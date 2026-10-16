// Native controls remain available without JavaScript or complete player markup.
document.querySelectorAll('.video-player').forEach(player => {
  const video = player.querySelector('video');
  const ui = player.querySelector('.video-ui');
  const start = player.querySelector('.video-start');
  const startLabel = player.querySelector('.video-start-label');
  const controls = player.querySelector('.video-controls');
  const toggle = player.querySelector('.video-toggle');
  const mute = player.querySelector('.video-mute');
  const progress = player.querySelector('.video-progress');
  const loading = player.querySelector('.video-loading');
  const error = player.querySelector('.video-error');
  if (!video || !ui || !start || !startLabel || !controls || !toggle || !mute || !progress || !loading || !error) return;
  const title = document.getElementById(video.getAttribute('aria-labelledby'))?.textContent || 'Видео';
  let started = false;
  let attempt = 0;

  function busy(value) {
    loading.hidden = !value;
    video.setAttribute('aria-busy', String(value));
  }
  function updateSound() {
    player.classList.toggle('is-muted', video.muted);
    mute.setAttribute('aria-pressed', String(video.muted));
    mute.setAttribute('aria-label', `${video.muted ? 'Включить' : 'Выключить'} звук: ${title}`);
  }
  function updateProgress() {
    const known = Number.isFinite(video.duration) && video.duration > 0;
    progress.disabled = !known;
    if (!known) return;
    progress.max = String(video.duration);
    progress.value = String(video.currentTime);
    progress.style.setProperty('--played', `${video.currentTime / video.duration * 100}%`);
    progress.setAttribute('aria-valuetext', `${Math.round(video.currentTime)} из ${Math.round(video.duration)} секунд`);
  }
  function showError() {
    ++attempt;
    video.pause();
    busy(false);
    player.classList.remove('is-playing');
    const restoreFocus = player.contains(document.activeElement);
    controls.hidden = true;
    error.textContent = 'Видео не загрузилось. Попробуйте ещё раз.';
    error.hidden = false;
    startLabel.textContent = 'Повторить';
    start.setAttribute('aria-label', `Повторить загрузку: ${title}`);
    start.hidden = false;
    if (restoreFocus) start.focus({ preventScroll: true });
  }
  async function play() {
    const request = ++attempt;
    const restoreFocus = document.activeElement === start;
    const retry = !error.hidden;
    error.hidden = true;
    if (retry || video.error) video.load();
    if (video.ended) video.currentTime = 0;
    started = true;
    start.hidden = true;
    controls.hidden = false;
    busy(true);
    if (restoreFocus) toggle.focus({ preventScroll: true });
    try {
      await video.play();
    } catch (reason) {
      if (request === attempt && reason.name !== 'AbortError') showError();
    }
  }
  function togglePlayback() {
    if (video.paused || video.ended) play();
    else video.pause();
  }
  start.addEventListener('click', play);
  toggle.addEventListener('click', togglePlayback);
  video.addEventListener('click', togglePlayback);
  mute.addEventListener('click', () => { video.muted = !video.muted; });
  progress.addEventListener('input', () => {
    if (Number.isFinite(video.duration)) {
      video.currentTime = Math.max(0, Math.min(video.duration, Number(progress.value)));
      updateProgress();
    }
  });
  video.addEventListener('play', () => {
    player.classList.add('is-playing');
    toggle.setAttribute('aria-label', `Приостановить: ${title}`);
  });
  video.addEventListener('playing', () => busy(false));
  video.addEventListener('waiting', () => { if (started && !video.paused) busy(true); });
  video.addEventListener('pause', () => {
    ++attempt;
    busy(false);
    player.classList.remove('is-playing');
    toggle.setAttribute('aria-label', `Воспроизвести: ${title}`);
  });
  video.addEventListener('ended', () => {
    busy(false);
    player.classList.remove('is-playing');
    const restoreFocus = controls.contains(document.activeElement);
    controls.hidden = true;
    startLabel.textContent = 'Смотреть снова';
    start.setAttribute('aria-label', `Смотреть снова: ${title}`);
    start.hidden = false;
    if (restoreFocus) start.focus({ preventScroll: true });
  });
  video.addEventListener('error', showError);
  video.querySelectorAll('source').forEach(source => source.addEventListener('error', showError));
  video.addEventListener('volumechange', updateSound);
  ['loadedmetadata', 'durationchange', 'timeupdate', 'seeked'].forEach(event => video.addEventListener(event, updateProgress));
  updateSound();
  updateProgress();
  ui.hidden = false;
  video.controls = false;
});
