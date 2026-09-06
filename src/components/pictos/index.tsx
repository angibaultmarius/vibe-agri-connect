/**
 * Pictogrammes extraits de banques libres, au moment du développement, puis
 * figés ici en SVG inline — aucune dépendance ni requête réseau à l'exécution.
 *
 *  - pictogrammes en couleur : Fluent Emoji (Microsoft), licence MIT
 *  - pictogrammes au trait   : Lucide, licence ISC
 *
 * Voir la section « Crédits » du README.
 */

type Props = { className?: string };

export function PictoRepas(props: Props) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden {...props} dangerouslySetInnerHTML={{ __html: `<g fill="none"><path fill="#cdc4d6" d="M16.5 28C22.851 28 28 22.851 28 16.5S22.851 5 16.5 5S5 10.149 5 16.5S10.149 28 16.5 28"/><path fill="#e1d8ec" d="M16.5 24.5a8 8 0 1 0 0-16a8 8 0 0 0 0 16"/><path fill="#998ea4" d="M6.82 6.31a.68.68 0 0 0-.68.68v2.69c0 .2-.16.35-.35.35c-.2 0-.35-.16-.35-.35V7.02c0-.37-.29-.7-.66-.71c-.39-.01-.71.3-.71.68v2.69c0 .2-.16.35-.35.35c-.2 0-.35-.16-.35-.35V7.02c0-.37-.29-.7-.66-.71c-.39-.01-.71.3-.71.68v4.58c0 .902.437 1.707 1.109 2.209c.601.339.601 1.891.601 1.891v10.02c0 .52.42.94.94.94h.23c.52 0 .94-.42.94-.94V15.67s0-1.491.601-1.891A2.76 2.76 0 0 0 7.53 11.57V6.99a.72.72 0 0 0-.71-.68m21.54 0c.9 0 1.63.73 1.63 1.63V25.7c0 .52-.42.94-.94.94h-.23c-.52 0-.94-.42-.94-.94v-8.617a3.15 3.15 0 0 1-1.85-2.883V8.65a2.32 2.32 0 0 1 2.33-2.34"/></g>` }} />
  );
}

export function PictoSport(props: Props) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden {...props} dangerouslySetInnerHTML={{ __html: `<g fill="none"><path fill="#ffc83d" d="M20.513 29.969H9.093c-4.75 0-7.08-3.859-7.03-6.969c0-3.406 4.843-15.875 4.843-15.875c.813-2.031 1.515-3.695 3.907-3.656c1.843 0 5.39 1.5 5.39 4.5c0 1.625-1.14 2.11-1.14 2.11c0 .968-.797 1.89-1.641 1.89H9.688s3.137 6.298 3.406 6.797c.268.499.531 0 .531 0c1.063-3.235 4.625-5.772 7.781-5.772C25.895 12.993 30 17.015 30 20.768v-.001v.002c0 4.763-3.157 9.2-9.487 9.2m9.487-9.2v-.002z"/><path fill="#d67d00" d="m10.25 6.437l1.297 1.649h2.094c-.47-.64-2.116-1.874-3.391-1.649m4.826 3.635l-.014.006c0 .969-.796 1.89-1.64 1.89h-3.59l.939 2.174C7.962 13.908 7 10.992 7 10.992h.814l.033.016h5.31c.53 0 1.687-.477.859-2.008c.29 0 .898.439 1.06 1.072m-.425 8.63a1.48 1.48 0 0 0-.756-.628a7 7 0 0 0-.27.692s-.094.178-.227.215a.5.5 0 0 1 .399.24l2.963 4.882a.5.5 0 0 0 .855-.519zm-2.559-.008a1.5 1.5 0 0 1 .666-.586c.171.34.292.576.336.658c.075.14.15.201.22.217a.5.5 0 0 0-.37.235l-2.893 4.7a.5.5 0 0 1-.852-.524z"/></g>` }} />
  );
}

export function PictoMedicament(props: Props) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden {...props} dangerouslySetInnerHTML={{ __html: `<g fill="none"><path fill="#fcd53f" d="m21.415 21.405l-6.39 6.39a7.63 7.63 0 0 1-10.79 0a7.63 7.63 0 0 1 0-10.79l6.39-6.39l8.642 2.585z"/><path fill="#f8312f" d="m10.635 10.625l6.39-6.39a7.63 7.63 0 0 1 10.79 0a7.63 7.63 0 0 1 0 10.79l-6.39 6.39z"/><path fill="#f4f4f4" d="M26 12a2 2 0 1 0 0-4a2 2 0 0 0 0 4"/></g>` }} />
  );
}

export function PictoTabac(props: Props) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden {...props} dangerouslySetInnerHTML={{ __html: `<g fill="none"><path fill="#fff" d="M27.875 15.938c0 6.592-5.345 11.937-11.937 11.937C9.345 27.875 4 22.53 4 15.938C4 9.345 9.345 4 15.938 4c6.592 0 11.937 5.345 11.937 11.938"/><path fill="#000" d="m22.603 9.817l-.342 1.056a2 2 0 0 0 .136 1.553l.404.763a2 2 0 0 1 .233.937v1.133c0 .24.303.342.449.152l.702-.922a2 2 0 0 0 .05-2.355l-.685-.984a2 2 0 0 1-.297-.65l-.17-.667c-.061-.243-.402-.254-.48-.016M7 17a1 1 0 0 1 1-1h13.75a.25.25 0 0 1 .25.25v2.5a.25.25 0 0 1-.25.25H8a1 1 0 0 1-1-1zm16-.75a.25.25 0 0 1 .25-.25h.5a.25.25 0 0 1 .25.25v2.5a.25.25 0 0 1-.25.25h-.5a.25.25 0 0 1-.25-.25z"/><path fill="#f8312f" d="M16 30c7.732 0 14-6.268 14-14S23.732 2 16 2S2 8.268 2 16s6.268 14 14 14m6.645-5.233A10.95 10.95 0 0 1 16 27C9.925 27 5 22.075 5 16c0-2.497.832-4.8 2.233-6.645zm2.122-2.122L9.355 7.233A10.95 10.95 0 0 1 16 5c6.075 0 11 4.925 11 11c0 2.497-.832 4.8-2.233 6.645"/></g>` }} />
  );
}

export function PictoCoeur(props: Props) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden {...props} dangerouslySetInnerHTML={{ __html: `<g fill="#f92f60"><path d="M11.372 4.011c-3.845-.961-7.089.014-8.933 2.781a.527.527 0 1 1-.877-.584c2.155-3.233 5.911-4.258 10.066-3.22a.527.527 0 0 1-.256 1.023m8.926 4.123C17.87 8.557 16 11.37 16 11.37s-1.86-2.823-4.298-3.236C5.695 7.1 3.216 12.275 4.215 16.132c1.397 5.36 7.792 10.496 10.533 12.493a2.12 2.12 0 0 0 2.505 0c2.74-1.997 9.135-7.134 10.532-12.493c1-3.847-1.48-9.031-7.487-7.998"/><path d="M4.917 7.777c.445-.672 1.008-1.21 1.724-1.535c.713-.324 1.615-.455 2.772-.25a.5.5 0 0 0 .174-.984c-1.323-.235-2.435-.097-3.36.324c-.922.42-1.619 1.101-2.144 1.892a.5.5 0 1 0 .834.553m15.711-3.766c3.846-.961 7.09.014 8.934 2.781a.527.527 0 0 0 .877-.584c-2.156-3.233-5.912-4.258-10.067-3.22a.527.527 0 0 0 .256 1.023"/><path d="M27.084 7.777c-.446-.672-1.01-1.21-1.725-1.535c-.713-.324-1.615-.455-2.772-.25a.5.5 0 1 1-.174-.984c1.323-.235 2.436-.097 3.36.324c.922.42 1.62 1.101 2.144 1.892a.5.5 0 1 1-.834.553"/></g>` }} />
  );
}

export function PictoLune(props: Props) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden {...props} dangerouslySetInnerHTML={{ __html: `<g fill="none"><path fill="#fcd53f" d="M23.41 5.632c.5 2.04.56 4.26.02 6.56c-1.26 5.33-5.64 9.51-11.02 10.48c-2.91.53-5.68.13-8.09-.92c-.56-.25-1.09.39-.8.93c2.65 4.88 8.11 8 14.22 7.19c6.23-.83 11.22-5.91 11.97-12.15c.6-5.18-1.6-9.86-5.28-12.75c-.47-.36-1.16.08-1.02.66"/><path fill="#f9c23c" d="M27.87 12.562a1.57 1.57 0 1 1-3.14 0a1.57 1.57 0 0 1 3.14 0m-12.92 12.88a1.57 1.57 0 1 1-3.14 0a1.57 1.57 0 0 1 3.14 0m11.85-6.47a.99.99 0 1 0 0-1.98a.99.99 0 0 0 0 1.98m-2 3.01a3 3 0 1 1-6 0a3 3 0 0 1 6 0"/></g>` }} />
  );
}

export function PictoAssiette(props: Props) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden {...props} dangerouslySetInnerHTML={{ __html: `<g fill="none"><path fill="#b4acbc" d="M18.69 29.52h-5.41C7.05 29.52 2 24.46 2 18.23v-5.27h27.97v5.27c0 6.23-5.05 11.29-11.28 11.29"/><path fill="#e1d8ec" d="M21.97 4.96H10c-4.42 0-8 3.58-8 8s3.58 8 8 8h11.97c4.42 0 8-3.58 8-8s-3.58-8-8-8"/><path fill="#44911b" d="M28.24 11.69c0-.1-.01-.2-.01-.31c-.18-2.41-2.12-4.35-4.52-4.52c-.03 0-.06 0-.09-.01c-1.5-.08-2.87-.83-3.81-2.01a4.862 4.862 0 0 0-7.62 0c-.94 1.18-2.31 1.93-3.81 2.01c-.03 0-.06 0-.09.01c-2.4.17-4.34 2.11-4.52 4.52c-.01.1-.01.21-.01.31c0 3.77 3.06 6.83 6.83 6.83h10.83c3.76 0 6.82-3.06 6.82-6.83"/><path fill="#f8312f" d="M24.83 12.23a5.17 5.17 0 0 0 .08-6.65a.755.755 0 0 0-1.17-.01l-1.047 1.216l-.623 2.817l-2.936 1.321l-1.054 1.226c-.31.36-.22.91.19 1.16c2.11 1.25 4.89.85 6.56-1.08"/><path fill="#86d72f" d="M27.274 15.26a5.78 5.78 0 0 1-5.304 3.48H10a5.79 5.79 0 0 1-5.418-3.764A7.17 7.17 0 0 1 9.56 12.42c1.54-.1 2.97.27 4.19.99c1.27.75 2.88.75 4.15 0a7.14 7.14 0 0 1 4.18-.98c2.108.148 3.976 1.23 5.194 2.83"/><path fill="#f92f60" d="M7.98 16.01c2.33 1.03 5.02.21 6.39-1.84c.26-.39.11-.93-.32-1.13l-1.473-.652l-2.93-.08l-2.057-2.127l-1.47-.651c-.44-.2-.94.05-1.06.51c-.59 2.39.59 4.94 2.92 5.97"/><path fill="#ca0b4a" d="M22.72 6.75c1.16 1 1.29 2.75.29 3.91s-2.75 1.3-3.91.29zm-10.1 5.66a2.774 2.774 0 0 1-5.07-2.25z"/><path fill="#f9c23c" d="M14.57 10.49a1.83 1.83 0 1 0 0-3.66a1.83 1.83 0 0 0 0 3.66m9.58 5.56a1.83 1.83 0 1 0 0-3.66a1.83 1.83 0 0 0 0 3.66m-8.8.27a1.83 1.83 0 1 1-3.66 0a1.83 1.83 0 0 1 3.66 0"/></g>` }} />
  );
}

export function IconeAccueil(props: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props} dangerouslySetInnerHTML={{ __html: `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"/><path d="M3 10a2 2 0 0 1 .709-1.528l7-6a2 2 0 0 1 2.582 0l7 6A2 2 0 0 1 21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></g>` }} />
  );
}

export function IconeCarnet(props: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props} dangerouslySetInnerHTML={{ __html: `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M2 6h4m-4 4h4m-4 4h4m-4 4h4"/><rect width="16" height="20" x="4" y="2" rx="2"/><path d="M9.5 8h5m-5 4H16m-6.5 4H14"/></g>` }} />
  );
}

export function IconeCourbe(props: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props} dangerouslySetInnerHTML={{ __html: `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3 3v16a2 2 0 0 0 2 2h16"/><path d="m19 9l-5 5l-4-4l-3 3"/></g>` }} />
  );
}

export function IconeCamera(props: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props} dangerouslySetInnerHTML={{ __html: `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M13.997 4a2 2 0 0 1 1.76 1.05l.486.9A2 2 0 0 0 18.003 7H20a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h1.997a2 2 0 0 0 1.759-1.048l.489-.904A2 2 0 0 1 10.004 4z"/><circle cx="12" cy="13" r="3"/></g>` }} />
  );
}

export function IconeReprendre(props: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props} dangerouslySetInnerHTML={{ __html: `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9a9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></g>` }} />
  );
}

export function IconeValider(props: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props} dangerouslySetInnerHTML={{ __html: `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 6L9 17l-5-5"/>` }} />
  );
}

export function IconeFermer(props: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props} dangerouslySetInnerHTML={{ __html: `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 6L6 18M6 6l12 12"/>` }} />
  );
}

export function IconePlus(props: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props} dangerouslySetInnerHTML={{ __html: `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14m-7-7v14"/>` }} />
  );
}

export function IconeEclair(props: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props} dangerouslySetInnerHTML={{ __html: `<path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.914 4a1.5 1.5 0 0 0-2.474-1.561l-9 9A1.5 1.5 0 0 0 5.5 14h4.002a.5.5 0 0 1 .471.666L8.086 20a1.5 1.5 0 0 0 2.475 1.56l9-9A1.5 1.5 0 0 0 18.5 10h-3.997a.5.5 0 0 1-.472-.667z"/>` }} />
  );
}

export function IconeBascule(props: Props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden {...props} dangerouslySetInnerHTML={{ __html: `<g fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2"><path d="M11 19H4a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h5m4 0h7a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-5"/><circle cx="12" cy="12" r="3"/><path d="m18 22l-3-3l3-3M6 2l3 3l-3 3"/></g>` }} />
  );
}

