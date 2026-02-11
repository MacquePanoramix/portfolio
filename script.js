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

/* ---------- Music player (shuffle + skip + volume) ---------- */
const bgm          = document.getElementById('bgm');
const toggleBtn    = document.getElementById('audioPower');   // top button
const skipBtn      = document.getElementById('audioToggle');  // bottom-right button
const volumeSlider = document.getElementById('audioVolume');  // volume range

if (bgm) {
  // --- initial volume ---
  const defaultVolume = 0.6;      // ~60% = cozy background
  bgm.volume = defaultVolume;
  if (volumeSlider) {
    volumeSlider.value = defaultVolume;
  }

  // Read playlist from the HTML attribute; fall back to placeholders if missing
  let playlist = [];
  try {
    const fromAttr = JSON.parse(bgm.dataset.playlist || '[]');
    if (Array.isArray(fromAttr) && fromAttr.length) playlist = fromAttr;
  } catch (_) {}
  if (!playlist.length) {
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
  // prepare the first (random) track, but don’t autoplay
  setTrackByOrder(orderIdx);

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

  // Sync the top button’s pressed state
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
  bgm.addEventListener('ended', () => {
  // If the audio element has "loop" set, let the browser handle looping.
  if (bgm.loop) return;

  // Otherwise (like on the main page), go to the next track.
  nextTrack(true);
});


  // Keep UI in sync when user pauses/resumes via native controls (mobile etc.)
  bgm.addEventListener('play',  updateTopUI);
  bgm.addEventListener('pause', updateTopUI);

  // Volume slider: range [0,1] → bgm.volume
  if (volumeSlider) {
    volumeSlider.addEventListener('input', () => {
      const v = parseFloat(volumeSlider.value);
      bgm.volume = Math.min(1, Math.max(0, isNaN(v) ? defaultVolume : v));
    });
  }

  /* ---------- Tiny page/section animations ---------- */
(function () {
  // Skip animations if user prefers reduced motion
  const prefersReduce = window.matchMedia &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduce) return;

  // Scroll-reveal for elements with .reveal
  const els = document.querySelectorAll('.reveal');
  if (!els.length) return;

  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.1 });

  els.forEach(el => io.observe(el));
})();

}


/* ---------- Mossaratus trailer preview swap ---------- */
document.querySelectorAll('.video-preview-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const embed = btn.closest('.video-embed');
    if (!embed) return;

    const youtubeId = embed.dataset.youtubeId;
    if (!youtubeId) return;

    const iframe = document.createElement('iframe');
    iframe.src = `https://www.youtube-nocookie.com/embed/${youtubeId}?autoplay=1&rel=0&modestbranding=1`;
    iframe.title = 'Mossaratus — Animated Trailer';
    iframe.loading = 'lazy';
    iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
    iframe.allowFullscreen = true;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.display = 'block';

    embed.replaceChildren(iframe);
    embed.classList.remove('video-preview');
  });
});

