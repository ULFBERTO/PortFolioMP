import { Suspense, lazy, memo, useCallback, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext.jsx';
import { LazyImage } from '@/shared/components/ui/index.js';
import { SectionHead, TechTag } from '@/shared/components/ui/Ink.jsx';

const ProjectModal = lazy(() => import('./ProjectModal.jsx'));

function ProjectsSection({ projects }) {
  const { t } = useLanguage();
  const [selectedProject, setSelectedProject] = useState(null);
  const handleSelect = useCallback((project) => setSelectedProject(project), []);
  const handleClose = useCallback(() => setSelectedProject(null), []);

  return (
    <section id="projects" className="flex flex-col gap-5 xl:col-span-2" aria-label={t('projects.title')}>
      <SectionHead kicker="// réplica x2 x4 x8" title={t('projects.title')} icon="view_kanban" />
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {projects.map((project, i) => (
          <ProjectCard key={project.id} project={project} index={i} onClick={() => handleSelect(project)} />
        ))}
      </div>
      {selectedProject && (
        <Suspense fallback={null}>
          <ProjectModal project={selectedProject} onClose={handleClose} />
        </Suspense>
      )}
    </section>
  );
}

const ProjectCard = memo(function ProjectCard({ project, index, onClick }) {
  const { lang } = useLanguage();
  return (
    <article
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick?.(); }
      }}
      tabIndex={0}
      role="button"
      aria-label={project.title}
      className="project-card group relative flex cursor-pointer flex-col overflow-hidden bg-[#fffdf7]"
      style={{
        border: '2.5px solid #1e1630',
        borderRadius: index % 2 ? '15px 225px 15px 255px / 255px 15px 225px 15px' : '255px 15px 225px 15px / 15px 225px 15px 255px',
        boxShadow: '4px 5px 0 #1e1630',
      }}
    >
      <span className="absolute -top-2 left-8 z-10 rotate-[-4deg] border border-ink/30 bg-paperdeep px-2 font-mono text-[10px] font-bold uppercase tracking-widest">
        seed {100 + index * 17}
      </span>
      <div className="relative flex h-44 w-full items-center justify-center overflow-hidden border-b-[2.5px] border-ink bg-paper">
        {project.imageUrl ? (
          <LazyImage src={project.imageUrl} alt={project.title} className="absolute inset-0 h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <span className="material-symbols-outlined text-6xl text-ink/40 transition-colors group-hover:text-ink" aria-hidden>{project.icon}</span>
        )}
        <div className="absolute left-3 top-3 rounded-full border-2 border-ink bg-pgreen/70 px-3 py-0.5 font-mono text-[11px] font-bold">{project.category}</div>
        <div className="absolute right-3 top-3 rounded-full border-2 border-ink bg-paper px-3 py-0.5 font-mono text-[11px] font-bold">{project.year}</div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-5">
        <h3 className="hand-title text-3xl leading-none">{project.title}</h3>
        <p className="line-clamp-3 text-sm leading-relaxed text-ink/70">{project.description[lang]}</p>
        <div className="mt-auto flex flex-wrap gap-1.5">
          {project.technologies.map((tech) => (<TechTag key={tech} label={tech} />))}
        </div>
        <div className="mt-1 flex gap-2">
          {project.demoUrl && (
            <a href={project.demoUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              className="btn-ink flex h-9 flex-1 items-center justify-center gap-1 bg-ink text-xs font-bold text-paper">
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>Demo
            </a>
          )}
          {project.downloadUrl && (
            <a href={project.downloadUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              className="btn-ink flex h-9 flex-1 items-center justify-center gap-1 bg-paper text-xs font-bold text-ink">
              <span className="material-symbols-outlined text-[16px]">download</span>{lang === 'es' ? 'Descargar' : 'Download'}
            </a>
          )}
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} aria-label="Github Repo"
              className="btn-ink grid h-9 w-10 place-items-center bg-paper text-ink">
              <span className="material-symbols-outlined text-[18px]">code</span>
            </a>
          )}
        </div>
      </div>
    </article>
  );
});

export default memo(ProjectsSection);
