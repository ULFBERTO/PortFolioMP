import { useState } from 'react'
import { useLanguage } from '../context/LanguageContext'

const categoryStyles = {
  primary: 'bg-primary/20 text-primary border-primary/30',
  blue: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  purple: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  orange: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  red: 'bg-red-500/20 text-red-400 border-red-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30'
}

export default function ProjectsSection({ projects }) {
  const { t } = useLanguage()
  const [selectedProject, setSelectedProject] = useState(null)

  return (
    <section id="projects" className="xl:col-span-2 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary">view_kanban</span>
          <h2 className="text-white text-xl font-bold">{t('projects.title')}</h2>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {projects.map((project) => (
          <ProjectCard key={project.id} project={project} onClick={() => setSelectedProject(project)} />
        ))}
      </div>

      {selectedProject && (
        <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />
      )}
    </section>
  )
}

function ProjectCard({ project, onClick }) {
  const { lang } = useLanguage()

  return (
    <article 
      onClick={onClick}
      className="project-card group flex flex-col bg-surface-dark rounded-3xl overflow-hidden border border-white/5 hover:border-primary/50 hover:shadow-[0_0_30px_rgba(43,238,121,0.1)] cursor-pointer transition-all"
    >
      <div className={`h-48 w-full bg-gradient-to-br ${project.gradient} relative flex items-center justify-center overflow-hidden`}>
        {project.imageUrl ? (
          <img 
            src={project.imageUrl} 
            alt={project.title} 
            loading="lazy"
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <span className="material-symbols-outlined text-6xl text-primary/60 group-hover:text-primary transition-colors">{project.icon}</span>
        )}
        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all"></div>
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10">
          {project.year}
        </div>
        <div className={`absolute top-4 left-4 ${categoryStyles[project.categoryColor] || categoryStyles.primary} backdrop-blur-md text-xs font-bold px-3 py-1 rounded-full border`}>
          {project.category}
        </div>
      </div>
      <div className="flex flex-col p-6 gap-4 flex-1">
        <div>
          <h3 className="text-white text-lg font-bold group-hover:text-primary transition-colors">{project.title}</h3>
          <p className="text-gray-400 text-sm mt-2 line-clamp-3">{project.description[lang]}</p>
        </div>
        <div className="flex flex-wrap gap-2 mt-auto">
          {project.technologies.map((tech) => (
            <span key={tech} className="text-xs text-primary bg-primary/10 px-2 py-1 rounded">{tech}</span>
          ))}
        </div>
        <div className="flex gap-3 mt-2">
          {project.demoUrl && (
            <a 
              href={project.demoUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={(e) => e.stopPropagation()}
              className="flex-1 h-10 rounded-full bg-primary/20 hover:bg-primary/30 text-primary text-xs font-bold transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
              Demo
            </a>
          )}
          {project.downloadUrl && (
            <a 
              href={project.downloadUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={(e) => e.stopPropagation()}
              className="flex-1 h-10 rounded-full bg-white/5 hover:bg-white/10 text-white text-xs font-bold transition-colors flex items-center justify-center gap-1"
            >
              <span className="material-symbols-outlined text-[16px]">download</span>
              <span>{lang === 'es' ? 'Descargar' : 'Download'}</span>
            </a>
          )}
          {project.repoUrl && (
            <a 
              href={project.repoUrl} 
              target="_blank" 
              rel="noopener noreferrer" 
              onClick={(e) => e.stopPropagation()}
              aria-label="Github Repo" 
              className="h-10 w-10 flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-white transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">code</span>
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

function ProjectModal({ project, onClose }) {
  const { lang } = useLanguage()

  return (
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
    >
      <div 
        className="bg-surface-dark rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Image */}
        <div className={`h-64 w-full bg-gradient-to-br ${project.gradient} relative flex items-center justify-center overflow-hidden`}>
          {project.imageUrl ? (
            <img 
              src={project.imageUrl} 
              alt={project.title} 
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <span className="material-symbols-outlined text-8xl text-primary/60">{project.icon}</span>
          )}
          <div className="absolute inset-0 bg-black/30"></div>
          
          {/* Close button */}
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white flex items-center justify-center transition-colors border border-white/10"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          {/* Year and Category badges */}
          <div className="absolute top-4 left-4 flex gap-2">
            <div className={`${categoryStyles[project.categoryColor] || categoryStyles.primary} backdrop-blur-md text-xs font-bold px-3 py-1 rounded-full border`}>
              {project.category}
            </div>
            <div className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10">
              {project.year}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 space-y-6">
          {/* Title */}
          <div>
            <h2 className="text-white text-3xl font-bold mb-2">{project.title}</h2>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <span key={tech} className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full">{tech}</span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="text-white text-lg font-bold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">description</span>
              {lang === 'es' ? 'Descripción' : 'Description'}
            </h3>
            <p className="text-gray-300 text-base leading-relaxed whitespace-pre-line">
              {project.description[lang]}
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 pt-4">
            {project.demoUrl && (
              <a 
                href={project.demoUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex-1 min-w-[200px] h-12 rounded-full bg-primary hover:bg-[#1fd665] text-background-dark text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                {lang === 'es' ? 'Ver Demo' : 'View Demo'}
              </a>
            )}
            {project.downloadUrl && (
              <a 
                href={project.downloadUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex-1 min-w-[200px] h-12 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">download</span>
                {lang === 'es' ? 'Descargar' : 'Download'}
              </a>
            )}
            {project.repoUrl && (
              <a 
                href={project.repoUrl} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex-1 min-w-[200px] h-12 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">code</span>
                {lang === 'es' ? 'Ver Código' : 'View Code'}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
