const menu = document.querySelector('.navigation');
const toggle = document.querySelector('.menu-toggle');
function closeMenu() {
  menu.classList.remove('is-open');
  toggle.setAttribute('aria-expanded', 'false');
  toggle.setAttribute('aria-label', 'Открыть меню');
}
toggle.addEventListener('click', () => {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  menu.classList.toggle('is-open', open);
  toggle.setAttribute('aria-expanded', String(open));
  toggle.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
});
menu.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
    closeMenu();
    toggle.focus();
  }
});
window.matchMedia('(min-width: 951px)').addEventListener('change', closeMenu);

const workVideos = document.querySelectorAll('.work-gallery video');
workVideos.forEach(video => {
  video.addEventListener('contextmenu', event => event.preventDefault());
  video.addEventListener('play', () => {
    workVideos.forEach(other => {
      if (other !== video) other.pause();
    });
  });
});

function setupCarousel(prefix) {
  const track = document.querySelector(`.${prefix}-track`);
  const previous = document.querySelector(`.${prefix}-previous`);
  const next = document.querySelector(`.${prefix}-next`);
  const position = document.querySelector(`.${prefix}-position`);
  const slides = [...track.children];
  function current() {
    return Math.max(0, Math.min(slides.length - 1, Math.round(track.scrollLeft / track.clientWidth)));
  }
  function update() {
    const index = current();
    previous.disabled = index === 0;
    next.disabled = index === slides.length - 1;
    position.textContent = `${index + 1} из ${slides.length}`;
  }
  function move(step) {
    const index = Math.max(0, Math.min(slides.length - 1, current() + step));
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    track.scrollTo({ left: index * track.clientWidth, behavior: reduced ? 'auto' : 'smooth' });
  }
  previous.addEventListener('click', () => move(-1));
  next.addEventListener('click', () => move(1));
  track.addEventListener('scroll', update, { passive: true });
  track.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    move(event.key === 'ArrowRight' ? 1 : -1);
  });
  window.addEventListener('resize', update);
  update();
}
setupCarousel('review');
setupCarousel('document');

const principles = document.querySelector('.approach-principles');
function fitPrinciples() {
  const rows = [...principles.children];
  const gap = parseFloat(getComputedStyle(principles).columnGap) || 0;
  const width = rows.reduce((total, row) => total + row.getBoundingClientRect().width, 0);
  principles.classList.toggle('is-inline', width + gap * (rows.length - 1) <= principles.clientWidth - 1);
}
if (typeof ResizeObserver !== 'undefined') new ResizeObserver(fitPrinciples).observe(principles);
window.addEventListener('resize', fitPrinciples);
if (document.fonts) document.fonts.ready.then(fitPrinciples);
fitPrinciples();
