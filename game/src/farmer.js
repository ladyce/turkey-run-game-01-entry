// Gobble & Go! — the farmer: patrol, chase, search AI + vision cone.
// One job: the hunter. He patrols, spots the turkey, chases, and corners it.

import { FARMER, PALETTE } from './config.js';

export const FARMER_STATE = {
  PATROL: 'patrol',
  CHASE: 'chase',
  SEARCH: 'search',
};

export function createFarmer(x, y, waypoints, speedScale) {
  return {
    x,
    y,
    radius: FARMER.radius,
    state: FARMER_STATE.PATROL,
    waypointIndex: 0,
    waypoints: waypoints || [{ x, y }],
    facingAngle: 0,
    speedScale: speedScale || 1,
    alert: 0, // 0..1 — fills while the turkey is visible
    loseSightTimer: 0,
    searchTimer: 0,
    lastSeenX: x,
    lastSeenY: y,
    walkCycle: 0,
    spottedFlash: 0,
  };
}

function angleTo(farmer, tx, ty) {
  return Math.atan2(ty - farmer.y, tx - farmer.x);
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function canFarmerSee(farmer, turkey) {
  if (turkey.hidden) return false;
  if (turkey.invulnerableTimer > 0) return false;
  const dx = turkey.x - farmer.x;
  const dy = turkey.y - farmer.y;
  const dist = Math.hypot(dx, dy);
  if (dist > FARMER.visionRange) return false;
  const toTurkey = Math.atan2(dy, dx);
  if (Math.abs(angleDiff(toTurkey, farmer.facingAngle)) > FARMER.visionHalfAngle) return false;
  return true;
}

function moveToward(farmer, tx, ty, speed, dt) {
  const dx = tx - farmer.x;
  const dy = ty - farmer.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  farmer.x += (dx / dist) * step;
  farmer.y += (dy / dist) * step;
  farmer.facingAngle = Math.atan2(dy, dx);
  farmer.walkCycle += dt * 9;
  return dist <= speed * dt + 2;
}

export function updateFarmer(farmer, turkey, dt, worldWidth, obstacles) {
  const seen = canFarmerSee(farmer, turkey);
  farmer.spottedFlash = Math.max(0, farmer.spottedFlash - dt);

  if (seen) {
    farmer.alert = Math.min(1, farmer.alert + dt * 1.6);
    farmer.lastSeenX = turkey.x;
    farmer.lastSeenY = turkey.y;
    farmer.loseSightTimer = FARMER.loseSightTime;
    if (farmer.alert >= 1 && farmer.state !== FARMER_STATE.CHASE) {
      farmer.state = FARMER_STATE.CHASE;
      farmer.spottedFlash = 0.6;
      farmer.justSpotted = true;
    } else {
      farmer.justSpotted = false;
    }
  } else {
    farmer.alert = Math.max(0, farmer.alert - dt * 0.5);
    farmer.loseSightTimer -= dt;
    farmer.justSpotted = false;
    if (farmer.state === FARMER_STATE.CHASE && farmer.loseSightTimer <= 0) {
      farmer.state = FARMER_STATE.SEARCH;
      farmer.searchTimer = FARMER.searchTime;
    }
  }

  if (farmer.state === FARMER_STATE.PATROL) {
    const wp = farmer.waypoints[farmer.waypointIndex];
    const arrived = moveToward(farmer, wp.x, wp.y, FARMER.patrolSpeed * farmer.speedScale, dt);
    if (arrived) farmer.waypointIndex = (farmer.waypointIndex + 1) % farmer.waypoints.length;
  } else if (farmer.state === FARMER_STATE.CHASE) {
    moveToward(farmer, turkey.x, turkey.y, FARMER.chaseSpeed * farmer.speedScale, dt);
  } else if (farmer.state === FARMER_STATE.SEARCH) {
    farmer.searchTimer -= dt;
    const arrived = moveToward(farmer, farmer.lastSeenX, farmer.lastSeenY, FARMER.searchSpeed * farmer.speedScale, dt);
    if (arrived || farmer.searchTimer <= 0) {
      farmer.state = FARMER_STATE.PATROL;
      farmer.alert = 0;
    }
  }

  farmer.x = Math.max(farmer.radius + 8, Math.min(worldWidth - farmer.radius - 8, farmer.x));
  farmer.y = Math.max(96 + farmer.radius, Math.min(720 - farmer.radius - 8, farmer.y));
  for (const o of obstacles) {
    if (!o.solid) continue;
    const cx = Math.max(o.x, Math.min(farmer.x, o.x + o.w));
    const cy = Math.max(o.y, Math.min(farmer.y, o.y + o.h));
    const dx = farmer.x - cx;
    const dy = farmer.y - cy;
    const d2 = dx * dx + dy * dy;
    if (d2 < farmer.radius * farmer.radius && d2 > 0.0001) {
      const d = Math.sqrt(d2);
      farmer.x = cx + (dx / d) * farmer.radius;
      farmer.y = cy + (dy / d) * farmer.radius;
    }
  }
  return farmer;
}

export function drawVisionCone(ctx, farmer) {
  const range = FARMER.visionRange;
  const half = FARMER.visionHalfAngle;
  const color =
    farmer.state === FARMER_STATE.CHASE
      ? 'rgba(255, 74, 61, 0.20)'
      : farmer.alert > 0.25
        ? 'rgba(255, 200, 69, 0.20)'
        : 'rgba(255, 240, 160, 0.10)';
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(farmer.x, farmer.y);
  ctx.arc(farmer.x, farmer.y, range, farmer.facingAngle - half, farmer.facingAngle + half);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle =
    farmer.state === FARMER_STATE.CHASE ? 'rgba(255,74,61,0.45)' : 'rgba(255,240,160,0.30)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function drawFarmer(ctx, farmer, time) {
  const bob = Math.sin(farmer.walkCycle) * 2;
  ctx.save();
  ctx.translate(farmer.x, farmer.y + bob * 0.3);

  // Shadow.
  ctx.fillStyle = 'rgba(0,0,0,0.28)';
  ctx.beginPath();
  ctx.ellipse(0, 22, 26, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs (overalls).
  ctx.strokeStyle = PALETTE.farmerOveralls;
  ctx.lineWidth = 8;
  ctx.lineCap = 'round';
  const step = Math.sin(farmer.walkCycle) * 6;
  ctx.beginPath();
  ctx.moveTo(-6, 8);
  ctx.lineTo(-6 + step, 22);
  ctx.moveTo(6, 8);
  ctx.lineTo(6 - step, 22);
  ctx.stroke();

  // Body: shirt + overalls.
  ctx.fillStyle = PALETTE.farmerShirt;
  ctx.beginPath();
  ctx.ellipse(0, -2, 20, 17, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = PALETTE.farmerOveralls;
  ctx.fillRect(-14, -4, 28, 18);
  ctx.fillStyle = '#ffc845';
  ctx.fillRect(-14, -4, 28, 3);

  // Arms: one holds the pitchfork.
  ctx.strokeStyle = PALETTE.farmerShirt;
  ctx.lineWidth = 7;
  ctx.beginPath();
  ctx.moveTo(14, -8);
  ctx.lineTo(26, 4);
  ctx.stroke();

  // Pitchfork.
  ctx.strokeStyle = '#8a8f98';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(28, 10);
  ctx.lineTo(36, -30);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(30, -30);
  ctx.lineTo(34, -42);
  ctx.moveTo(36, -30);
  ctx.lineTo(36, -44);
  ctx.moveTo(42, -30);
  ctx.lineTo(40, -42);
  ctx.stroke();

  // Head + straw hat.
  ctx.fillStyle = PALETTE.farmerSkin;
  ctx.beginPath();
  ctx.arc(0, -26, 11, 0, Math.PI * 2);
  ctx.fill();
  // Moustache.
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(-8, -22, 16, 3);
  // Straw hat.
  ctx.fillStyle = PALETTE.farmerHat;
  ctx.beginPath();
  ctx.ellipse(0, -32, 20, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(0, -36, 11, 7, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#a03d2d';
  ctx.fillRect(-11, -36, 22, 3);

  // Angry eyes when chasing.
  if (farmer.state === FARMER_STATE.CHASE) {
    ctx.strokeStyle = '#d43d2a';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-8, -30);
    ctx.lineTo(-2, -27);
    ctx.moveTo(8, -30);
    ctx.lineTo(2, -27);
    ctx.stroke();
  }

  ctx.restore();

  // Alert badge above the farmer.
  if (farmer.alert > 0.15 || farmer.state !== FARMER_STATE.PATROL) {
    const label =
      farmer.state === FARMER_STATE.CHASE ? '!' : farmer.state === FARMER_STATE.SEARCH ? '?' : '...';
    const bg = farmer.state === FARMER_STATE.CHASE ? '#ff4a3d' : '#ffc845';
    ctx.font = 'bold 20px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    const w = 26;
    ctx.fillStyle = bg;
    ctx.beginPath();
    ctx.arc(farmer.x, farmer.y - 58, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = 'rgba(0,0,0,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = farmer.state === FARMER_STATE.CHASE ? '#fff' : '#241a08';
    ctx.fillText(label, farmer.x, farmer.y - 51);
    void w;
  }
}
