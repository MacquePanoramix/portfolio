/*
 * An isolated browser study of the body in Aquarium's Fish.pde and Chain.pde:
 * https://github.com/MacquePanoramix/Aquarium
 * The original project credits https://github.com/argonautcode/animal-proc-anim
 * and https://www.youtube.com/watch?v=qlfh_rv6khY&t=10s. The head direction
 * is deliberately visitor-controlled here; flocking and the environment are
 * not simulated. Body sizes, joint spacing and the angular constraint follow
 * the original. Canvas curves are an adaptation of the Processing drawing.
 *
 * MIT License
 * Copyright (c) 2024 argonaut
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
(() => {
  const stage = document.getElementById('spine-study');
  const canvas = stage && stage.querySelector('canvas');
  const fallback = stage && stage.querySelector('.aquarium-study-fallback');
  const controls = document.querySelector('.aquarium-study-controls');
  const slider = document.getElementById('spine-direction');
  const value = document.getElementById('spine-direction-value');
  const motion = document.getElementById('spine-motion');
  const jointToggle = document.getElementById('spine-joints');
  const reset = document.getElementById('spine-reset');
  if (!stage || !canvas || !fallback || !controls || !slider || !value || !motion || !jointToggle || !reset) return;
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const scale = .31; // Enlarged for the study; the original proportions are retained.
  const link = 64 * scale;
  const widths = [68, 81, 84, 83, 77, 64, 51, 38, 32, 19];
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  let joints = [];
  let playing = false;
  let visible = true;
  let showJoints = true;
  let frame = 0;
  let last = 0;
  const angle = () => Number(slider.value) * Math.PI / 180;
  const shortest = a => Math.atan2(Math.sin(a), Math.cos(a));
  const offset = (joint, heading, distance) => ({ x: joint.x + Math.cos(heading) * distance, y: joint.y + Math.sin(heading) * distance });

  function resetPose() {
    slider.value = '0';
    joints = Array.from({length: 12}, (_, i) => ({x: 480 - i * link, y: 160, angle: 0}));
    updateValue();
    draw();
  }
  function updateValue() {
    const degrees = Number(slider.value);
    value.textContent = degrees === 0 ? 'Straight' : `${Math.abs(degrees)}° ${degrees < 0 ? 'up' : 'down'}`;
  }
  // Port of Fish.updateBody: each joint follows its predecessor at a fixed
  // link length, limited to PI / 8 relative to the preceding angle.
  function follow() {
    joints[0].angle = angle();
    for (let i = 1; i < joints.length; i++) {
      const ahead = joints[i - 1], current = joints[i];
      const wanted = Math.atan2(ahead.y - current.y, ahead.x - current.x);
      const difference = Math.max(-Math.PI / 8, Math.min(Math.PI / 8, shortest(wanted - ahead.angle)));
      current.angle = ahead.angle + difference;
      current.x = ahead.x - Math.cos(current.angle) * link;
      current.y = ahead.y - Math.sin(current.angle) * link;
    }
  }
  function shape(points) {
    const tail = points[points.length - 1];
    ctx.beginPath();
    ctx.moveTo((tail.x + points[0].x) / 2, (tail.y + points[0].y) / 2);
    points.forEach((point, i) => {
      const next = points[(i + 1) % points.length];
      ctx.quadraticCurveTo(point.x, point.y, (point.x + next.x) / 2, (point.y + next.y) / 2);
    });
    ctx.closePath(); ctx.fill(); ctx.stroke();
  }
  function draw() {
    ctx.clearRect(0, 0, 800, 320);
    const j = joints;
    if (!j.length) return;
    const at = (i, a, extra = 0) => offset(j[i], j[i].angle + a, widths[i] * scale + extra);
    ctx.strokeStyle = '#fffaf4';
    ctx.lineWidth = 2;
    ctx.fillStyle = '#d6b5bc';
    [[3, Math.PI / 3, -Math.PI / 4, 80, 32], [3, -Math.PI / 3, Math.PI / 4, 80, 32],
      [7, Math.PI / 2, -Math.PI / 4, 48, 16], [7, -Math.PI / 2, Math.PI / 4, 48, 16]].forEach(([i, a, rotation, rx, ry]) => {
      const p = at(i, a);
      ctx.beginPath(); ctx.ellipse(p.x, p.y, rx * scale, ry * scale, j[i - 1].angle + rotation, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
    });
    const bend = shortest(j[0].angle - j[11].angle);
    const tail = [];
    for (let i = 8; i < 12; i++) tail.push(offset(j[i], j[i].angle - Math.PI / 2, 1.5 * bend * (i - 8) ** 2 * scale));
    for (let i = 11; i >= 8; i--) tail.push(offset(j[i], j[i].angle + Math.PI / 2, Math.max(-13 * scale, Math.min(13 * scale, bend * 6 * scale))));
    shape(tail);
    ctx.fillStyle = '#a98aaf';
    const body = [];
    for (let i = 0; i < 10; i++) body.push(at(i, Math.PI / 2));
    body.push(at(9, Math.PI));
    for (let i = 9; i >= 0; i--) body.push(at(i, -Math.PI / 2));
    body.push(at(0, -Math.PI / 6), at(0, 0, 4 * scale), at(0, Math.PI / 6));
    shape(body);
    ctx.fillStyle = '#fffaf4';
    [Math.PI / 2, -Math.PI / 2].forEach(a => { const p = at(0, a, -18 * scale); ctx.beginPath(); ctx.arc(p.x, p.y, 12 * scale, 0, Math.PI * 2); ctx.fill(); });
    if (showJoints) {
      ctx.strokeStyle = '#5e475f'; ctx.fillStyle = '#fffaf4'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(j[0].x, j[0].y);
      j.slice(1).forEach(point => ctx.lineTo(point.x, point.y)); ctx.stroke();
      j.forEach((point, i) => { ctx.beginPath(); ctx.arc(point.x, point.y, i === 0 ? 5 : 4, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); });
    }
  }
  function tick(time) {
    frame = 0;
    if (!playing || !visible || document.hidden) { last = 0; return; }
    const dt = last ? Math.min((time - last) / 1000, .05) : 0;
    last = time;
    joints[0].x += Math.cos(angle()) * 65 * dt;
    joints[0].y += Math.sin(angle()) * 65 * dt;
    if (joints[0].x > 860 || joints[0].y < -50 || joints[0].y > 370) {
      const heading = angle();
      const startY = heading < 0 ? 250 : heading > 0 ? 70 : 160;
      joints = Array.from({length: 12}, (_, i) => ({x: 120 - Math.cos(heading) * i * link, y: startY - Math.sin(heading) * i * link, angle: heading}));
    }
    follow(); draw();
    frame = requestAnimationFrame(tick);
  }
  function sync() {
    motion.textContent = playing ? 'Pause motion' : 'Play motion';
    if (frame) cancelAnimationFrame(frame);
    frame = 0; last = 0;
    if (playing && visible && !document.hidden) frame = requestAnimationFrame(tick);
  }
  slider.addEventListener('input', () => { updateValue(); follow(); draw(); });
  motion.addEventListener('click', () => { playing = !playing; sync(); });
  jointToggle.addEventListener('click', () => { showJoints = !showJoints; jointToggle.setAttribute('aria-pressed', String(showJoints)); draw(); });
  reset.addEventListener('click', () => { playing = false; resetPose(); sync(); });
  reducedMotion.addEventListener('change', event => { if (event.matches) { playing = false; sync(); } });
  document.addEventListener('visibilitychange', sync);
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => { visible = entries[0].isIntersecting; sync(); }).observe(stage);
  resetPose();
  canvas.hidden = false;
  fallback.setAttribute('hidden', '');
  controls.hidden = false;
})();
