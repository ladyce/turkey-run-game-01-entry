// Gobble & Go! — pickups and hazards: corn, golden feathers, hay bales,
// ovens and sweeping carving knives, plus the exit gate.
// One job: everything the turkey collects, hides in, or must dodge.

import { PALETTE } from './config.js';

export function createCorn(x, y) {
  return { kind: 'corn', x, y, taken: false, bobPhase: Math.random() * Math.PI * 2 };
}

export function createFeather(x, y) {
  return { kind: 'feather', x, y, taken: false, bobPhase: Math.random() * Math.PI * 2 };
}

export function createHayBale(x, y) {
  return { kind: 'hay', x, y, w: 92, h: 64, solid: false };
}

export function createOven(x, y) {
  return { kind: 'oven', x, y, w: 150, h: 110, solid: true, heatPhase: Math.random() * Math.PI * 2 };
}

export function createKnifeLane(y, speed, offset) {
  return { kind: 'knife', y, x: 0, speed, offset: offset || 0, w: 64, h: 14 };
}

export function createExitGate(x, y) {
  return { kind: 'exit', x, y, w: 70, h: 170 };
}

export function updateKnifeLane(knife, worldWidth, time) {
  // Sweeps back and forth across the world on its lane.
  const span = worldWidth - 200;
  const t = ((time * knife.speed + knife.offset) % 2 + 2) % 2;
  const p = t < 1 ? t : 2 - t;
  knife.x = 100 + p * span;
  return knife;
}

export function circleHitsRect(cx, cy, r, rect) {
  const nx = Math.max(rect.x, Math.min(cx, rect.x + rect.w));
  const ny = Math.max(rect.y, Math.min(cy, rect.y + rect.h));
  const dx = cx - nx;
  const dy = cy - ny;
  return dx * dx + dy * dy < r * r;
}

export function drawCorn(ctx, corn, time) {
  const bob = Math.sin(time * 3 + corn.bobPhase) * 3;
  ctx.save();
  ctx.translate(corn.x, corn.y + bob);
  // Husk leaves.
  ctx.fillStyle = '#5a9a3e';
  ctx.beginPath();
  ctx.ellipse(-8, 4, 7, 12, -0.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(8, 4, 7, 12, 0.5, 0, Math.PI * 2);
  ctx.fill();
  // Cob.
  ctx.fillStyle = '#f2c230';
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#d9a41e';
  for (let i = -1; i <= 1; i++) {
    ctx.fillRect(i * 5 - 1, -10, 2, 20);
  }
  ctx.restore();
}

export function drawFeather(ctx, feather, time) {
  const bob = Math.sin(time * 2.5 + feather.bobPhase) * 4;
  ctx.save();
  ctx.translate(feather.x, feather.y + bob);
  ctx.rotate(Math.sin(time * 1.5 + feather.bobPhase) * 0.25);
  ctx.fillStyle = '#ffd94a';
  ctx.beginPath();
  ctx.ellipse(0, 0, 9, 20, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath();
  ctx.ellipse(0, -2, 4, 14, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#c9a13a';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, -18);
  ctx.lineTo(0, 22);
  ctx.stroke();
  ctx.restore();
}

export function drawHayBale(ctx, hay) {
  ctx.save();
  ctx.translate(hay.x + hay.w / 2, hay.y + hay.h / 2);
  ctx.fillStyle = 'rgba(0,0,0,0.2)';
  ctx.beginPath();
  ctx.ellipse(0, hay.h / 2 - 2, hay.w / 2, 8, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.hay;
  ctx.beginPath();
  ctx.ellipse(0, 0, hay.w / 2, hay.h / 2, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = PALETTE.hayDark;
  ctx.lineWidth = 2;
  for (let i = -2; i <= 2; i++) {
    ctx.beginPath();
    ctx.ellipse(0, 0, hay.w / 2 - 6, (hay.h / 2 - 4) * (Math.abs(i) / 2.5 + 0.25), 0, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.fillStyle = '#7a5a1a';
  ctx.font = 'bold 11px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HIDE HERE', 0, 4);
  ctx.restore();
}

export function drawOven(ctx, oven, time) {
  const glow = 0.7 + Math.sin(time * 4 + oven.heatPhase) * 0.25;
  ctx.save();
  ctx.translate(oven.x, oven.y);
  // Body.
  ctx.fillStyle = PALETTE.oven;
  ctx.fillRect(0, 0, oven.w, oven.h);
  ctx.fillStyle = '#2a2a33';
  ctx.fillRect(0, 0, oven.w, 12);
  // Glowing door + bright core.
  ctx.fillStyle = `rgba(255, 122, 42, ${glow})`;
  ctx.fillRect(18, 28, oven.w - 36, 52);
  ctx.fillStyle = `rgba(255, 214, 90, ${glow * 0.85})`;
  ctx.fillRect(30, 40, oven.w - 60, 28);
  ctx.fillStyle = '#1a1a1a';
  ctx.fillRect(18, 28, oven.w - 36, 6);
  // Dials + handle.
  ctx.fillStyle = '#dfe6ee';
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.arc(34 + i * 22, 18, 5, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = '#dfe6ee';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(12, 24);
  ctx.lineTo(oven.w - 12, 24);
  ctx.stroke();
  // Warning label.
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 13px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('HOT OVEN!', oven.w / 2, oven.h - 12);
  ctx.restore();
}

export function drawKnife(ctx, knife) {
  ctx.save();
  ctx.translate(knife.x, knife.y);
  // Blade.
  ctx.fillStyle = PALETTE.knife;
  ctx.beginPath();
  ctx.moveTo(-32, -7);
  ctx.lineTo(18, -7);
  ctx.lineTo(32, 0);
  ctx.lineTo(18, 7);
  ctx.lineTo(-32, 7);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = '#9aa5b1';
  ctx.lineWidth = 1.5;
  ctx.stroke();
  // Handle.
  ctx.fillStyle = PALETTE.knifeHandle;
  ctx.fillRect(-48, -6, 18, 12);
  ctx.fillStyle = '#3a1d10';
  ctx.fillRect(-48, -6, 18, 3);
  // Danger glint.
  ctx.fillStyle = 'rgba(255,255,255,0.7)';
  ctx.fillRect(-20, -5, 30, 2);
  ctx.restore();
}

export function drawExitGate(ctx, gate, time) {
  const pulse = 0.6 + Math.sin(time * 3) * 0.25;
  ctx.save();
  ctx.translate(gate.x, gate.y);
  // Posts.
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(-6, 0, 12, gate.h);
  ctx.fillRect(gate.w - 6, 0, 12, gate.h);
  // Glowing doorway.
  ctx.fillStyle = `rgba(126, 217, 87, ${pulse})`;
  ctx.fillRect(6, 8, gate.w - 12, gate.h - 8);
  ctx.fillStyle = '#1e4d12';
  ctx.font = 'bold 15px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center';
  ctx.save();
  ctx.translate(gate.w / 2, gate.h / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText('ESCAPE!', 0, 5);
  ctx.restore();
  // Arrow.
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath();
  ctx.moveTo(gate.w / 2 - 12, gate.h - 30);
  ctx.lineTo(gate.w / 2 + 12, gate.h - 30);
  ctx.lineTo(gate.w / 2, gate.h - 12);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
