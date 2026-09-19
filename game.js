const canvas = document.querySelector('#game');
const ctx = canvas.getContext('2d');
const progress = document.querySelector('#progress');
const seedLabel = document.querySelector('#seed');
const message = document.querySelector('#message');
const W = canvas.width, H = canvas.height;
const TOTAL = 40;
const GAP_VARIANTS = [105, 170, 245];
const keys = new Set();
let seed = Math.floor(Math.random() * 0xffffffff);
let platforms, player, cameraX, currentPlatform, state;

function random() { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 0x100000000; }
function choose(list) { return list[Math.floor(random() * list.length)]; }
function reset() {
  platforms = [{ x: 70, y: 410, w: 190, h: 18, index: 0 }];
  currentPlatform = 0;
  for (let i = 1; i < TOTAL; i++) generatePlatform(i);
  player = { x: platforms[0].x + 70, y: platforms[0].y - 34, w: 30, h: 34, vx: 0, vy: 0, grounded: true };
  cameraX = 0; state = 'playing'; message.classList.add('hidden');
  progress.textContent = 'Платформа 1 / 40'; seedLabel.textContent = `seed ${seed}`;
}
function generatePlatform(index) {
  const previous = platforms[index - 1];
  const gap = choose(GAP_VARIANTS);
  const y = Math.max(245, Math.min(445, previous.y + choose([-75, -35, 0, 25, 55])));
  platforms.push({ x: previous.x + previous.w + gap, y, w: 135 + Math.floor(random() * 75), h: 18, index });
}
function restart() { seed = Math.floor(Math.random() * 0xffffffff); reset(); }
function onKey(e, down) {
  if (['ArrowLeft','ArrowRight','ArrowUp','Space','KeyA','KeyD','KeyW','KeyR'].includes(e.code)) e.preventDefault();
  if (down && e.code === 'KeyR') restart();
  if (down) keys.add(e.code); else keys.delete(e.code);
}
addEventListener('keydown', e => onKey(e, true)); addEventListener('keyup', e => onKey(e, false));

function update(dt) {
  if (state !== 'playing') return;
  const left = keys.has('ArrowLeft') || keys.has('KeyA');
  const right = keys.has('ArrowRight') || keys.has('KeyD');
  const jump = keys.has('ArrowUp') || keys.has('KeyW') || keys.has('Space');
  if (left) player.vx -= 0.65 * dt; if (right) player.vx += 0.65 * dt;
  if (!left && !right) player.vx *= Math.pow(0.78, dt);
  player.vx = Math.max(-6.5, Math.min(6.5, player.vx));
  if (jump && player.grounded) { player.vy = -12.5; player.grounded = false; }
  const oldBottom = player.y + player.h;
  player.vy += 0.62 * dt; player.vy = Math.min(player.vy, 15);
  player.x += player.vx * dt; player.y += player.vy * dt; player.grounded = false;
  for (const p of platforms) {
    if (player.vy >= 0 && oldBottom <= p.y + 3 && player.y + player.h >= p.y && player.x + player.w > p.x + 8 && player.x < p.x + p.w - 8) {
      player.y = p.y - player.h; player.vy = 0; player.grounded = true;
      if (p.index > currentPlatform) { currentPlatform = p.index; progress.textContent = `Платформа ${currentPlatform + 1} / ${TOTAL}`; if (currentPlatform === TOTAL - 1) finish(); }
    }
  }
  if (player.y > H + 150) { player.x = platforms[currentPlatform].x + 45; player.y = platforms[currentPlatform].y - player.h - 5; player.vy = 0; }
  const target = player.x - W * 0.42; cameraX += (target - cameraX) * 0.1; cameraX = Math.max(0, Math.min(cameraX, platforms[TOTAL - 1].x - W + 120));
}
function finish() { state = 'won'; message.innerHTML = 'Финиш! <small>Ты прошёл все 40 платформ. Нажми R, чтобы сыграть снова.</small>'; message.classList.remove('hidden'); }
function visible(p) { return p.index >= Math.max(0, currentPlatform - 2) && p.index <= Math.min(TOTAL - 1, currentPlatform + 2); }
function draw() {
  const grad = ctx.createLinearGradient(0,0,0,H); grad.addColorStop(0,'#202a59'); grad.addColorStop(1,'#11152d'); ctx.fillStyle = grad; ctx.fillRect(0,0,W,H);
  ctx.fillStyle = '#ffffff12'; for (let i=0;i<50;i++) { const x = (i*193 - cameraX*.15) % W; const y = (i*83)%260; ctx.fillRect(x,y,2,2); }
  for (const p of platforms) if (visible(p)) drawPlatform(p);
  drawPlayer();
}
function drawPlatform(p) { const x=p.x-cameraX; ctx.fillStyle='#39488a'; ctx.fillRect(x,p.y,p.w,p.h); ctx.fillStyle='#73e0c0'; ctx.fillRect(x,p.y,p.w,5); ctx.fillStyle='#ffffff18'; ctx.fillRect(x+8,p.y+8,p.w-16,3); }
function drawPlayer() { const x=player.x-cameraX+player.w/2,y=player.y+player.h/2; ctx.save(); ctx.translate(x,y); ctx.rotate(Math.PI/2); ctx.beginPath(); for(let i=0;i<5;i++){const a=i*2*Math.PI/5; const px=Math.cos(a)*22, py=Math.sin(a)*22; i?ctx.lineTo(px,py):ctx.moveTo(px,py);} ctx.closePath(); ctx.fillStyle='#ffda24'; ctx.fill(); ctx.strokeStyle='#fff09a'; ctx.lineWidth=3; ctx.stroke(); ctx.restore(); }
let last = performance.now(); function loop(now) { const dt=Math.min(2,(now-last)/16.67); last=now; update(dt); draw(); requestAnimationFrame(loop); }
reset(); requestAnimationFrame(loop);
