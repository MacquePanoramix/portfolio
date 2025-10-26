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
const padX = 14;
const padY = 8;


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
}


// Run on load and when resized (so it adapts on mobile)
window.addEventListener('load',   updateJourneyPath);
window.addEventListener('resize', () => requestAnimationFrame(updateJourneyPath));
