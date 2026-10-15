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

const dialog = document.querySelector('.booking-dialog');
const choice = document.querySelector('#session-choice');
const duration = document.querySelector('#selected-duration');
const price = document.querySelector('#selected-price');
const sessions = {
  first: ['55 минут · диагностический сеанс', '5 700 ₽ вместо 7 800 ₽'],
  body: ['Базовый формат · 55 минут', '5 700–7 800 ₽'],
  extended: ['85 минут и более длительные сеансы · до 2 часов', 'Стоимость согласуем при записи'],
  combined: ['Базовый сеанс · 55 минут · индивидуальное сочетание техник', '5 700–7 800 ₽ за базовый сеанс'],
  chinese: ['В составе индивидуального сеанса · базово 55 минут', '5 700–7 800 ₽ за базовый сеанс'],
  feet: ['В составе индивидуального сеанса · базово 55 минут', '5 700–7 800 ₽ за базовый сеанс'],
  face: ['Массаж лица · отдельная составляющая по запросу', 'Формат и стоимость согласуем лично'],
  course: ['Количество встреч обсудим после первого сеанса', 'Скидка 10% на абонемент'],
  qigong: ['Отдельное индивидуальное занятие', 'Длительность и стоимость — при записи'],
  training: ['Обучение техникам Цзин-ло · с учётом вашей подготовки', 'Программу, длительность и стоимость обсудим лично']
};
let trigger;
function updateSession() {
  const selected = sessions[choice.value] || sessions.first;
  duration.textContent = selected[0];
  price.textContent = selected[1];
}
document.querySelectorAll('[data-book]').forEach(button => {
  button.addEventListener('click', () => {
    trigger = button;
    choice.value = button.dataset.book || 'first';
    updateSession();
    closeMenu();
    dialog.showModal();
    document.body.classList.add('modal-open');
    choice.focus();
  });
});
choice.addEventListener('change', updateSession);
document.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
document.querySelector('.dialog-done').addEventListener('click', () => dialog.close());
dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) dialog.close();
});
dialog.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  trigger?.focus();
});

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
