(() => {
  const wrap = document.getElementById('journey-line');
  const text = wrap?.querySelector('.journey-text');
  const svg = wrap?.querySelector('.journey-svg');
  const path = document.getElementById('journey-loop');
  const cars = wrap?.querySelector('.journey-cars');
  const toggle = document.querySelector('.journey-motion-toggle');
  if (!wrap || !text || !svg || !path || !cars || !toggle) return;

  // The original train is a single silhouette. Clip it into its engine and
  // carriages, then place each part along the same path at a trailing distance.
  const ns = 'http://www.w3.org/2000/svg';
  const slices = [[0, 410], [410, 700], [700, 980], [980, 1280]];
  const scale = 28 / 640;
  const parts = slices.map(([start, end]) => {
    const width = (end - start) * scale;
    const group = document.createElementNS(ns, 'g');
    const mirrored = document.createElementNS(ns, 'g');
    mirrored.setAttribute('transform', 'scale(-1 1)');
    const crop = document.createElementNS(ns, 'svg');
    crop.setAttribute('x', -width / 2);
    crop.setAttribute('y', -14);
    crop.setAttribute('width', width);
    crop.setAttribute('height', 28);
    crop.setAttribute('viewBox', `${start} 0 ${end - start} 640`);
    crop.setAttribute('overflow', 'hidden');
    const image = document.createElementNS(ns, 'image');
    image.setAttribute('href', 'train.svg');
    image.setAttribute('width', '1280');
    image.setAttribute('height', '640');
    crop.appendChild(image);
    mirrored.appendChild(crop);
    group.appendChild(mirrored);
    cars.appendChild(group);
    return { group, width };
  });

  let offset = 0;
  parts.forEach((part, index) => {
    if (index) offset += (parts[index - 1].width + part.width) / 2;
    part.offset = offset;
  });

  const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
  let paused = preference.matches;
  let visible = true;
  let length = 0;
  let distance = 0;
  let frame = 0;
  let lastTime = 0;
  const speed = 20; // pixels per second, independent of sentence length

  const syncButton = () => {
    toggle.textContent = paused ? 'Play train' : 'Pause train';
    toggle.setAttribute('aria-label', paused ? 'Play the journey train animation' : 'Pause the journey train animation');
  };
  const pointAt = value => path.getPointAtLength((value % length + length) % length);
  const draw = () => {
    if (!length) return;
    parts.forEach(part => {
      const at = distance - part.offset;
      const point = pointAt(at);
      const before = pointAt(at - 0.5);
      const after = pointAt(at + 0.5);
      const angle = Math.atan2(after.y - before.y, after.x - before.x) * 180 / Math.PI;
      part.group.setAttribute('transform', `translate(${point.x} ${point.y}) rotate(${angle})`);
    });
  };
  const tick = time => {
    if (paused || !visible || document.hidden) { frame = 0; lastTime = 0; return; }
    if (lastTime) distance = (distance + Math.min((time - lastTime) / 1000, 0.05) * speed) % length;
    lastTime = time;
    draw();
    frame = requestAnimationFrame(tick);
  };
  const syncAnimation = () => {
    if (!paused && visible && !document.hidden && length && !frame) frame = requestAnimationFrame(tick);
    if (paused || !visible || document.hidden) {
      cancelAnimationFrame(frame);
      frame = 0;
      lastTime = 0;
    }
    syncButton();
  };
  const updatePath = () => {
    const rect = text.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const previousLength = length;
    const w = Math.max(80, rect.width + 36);
    const h = Math.max(48, rect.height + 24);
    const endCurve = Math.min(Math.max(32, h * 0.75), w * 0.27);
    svg.setAttribute('width', w);
    svg.setAttribute('height', h);
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`);
    path.setAttribute('d', [
      `M ${endCurve} 1`,
      `C ${w * 0.35} -4 ${w * 0.65} -4 ${w - endCurve} 1`,
      `C ${w - 1} 1 ${w - 1} ${h - 1} ${w - endCurve} ${h - 1}`,
      `C ${w * 0.65} ${h + 4} ${w * 0.35} ${h + 4} ${endCurve} ${h - 1}`,
      `C 1 ${h - 1} 1 1 ${endCurve} 1 Z`
    ].join(' '));
    length = path.getTotalLength();
    distance = previousLength ? distance / previousLength * length : 0;
    draw();
    svg.style.visibility = 'visible';
    syncAnimation();
  };

  toggle.addEventListener('click', () => { paused = !paused; syncAnimation(); });
  preference.addEventListener?.('change', event => { paused = event.matches; syncAnimation(); });
  document.addEventListener('visibilitychange', syncAnimation);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      visible = entries[0].isIntersecting;
      syncAnimation();
    }).observe(wrap);
  }
  if ('ResizeObserver' in window) new ResizeObserver(updatePath).observe(text);
  else window.addEventListener('resize', updatePath);
  if (document.fonts?.ready) document.fonts.ready.then(updatePath);
  updatePath();
})();
