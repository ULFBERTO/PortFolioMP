package models

import "time"

// Roles
const (
	RoleAdmin = "admin"
	RoleUser  = "user"
)

// User is a platform account. Passwords are stored as bcrypt hashes only.
type User struct {
	ID                    string     `json:"id"`
	Email                 string     `json:"email"`
	Role                  string     `json:"role"`
	EmailVerified         bool       `json:"emailVerified"`
	VerificationExpiresAt *time.Time `json:"-"`
	CreatedAt             time.Time  `json:"createdAt"`
	UpdatedAt             time.Time  `json:"updatedAt"`
}

// UserWithHash is used internally when the password hash is required.
type UserWithHash struct {
	User
	PasswordHash string `json:"-"`
}

// Public strips the password hash before sending a user to the client.
func (u *UserWithHash) Public() *User {
	return &User{
		ID:            u.ID,
		Email:         u.Email,
		Role:          u.Role,
		EmailVerified: u.EmailVerified,
		CreatedAt:     u.CreatedAt,
		UpdatedAt:     u.UpdatedAt,
	}
}

// RegisterRequest is the payload for POST /api/auth/register
type RegisterRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// LoginRequest is the payload for POST /api/auth/login
type LoginRequest struct {
	Email    string `json:"email"`
	Password string `json:"password"`
}

// AuthResponse is returned on register/login/refresh
type AuthResponse struct {
	Authenticated bool   `json:"authenticated"`
	User          *User  `json:"user,omitempty"`
	ExpiresIn     int64  `json:"expiresIn,omitempty"`
}

// UpdateRoleRequest is the payload for PATCH /api/admin/users/:id/role
type UpdateRoleRequest struct {
	Role string `json:"role"`
}
