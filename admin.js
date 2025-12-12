// Admin Panel Logic for Portfolio Dashboard
// Access: index.html?admin=YOUR_KEY

let portfolioData = null;
let isAdminMode = false;
let currentEditingProject = null;
let currentEditingExp = null;

// Initialize admin panel
document.addEventListener('DOMContentLoaded', async () => {
    await loadPortfolioData();
    checkAdminAccess();
});

// Load portfolio data from JSON
async function loadPortfolioData() {
    try {
        debugger
        const response = await fetch('data.json');
        if (!response.ok) throw new Error('Fetch failed');
        portfolioData = await response.json();
    } catch (error) {
        console.warn('Could not load data.json (this is normal for file:// URLs), using embedded data:', error.message);
        // Fallback: use embedded default data for file:// URLs
        portfolioData = getDefaultData();
    }
    applyTheme();
    renderPortfolio();
}

// Default embedded data (for file:// compatibility)
function getDefaultData() {
    return {
        "adminKey": "mario2024",
        "theme": {
            "primary": "#2bee79",
            "backgroundDark": "#102217",
            "surfaceDark": "#162e21",
            "backgroundLight": "#f6f8f7",
            "surfaceLight": "#ffffff"
        },
        "profile": {
            "name": "Mario Alejandro Patiño Ortiz",
            "shortName": "Mario Patiño",
            "initials": "MA",
            "role": { "es": "Desarrollador FullStack", "en": "FullStack Developer" },
            "avatarUrl": "",
            "email": "mario.patino@example.com",
            "github": "https://github.com/ULFBERTO",
            "linkedin": "https://linkedin.com/in/mario-patino",
            "cvUrl": ""
        },
        "hero": {
            "greeting": { "es": "Hola, soy", "en": "Hello, I'm" },
            "description": {
                "es": "Desarrollador FullStack especializado en tecnologías web modernas. Transformando ideas complejas en código elegante y eficiente desde 2022.",
                "en": "FullStack Developer specializing in modern web technologies. Transforming complex ideas into elegant, efficient code since 2022."
            }
        },
        "stats": {
            "yearsActive": { "value": "3+", "label": { "es": "Años Activo", "en": "Years Active" }, "sublabel": { "es": "Desde 2022", "en": "Since 2022" } },
            "projects": { "value": "5+", "label": { "es": "Proyectos", "en": "Projects" }, "sublabel": { "es": "Proyectos principales", "en": "Major projects" } },
            "techStack": { "value": "10+", "label": { "es": "Stack Tecnológico", "en": "Tech Stack" }, "sublabel": { "es": "Tecnologías", "en": "Technologies" } },
            "experience": { "value": "3", "label": { "es": "Experiencia", "en": "Experience" }, "sublabel": { "es": "Freelance, Empresa, Personal", "en": "Freelance, Company, Personal" } }
        },
        "experience": [
            { "id": "exp1", "icon": "terminal", "title": { "es": "Desarrollador FullStack Freelance", "en": "Freelance FullStack Developer" }, "date": "2023 - Present", "description": { "es": "Desarrollo de soluciones web personalizadas para clientes internacionales usando Angular, .NET y tecnologías modernas.", "en": "Developing custom web solutions for international clients using Angular, .NET and modern technologies." }, "isCurrent": true },
            { "id": "exp2", "icon": "business", "title": { "es": "Desarrollador en Empresa", "en": "Company Developer" }, "date": "2022 - 2023", "description": { "es": "Colaboración en desarrollo de microservicios backend y componentes UI frontend.", "en": "Collaboration on backend microservices development and frontend UI components." }, "isCurrent": false },
            { "id": "exp3", "icon": "lightbulb", "title": { "es": "Proyectos Personales", "en": "Personal Projects" }, "date": "2022 - Present", "description": { "es": "Desarrollo continuo de proyectos innovadores para aprendizaje y portafolio.", "en": "Continuous development of innovative projects for learning and portfolio." }, "isCurrent": true }
        ],
        "technologies": ["Angular", ".NET", "Rust", "C++", "Python", "TypeScript", "OpenGL", "Three.js", "Qiskit", "Flask"],
        "projects": [
            { "id": "atomsim", "title": "AtomSim", "category": "Educational", "categoryColor": "primary", "year": "2024", "description": { "es": "Simulador interactivo de química molecular con visualización 3D de átomos. Incluye motor de física realista, tabla periódica integrada y formación de moléculas automática.", "en": "Interactive molecular chemistry simulator with 3D atom visualization. Includes realistic physics engine, integrated periodic table and automatic molecule formation." }, "technologies": ["Angular 17", "Three.js", "Cannon-es"], "demoUrl": "https://atom-ai10vs8xq-ulfbertos-projects.vercel.app/", "repoUrl": "https://github.com/ULFBERTO/AtomSim", "downloadUrl": "", "icon": "science", "gradient": "from-purple-900/50 to-blue-900/50" },
            { "id": "oxide-browser", "title": "Oxide Browser", "category": "Full Stack", "categoryColor": "blue", "year": "2024", "description": { "es": "Motor de búsqueda completo con backend .NET (algoritmo BM25), frontend Angular 19, e instalador nativo en Rust. Incluye modo IA y búsqueda multi-categoría.", "en": "Complete search engine with .NET backend (BM25 algorithm), Angular 19 frontend, and native Rust installer. Includes AI mode and multi-category search." }, "technologies": [".NET 8", "Angular 19", "Rust"], "demoUrl": "https://oxide-browser.vercel.app", "repoUrl": "https://github.com/ULFBERTO/OxideBrowser", "downloadUrl": "https://github.com/ULFBERTO/Oxide/releases", "icon": "public", "gradient": "from-orange-900/50 to-red-900/50" },
            { "id": "oxide-engine", "title": "OxideEngine", "category": "Graphics Engine", "categoryColor": "purple", "year": "2024", "description": { "es": "Motor gráfico 3D desarrollado desde cero en C++17 con OpenGL 3.3. Incluye editor visual con sistema de gizmos, raycast para selección y gestión de proyectos.", "en": "3D graphics engine built from scratch in C++17 with OpenGL 3.3. Includes visual editor with gizmo system, raycast for selection and project management." }, "technologies": ["C++17", "OpenGL 3.3", "Dear ImGui"], "demoUrl": "", "repoUrl": "https://github.com/ULFBERTO/Oxide", "downloadUrl": "https://github.com/ULFBERTO/Oxide/releases", "icon": "3d_rotation", "gradient": "from-cyan-900/50 to-teal-900/50" },
            { "id": "quantumleap", "title": "QuantumLeap", "category": "Quantum Computing", "categoryColor": "primary", "year": "2024", "description": { "es": "Plataforma educativa de computación cuántica con esfera de Bloch 3D interactiva, diseñador de circuitos y backend Python con Qiskit para ejecución real.", "en": "Quantum computing educational platform with interactive 3D Bloch sphere, circuit designer and Python backend with Qiskit for real execution." }, "technologies": ["Angular 19", "Python", "Qiskit"], "demoUrl": "https://basic-quantum-akgorithms.vercel.app/", "repoUrl": "https://github.com/ULFBERTO/Basic-Quantum-Akgorithms", "downloadUrl": "", "icon": "memory", "gradient": "from-indigo-900/50 to-violet-900/50" }
        ],
        "contact": { "title": { "es": "¿Trabajamos juntos?", "en": "Let's work together?" }, "description": { "es": "Estoy disponible para proyectos freelance, oportunidades de trabajo y colaboraciones. ¡No dudes en contactarme!", "en": "I'm available for freelance projects, job opportunities and collaborations. Don't hesitate to contact me!" } },
        "sidebar": { "availability": { "es": "Disponibilidad", "en": "Availability" }, "openToWork": { "es": "Disponible para trabajar", "en": "Open to work" }, "downloadCV": { "es": "Descargar CV", "en": "Download CV" } },
        "footer": { "builtWith": { "es": "Construido con código y café.", "en": "Built with code & coffee." } }
    };
}

// Check URL for admin key
function checkAdminAccess() {
    const urlParams = new URLSearchParams(window.location.search);
    const adminKey = urlParams.get('admin');

    if (adminKey && portfolioData && adminKey === portfolioData.adminKey) {
        isAdminMode = true;
        showAdminPanel();
    }
}

// Apply theme colors from data
function applyTheme() {
    if (!portfolioData) return;
    const root = document.documentElement;
    root.style.setProperty('--color-primary', portfolioData.theme.primary);
    root.style.setProperty('--color-bg-dark', portfolioData.theme.backgroundDark);
    root.style.setProperty('--color-surface-dark', portfolioData.theme.surfaceDark);

    // Update Tailwind config dynamically
    if (typeof tailwind !== 'undefined') {
        tailwind.config.theme.extend.colors.primary = portfolioData.theme.primary;
        tailwind.config.theme.extend.colors['background-dark'] = portfolioData.theme.backgroundDark;
        tailwind.config.theme.extend.colors['surface-dark'] = portfolioData.theme.surfaceDark;
    }
}

// Render portfolio from data
function renderPortfolio() {
    if (!portfolioData) return;

    // Profile
    const profileInitials = document.querySelectorAll('.profile-initials');
    profileInitials.forEach(el => el.textContent = portfolioData.profile.initials);

    const profileName = document.querySelectorAll('.profile-name');
    profileName.forEach(el => el.textContent = portfolioData.profile.shortName);

    // Profile role
    const lang = currentLang || 'es';
    const profileRole = document.querySelectorAll('.profile-role');
    profileRole.forEach(el => el.textContent = portfolioData.profile.role[lang]);

    // Hero name
    const heroName = document.querySelector('.hero-name');
    if (heroName) heroName.textContent = portfolioData.profile.name.split(' ').slice(0, 2).join(' ') + '.';

    // Footer name
    const footerName = document.querySelector('.footer-name');
    if (footerName) footerName.textContent = portfolioData.profile.name;

    // Social links
    const githubLinks = document.querySelectorAll('#github-link, #contact-github, #footer-links a[href*="github"]');
    githubLinks.forEach(el => el.href = portfolioData.profile.github);

    const linkedinLinks = document.querySelectorAll('#linkedin-link, #contact-linkedin, #footer-links a[href*="linkedin"]');
    linkedinLinks.forEach(el => el.href = portfolioData.profile.linkedin);

    // Email
    const emailBtn = document.getElementById('email-btn');
    if (emailBtn) emailBtn.href = `mailto:${portfolioData.profile.email}`;

    // CV download
    const cvBtn = document.getElementById('cv-download-btn');
    if (cvBtn && portfolioData.profile.cvUrl) {
        cvBtn.href = portfolioData.profile.cvUrl;
        cvBtn.target = '_blank';
    }

    // Update data-based translations
    updateDataTranslations();

    // Render projects dynamically
    renderProjects();

    // Render experience timeline
    renderExperience();

    // Render technologies
    renderTechnologies();

    // Render stats
    if (typeof renderStats === 'function') {
        renderStats();
    }

    // Apply language
    setLanguage(lang);
}

// Update translations from data
function updateDataTranslations() {
    if (!portfolioData) return;
    const lang = currentLang || 'es';

    // Hero
    const heroGreeting = document.querySelector('[data-i18n="hero.greeting"]');
    if (heroGreeting) heroGreeting.textContent = portfolioData.hero.greeting[lang];

    const heroDesc = document.querySelector('[data-i18n="hero.description"]');
    if (heroDesc) heroDesc.textContent = portfolioData.hero.description[lang];

    // Stats
    document.querySelectorAll('[data-stat]').forEach(el => {
        const stat = el.getAttribute('data-stat');
        if (portfolioData.stats[stat]) {
            const valueEl = el.querySelector('.stat-value');
            const labelEl = el.querySelector('.stat-label');
            const sublabelEl = el.querySelector('.stat-sublabel');
            if (valueEl) valueEl.textContent = portfolioData.stats[stat].value;
            if (labelEl) labelEl.textContent = portfolioData.stats[stat].label[lang];
            if (sublabelEl) sublabelEl.textContent = portfolioData.stats[stat].sublabel[lang];
        }
    });

    // Contact
    const contactTitle = document.querySelector('[data-i18n="contact.title"]');
    if (contactTitle) contactTitle.textContent = portfolioData.contact.title[lang];

    const contactDesc = document.querySelector('[data-i18n="contact.desc"]');
    if (contactDesc) contactDesc.textContent = portfolioData.contact.description[lang];
}

// Render projects from data
function renderProjects() {
    const container = document.getElementById('projects-container');
    if (!container || !portfolioData) return;

    const lang = currentLang || 'es';
    container.innerHTML = portfolioData.projects.map(project => `
        <article class="project-card group flex flex-col bg-surface-dark rounded-3xl overflow-hidden border border-white/5 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(43,238,121,0.1)]" data-project-id="${project.id}">
            <div class="h-48 w-full bg-gradient-to-br ${project.gradient} relative flex items-center justify-center">
                <div class="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all"></div>
                <span class="material-symbols-outlined text-6xl text-primary/60 group-hover:text-primary transition-colors">${project.icon}</span>
                <div class="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10">
                    ${project.year}
                </div>
                <div class="absolute top-4 left-4 ${getCategoryStyle(project.categoryColor)} backdrop-blur-md text-xs font-bold px-3 py-1 rounded-full border">
                    ${project.category}
                </div>
            </div>
            <div class="flex flex-col p-6 gap-4 flex-1">
                <div>
                    <h3 class="text-white text-lg font-bold group-hover:text-primary transition-colors">${project.title}</h3>
                    <p class="text-gray-400 text-sm mt-2 line-clamp-3">${project.description[lang]}</p>
                </div>
                <div class="flex flex-wrap gap-2 mt-auto">
                    ${project.technologies.map(tech => `<span class="text-xs text-primary bg-primary/10 px-2 py-1 rounded">${tech}</span>`).join('')}
                </div>
                <div class="flex gap-3 mt-2">
                    ${project.demoUrl ? `
                        <a href="${project.demoUrl}" target="_blank" class="flex-1 h-10 rounded-full bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold transition-colors flex items-center justify-center gap-1">
                            <span class="material-symbols-outlined text-[16px]">play_arrow</span>
                            Demo
                        </a>
                    ` : ''}
                    ${project.downloadUrl ? `
                        <a href="${project.downloadUrl}" target="_blank" class="flex-1 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1">
                            <span class="material-symbols-outlined text-[16px]">download</span>
                            <span>${lang === 'es' ? 'Descargar' : 'Download'}</span>
                        </a>
                    ` : ''}
                    ${project.repoUrl ? `
                        <a href="${project.repoUrl}" target="_blank" aria-label="Github Repo" class="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors">
                            <span class="material-symbols-outlined text-[18px]">code</span>
                        </a>
                    ` : ''}
                </div>
            </div>
        </article>
    `).join('');
}

// Get category style based on color
function getCategoryStyle(color) {
    const styles = {
        'primary': 'bg-primary/20 text-primary border-primary/30',
        'blue': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
        'purple': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
        'orange': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
        'red': 'bg-red-500/20 text-red-400 border-red-500/30',
        'cyan': 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
    };
    return styles[color] || styles['primary'];
}

// Render experience timeline
function renderExperience() {
    const container = document.getElementById('experience-container');
    if (!container || !portfolioData) return;

    const lang = currentLang || 'es';
    container.innerHTML = portfolioData.experience.map((exp, index) => `
        <div class="flex flex-col items-center gap-1 ${index === 0 ? 'pt-2' : ''} ${index === portfolioData.experience.length - 1 ? 'pb-2' : ''}">
            ${index > 0 ? '<div class="w-[1px] bg-white/10 h-2"></div>' : ''}
            <div class="w-8 h-8 rounded-full ${exp.isCurrent ? 'bg-primary/20 text-primary' : 'bg-white/5 text-gray-400'} flex items-center justify-center">
                <span class="material-symbols-outlined text-[18px]">${exp.icon}</span>
            </div>
            ${index < portfolioData.experience.length - 1 ? '<div class="w-[1px] bg-white/10 h-full grow my-2"></div>' : ''}
        </div>
        <div class="flex flex-1 flex-col ${index < portfolioData.experience.length - 1 ? 'pb-8' : ''} pt-1 pl-2">
            <p class="text-white text-base font-bold">${exp.title[lang]}</p>
            <p class="${exp.isCurrent ? 'text-primary' : 'text-gray-400'} text-sm mb-1">${exp.date}</p>
            <p class="text-gray-400 text-sm leading-relaxed">${exp.description[lang]}</p>
        </div>
    `).join('');
}

// Render technologies
function renderTechnologies() {
    const container = document.getElementById('technologies-container');
    if (!container || !portfolioData) return;

    container.innerHTML = portfolioData.technologies.map(tech => `
        <span class="px-3 py-1.5 rounded-lg bg-background-dark text-white text-xs font-medium border border-white/10">${tech}</span>
    `).join('');
}

// ============ ADMIN PANEL FUNCTIONS ============

function showAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        adminPanel.classList.remove('hidden');
        populateAdminForms();
    }
}

function hideAdminPanel() {
    const adminPanel = document.getElementById('admin-panel');
    if (adminPanel) {
        adminPanel.classList.add('hidden');
    }
}

function populateAdminForms() {
    if (!portfolioData) return;

    // Profile
    document.getElementById('admin-name').value = portfolioData.profile.name;
    document.getElementById('admin-shortname').value = portfolioData.profile.shortName;
    document.getElementById('admin-initials').value = portfolioData.profile.initials;
    document.getElementById('admin-role-es').value = portfolioData.profile.role.es;
    document.getElementById('admin-role-en').value = portfolioData.profile.role.en;
    document.getElementById('admin-email').value = portfolioData.profile.email;
    document.getElementById('admin-github').value = portfolioData.profile.github;
    document.getElementById('admin-linkedin').value = portfolioData.profile.linkedin;
    document.getElementById('admin-avatar').value = portfolioData.profile.avatarUrl || '';
    document.getElementById('admin-cv').value = portfolioData.profile.cvUrl || '';

    // Hero
    document.getElementById('admin-hero-greeting-es').value = portfolioData.hero.greeting.es;
    document.getElementById('admin-hero-greeting-en').value = portfolioData.hero.greeting.en;
    document.getElementById('admin-hero-desc-es').value = portfolioData.hero.description.es;
    document.getElementById('admin-hero-desc-en').value = portfolioData.hero.description.en;

    // Stats
    document.getElementById('admin-stat-years').value = portfolioData.stats.yearsActive.value;
    document.getElementById('admin-stat-projects').value = portfolioData.stats.projects.value;
    document.getElementById('admin-stat-tech').value = portfolioData.stats.techStack.value;
    document.getElementById('admin-stat-exp').value = portfolioData.stats.experience.value;

    // Theme
    document.getElementById('admin-color-primary').value = portfolioData.theme.primary;
    document.getElementById('admin-color-bg').value = portfolioData.theme.backgroundDark;
    document.getElementById('admin-color-surface').value = portfolioData.theme.surfaceDark;

    // Admin Key
    document.getElementById('admin-key').value = portfolioData.adminKey;

    // Technologies
    document.getElementById('admin-technologies').value = portfolioData.technologies.join(', ');

    // Render projects list
    renderAdminProjectsList();

    // Render experience list
    renderAdminExperienceList();
}

function renderAdminProjectsList() {
    const container = document.getElementById('admin-projects-list');
    if (!container || !portfolioData) return;

    container.innerHTML = portfolioData.projects.map(project => `
        <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary">${project.icon}</span>
                <span class="text-white font-medium">${project.title}</span>
                <span class="text-xs text-gray-400">${project.year}</span>
            </div>
            <div class="flex gap-2">
                <button onclick="editProject('${project.id}')" class="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <span class="material-symbols-outlined text-[18px] text-gray-400">edit</span>
                </button>
                <button onclick="deleteProject('${project.id}')" class="p-2 hover:bg-red-500/20 rounded-lg transition-colors">
                    <span class="material-symbols-outlined text-[18px] text-red-400">delete</span>
                </button>
            </div>
        </div>
    `).join('');
}

function renderAdminExperienceList() {
    const container = document.getElementById('admin-experience-list');
    if (!container || !portfolioData) return;

    container.innerHTML = portfolioData.experience.map(exp => `
        <div class="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div class="flex items-center gap-3">
                <span class="material-symbols-outlined text-primary">${exp.icon}</span>
                <span class="text-white font-medium">${exp.title.es}</span>
                <span class="text-xs text-gray-400">${exp.date}</span>
            </div>
            <div class="flex gap-2">
                <button onclick="editExperience('${exp.id}')" class="p-2 hover:bg-white/10 rounded-lg transition-colors">
                    <span class="material-symbols-outlined text-[18px] text-gray-400">edit</span>
                </button>
                <button onclick="deleteExperience('${exp.id}')" class="p-2 hover:bg-red-500/20 rounded-lg transition-colors">
                    <span class="material-symbols-outlined text-[18px] text-red-400">delete</span>
                </button>
            </div>
        </div>
    `).join('');
}

// Project CRUD
function showProjectForm(project = null) {
    currentEditingProject = project;
    const modal = document.getElementById('project-modal');
    const title = document.getElementById('project-modal-title');

    if (project) {
        title.textContent = 'Editar Proyecto / Edit Project';
        document.getElementById('project-id').value = project.id;
        document.getElementById('project-title').value = project.title;
        document.getElementById('project-category').value = project.category;
        document.getElementById('project-category-color').value = project.categoryColor;
        document.getElementById('project-year').value = project.year;
        document.getElementById('project-desc-es').value = project.description.es;
        document.getElementById('project-desc-en').value = project.description.en;
        document.getElementById('project-tech').value = project.technologies.join(', ');
        document.getElementById('project-demo').value = project.demoUrl || '';
        document.getElementById('project-repo').value = project.repoUrl || '';
        document.getElementById('project-download').value = project.downloadUrl || '';
        document.getElementById('project-icon').value = project.icon;
        document.getElementById('project-gradient').value = project.gradient;
    } else {
        title.textContent = 'Nuevo Proyecto / New Project';
        document.getElementById('project-form').reset();
        document.getElementById('project-id').value = 'project-' + Date.now();
    }

    modal.classList.remove('hidden');
}

function hideProjectModal() {
    document.getElementById('project-modal').classList.add('hidden');
    currentEditingProject = null;
}

function saveProject() {
    const project = {
        id: document.getElementById('project-id').value,
        title: document.getElementById('project-title').value,
        category: document.getElementById('project-category').value,
        categoryColor: document.getElementById('project-category-color').value,
        year: document.getElementById('project-year').value,
        description: {
            es: document.getElementById('project-desc-es').value,
            en: document.getElementById('project-desc-en').value
        },
        technologies: document.getElementById('project-tech').value.split(',').map(t => t.trim()),
        demoUrl: document.getElementById('project-demo').value,
        repoUrl: document.getElementById('project-repo').value,
        downloadUrl: document.getElementById('project-download').value,
        icon: document.getElementById('project-icon').value,
        gradient: document.getElementById('project-gradient').value
    };

    const index = portfolioData.projects.findIndex(p => p.id === project.id);
    if (index >= 0) {
        portfolioData.projects[index] = project;
    } else {
        portfolioData.projects.push(project);
    }

    hideProjectModal();
    renderAdminProjectsList();
    renderProjects();
}

function editProject(id) {
    const project = portfolioData.projects.find(p => p.id === id);
    if (project) showProjectForm(project);
}

function deleteProject(id) {
    if (confirm('¿Eliminar este proyecto? / Delete this project?')) {
        portfolioData.projects = portfolioData.projects.filter(p => p.id !== id);
        renderAdminProjectsList();
        renderProjects();
    }
}

// Experience CRUD
function showExperienceForm(exp = null) {
    currentEditingExp = exp;
    const modal = document.getElementById('experience-modal');
    const title = document.getElementById('experience-modal-title');

    if (exp) {
        title.textContent = 'Editar Experiencia / Edit Experience';
        document.getElementById('exp-id').value = exp.id;
        document.getElementById('exp-icon').value = exp.icon;
        document.getElementById('exp-title-es').value = exp.title.es;
        document.getElementById('exp-title-en').value = exp.title.en;
        document.getElementById('exp-date').value = exp.date;
        document.getElementById('exp-desc-es').value = exp.description.es;
        document.getElementById('exp-desc-en').value = exp.description.en;
        document.getElementById('exp-current').checked = exp.isCurrent;
    } else {
        title.textContent = 'Nueva Experiencia / New Experience';
        document.getElementById('experience-form').reset();
        document.getElementById('exp-id').value = 'exp-' + Date.now();
    }

    modal.classList.remove('hidden');
}

function hideExperienceModal() {
    document.getElementById('experience-modal').classList.add('hidden');
    currentEditingExp = null;
}

function saveExperience() {
    const exp = {
        id: document.getElementById('exp-id').value,
        icon: document.getElementById('exp-icon').value,
        title: {
            es: document.getElementById('exp-title-es').value,
            en: document.getElementById('exp-title-en').value
        },
        date: document.getElementById('exp-date').value,
        description: {
            es: document.getElementById('exp-desc-es').value,
            en: document.getElementById('exp-desc-en').value
        },
        isCurrent: document.getElementById('exp-current').checked
    };

    const index = portfolioData.experience.findIndex(e => e.id === exp.id);
    if (index >= 0) {
        portfolioData.experience[index] = exp;
    } else {
        portfolioData.experience.push(exp);
    }

    hideExperienceModal();
    renderAdminExperienceList();
    renderExperience();
}

function editExperience(id) {
    const exp = portfolioData.experience.find(e => e.id === id);
    if (exp) showExperienceForm(exp);
}

function deleteExperience(id) {
    if (confirm('¿Eliminar esta experiencia? / Delete this experience?')) {
        portfolioData.experience = portfolioData.experience.filter(e => e.id !== id);
        renderAdminExperienceList();
        renderExperience();
    }
}

// Save all changes from admin panel
function saveAdminChanges() {
    // Profile
    portfolioData.profile.name = document.getElementById('admin-name').value;
    portfolioData.profile.shortName = document.getElementById('admin-shortname').value;
    portfolioData.profile.initials = document.getElementById('admin-initials').value;
    portfolioData.profile.role.es = document.getElementById('admin-role-es').value;
    portfolioData.profile.role.en = document.getElementById('admin-role-en').value;
    portfolioData.profile.email = document.getElementById('admin-email').value;
    portfolioData.profile.github = document.getElementById('admin-github').value;
    portfolioData.profile.linkedin = document.getElementById('admin-linkedin').value;
    portfolioData.profile.avatarUrl = document.getElementById('admin-avatar').value;
    portfolioData.profile.cvUrl = document.getElementById('admin-cv').value;

    // Hero
    portfolioData.hero.greeting.es = document.getElementById('admin-hero-greeting-es').value;
    portfolioData.hero.greeting.en = document.getElementById('admin-hero-greeting-en').value;
    portfolioData.hero.description.es = document.getElementById('admin-hero-desc-es').value;
    portfolioData.hero.description.en = document.getElementById('admin-hero-desc-en').value;

    // Stats
    portfolioData.stats.yearsActive.value = document.getElementById('admin-stat-years').value;
    portfolioData.stats.projects.value = document.getElementById('admin-stat-projects').value;
    portfolioData.stats.techStack.value = document.getElementById('admin-stat-tech').value;
    portfolioData.stats.experience.value = document.getElementById('admin-stat-exp').value;

    // Theme
    portfolioData.theme.primary = document.getElementById('admin-color-primary').value;
    portfolioData.theme.backgroundDark = document.getElementById('admin-color-bg').value;
    portfolioData.theme.surfaceDark = document.getElementById('admin-color-surface').value;

    // Admin Key
    portfolioData.adminKey = document.getElementById('admin-key').value;

    // Technologies
    portfolioData.technologies = document.getElementById('admin-technologies').value.split(',').map(t => t.trim());

    // Apply changes
    applyTheme();
    renderPortfolio();

    alert('Cambios aplicados. Descarga el archivo data.json para guardar permanentemente.\n\nChanges applied. Download data.json to save permanently.');
}

// Preview theme changes live
function previewTheme() {
    const primary = document.getElementById('admin-color-primary').value;
    const bg = document.getElementById('admin-color-bg').value;
    const surface = document.getElementById('admin-color-surface').value;

    document.documentElement.style.setProperty('--tw-colors-primary', primary);
    document.body.style.backgroundColor = bg;

    // Update CSS variables
    const style = document.createElement('style');
    style.textContent = `
        .bg-primary { background-color: ${primary} !important; }
        .text-primary { color: ${primary} !important; }
        .border-primary { border-color: ${primary} !important; }
        .bg-primary\\/10 { background-color: ${primary}1a !important; }
        .bg-primary\\/20 { background-color: ${primary}33 !important; }
        .bg-background-dark { background-color: ${bg} !important; }
        .bg-surface-dark { background-color: ${surface} !important; }
    `;
    document.head.appendChild(style);
}

// Download data.json
function downloadData() {
    saveAdminChanges();

    const dataStr = JSON.stringify(portfolioData, null, 4);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = 'data.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Switch admin panel tabs
function switchAdminTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.admin-tab-content').forEach(tab => {
        tab.classList.add('hidden');
    });

    // Show selected tab
    document.getElementById(`admin-tab-${tabName}`).classList.remove('hidden');

    // Update tab buttons
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        btn.classList.remove('bg-primary', 'text-background-dark');
        btn.classList.add('text-gray-400', 'hover:bg-white/10');
    });

    document.querySelector(`[data-tab="${tabName}"]`).classList.add('bg-primary', 'text-background-dark');
    document.querySelector(`[data-tab="${tabName}"]`).classList.remove('text-gray-400', 'hover:bg-white/10');
}
