package database

import (
	"context"
	"database/sql"
	_ "embed"
	"encoding/json"
	"fmt"
	"log"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"portfolio-backend/internal/models"
)

//go:embed seed_data.json
var defaultSeedData []byte

type DB struct {
	SQL *sql.DB
}

// Connect initializes the PostgreSQL connection using pgx stdlib
func Connect(connStr string) (*DB, error) {
	db, err := sql.Open("pgx", connStr)
	if err != nil {
		return nil, fmt.Errorf("failed to open database: %w", err)
	}

	// Pool settings optimal for serverless and low concurrency
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := db.PingContext(ctx); err != nil {
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	database := &DB{SQL: db}

	// Auto-migrate tables and seed initial data
	if err := database.AutoMigrate(ctx); err != nil {
		log.Printf("[DB] Warning during auto-migration: %v", err)
	}

	return database, nil
}

// AutoMigrate creates tables and seeds initial data if missing
func (d *DB) AutoMigrate(ctx context.Context) error {
	createTablesSQL := `
	CREATE TABLE IF NOT EXISTS portfolio_state (
		id INT PRIMARY KEY DEFAULT 1,
		data JSONB NOT NULL,
		version INT NOT NULL DEFAULT 1,
		updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
		CONSTRAINT single_row CHECK (id = 1)
	);

	CREATE TABLE IF NOT EXISTS audit_logs (
		id SERIAL PRIMARY KEY,
		ip_address VARCHAR(45) NOT NULL,
		action VARCHAR(50) NOT NULL,
		success BOOLEAN NOT NULL DEFAULT true,
		details TEXT,
		created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
	);
	`

	_, err := d.SQL.ExecContext(ctx, createTablesSQL)
	if err != nil {
		return fmt.Errorf("failed to create tables: %w", err)
	}

	// Check if portfolio_state is already seeded
	var count int
	err = d.SQL.QueryRowContext(ctx, "SELECT COUNT(*) FROM portfolio_state WHERE id = 1").Scan(&count)
	if err != nil {
		return fmt.Errorf("failed to check portfolio_state count: %w", err)
	}

	if count == 0 {
		log.Println("[DB] Seeding initial portfolio data from seed_data.json...")
		// Validate seed data format
		var test models.PortfolioData
		if err := json.Unmarshal(defaultSeedData, &test); err != nil {
			return fmt.Errorf("invalid embedded seed_data.json: %w", err)
		}

		insertSQL := `INSERT INTO portfolio_state (id, data, version, updated_at) VALUES (1, $1, 1, NOW())`
		_, err = d.SQL.ExecContext(ctx, insertSQL, defaultSeedData)
		if err != nil {
			return fmt.Errorf("failed to insert initial seed data: %w", err)
		}
		log.Println("[DB] Initial portfolio data seeded successfully into Neon DB!")
	} else {
		log.Println("[DB] Portfolio state table already contains data, skipping seed.")
	}

	return nil
}

// GetPortfolio retrieves the current portfolio JSON
func (d *DB) GetPortfolio(ctx context.Context) (*models.PortfolioData, error) {
	var rawJSON []byte
	err := d.SQL.QueryRowContext(ctx, "SELECT data FROM portfolio_state WHERE id = 1").Scan(&rawJSON)
	if err != nil {
		if err == sql.ErrNoRows {
			// Fallback to embedded seed
			var fallback models.PortfolioData
			if jsonErr := json.Unmarshal(defaultSeedData, &fallback); jsonErr == nil {
				return &fallback, nil
			}
		}
		return nil, fmt.Errorf("error reading portfolio from DB: %w", err)
	}

	var portfolio models.PortfolioData
	if err := json.Unmarshal(rawJSON, &portfolio); err != nil {
		return nil, fmt.Errorf("error parsing portfolio JSON: %w", err)
	}

	return &portfolio, nil
}

// UpdatePortfolio saves changes to the database
func (d *DB) UpdatePortfolio(ctx context.Context, data *models.PortfolioData) error {
	rawJSON, err := json.Marshal(data)
	if err != nil {
		return fmt.Errorf("failed to marshal portfolio data: %w", err)
	}

	upsertSQL := `
	INSERT INTO portfolio_state (id, data, version, updated_at)
	VALUES (1, $1, 1, NOW())
	ON CONFLICT (id) DO UPDATE SET
		data = EXCLUDED.data,
		version = portfolio_state.version + 1,
		updated_at = NOW();
	`
	_, err = d.SQL.ExecContext(ctx, upsertSQL, rawJSON)
	if err != nil {
		return fmt.Errorf("failed to update portfolio in DB: %w", err)
	}

	return nil
}

// LogAudit records an action in audit_logs
func (d *DB) LogAudit(ctx context.Context, ip, action string, success bool, details string) {
	go func() {
		// Log asynchronously to not block the request
		ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
		defer cancel()
		_, _ = d.SQL.ExecContext(ctx,
			"INSERT INTO audit_logs (ip_address, action, success, details) VALUES ($1, $2, $3, $4)",
			ip, action, success, details,
		)
	}()
}
