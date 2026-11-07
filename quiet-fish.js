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
  const canvas = document.querySelector('.quiet-fish-canvas');
  const reading = document.querySelector('.quiet-reading');
  const button = document.querySelector('.quiet-fish-toggle');
  if (!canvas || !reading || !button) return;
  const context = canvas.getContext('2d');
  if (!context) return;
  const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const profile = [68, 81, 84, 83, 77, 64, 51, 38, 32, 19];
  const palettes = [['#ac86b5','#dec1d2'], ['#d39887','#eac3a5'], ['#84aca1','#bdd6bd'], ['#8d9abe','#c4bddb'], ['#c29c72','#ead6a6'], ['#b889a1','#e2c1cf']];
  const positions = [[.10,.18],[.20,.28],[.12,.70],[.82,.21],[.91,.39],[.83,.76],[.25,.88],[.70,.87]];
  const mobilePositions = [[.22,.10],[.70,.14],[.28,.88],[.78,.91]];
  const scales = [.055,.073,.105,.065,.092,.115,.060,.080];
  const point = (joint, angle, distance) => ({x:joint.x + Math.cos(angle)*distance, y:joint.y + Math.sin(angle)*distance});
  const wrapAngle = angle => Math.atan2(Math.sin(angle),Math.cos(angle));
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  let width = 0, height = 0, school = [], frame = 0, lastTime = 0;
  let playing = !motion.matches;

  function makeFish(i) {
    const scale = scales[i] * (width < 600 ? .8 : 1);
    const angle = i % 2 ? Math.PI * .85 : .15;
    const place = width < 600 ? mobilePositions[i] : positions[i];
    const x = width * place[0], y = height * place[1];
    const link = 64 * scale;
    const f = {x,y,scale,link,angle,vx:Math.cos(angle),vy:Math.sin(angle),colors:palettes[i % palettes.length]};
    f.joints = Array.from({length:12}, (_,j) => ({x:x-Math.cos(angle)*link*j,y:y-Math.sin(angle)*link*j,angle}));
    return f;
  }
  function resize() {
    const nextW = document.documentElement.clientWidth, nextH = window.innerHeight;
    if (!nextW || !nextH || (width === nextW && height === nextH)) return;
    const oldW = width, oldH = height;
    width = nextW; height = nextH;
    const count = width < 600 ? 4 : (width < 1000 ? 6 : 8);
    if (!school.length || (oldW < 600) !== (width < 600)) school = Array.from({length:count}, (_,i) => makeFish(i));
    else {
      school = school.slice(0,count);
      school.forEach(f => { const dx=f.x*(width/oldW-1), dy=f.y*(height/oldH-1); f.x+=dx; f.y+=dy; f.joints.forEach(j => {j.x+=dx;j.y+=dy;}); });
      while(school.length<count) school.push(makeFish(school.length));
    }
    const ratio = Math.min(window.devicePixelRatio || 1,2);
    canvas.width = Math.ceil(width*ratio); canvas.height = Math.ceil(height*ratio);
    context.setTransform(ratio,0,0,ratio,0,0);
  }
  function step(dt) {
    // Creature.pde: size-dependent ranges and weighting, neighbour sizes,
    // mid-spine cohesion/separation and direction-based alignment. Each force
    // is averaged by its own neighbour count; speed and edge steering are
    // adapted for the gentler, bounded webpage (no food, rocks or current).
    const forces = school.map(f => {
      const area = 100, s=f.scale, ratio=.05/s;
      const cr=area*(1+.02/s), sr=area*.3*(s/.05)**2, ar=area*1.2*(1+.05/s)**2;
      let cx=0,cy=0,sx=0,sy=0,ax=0,ay=0,cn=0,sn=0,an=0;
      for (const other of school) {
        if (f===other) continue;
        const dx=other.x-f.x,dy=other.y-f.y,dist=Math.hypot(dx,dy);
        const mid=f.joints[4], omid=other.joints[4], influence=(other.scale/.05)**1.5;
        if (dist<=cr) {cx+=(omid.x-mid.x)*influence;cy+=(omid.y-mid.y)*influence;cn++;}
        const mdx=mid.x-omid.x,mdy=mid.y-omid.y;
        if (Math.hypot(f.x-omid.x,f.y-omid.y)<=sr) {
          sx-=(mdx+(mdx<0?sr:-sr))*influence; sy-=(mdy+(mdy<0?sr:-sr))*influence;sn++;
        }
        if (dist<=ar) {const inf=(other.scale/.05)**2;ax+=Math.cos(other.angle)*inf;ay+=Math.sin(other.angle)*inf;an++;}
      }
      if(cn){cx/=cn;cy/=cn;} if(sn){sx/=sn;sy/=sn;} if(an){ax/=an;ay/=an;}
      let fx=cx*.001*ratio**3.5+sx*.025*ratio**6.5+ax*.01*ratio**4;
      let fy=cy*.001*ratio**3.5+sy*.025*ratio**6.5+ay*.01*ratio**4;
      const margin=Math.min(105,Math.max(55,Math.min(width,height)*.16));
      const wall=.005*ratio**2;
      if(f.x<margin) fx+=(margin-f.x)*wall;
      if(f.x>width-margin) fx-=(f.x-(width-margin))*wall;
      if(f.y<margin) fy+=(margin-f.y)*wall;
      if(f.y>height-margin) fy-=(f.y-(height-margin))*wall;
      const magnitude=Math.hypot(fx,fy); if(magnitude>.12){fx*=.12/magnitude;fy*=.12/magnitude;}
      return {fx,fy,ax,ay};
    });
    school.forEach((f,i) => {
      const force=forces[i], stepSize=dt*18;
      f.vx+=force.fx*stepSize; f.vy+=force.fy*stepSize;
      const mag=Math.hypot(f.vx,f.vy)||1; f.vx/=mag; f.vy/=mag;
      const orientationWeight=1.8*(.05/f.scale);
      f.angle=Math.atan2(force.ay*.01*(.05/f.scale)**4+f.vy*orientationWeight,force.ax*.01*(.05/f.scale)**4+f.vx*orientationWeight);
      const speed=clamp(23*(.07/f.scale)**.3,15,27);
      f.x=clamp(f.x+f.vx*speed*dt,4,width-4); f.y=clamp(f.y+f.vy*speed*dt,4,height-4);
      f.joints[0]={x:f.x,y:f.y,angle:f.angle};
      for(let j=1;j<f.joints.length;j++){
        const prev=f.joints[j-1], joint=f.joints[j];
        const wanted=Math.atan2(prev.y-joint.y,prev.x-joint.x);
        joint.angle=prev.angle+clamp(wrapAngle(wanted-prev.angle),-Math.PI/8,Math.PI/8);
        joint.x=prev.x-Math.cos(joint.angle)*f.link; joint.y=prev.y-Math.sin(joint.angle)*f.link;
      }
    });
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
    context.globalAlpha = .78;
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
    resize();
    context.clearRect(0,0,width,height);
    // Keep the reading and controls clear, including the full fish silhouette.
    const r=reading.getBoundingClientRect(), pad=24;
    context.save(); context.beginPath(); context.rect(0,0,width,height);
    context.rect(r.left-pad,r.top-pad,r.width+pad*2,r.height+pad*2);
    context.clip('evenodd'); school.forEach(drawFish); context.restore();
  }
  function tick(time) {
    frame=0;
    if(!playing || document.hidden){lastTime=0;return;}
    const dt=lastTime ? Math.min((time-lastTime)/1000,.05) : 0; lastTime=time;
    if(dt) step(dt); draw(); frame=requestAnimationFrame(tick);
  }
  function update() {
    button.textContent=playing?'Pause fish':'Play fish';
    button.setAttribute('aria-label',playing?'Pause the Quiet Corner fish':'Play the Quiet Corner fish');
    if(frame) cancelAnimationFrame(frame); frame=0;lastTime=0;draw();
    if(playing && !document.hidden) frame=requestAnimationFrame(tick);
  }
  button.hidden=false;
  button.addEventListener('click',()=>{playing=!playing;update();});
  motion.addEventListener('change',event=>{if(event.matches)playing=false;update();});
  document.addEventListener('visibilitychange',update);
  window.addEventListener('resize',update,{passive:true});
  window.addEventListener('scroll',draw,{passive:true});
  update();
})();
