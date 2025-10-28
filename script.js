/* ---------- Smooth scrolling for nav ---------- */
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', e => {
    const target = document.querySelector(anchor.getAttribute('href'));
    if (!target) return;
    e.preventDefault();
    target.scrollIntoView({ behavior: 'smooth' });
  });
});

/* ---------- Train path around the journey text ---------- */
function updateJourneyPath() {
  const wrap = document.getElementById('journey-line');
  if (!wrap) return;

  const text = wrap.querySelector('.journey-text');
  const svg  = wrap.querySelector('.journey-svg');
  const path = document.getElementById('journey-track-path');
  if (!text || !svg || !path) return;

  const r = text.getBoundingClientRect();

  // Slightly tighter padding so the train "hugs" the sentence
  const padX = 14, padY = 10;
  const radius = 16;

  const w = Math.max(60, Math.round(r.width  + padX * 2));
  const h = Math.max(40, Math.round(r.height + padY * 2));

  svg.setAttribute('width',  w);
  svg.setAttribute('height', h);
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

  const d = [
    `M ${radius} 0`,
    `H ${w - radius}`,
    `A ${radius} ${radius} 0 0 1 ${w} ${radius}`,
    `V ${h - radius}`,
    `A ${radius} ${radius} 0 0 1 ${w - radius} ${h}`,
    `H ${radius}`,
    `A ${radius} ${radius} 0 0 1 0 ${h - radius}`,
    `V ${radius}`,
    `A ${radius} ${radius} 0 0 1 ${radius} 0`,
    'Z'
  ].join(' ');
  path.setAttribute('d', d);

  // Reveal SVG after we draw the path to avoid the initial "jump"
  svg.style.visibility = 'visible';
}
window.addEventListener('load',   updateJourneyPath);
window.addEventListener('resize', () => requestAnimationFrame(updateJourneyPath));

/* ---------- Music player (shuffle + skip) ---------- */
const bgm         = document.getElementById('bgm');
const toggleBtn   = document.getElementById('audioPower'); // top button
const skipBtn     = document.getElementById('audioToggle'); // bottom button (now: Next)

if (bgm) {
  // Read playlist from the HTML attribute; fall back to placeholders if missing
  let playlist = [];
  try {
    const fromAttr = JSON.parse(bgm.dataset.playlist || '[]');
    if (Array.isArray(fromAttr) && fromAttr.length) playlist = fromAttr;
  } catch (_) {}
  if (!playlist.length) {
    // You can delete this fallback once your data-playlist is filled
    playlist = [
      'audio/Carroussel Cafe (Instrumental).mp3',
      'audio/Starlit Atelier (Instrumental).mp3',
      'audio/Title_ Waterwheel Café (Instrumental).mp3',
      'audio/dreamy-jazz-slow-background-jazz-music-piano-and-seattle-strings-9998.mp3',
      'audio/lamp Cafe.mp3'
    ];
  }

  // Shuffle helper
  function shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
  }

  // Build a shuffled order of indices and start at a random position in that order
  let order = playlist.map((_, i) => i);
  shuffle(order);
  let orderIdx = Math.floor(Math.random() * order.length);

  function setTrackByOrder(i) {
    const trackIndex = order[i];
    bgm.src = playlist[trackIndex];
    bgm.load();
  }
  setTrackByOrder(orderIdx); // prepare the first (random) track, do not autoplay

  function nextTrack(autoplay = true) {
    orderIdx = (orderIdx + 1) % order.length;
    setTrackByOrder(orderIdx);
    if (autoplay && !bgm.muted) {
      const p = bgm.play();
      if (p && p.catch) p.catch(() => {});
    }
  }

  function isPlaying() {
    return !bgm.paused && !bgm.ended && bgm.currentTime > 0 && !bgm.muted;
  }

  // Keep the top button's pressed state in sync
  function updateTopUI() {
    if (!toggleBtn) return;
    toggleBtn.setAttribute('aria-pressed', isPlaying() ? 'true' : 'false');
  }

  // Top button: play/pause (and unmute on first play)
  if (toggleBtn) {
    toggleBtn.addEventListener('click', () => {
      if (isPlaying()) {
        bgm.pause();
      } else {
        bgm.muted = false;
        const p = bgm.play();
        if (p && p.catch) p.catch(() => {});
      }
      updateTopUI();
    });
  }

  // Bottom button: skip to next track
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      const wasPlaying = isPlaying();
      nextTrack(wasPlaying);   // if it was playing, continue playing; if not, just queue next
    });
  }

  // Auto-advance when a track ends
  bgm.addEventListener('ended', () => nextTrack(true));

  // Keep UI in sync when user pauses/resumes via native controls (mobile etc.)
  bgm.addEventListener('play',  updateTopUI);
  bgm.addEventListener('pause', updateTopUI);
}
