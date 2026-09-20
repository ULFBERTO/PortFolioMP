package models

// LocalizedText supports bilingual text (Spanish & English)
type LocalizedText struct {
	ES string `json:"es"`
	EN string `json:"en"`
}

// Theme color definitions
type Theme struct {
	Primary         string `json:"primary"`
	BackgroundDark  string `json:"backgroundDark"`
	SurfaceDark     string `json:"surfaceDark"`
	BackgroundLight string `json:"backgroundLight"`
	SurfaceLight    string `json:"surfaceLight"`
}

// Profile information
type Profile struct {
	Name      string        `json:"name"`
	ShortName string        `json:"shortName"`
	Initials  string        `json:"initials"`
	Role      LocalizedText `json:"role"`
	AvatarURL string        `json:"avatarUrl"`
	Email     string        `json:"email"`
	GitHub    string        `json:"github"`
	LinkedIn  string        `json:"linkedin"`
	CvURL     string        `json:"cvUrl"`
}

// Hero section data
type Hero struct {
	Greeting    LocalizedText `json:"greeting"`
	Description LocalizedText `json:"description"`
}

// StatItem represents a single numerical highlight
type StatItem struct {
	Value    string        `json:"value"`
	Label    LocalizedText `json:"label"`
	Sublabel LocalizedText `json:"sublabel"`
}

// Stats section collection
type Stats struct {
	YearsActive StatItem `json:"yearsActive"`
	Projects    StatItem `json:"projects"`
	TechStack   StatItem `json:"techStack"`
	Experience  StatItem `json:"experience"`
}

// ExperienceItem represents a job or milestone
type ExperienceItem struct {
	ID          string        `json:"id"`
	Icon        string        `json:"icon"`
	Title       LocalizedText `json:"title"`
	Date        string        `json:"date"`
	Description LocalizedText `json:"description"`
	IsCurrent   bool          `json:"isCurrent"`
}

// ProjectItem represents a showcased project
type ProjectItem struct {
	ID            string        `json:"id"`
	Title         string        `json:"title"`
	Category      string        `json:"category"`
	CategoryColor string        `json:"categoryColor"`
	Year          string        `json:"year"`
	Description   LocalizedText `json:"description"`
	Technologies  []string      `json:"technologies"`
	DemoURL       string        `json:"demoUrl"`
	RepoURL       string        `json:"repoUrl"`
	DownloadURL   string        `json:"downloadUrl"`
	Icon          string        `json:"icon"`
	Gradient      string        `json:"gradient"`
}

// Contact section
type Contact struct {
	Title       LocalizedText `json:"title"`
	Description LocalizedText `json:"description"`
}

// Sidebar labels
type Sidebar struct {
	Availability LocalizedText `json:"availability"`
	OpenToWork   LocalizedText `json:"openToWork"`
	DownloadCV   LocalizedText `json:"downloadCV"`
}

// Footer section
type Footer struct {
	BuiltWith LocalizedText `json:"builtWith"`
}

// PortfolioData represents the complete state expected by the frontend
type PortfolioData struct {
	Theme        Theme            `json:"theme"`
	Profile      Profile          `json:"profile"`
	Hero         Hero             `json:"hero"`
	Stats        Stats            `json:"stats"`
	Experience   []ExperienceItem `json:"experience"`
	Technologies []string         `json:"technologies"`
	Projects     []ProjectItem    `json:"projects"`
	Contact      Contact          `json:"contact"`
	Sidebar      Sidebar          `json:"sidebar"`
	Footer       Footer           `json:"footer"`
}

// AuthVerifyRequest for admin key verification
type AuthVerifyRequest struct {
	AdminKey string `json:"adminKey"`
}

// AuthVerifyResponse with signed JWT
type AuthVerifyResponse struct {
	Token         string `json:"token"`
	ExpiresIn     int64  `json:"expiresIn"`
	Authenticated bool   `json:"authenticated"`
}
