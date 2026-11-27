// Gobble & Go! — the turkey (player): movement, dash, sneak, drawing.
// One job: everything about Tom the turkey, the hero of this escape.

import { PLAYER, PALETTE, VIEW_W, WORLD_H } from './config.js';

export function createTurkey(x, y) {
  return {
    x,
    y,
    vx: 0,
    vy: 0,
    facing: 1, // 1 = right, -1 = left
    radius: PLAYER.radius,
    dashTimer: 0,
    dashCooldown: 0,
    dashDirX: 1,
    dashDirY: 0,
    invulnerableTimer: 0,
    hidden: false,
    sneaking: false,
    walkCycle: 0,
    moving: false,
    gobbleTimer: 0,
  };
}

export function resetTurkeyPosition(turkey, x, y) {
  turkey.x = x;
  turkey.y = y;
  turkey.vx = 0;
  turkey.vy = 0;
  turkey.dashTimer = 0;
  turkey.dashCooldown = 0;
  turkey.invulnerableTimer = 2.0;
  turkey.hidden = false;
}

function clampToWorld(turkey, worldWidth, obstacles) {
  turkey.x = Math.max(turkey.radius + 8, Math.min(worldWidth - turkey.radius - 8, turkey.x));
  turkey.y = Math.max(96 + turkey.radius, Math.min(WORLD_H - turkey.radius - 8, turkey.y));
  // Push out of solid obstacle rectangles.
  for (const o of obstacles) {
    if (!o.solid) continue;
    const cx = Math.max(o.x, Math.min(turkey.x, o.x + o.w));
    const cy = Math.max(o.y, Math.min(turkey.y, o.y + o.h));
    const dx = turkey.x - cx;
    const dy = turkey.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < turkey.radius * turkey.radius && d2 > 0.0001) {
      const d = Math.sqrt(d2);
      turkey.x = cx + (dx / d) * turkey.radius;
      turkey.y = cy + (dy / d) * turkey.radius;
    }
  }
}

export function updateTurkey(turkey, input, dt, worldWidth, obstacles, hayBales) {
  let mx = (input.isDown('right') ? 1 : 0) - (input.isDown('left') ? 1 : 0);
  let my = (input.isDown('down') ? 1 : 0) - (input.isDown('up') ? 1 : 0);
  const len = Math.hypot(mx, my);
  if (len > 0) {
    mx /= len;
    my /= len;
  }
  turkey.sneaking = input.isDown('sneak');
  turkey.moving = len > 0;

  turkey.dashCooldown = Math.max(0, turkey.dashCooldown - dt);
  turkey.invulnerableTimer = Math.max(0, turkey.invulnerableTimer - dt);
  turkey.gobbleTimer = Math.max(0, turkey.gobbleTimer - dt);

  // Dash: Space, or click toward the mouse.
  const click = input.consumeClick();
  let wantDash = false;
  let dashX = mx;
  let dashY = my;
  if (input.consume('dash')) {
    wantDash = true;
    if (len === 0) {
      dashX = turkey.facing;
      dashY = 0;
    }
  } else if (click) {
    wantDash = true;
    const worldClickX = click.x + (turkey.camX || 0);
    dashX = worldClickX - turkey.x;
    dashY = click.y - turkey.y;
    const dl = Math.hypot(dashX, dashY) || 1;
    dashX /= dl;
    dashY /= dl;
  }
  if (wantDash && turkey.dashCooldown <= 0 && turkey.dashTimer <= 0) {
    turkey.dashTimer = PLAYER.dashTime;
    turkey.dashCooldown = PLAYER.dashCooldown;
    turkey.dashDirX = dashX;
    turkey.dashDirY = dashY;
    turkey.dashed = true;
  } else {
    turkey.dashed = false;
  }

  if (turkey.dashTimer > 0) {
    turkey.dashTimer -= dt;
    turkey.vx = turkey.dashDirX * PLAYER.dashSpeed;
    turkey.vy = turkey.dashDirY * PLAYER.dashSpeed;
  } else {
    const speed = turkey.sneaking ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
    turkey.vx = mx * speed;
    turkey.vy = my * speed;
  }

  turkey.x += turkey.vx * dt;
  turkey.y += turkey.vy * dt;
  if (mx !== 0) turkey.facing = mx > 0 ? 1 : -1;
  if (turkey.moving) turkey.walkCycle += dt * (turkey.sneaking ? 6 : 11);
  clampToWorld(turkey, worldWidth, obstacles);

  // Hiding: standing inside a hay bale makes the turkey invisible.
  turkey.hidden = false;
  for (const hay of hayBales) {
    if (
      turkey.x > hay.x + 6 && turkey.x < hay.x + hay.w - 6 &&
      turkey.y > hay.y + 6 && turkey.y < hay.y + hay.h - 6
    ) {
      turkey.hidden = true;
      break;
    }
  }
  return turkey;
}

export function drawTurkey(ctx, turkey, time) {
  const bob = turkey.moving ? Math.sin(turkey.walkCycle) * 3 : Math.sin(time * 2) * 1.5;
  const blink = turkey.invulnerableTimer > 0 && Math.floor(time * 12) % 2 === 0;
  if (blink) ctx.globalAlpha = 0.35;

  ctx.save();
  ctx.translate(turkey.x, turkey.y + bob * 0.3);
  ctx.scale(turkey.facing, 1);

  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.25)';
  ctx.beginPath();
  ctx.ellipse(0, 20, 24, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail fan (behind the body).
  ctx.fillStyle = PALETTE.turkeyTail;
  for (let i = -2; i <= 2; i++) {
    ctx.save();
    ctx.rotate(i * 0.32 - Math.PI / 2);
    ctx.beginPath();
    ctx.ellipse(-26, 0, 16, 7, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#e8a34a';
    ctx.beginPath();
    ctx.ellipse(-26, 0, 10, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = PALETTE.turkeyTail;
    ctx.restore();
  }

  // Body.
  ctx.fillStyle = PALETTE.turkeyBody;
  ctx.beginPath();
  ctx.ellipse(0, 0, 24, 19, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.turkeyDark;
  ctx.beginPath();
  ctx.ellipse(-4, 6, 16, 11, 0, 0, Math.PI * 2);
  ctx.fill();
  // Wing.
  ctx.fillStyle = '#a06a35';
  ctx.beginPath();
  ctx.ellipse(-2, 2, 13, 9, -0.4, 0, Math.PI * 2);
  ctx.fill();

  // Neck + head.
  ctx.strokeStyle = PALETTE.turkeyHead;
  ctx.lineWidth = 9;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(14, -8);
  ctx.quadraticCurveTo(24, -22, 22, -30);
  ctx.stroke();
  ctx.fillStyle = PALETTE.turkeyHead;
  ctx.beginPath();
  ctx.arc(22, -32, 9, 0, Math.PI * 2);
  ctx.fill();
  // Beak.
  ctx.fillStyle = '#f2b234';
  ctx.beginPath();
  ctx.moveTo(28, -34);
  ctx.lineTo(40, -30);
  ctx.lineTo(28, -28);
  ctx.closePath();
  ctx.fill();
  // Wattle.
  ctx.fillStyle = PALETTE.wattle;
  ctx.beginPath();
  ctx.ellipse(30, -24, 3.5, 6, 0.3, 0, Math.PI * 2);
  ctx.fill();
  // Eye.
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(24, -35, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(25, -36, 1, 0, Math.PI * 2);
  ctx.fill();
  // Little legs.
  ctx.strokeStyle = '#f2b234';
  ctx.lineWidth = 3;
  const step = turkey.moving ? Math.sin(turkey.walkCycle) * 5 : 0;
  ctx.beginPath();
  ctx.moveTo(-6, 16);
  ctx.lineTo(-6 + step, 24);
  ctx.moveTo(6, 16);
  ctx.lineTo(6 - step, 24);
  ctx.stroke();

  ctx.restore();
  ctx.globalAlpha = 1;

  // "HIDDEN" tag when tucked in hay.
  if (turkey.hidden) {
    ctx.font = 'bold 13px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillStyle = '#fff3d6';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 3;
    const label = 'HIDDEN IN THE HAY';
    ctx.strokeText(label, turkey.x, turkey.y - 42);
    ctx.fillText(label, turkey.x, turkey.y - 42);
  }
}
