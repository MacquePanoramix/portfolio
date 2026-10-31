/*
 * Paper-background adaptation of Luís Hollanda and Tzuling Lin's Aquarium:
 * https://github.com/MacquePanoramix/Aquarium (Fish.pde and Chain.pde).
 * That project's procedural fish credits argonautcode/animal-proc-anim and
 * https://www.youtube.com/watch?v=qlfh_rv6khY&t=10s. The 12-joint spine,
 * angle constraint, width profile and paired fins below follow that fish;
 * the movement and palette are adapted for this page's paper background.
 *
 * MIT License
 * Copyright (c) 2024 argonaut
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(() => {
  const section = document.querySelector('#projects');
  const heading = section && section.querySelector('h2');
  if (!section || !heading) return;

  const canvas = document.createElement('canvas');
  canvas.className = 'aquarium-canvas';
  canvas.setAttribute('aria-hidden', 'true');
  const context = canvas.getContext('2d');
  if (!context) return;
  section.prepend(canvas);

  const controls = document.createElement('div');
  controls.className = 'aquarium-controls';
  controls.innerHTML = '<button type="button"></button><span>Fish from <a href="https://github.com/MacquePanoramix/Aquarium" target="_blank" rel="noopener noreferrer">Aquarium</a> · <a href="https://github.com/argonautcode/animal-proc-anim" target="_blank" rel="noopener noreferrer">animation source</a> · <a href="https://www.youtube.com/watch?v=qlfh_rv6khY&amp;t=10s" target="_blank" rel="noopener noreferrer">tutorial</a></span>';
  heading.after(controls);
  const button = controls.querySelector('button');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let playing = !reducedMotion.matches;
  let visible = true;
  let frame = 0;
  let lastTime = 0;
  let width = 0;
  let height = 0;
  let fish = [];
  const profile = [68, 81, 84, 83, 77, 64, 51, 38, 32, 19];
  const palettes = [
    ['#b29ab9', '#d9b4c4'], ['#c99e8d', '#dfc2aa'],
    ['#91aaa4', '#bac8b6'], ['#a79abd', '#d0bbcf']
  ];
  const wrapAngle = angle => Math.atan2(Math.sin(angle), Math.cos(angle));
  const point = (joint, angle, distance) => ({ x: joint.x + Math.cos(angle) * distance, y: joint.y + Math.sin(angle) * distance });

  function resetSpine(f) {
    const angle = f.direction > 0 ? 0 : Math.PI;
    f.joints = Array.from({ length: 12 }, (_, i) => ({
      x: f.x - Math.cos(angle) * f.link * i,
      y: f.y - Math.sin(angle) * f.link * i,
      angle
    }));
  }

  function makeFish(i, count) {
    const scale = [0.105, 0.115, 0.098, 0.11][i % 4];
    const direction = i % 2 ? -1 : 1;
    const baseY = 220 + (i + .5) * Math.max(0, height - 320) / count;
    const f = {
      x: ((i * 379 + 127) % Math.max(width, 1)), y: baseY,
      baseY, direction, scale, link: 64 * scale,
      speed: 19 + (i % 4) * 3, phase: i * 1.7,
      colors: palettes[i % palettes.length]
    };
    resetSpine(f);
    return f;
  }

  function sizePopulation() {
    // Paper extends beyond the centered content section, so the fish's world
    // spans the viewport (excluding the scrollbar), not the section's width.
    const nextWidth = document.documentElement.clientWidth;
    const nextHeight = section.offsetHeight;
    if (!nextWidth || !nextHeight || (nextWidth === width && nextHeight === height)) return;
    const heightChanged = nextHeight !== height;
    if (width && nextWidth < width) {
      // Keep fish in the resized world instead of leaving them far offscreen.
      fish.forEach(f => {
        const nextX = f.x * nextWidth / width;
        const shift = nextX - f.x;
        f.x = nextX;
        f.joints.forEach(joint => { joint.x += shift; });
      });
    }
    width = nextWidth;
    height = nextHeight;
    // A sparse population scales with the long section, not the whole document.
    // Preserve existing fish and their jointed poses through a layout change.
    if (heightChanged || !fish.length) {
      const count = Math.max(6, Math.min(36, Math.ceil(height / 330)));
      fish = Array.from({ length: count }, (_, i) => {
        const f = fish[i];
        if (!f) return makeFish(i, count);
        const baseY = 220 + (i + .5) * Math.max(0, height - 320) / count;
        const shift = baseY - f.baseY;
        f.baseY = baseY;
        f.y += shift;
        f.joints.forEach(joint => { joint.y += shift; });
        return f;
      });
    }
  }

  function move(f, dt) {
    f.phase += dt * .85;
    f.x += f.direction * f.speed * dt;
    f.y = f.baseY + Math.sin(f.phase) * 13;
    if ((f.direction > 0 && f.x > width + 100) || (f.direction < 0 && f.x < -100)) {
      f.x = f.direction > 0 ? -100 : width + 100;
      resetSpine(f);
    }
    const head = f.joints[0];
    head.x = f.x;
    head.y = f.y;
    head.angle = Math.atan2(Math.cos(f.phase) * 13 * .85, f.direction * f.speed);
    for (let i = 1; i < f.joints.length; i++) {
      const previous = f.joints[i - 1];
      const joint = f.joints[i];
      const wanted = Math.atan2(previous.y - joint.y, previous.x - joint.x);
      const difference = Math.max(-Math.PI / 8, Math.min(Math.PI / 8, wrapAngle(wanted - previous.angle)));
      joint.angle = previous.angle + difference;
      joint.x = previous.x - Math.cos(joint.angle) * f.link;
      joint.y = previous.y - Math.sin(joint.angle) * f.link;
    }
  }

  function smoothShape(points) {
    context.beginPath();
    const last = points[points.length - 1];
    context.moveTo((last.x + points[0].x) / 2, (last.y + points[0].y) / 2);
    for (let i = 0; i < points.length; i++) {
      const next = points[(i + 1) % points.length];
      context.quadraticCurveTo(points[i].x, points[i].y, (points[i].x + next.x) / 2, (points[i].y + next.y) / 2);
    }
    context.closePath();
    context.fill();
    context.stroke();
  }

  function drawFish(f) {
    const j = f.joints, s = f.scale;
    const at = (i, offset, lengthOffset = 0) => point(j[i], j[i].angle + offset, profile[i] * s + lengthOffset);
    context.save();
    context.globalAlpha = .7;
    context.lineWidth = 1;
    context.strokeStyle = '#fffaf2';
    context.fillStyle = f.colors[1];
    // The original's four paired elliptical fins, placed on spine joints.
    [[3, Math.PI / 3, -Math.PI / 4, 80, 32], [3, -Math.PI / 3, Math.PI / 4, 80, 32],
      [7, Math.PI / 2, -Math.PI / 4, 48, 16], [7, -Math.PI / 2, Math.PI / 4, 48, 16]].forEach(([i, offset, rotation, rx, ry]) => {
      const p = at(i, offset);
      context.beginPath();
      context.ellipse(p.x, p.y, rx * s, ry * s, j[i - 1].angle + rotation, 0, Math.PI * 2);
      context.fill(); context.stroke();
    });
    const tailBend = wrapAngle(j[0].angle - j[11].angle);
    const tail = [];
    for (let i = 8; i < 12; i++) tail.push(point(j[i], j[i].angle - Math.PI / 2, 1.5 * tailBend * (i - 8) ** 2 * s));
    for (let i = 11; i >= 8; i--) tail.push(point(j[i], j[i].angle + Math.PI / 2, Math.max(-13 * s, Math.min(13 * s, tailBend * 6 * s))));
    smoothShape(tail);
    context.fillStyle = f.colors[0];
    const body = [];
    for (let i = 0; i < 10; i++) body.push(at(i, Math.PI / 2));
    body.push(at(9, Math.PI));
    for (let i = 9; i >= 0; i--) body.push(at(i, -Math.PI / 2));
    body.push(at(0, -Math.PI / 6), at(0, 0, 4 * s), at(0, Math.PI / 6));
    smoothShape(body);
    context.fillStyle = f.colors[1];
    const bend = wrapAngle(j[0].angle - j[6].angle);
    context.beginPath();
    context.moveTo(j[4].x, j[4].y);
    context.bezierCurveTo(j[5].x, j[5].y, j[6].x, j[6].y, j[7].x, j[7].y);
    const c6 = point(j[6], j[6].angle + Math.PI / 2, bend * 16 * s);
    const c5 = point(j[5], j[5].angle + Math.PI / 2, bend * 16 * s);
    context.bezierCurveTo(c6.x, c6.y, c5.x, c5.y, j[4].x, j[4].y);
    context.fill(); context.stroke();
    context.fillStyle = '#fffaf2';
    [Math.PI / 2, -Math.PI / 2].forEach(offset => {
      const eye = at(0, offset, -18 * s);
      context.beginPath(); context.arc(eye.x, eye.y, 12 * s, 0, Math.PI * 2); context.fill();
    });
    context.restore();
  }

  function draw() {
    sizePopulation();
    const rect = section.getBoundingClientRect();
    const start = Math.max(0, -rect.top);
    const end = Math.min(height, window.innerHeight - rect.top);
    if (end <= start || !width) { canvas.style.display = 'none'; return; }
    canvas.style.display = 'block';
    const visibleHeight = Math.ceil(end - start);
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    // Convert viewport x=0 to the section's local coordinate system.
    canvas.style.left = `${-rect.left}px`;
    canvas.style.top = `${start}px`;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${visibleHeight}px`;
    const pixelWidth = Math.ceil(width * ratio), pixelHeight = Math.ceil(visibleHeight * ratio);
    if (canvas.width !== pixelWidth || canvas.height !== pixelHeight) {
      canvas.width = pixelWidth; canvas.height = pixelHeight;
    }
    context.setTransform(ratio, 0, 0, ratio, 0, -start * ratio);
    context.clearRect(0, start, width, visibleHeight);
    fish.forEach(f => { if (f.y > start - 100 && f.y < end + 100) drawFish(f); });
  }

  function tick(time) {
    frame = 0;
    if (!playing || !visible || document.hidden) { lastTime = 0; return; }
    const dt = lastTime ? Math.min((time - lastTime) / 1000, .05) : 0;
    lastTime = time;
    fish.forEach(f => move(f, dt));
    draw();
    frame = requestAnimationFrame(tick);
  }
  function update() {
    button.textContent = playing ? 'Pause fish' : 'Play fish';
    if (frame) cancelAnimationFrame(frame);
    frame = 0; lastTime = 0;
    draw();
    if (playing && visible && !document.hidden) frame = requestAnimationFrame(tick);
  }
  button.addEventListener('click', () => { playing = !playing; update(); });
  reducedMotion.addEventListener('change', event => { if (event.matches) playing = false; update(); });
  document.addEventListener('visibilitychange', update);
  window.addEventListener('resize', draw, { passive: true });
  window.addEventListener('scroll', () => { if (!playing) draw(); }, { passive: true });
  if ('ResizeObserver' in window) new ResizeObserver(draw).observe(section);
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => { visible = entries[0].isIntersecting; update(); }, { rootMargin: '100px' }).observe(section);
  }
  update();
})();
