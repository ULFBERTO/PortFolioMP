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
      className="fixed inset-0 z-50 flex items-center justify-center bg-ink/70 p-4 backdrop-blur-sm animate-fadeIn"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={project.title}
    >
      <div
        className="ink-card max-h-[90vh] w-full max-w-4xl overflow-y-auto animate-scaleIn"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative flex h-64 w-full items-center justify-center overflow-hidden border-b-[2.5px] border-ink bg-paper">
          {project.imageUrl ? (
            <LazyImage
              src={project.imageUrl}
              alt={project.title}
              eager
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <span className="material-symbols-outlined text-8xl text-ink/40">{project.icon}</span>
          )}

          <button
            type="button"
            onClick={onClose}
            aria-label={t('common.close')}
            className="btn-ink absolute right-4 top-4 grid size-10 place-items-center bg-paper text-ink"
          >
            <span className="material-symbols-outlined">close</span>
          </button>

          <div className="absolute top-4 left-4 flex gap-2">
            <div className="rounded-full border-2 border-ink bg-pgreen/70 px-3 py-1 font-mono text-xs font-bold">
              {project.category}
            </div>
            <div className="rounded-full border-2 border-ink bg-paper px-3 py-1 font-mono text-xs font-bold">
              {project.year}
            </div>
          </div>
        </div>

        <div className="space-y-6 p-8">
          <div>
            <h2 className="hand-title mb-2 text-5xl">{project.title}</h2>
            <div className="flex flex-wrap gap-2">
              {project.technologies.map((tech) => (
                <span key={tech} className="rounded-full border-2 border-ink bg-pgreen/30 px-3 py-1 font-mono text-xs font-bold">{tech}</span>
              ))}
            </div>
          </div>

          <div>
            <h3 className="mb-3 flex items-center gap-2 font-mono text-sm font-bold uppercase tracking-widest">
              <span className="material-symbols-outlined">description</span>
              {t('common.description')}
            </h3>
            <p className="whitespace-pre-line text-base leading-relaxed text-ink/80">
              {project.description[lang]}
            </p>
          </div>

          <div className="flex flex-wrap gap-3 pt-4">
            {project.demoUrl && (
              <a
                href={project.demoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-ink flex h-12 min-w-[200px] flex-1 items-center justify-center gap-2 bg-ink text-sm font-bold text-paper"
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
                className="btn-ink flex h-12 min-w-[200px] flex-1 items-center justify-center gap-2 bg-paper text-sm font-bold text-ink"
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
                className="btn-ink flex h-12 min-w-[200px] flex-1 items-center justify-center gap-2 bg-paper text-sm font-bold text-ink"
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
