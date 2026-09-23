package models

import (
	"encoding/json"
	"regexp"
	"time"
)

var templatePattern = regexp.MustCompile(`^[a-z0-9-]{1,32}$`)

// Profession types (each has its own explicit form in the frontend)
const (
	ProfessionDeveloper = "developer"
	ProfessionDesigner  = "designer"
	ProfessionGeneral   = "general"
)

// Visual templates (each profession can be rendered with any template)
const (
	TemplateHandDrawn = "hand-drawn"
	TemplateExecutive = "executive"
	TemplateMinimal   = "minimal"
)

// Visibility modes (chosen by the owner per CV)
const (
	VisibilityPublic  = "public"
	VisibilityPrivate = "private"
)

// CV is a single resume page owned by a user, served at an exact URL /cv/:slug
type CV struct {
	ID          string          `json:"id"`
	OwnerID     string          `json:"ownerId"`
	Slug        string          `json:"slug"`
	Title       string          `json:"title"`
	Profession  string          `json:"profession"`
	Template    string          `json:"template"`
	Visibility  string          `json:"visibility"`
	Data        json.RawMessage `json:"data"`
	CreatedAt   time.Time       `json:"createdAt"`
	UpdatedAt   time.Time       `json:"updatedAt"`
	OwnerEmail  string          `json:"ownerEmail,omitempty"`
}

// CreateCVRequest is the payload for POST /api/cvs
type CreateCVRequest struct {
	Slug       string          `json:"slug"`
	Title      string          `json:"title"`
	Profession string          `json:"profession"`
	Template   string          `json:"template"`
	Visibility string          `json:"visibility"`
	Data       json.RawMessage `json:"data,omitempty"`
}

// UpdateCVRequest is the payload for PUT /api/cvs/:id
type UpdateCVRequest struct {
	Title      *string         `json:"title,omitempty"`
	Profession *string         `json:"profession,omitempty"`
	Template   *string         `json:"template,omitempty"`
	Visibility *string         `json:"visibility,omitempty"`
	Slug       *string         `json:"slug,omitempty"`
	Data       json.RawMessage `json:"data,omitempty"`
}

func validIn(v string, allowed ...string) bool {
	for _, a := range allowed {
		if v == a {
			return true
		}
	}
	return false
}

// ValidProfession reports whether p is a known profession type.
func ValidProfession(p string) bool {
	return validIn(p, ProfessionDeveloper, ProfessionDesigner, ProfessionGeneral)
}

// ValidTemplate reports whether t is a usable template id.
// El catálogo vive en el frontend (15+ plantillas y creciendo), así que el
// backend solo valida formato seguro: 1-32 chars [a-z0-9-].
// CVView aplica fallback a hand-drawn ante un id desconocido.
func ValidTemplate(t string) bool {
	return templatePattern.MatchString(t)
}

// ValidVisibility reports whether v is a known visibility mode.
func ValidVisibility(v string) bool {
	return validIn(v, VisibilityPublic, VisibilityPrivate)
}

// ValidRole reports whether r is a known user role.
func ValidRole(r string) bool {
	return validIn(r, RoleAdmin, RoleUser)
}
