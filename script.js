// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();

        document.querySelector(this.getAttribute('href')).scrollIntoView({
            behavior: 'smooth'
        });
    });
});

// Draw a rounded-rectangle path around the journey text,
// and size the SVG to that path so the train orbits correctly.
// Draw a rounded-rectangle path around the journey text,
// and size the SVG to that path so the train orbits correctly.
function updateJourneyPath() {
  const wrap = document.getElementById('journey-line');
  if (!wrap) return;

  const text = wrap.querySelector('.journey-text');
  const svg  = wrap.querySelector('.journey-svg');
  const path = document.getElementById('journey-track-path');
  if (!text || !svg || !path) return;

  // Measure the text box
  const r = text.getBoundingClientRect();

  // Padding around the text inside the orbit (closer to letters)
const padX = 10;
const padY = 4;


  // Corner radius of the rounded rectangle
  const radius = 16;

  // Extra padding OUTSIDE the track so the train sprite
  // never gets clipped by the SVG bounds.
  const ORBIT_PAD = 18;  // bump to 20–24 if you increase the train size

  const innerW = Math.max(60, Math.round(r.width  + padX * 2));
  const innerH = Math.max(40, Math.round(r.height + padY * 2));

  // Final SVG size including extra orbit padding
  const w = innerW + ORBIT_PAD * 2;
  const h = innerH + ORBIT_PAD * 2;

  svg.setAttribute('width',  w);
  svg.setAttribute('height', h);
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

  // Top-left of the inner rounded rectangle (the track)
  const x0 = ORBIT_PAD;
  const y0 = ORBIT_PAD;

  // Rounded-rectangle path (clockwise)
  const d = [
    `M ${x0 + radius} ${y0}`,
    `H ${x0 + innerW - radius}`,
    `A ${radius} ${radius} 0 0 1 ${x0 + innerW} ${y0 + radius}`,
    `V ${y0 + innerH - radius}`,
    `A ${radius} ${radius} 0 0 1 ${x0 + innerW - radius} ${y0 + innerH}`,
    `H ${x0 + radius}`,
    `A ${radius} ${radius} 0 0 1 ${x0} ${y0 + innerH - radius}`,
    `V ${y0 + radius}`,
    `A ${radius} ${radius} 0 0 1 ${x0 + radius} ${y0}`,
    'Z'
  ].join(' ');

  path.setAttribute('d', d);

// show the svg only after the path is set (prevents initial "jump")
svg.style.visibility = 'visible';
}


// Run on load and when resized (so it adapts on mobile)
window.addEventListener('load',   updateJourneyPath);
window.addEventListener('resize', () => requestAnimationFrame(updateJourneyPath));

/* === Background Music Toggle (muted by default) === */
(function () {
  const audio = document.getElementById('bgm');
  const btn   = document.getElementById('musicToggle');
  if (!audio || !btn) return;

  // Restore previous preference
  const saved = localStorage.getItem('bgm-pref'); // 'on' | 'off'
  const wantOn = saved === 'on';

  // Always begin muted to satisfy autoplay policies
  audio.muted = true;
  audio.volume = 0; // fade-in later

  // If user previously chose ON, we’ll auto-start after first interaction
  let armedAutoplay = wantOn;

  // Small helper for gentle fades
  function fadeVolume(target, ms = 600) {
    const start = audio.volume;
    const delta = target - start;
    const startT = performance.now();
    function step(t) {
      const p = Math.min(1, (t - startT) / ms);
      audio.volume = start + delta * p;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  async function playBgm() {
    try {
      audio.muted = false;
      if (audio.paused) await audio.play();
      fadeVolume(0.65, 700);
      btn.setAttribute('aria-pressed', 'true');
      localStorage.setItem('bgm-pref', 'on');
    } catch (e) {
      // Playback can still be blocked until a gesture occurs.
      // We stay 'armed' and try again on the next click.
      armedAutoplay = true;
    }
  }

  function stopBgm() {
    fadeVolume(0, 400);
    setTimeout(() => {
      audio.pause();
      audio.currentTime = 0;
      audio.muted = true;
    }, 420);
    btn.setAttribute('aria-pressed', 'false');
    localStorage.setItem('bgm-pref', 'off');
    armedAutoplay = false;
  }

  // Toggle on button click (this is a clear user gesture)
  btn.addEventListener('click', () => {
    const isOn = btn.getAttribute('aria-pressed') === 'true';
    if (isOn) stopBgm();
    else playBgm();
  });

  // “Arm” autoplay: first user interaction anywhere can start it if pref was 'on'
  function armOnce() {
    if (armedAutoplay) {
      armedAutoplay = false; // un-arm
      playBgm();
    }
    window.removeEventListener('pointerdown', armOnce);
    window.removeEventListener('keydown', armOnce);
  }
  window.addEventListener('pointerdown', armOnce, { once: true });
  window.addEventListener('keydown', armOnce, { once: true });

  // Optional niceties: pause when tab hidden; resume when visible and 'on'
  document.addEventListener('visibilitychange', () => {
    const on = localStorage.getItem('bgm-pref') === 'on';
    if (document.hidden) {
      if (!audio.paused) audio.pause();
    } else if (on) {
      playBgm();
    }
  });
})();

