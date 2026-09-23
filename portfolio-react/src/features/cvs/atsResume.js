/**
 * Hoja ATS imprimible: port de la plantilla del usuario a datos del CV.
 * - Cero dependencias, sin JSX (testeable con node).
 * - ATS-safe: una columna, Arial, h1/h2/ul/li reales, SIN emojis ni tablas
 *   (los emojis confunden a los parsers de los reclutadores).
 * - Secciones solo si tienen datos.
 * - Salida: HTML standalone -> iframe oculto -> window.print() (Guardar como PDF).
 * @module features/cvs/atsResume
 */

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const pick = (loc, lang) => {
  if (loc == null) return '';
  if (typeof loc === 'string') return loc;
  return loc[lang] || loc.es || loc.en || '';
};

/** Divide un texto en viñetas por saltos de línea; si no hay, un solo párrafo. */
function bullets(text) {
  const lines = String(text || '')
    .split(/\r?\n/)
    .map((l) => l.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
  if (lines.length <= 1) return { bullets: [], paragraph: String(text || '').trim() };
  return { bullets: lines, paragraph: '' };
}

const ATS_CSS = `
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:Arial,Helvetica,sans-serif;font-size:10.5pt;line-height:1.5;color:#000;background:#fff;max-width:800px;margin:0 auto;padding:30px 40px}
h1{font-size:22pt;font-weight:bold;margin-bottom:4px;letter-spacing:.5px;color:#1a1a1a}
.contact{font-size:9pt;margin-bottom:14px;color:#333;border-bottom:1px solid #ccc;padding-bottom:10px}
.contact a{color:#1a1a1a;text-decoration:none}
.contact span{margin-right:18px}
h2{font-size:12pt;font-weight:bold;text-transform:uppercase;letter-spacing:1.2px;border-bottom:1.5px solid #000;margin-top:22px;margin-bottom:10px;padding-bottom:3px;color:#1a1a1a}
.summary{margin-bottom:12px}
.skills-block{margin-bottom:6px}
.skills-block strong{display:inline-block;min-width:140px;font-weight:bold}
.job{margin-bottom:16px;page-break-inside:avoid}
.job-title{font-weight:bold;font-size:10.5pt}
.job-date{font-size:9pt;color:#444;margin-bottom:3px}
ul{margin-left:18px;margin-top:2px;margin-bottom:6px}
li{margin-bottom:2px;text-align:justify}
.edu-item{margin-bottom:8px}
.edu-title{font-weight:bold}
.edu-details{font-size:9pt;color:#444}
@media print{body{padding:20px 30px;font-size:10pt}h2{border-bottom:1px solid #000}a{color:#000}}
`;

/**
 * @param {object} cv { slug, title, data }
 * @param {{lang:'es'|'en', siteUrl:string}} opts
 */
export function buildAtsHtml(cv, opts = {}) {
  const lang = opts.lang === 'en' ? 'en' : 'es';
  const siteUrl = (opts.siteUrl || '').replace(/\/$/, '');
  const d = cv?.data || {};
  const p = d.profile || {};
  const name = p.name || cv?.title || 'Hoja de vida';

  const contactBits = [];
  if (p.email) contactBits.push(`<span>Email: <a href="mailto:${esc(p.email)}">${esc(p.email)}</a></span>`);
  if (p.phone) contactBits.push(`<span>Tel: ${esc(p.phone)}</span>`);
  if (p.location) contactBits.push(`<span>Ubicación: ${esc(p.location)}</span>`);
  if (p.linkedin) contactBits.push(`<span>LinkedIn: <a href="${esc(p.linkedin)}">${esc(p.linkedin)}</a></span>`);
  if (p.github) contactBits.push(`<span>GitHub: <a href="${esc(p.github)}">${esc(p.github)}</a></span>`);
  if (cv?.slug) contactBits.push(`<span>Portafolio: <a href="${esc(`${siteUrl}/cv/${cv.slug}`)}">${esc(`${siteUrl}/cv/${cv.slug}`)}</a></span>`);

  const summary = pick(d.hero?.description, lang);
  const techs = Array.isArray(d.technologies) ? d.technologies.filter(Boolean) : [];
  const experience = Array.isArray(d.experience) ? d.experience : [];
  const projects = Array.isArray(d.projects) ? d.projects : [];
  const education = Array.isArray(d.education) ? d.education : [];
  const languages = pick(d.languages, lang);

  const T = lang === 'en'
    ? { profile: 'Professional Summary', skills: 'Technical Skills', stack: 'Stack', exp: 'Professional Experience', proj: 'Selected Projects', edu: 'Education', lang: 'Languages' }
    : { profile: 'Perfil Profesional', skills: 'Habilidades Técnicas', stack: 'Stack', exp: 'Experiencia Profesional', proj: 'Proyectos Destacados', edu: 'Educación', lang: 'Idiomas' };

  const expHtml = experience
    .map((e) => {
      const b = bullets(pick(e.description, lang));
      const body = b.bullets.length
        ? `<ul>${b.bullets.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`
        : b.paragraph ? `<p>${esc(b.paragraph)}</p>` : '';
      return `<div class="job"><div><span class="job-title">${esc(pick(e.title, lang))}</span></div>${e.date ? `<div class="job-date">${esc(e.date)}</div>` : ''}${body}</div>`;
    })
    .join('');

  const projHtml = projects
    .map((pr) => {
      const tech = (pr.technologies || []).filter(Boolean).join(', ');
      const b = bullets(pick(pr.description, lang));
      const body = b.bullets.length
        ? `<ul>${b.bullets.map((l) => `<li>${esc(l)}</li>`).join('')}</ul>`
        : b.paragraph ? `<p>${esc(b.paragraph)}</p>` : '';
      const links = [pr.demoUrl && `Demo: ${pr.demoUrl}`, pr.repoUrl && `Repo: ${pr.repoUrl}`].filter(Boolean).map(esc).join(' | ');
      return `<div class="job"><div><span class="job-title">${esc(pr.title)}</span>${tech ? ` – ${esc(tech)}` : ''}</div>${pr.year ? `<div class="job-date">${esc(pr.year)}</div>` : ''}${body}${links ? `<div class="job-date">${links}</div>` : ''}</div>`;
    })
    .join('');

  const eduHtml = education
    .filter((e) => e.title || e.details)
    .map((e) => `<div class="edu-item"><div class="edu-title">${esc(e.title)}</div>${e.details ? `<div class="edu-details">${esc(e.details)}</div>` : ''}</div>`)
    .join('');

  return `<!DOCTYPE html>
<html lang="${lang}">
<head><meta charset="UTF-8"><title>CV - ${esc(name)}</title><style>${ATS_CSS}</style></head>
<body>
<h1>${esc(name)}</h1>
${contactBits.length ? `<div class="contact">${contactBits.join('')}</div>` : ''}
${summary ? `<h2>${T.profile}</h2><p class="summary">${esc(summary)}</p>` : ''}
${techs.length ? `<h2>${T.skills}</h2><div class="skills-block"><strong>${T.stack}:</strong> ${esc(techs.join(', '))}</div>` : ''}
${expHtml ? `<h2>${T.exp}</h2>${expHtml}` : ''}
${projHtml ? `<h2>${T.proj}</h2>${projHtml}` : ''}
${eduHtml ? `<h2>${T.edu}</h2>${eduHtml}` : ''}
${languages ? `<h2>${T.lang}</h2><p>${esc(languages)}</p>` : ''}
</body>
</html>`;
}

/**
 * Descarga el CV como PDF vía diálogo de impresión (Guardar como PDF).
 * Usa iframe oculto con documento standalone: lo impreso es solo la hoja.
 */
export function printAtsPdf(cv, opts = {}) {
  const html = buildAtsHtml(cv, {
    lang: opts.lang,
    siteUrl: opts.siteUrl || window.location.origin,
  });
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden;';
  document.body.appendChild(iframe);
  const cleanup = () => {
    try {
      document.body.removeChild(iframe);
    } catch {
      /* noop */
    }
  };
  const doc = iframe.contentDocument || iframe.contentWindow?.document;
  doc.open();
  doc.write(html);
  doc.close();
  const go = () => {
    try {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    } finally {
      // La limpieza real ocurre tras el diálogo (afterprint) + fallback por tiempo
      setTimeout(cleanup, 2000);
    }
  };
  try {
    iframe.contentWindow.onafterprint = cleanup;
  } catch {
    /* noop */
  }
  // Dar un tick a que el documento asiente antes de imprimir
  setTimeout(go, 350);
}
