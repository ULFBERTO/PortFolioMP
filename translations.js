// Translations for the portfolio dashboard
// This works with admin.js for dynamic content loading

// Current language
let currentLang = localStorage.getItem('portfolio-lang') || 'es';

// Static translations (UI elements that don't come from data.json)
const staticTranslations = {
    es: {
        "nav.dashboard": "Dashboard",
        "nav.projects": "Proyectos",
        "nav.experience": "Experiencia",
        "nav.contact": "Contacto",
        "experience.title": "Línea de Experiencia",
        "projects.title": "Proyectos Destacados",
        "tech.title": "Tecnologías Principales",
        "contact.sendEmail": "Enviar Email"
    },
    en: {
        "nav.dashboard": "Dashboard",
        "nav.projects": "Projects",
        "nav.experience": "Experience",
        "nav.contact": "Contact",
        "experience.title": "Experience Timeline",
        "projects.title": "Featured Projects",
        "tech.title": "Core Technologies",
        "contact.sendEmail": "Send Email"
    }
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    initMobileMenu();
    initNavigation();
    // Language will be set after data loads in admin.js
});

// Set language function
function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('portfolio-lang', lang);

    // Update static translations
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (staticTranslations[lang] && staticTranslations[lang][key]) {
            element.textContent = staticTranslations[lang][key];
        }
    });

    // Update HTML lang attribute
    document.documentElement.lang = lang === 'es' ? 'es' : 'en';

    // Update language toggle buttons
    const esBtn = document.getElementById('lang-es');
    const enBtn = document.getElementById('lang-en');
    const mobileIndicator = document.getElementById('mobile-lang-indicator');

    if (esBtn && enBtn) {
        if (lang === 'es') {
            esBtn.classList.add('bg-primary', 'text-background-dark');
            esBtn.classList.remove('text-gray-400');
            enBtn.classList.remove('bg-primary', 'text-background-dark');
            enBtn.classList.add('text-gray-400');
        } else {
            enBtn.classList.add('bg-primary', 'text-background-dark');
            enBtn.classList.remove('text-gray-400');
            esBtn.classList.remove('bg-primary', 'text-background-dark');
            esBtn.classList.add('text-gray-400');
        }
    }

    if (mobileIndicator) {
        mobileIndicator.textContent = lang.toUpperCase();
    }

    // If portfolioData is loaded, update dynamic content
    if (typeof portfolioData !== 'undefined' && portfolioData) {
        updateDataTranslations();
        renderProjects();
        renderExperience();
        renderStats();
    }
}

// Toggle language (for mobile)
function toggleLanguage() {
    const newLang = currentLang === 'es' ? 'en' : 'es';
    setLanguage(newLang);
}

// Mobile menu functionality
function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const mobileMenu = document.getElementById('mobile-menu');

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', () => {
            mobileMenu.classList.toggle('hidden');
        });
    }
}

function closeMobileMenu() {
    const mobileMenu = document.getElementById('mobile-menu');
    if (mobileMenu) {
        mobileMenu.classList.add('hidden');
    }
}

// Smooth scroll navigation
function initNavigation() {
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');
            if (targetId && targetId !== '#') {
                e.preventDefault();
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }

                // Update active nav link
                document.querySelectorAll('.nav-link').forEach(link => {
                    link.classList.remove('bg-primary/10', 'text-primary');
                    link.classList.add('text-gray-400');
                });
                this.classList.add('bg-primary/10', 'text-primary');
                this.classList.remove('text-gray-400');
            }
        });
    });
}

// Render stats from data
function renderStats() {
    const container = document.getElementById('stats-container');
    if (!container || typeof portfolioData === 'undefined' || !portfolioData) return;

    const lang = currentLang || 'es';
    const stats = portfolioData.stats;

    const statsConfig = [
        { key: 'yearsActive', icon: 'calendar_month' },
        { key: 'projects', icon: 'rocket_launch' },
        { key: 'techStack', icon: 'code' },
        { key: 'experience', icon: 'work' }
    ];

    container.innerHTML = statsConfig.map(({ key, icon }) => `
        <div class="flex flex-col gap-1 p-6 rounded-2xl bg-surface-dark border border-white/5 hover:border-primary/30 transition-colors group" data-stat="${key}">
            <div class="flex items-center justify-between mb-2">
                <p class="text-gray-400 text-sm font-medium stat-label">${stats[key].label[lang]}</p>
                <span class="material-symbols-outlined text-primary/50 group-hover:text-primary transition-colors">${icon}</span>
            </div>
            <p class="text-white text-3xl font-bold stat-value">${stats[key].value}</p>
            <p class="text-gray-500 text-xs stat-sublabel">${stats[key].sublabel[lang]}</p>
        </div>
    `).join('');
}
