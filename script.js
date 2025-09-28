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
function updateJourneyPath() {
  const wrap = document.getElementById('journey-line');
  if (!wrap) return;

  const text = wrap.querySelector('.journey-text');
  const svg  = wrap.querySelector('.journey-svg');
  const path = document.getElementById('journey-track-path');
  if (!text || !svg || !path) return;

  // Measure the text box
  const r = text.getBoundingClientRect();
  // Padding around the text inside the orbit
  const padX = 20, padY = 12;
  // Corner radius of the rounded rectangle
  const radius = 16;

  const w = Math.max(60, Math.round(r.width  + padX * 2));
  const h = Math.max(40, Math.round(r.height + padY * 2));

  // Size the SVG to fit the rounded rect
  svg.setAttribute('width',  w);
  svg.setAttribute('height', h);
  svg.setAttribute('viewBox', `0 0 ${w} ${h}`);

  // Rounded-rectangle path (clockwise)
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
}

// Run on load and when resized (so it adapts on mobile)
window.addEventListener('load',   updateJourneyPath);
window.addEventListener('resize', () => requestAnimationFrame(updateJourneyPath));
