import { memo, useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext.jsx';
import { LazyImage } from '@/shared/components/ui/index.js';
import { categoryStyles } from './projectStyles.js';

/**
 * Modal pesado: se carga en chunk separado solo al abrir un proyecto.
 * Incluye focus management básico + cierre con Escape.
 */
const ProjectModal = memo(function ProjectModal({ project, onClose }) {
  const { lang, t } = useLanguage();

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    document.addEventListener('keydown', onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
    >
      <div
        className="bg-surface-dark rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto border border-white/10 shadow-2xl animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className={`h-64 w-full bg-gradient-to-br ${project.gradient} relative flex items-center justify-center overflow-hidden`}>
          {project.imageUrl ? (
            <LazyImage
              src={project.imageUrl}
              alt={project.title}
              eager
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <span className="material-symbols-outlined text-8xl text-primary/60">{project.icon}</span>
          )}
          <div className="absolute inset-0 bg-black/30" aria-hidden />

          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md hover:bg-black/80 text-white flex items-center justify-center transition-colors border border-white/10"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <div className="absolute top-4 left-4 flex gap-2">
            <div className={`${categoryStyles[project.categoryColor] || categoryStyles.primary} backdrop-blur-md text-xs font-bold px-3 py-1 rounded-full border`}>
              {project.category}
            </div>
            <div className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-3 py-1 rounded-full border border-white/10">
              {project.year}
            </div>
          </div>
        </div>

        <div className="p-8 space-y-6">
          <div>
            <h2 className="text-white text-3xl font-bold mb-2">{project.title}</h2>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <span key={tech} className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full">{tech}</span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-white text-lg font-bold mb-3 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">description</span>
              {t('common.description')}
            </h3>
            <p className="text-gray-300 text-base leading-relaxed whitespace-pre-line">
              {project.description[lang]}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 min-w-[200px] h-12 rounded-full bg-primary hover:bg-[#1fd665] text-background-dark text-sm font-bold transition-colors flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[20px]">play_arrow</span>
                {t('projects.viewDemo')}
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
                {t('projects.download')}
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
                {t('projects.viewCode')}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export default ProjectModal;
