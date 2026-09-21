package database

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"regexp"
	"strings"

	"portfolio-backend/internal/auth"
	"portfolio-backend/internal/models"
)

var slugPattern = regexp.MustCompile(`^[a-z0-9][a-z0-9-]{1,46}[a-z0-9]$`)

// ValidateSlug reports whether s is a usable public slug.
func ValidateSlug(s string) bool {
	return slugPattern.MatchString(strings.ToLower(s))
}

func NormalizeEmail(email string) string {
	return strings.ToLower(strings.TrimSpace(email))
}

// ---------------- Users ----------------

func scanUser(row *sql.Row, withHash bool) (*models.UserWithHash, error) {
	var u models.UserWithHash
	var expiresAt sql.NullTime
	err := row.Scan(
		&u.ID, &u.Email, &u.PasswordHash, &u.Role,
		&u.EmailVerified, &expiresAt,
		&u.CreatedAt, &u.UpdatedAt,
	)
	if err != nil {
		return nil, err
	}
	if expiresAt.Valid {
		t := expiresAt.Time
		u.VerificationExpiresAt = &t
	}
	if !withHash {
		u.PasswordHash = ""
	}
	return &u, nil
}

const userColumns = `id, email, password_hash, role, email_verified, verification_expires_at, created_at, updated_at`

// CreateUser inserts a new user with a bcrypt-hashed password.
func (d *DB) CreateUser(ctx context.Context, email, passwordHash, role string) (*models.User, error) {
	email = NormalizeEmail(email)
	if role != models.RoleAdmin && role != models.RoleUser {
		role = models.RoleUser
	}
	var u models.User
	err := d.SQL.QueryRowContext(ctx, `
		INSERT INTO users (email, password_hash, role, email_verified)
		VALUES ($1, $2, $3, false)
		RETURNING id, email, role, email_verified, created_at, updated_at
	`, email, passwordHash, role).Scan(&u.ID, &u.Email, &u.Role, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// GetUserByEmail fetches a user including the hash (for login).
func (d *DB) GetUserByEmail(ctx context.Context, email string) (*models.UserWithHash, error) {
	email = NormalizeEmail(email)
	row := d.SQL.QueryRowContext(ctx, `
		SELECT `+userColumns+` FROM users WHERE lower(email) = lower($1) LIMIT 1
	`, email)
	return scanUser(row, true)
}

// GetUserByID fetches a user including the hash.
func (d *DB) GetUserByID(ctx context.Context, id string) (*models.UserWithHash, error) {
	row := d.SQL.QueryRowContext(ctx, `
		SELECT `+userColumns+` FROM users WHERE id = $1 LIMIT 1
	`, id)
	return scanUser(row, true)
}

// CountUsers returns the total number of users.
func (d *DB) CountUsers(ctx context.Context) (int, error) {
	var n int
	err := d.SQL.QueryRowContext(ctx, `SELECT COUNT(*) FROM users`).Scan(&n)
	return n, err
}

// ListUsers returns all users (admin only, without hashes).
func (d *DB) ListUsers(ctx context.Context) ([]models.User, error) {
	rows, err := d.SQL.QueryContext(ctx, `
		SELECT id, email, role, email_verified, created_at, updated_at
		FROM users ORDER BY created_at ASC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	users := []models.User{}
	for rows.Next() {
		var u models.User
		if err := rows.Scan(&u.ID, &u.Email, &u.Role, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt); err != nil {
			return nil, err
		}
		users = append(users, u)
	}
	return users, rows.Err()
}

// SetUserRole changes a user's role.
func (d *DB) SetUserRole(ctx context.Context, id, role string) (*models.User, error) {
	var u models.User
	err := d.SQL.QueryRowContext(ctx, `
		UPDATE users SET role = $2, updated_at = NOW() WHERE id = $1
		RETURNING id, email, role, email_verified, created_at, updated_at
	`, id, role).Scan(&u.ID, &u.Email, &u.Role, &u.EmailVerified, &u.CreatedAt, &u.UpdatedAt)
	if err != nil {
		return nil, err
	}
	return &u, nil
}

// DeleteUser removes a user (their CVs cascade).
func (d *DB) DeleteUser(ctx context.Context, id string) error {
	res, err := d.SQL.ExecContext(ctx, `DELETE FROM users WHERE id = $1`, id)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// ---------------- CVs ----------------

func scanCV(rows interface {
	Scan(dest ...interface{}) error
}, withOwner bool) (*models.CV, error) {
	var cv models.CV
	var raw []byte
	var ownerEmail sql.NullString
	dest := []interface{}{&cv.ID, &cv.OwnerID, &cv.Slug, &cv.Title, &cv.Profession, &cv.Template, &cv.Visibility, &raw, &cv.CreatedAt, &cv.UpdatedAt}
	if withOwner {
		dest = append(dest, &ownerEmail)
	}
	if err := rows.Scan(dest...); err != nil {
		return nil, err
	}
	cv.Data = json.RawMessage(raw)
	if ownerEmail.Valid {
		cv.OwnerEmail = ownerEmail.String
	}
	return &cv, nil
}

const cvColumns = `id, owner_id, slug, title, profession, template, visibility, data, created_at, updated_at`

// CreateCV inserts a new CV for an owner.
func (d *DB) CreateCV(ctx context.Context, ownerID string, req *models.CreateCVRequest) (*models.CV, error) {
	slug := strings.ToLower(strings.TrimSpace(req.Slug))
	if !ValidateSlug(slug) {
		return nil, fmt.Errorf("slug inválido (3-48 chars, a-z 0-9 -)")
	}
	if !models.ValidProfession(req.Profession) || !models.ValidTemplate(req.Template) || !models.ValidVisibility(req.Visibility) {
		return nil, fmt.Errorf("profession/template/visibility inválidos")
	}
	data := req.Data
	if len(data) == 0 {
		data = json.RawMessage(`{}`)
	}
	row := d.SQL.QueryRowContext(ctx, `
		INSERT INTO cvs (owner_id, slug, title, profession, template, visibility, data)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		RETURNING `+cvColumns,
		ownerID, slug, req.Title, req.Profession, req.Template, req.Visibility, string(data),
	)
	return scanCV(row, false)
}

// GetCVByID fetches a CV by id.
func (d *DB) GetCVByID(ctx context.Context, id string) (*models.CV, error) {
	row := d.SQL.QueryRowContext(ctx, `SELECT `+cvColumns+` FROM cvs WHERE id = $1 LIMIT 1`, id)
	return scanCV(row, false)
}

// GetCVBySlug fetches a CV by slug (case-insensitive).
func (d *DB) GetCVBySlug(ctx context.Context, slug string) (*models.CV, error) {
	row := d.SQL.QueryRowContext(ctx, `SELECT `+cvColumns+` FROM cvs WHERE lower(slug) = lower($1) LIMIT 1`, strings.TrimSpace(slug))
	return scanCV(row, false)
}

// ListCVsByOwner returns all CVs of a user.
func (d *DB) ListCVsByOwner(ctx context.Context, ownerID string) ([]models.CV, error) {
	rows, err := d.SQL.QueryContext(ctx, `SELECT `+cvColumns+` FROM cvs WHERE owner_id = $1 ORDER BY updated_at DESC`, ownerID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []models.CV{}
	for rows.Next() {
		cv, err := scanCV(rows, false)
		if err != nil {
			return nil, err
		}
		out = append(out, *cv)
	}
	return out, rows.Err()
}

// ListAllCVs returns every CV (admin only).
func (d *DB) ListAllCVs(ctx context.Context) ([]models.CV, error) {
	rows, err := d.SQL.QueryContext(ctx, `
		SELECT c.id, c.owner_id, c.slug, c.title, c.profession, c.template, c.visibility, c.data, c.created_at, c.updated_at, u.email
		FROM cvs c JOIN users u ON u.id = c.owner_id ORDER BY c.updated_at DESC
	`)
	if err != nil {
		return nil, err
	}
	defer rows.Close()
	out := []models.CV{}
	for rows.Next() {
		cv, err := scanCV(rows, true)
		if err != nil {
			return nil, err
		}
		out = append(out, *cv)
	}
	return out, rows.Err()
}

// UpdateCV updates mutable fields of a CV owned by ownerID (empty ownerID skips ownership check for admin paths that already verified).
func (d *DB) UpdateCV(ctx context.Context, id, ownerID string, req *models.UpdateCVRequest) (*models.CV, error) {
	current, err := d.GetCVByID(ctx, id)
	if err != nil {
		return nil, err
	}
	if ownerID != "" && current.OwnerID != ownerID {
		return nil, fmt.Errorf("forbidden")
	}
	title := current.Title
	profession := current.Profession
	template := current.Template
	visibility := current.Visibility
	slug := current.Slug
	if req.Title != nil {
		title = *req.Title
	}
	if req.Profession != nil {
		if !models.ValidProfession(*req.Profession) {
			return nil, fmt.Errorf("profession inválida")
		}
		profession = *req.Profession
	}
	if req.Template != nil {
		if !models.ValidTemplate(*req.Template) {
			return nil, fmt.Errorf("template inválido")
		}
		template = *req.Template
	}
	if req.Visibility != nil {
		if !models.ValidVisibility(*req.Visibility) {
			return nil, fmt.Errorf("visibility inválida")
		}
		visibility = *req.Visibility
	}
	if req.Slug != nil {
		s := strings.ToLower(strings.TrimSpace(*req.Slug))
		if !ValidateSlug(s) {
			return nil, fmt.Errorf("slug inválido (3-48 chars, a-z 0-9 -)")
		}
		slug = s
	}
	dataStr := string(current.Data)
	if len(req.Data) != 0 {
		dataStr = string(req.Data)
	}
	row := d.SQL.QueryRowContext(ctx, `
		UPDATE cvs SET title = $2, profession = $3, template = $4, visibility = $5, slug = $6, data = $7, updated_at = NOW()
		WHERE id = $1 RETURNING `+cvColumns,
		id, title, profession, template, visibility, slug, dataStr,
	)
	return scanCV(row, false)
}

// DeleteCV removes a CV (ownership enforced by caller, except admin).
func (d *DB) DeleteCV(ctx context.Context, id, ownerID string) error {
	var query string
	var args []interface{}
	if ownerID == "" {
		query = `DELETE FROM cvs WHERE id = $1`
		args = []interface{}{id}
	} else {
		query = `DELETE FROM cvs WHERE id = $1 AND owner_id = $2`
		args = []interface{}{id, ownerID}
	}
	res, err := d.SQL.ExecContext(ctx, query, args...)
	if err != nil {
		return err
	}
	n, _ := res.RowsAffected()
	if n == 0 {
		return sql.ErrNoRows
	}
	return nil
}

// CountCVs returns the total number of CVs.
func (d *DB) CountCVs(ctx context.Context) (int, error) {
	var n int
	err := d.SQL.QueryRowContext(ctx, `SELECT COUNT(*) FROM cvs`).Scan(&n)
	return n, err
}

// ---------------- Seed: admin user + migrate legacy portfolio ----------------

// SeedAdminIfEmpty creates the first admin from env when the users table is empty.
// Set ADMIN_SEED_EMAIL + ADMIN_SEED_PASSWORD (min 8 chars) in the backend env.
func (d *DB) SeedAdminIfEmpty(ctx context.Context) error {
	n, err := d.CountUsers(ctx)
	if err != nil {
		return err
	}
	if n > 0 {
		return nil
	}
	email := NormalizeEmail(os.Getenv("ADMIN_SEED_EMAIL"))
	password := os.Getenv("ADMIN_SEED_PASSWORD")
	if email == "" || len(password) < 8 {
		log.Println("[DB] users vacía pero sin ADMIN_SEED_EMAIL/ADMIN_SEED_PASSWORD válido (min 8): no se crea admin. Configúralos en Vercel.")
		return nil
	}
	hash, err := auth.HashPassword(password)
	if err != nil {
		return err
	}
	u, err := d.CreateUser(ctx, email, hash, models.RoleAdmin)
	if err != nil {
		return err
	}
	// El seed del dueño queda verificado (el SMTP llega después).
	_, _ = d.SQL.ExecContext(ctx, `UPDATE users SET email_verified = true WHERE id = $1`, u.ID)
	u.EmailVerified = true
	log.Printf("[DB] Admin inicial creado: %s (id=%s). Quita ADMIN_SEED_PASSWORD del env.", u.Email, u.ID)
	return nil
}

// slugify converts a display name into a URL-safe slug base.
func slugify(name string) string {
	s := strings.ToLower(strings.TrimSpace(name))
	var b strings.Builder
	prevDash := false
	for _, r := range s {
		switch {
		case r >= 'a' && r <= 'z', r >= '0' && r <= '9':
			b.WriteRune(r)
			prevDash = false
		case r == ' ' || r == '-' || r == '_' || r == '.':
			if !prevDash && b.Len() > 0 {
				b.WriteByte('-')
				prevDash = true
			}
		default:
			// drop accents/symbols (keep it simple + deterministic)
		}
	}
	out := strings.Trim(b.String(), "-")
	if len(out) < 3 {
		out = "mi-cv"
	}
	if len(out) > 40 {
		out = out[:40]
	}
	return strings.Trim(out, "-")
}

// MigrateLegacyPortfolio converts the old single-row portfolio_state into a CV
// owned by the first admin (only when cvs is empty and legacy data exists).
func (d *DB) MigrateLegacyPortfolio(ctx context.Context) error {
	n, err := d.CountCVs(ctx)
	if err != nil {
		return err
	}
	if n > 0 {
		return nil
	}
	var raw []byte
	err = d.SQL.QueryRowContext(ctx, `SELECT data FROM portfolio_state WHERE id = 1`).Scan(&raw)
	if err != nil {
		if err == sql.ErrNoRows {
			return nil
		}
		return err
	}
	var data models.PortfolioData
	if err := json.Unmarshal(raw, &data); err != nil {
		return fmt.Errorf("legacy portfolio inválido: %w", err)
	}
	var adminID string
	err = d.SQL.QueryRowContext(ctx, `SELECT id FROM users WHERE role = 'admin' ORDER BY created_at ASC LIMIT 1`).Scan(&adminID)
	if err != nil {
		log.Println("[DB] Sin admin: se omite migrar portfolio_state (crea ADMIN_SEED_* y reinicia).")
		return nil
	}
	slug := slugify(data.Profile.ShortName)
	if slug == "" {
		slug = "mi-cv"
	}
	// Garantizar slug único
	base := slug
	for i := 2; ; i++ {
		var exists int
		_ = d.SQL.QueryRowContext(ctx, `SELECT COUNT(*) FROM cvs WHERE lower(slug) = lower($1)`, slug).Scan(&exists)
		if exists == 0 {
			break
		}
		slug = fmt.Sprintf("%s-%d", base, i)
	}
	title := data.Profile.Name
	if title == "" {
		title = "Mi hoja de vida"
	}
	_, err = d.CreateCV(ctx, adminID, &models.CreateCVRequest{
		Slug:       slug,
		Title:      title,
		Profession: models.ProfessionDeveloper,
		Template:   models.TemplateHandDrawn,
		Visibility: models.VisibilityPublic,
		Data:       raw,
	})
	if err != nil {
		return err
	}
	log.Printf("[DB] portfolio_state migrado a CV público /cv/%s (owner admin %s).", slug, adminID)
	return nil
}

// SeedPlatform runs first-boot seeding in order: admin -> legacy CV.
func (d *DB) SeedPlatform(ctx context.Context) {
	if err := d.SeedAdminIfEmpty(ctx); err != nil {
		log.Printf("[DB] Seed admin: %v", err)
	}
	if err := d.MigrateLegacyPortfolio(ctx); err != nil {
		log.Printf("[DB] Migración legacy: %v", err)
	}
}
