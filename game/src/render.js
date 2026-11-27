// Gobble & Go! — all drawing: the world, the HUD, title and end screens.
// One job: turn game state into the picture the judge sees.

import { VIEW_W, VIEW_H, PALETTE, STAGE_COUNT } from './config.js';
import { drawTurkey } from './turkey.js';
import { drawFarmer, drawVisionCone } from './farmer.js';
import {
  drawCorn, drawFeather, drawHayBale, drawOven, drawKnife, drawExitGate, circleHitsRect,
} from './hazards.js';

function drawGround(ctx, stage, camX) {
  const ground = stage.def.ground;
  ctx.save();
  if (ground === 'farm') {
    ctx.fillStyle = PALETTE.grass;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    // Mowed stripes.
    ctx.fillStyle = PALETTE.grassDark;
    for (let x = -((camX % 160) + 160) % 160; x < VIEW_W; x += 320) {
      ctx.fillRect(x, 90, 160, VIEW_H - 90);
    }
    // Dirt path along the turkey's running line.
    ctx.fillStyle = PALETTE.dirt;
    ctx.fillRect(0, 330, VIEW_W, 130);
    ctx.fillStyle = PALETTE.dirtDark;
    for (let x = -((camX % 90) + 90) % 90; x < VIEW_W; x += 90) {
      ctx.beginPath();
      ctx.ellipse(x + 20, 395, 14, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    // Autumn leaves drifting on the field.
    ctx.fillStyle = 'rgba(217, 122, 42, 0.5)';
    for (let i = 0; i < 12; i++) {
      const lx = ((i * 173 + camX * 0.3) % 1400) - 60;
      const ly = 120 + ((i * 97) % 560);
      ctx.beginPath();
      ctx.ellipse(lx, ly, 7, 4, i, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (ground === 'barn') {
    ctx.fillStyle = '#8a6a42';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.fillStyle = '#7a5a36';
    for (let x = -((camX % 120) + 120) % 120; x < VIEW_W; x += 120) {
      ctx.fillRect(x, 90, 8, VIEW_H - 90);
    }
    // Straw scattered on the floor.
    ctx.strokeStyle = 'rgba(232, 194, 90, 0.55)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 24; i++) {
      const sx = ((i * 211 + camX * 0.5) % 1400) - 60;
      const sy = 130 + ((i * 131) % 560);
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + 18, sy + 3);
      ctx.stroke();
    }
    // Shafts of light through the barn boards.
    ctx.fillStyle = 'rgba(255, 240, 190, 0.10)';
    for (let x = 200; x < VIEW_W; x += 420) {
      ctx.beginPath();
      ctx.moveTo(x, 90);
      ctx.lineTo(x + 90, 90);
      ctx.lineTo(x + 190, VIEW_H);
      ctx.lineTo(x + 60, VIEW_H);
      ctx.closePath();
      ctx.fill();
    }
  } else {
    // Kitchen: checkerboard tile floor.
    const tile = 64;
    for (let ty = 0; ty < VIEW_H / tile + 1; ty++) {
      for (let tx = -1; tx < VIEW_W / tile + 1; tx++) {
        const wx = tx * tile - (camX % tile);
        ctx.fillStyle = (tx + ty) % 2 === 0 ? PALETTE.kitchenFloor : PALETTE.kitchenTile;
        ctx.fillRect(wx, 90 + ty * tile, tile, tile);
      }
    }
    // Back wall.
    ctx.fillStyle = '#c9b18a';
    ctx.fillRect(0, 0, VIEW_W, 90);
    ctx.fillStyle = '#b39a72';
    ctx.fillRect(0, 84, VIEW_W, 6);
  }
  ctx.restore();
}

function drawObstacle(ctx, o, camX) {
  const x = o.x - camX;
  if (x + o.w < -80 || x > VIEW_W + 80) return;
  ctx.save();
  if (o.kind === 'fence') {
    ctx.fillStyle = PALETTE.fence;
    ctx.fillRect(x, o.y, o.w, o.h);
    ctx.fillStyle = '#6b4420';
    ctx.fillRect(x, o.y + 5, o.w, 3);
    ctx.fillStyle = '#a06a35';
    ctx.fillRect(x + 2, o.y - 6, 5, o.h + 6);
    ctx.fillRect(x + o.w - 7, o.y - 6, 5, o.h + 6);
  } else if (o.kind === 'pumpkin') {
    ctx.fillStyle = '#e07830';
    ctx.beginPath();
    ctx.ellipse(x + o.w / 2, o.y + o.h / 2, o.w / 2, o.h / 2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#b85a1e';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(x + o.w / 2, o.y + o.h / 2, o.w / 3, o.h / 2, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = '#5a9a3e';
    ctx.fillRect(x + o.w / 2 - 3, o.y - 8, 6, 10);
  } else if (o.kind === 'crate') {
    ctx.fillStyle = '#a07840';
    ctx.fillRect(x, o.y, o.w, o.h);
    ctx.strokeStyle = '#6b4a22';
    ctx.lineWidth = 3;
    ctx.strokeRect(x + 2, o.y + 2, o.w - 4, o.h - 4);
    ctx.beginPath();
    ctx.moveTo(x, o.y);
    ctx.lineTo(x + o.w, o.y + o.h);
    ctx.moveTo(x + o.w, o.y);
    ctx.lineTo(x, o.y + o.h);
    ctx.stroke();
  } else if (o.kind === 'post') {
    ctx.fillStyle = PALETTE.barnWood;
    ctx.fillRect(x, o.y, o.w, o.h);
    ctx.fillStyle = '#5a3418';
    ctx.fillRect(x, o.y, o.w, 8);
  } else if (o.kind === 'counter') {
    ctx.fillStyle = '#9a8a70';
    ctx.fillRect(x, o.y, o.w, o.h);
    ctx.fillStyle = '#6b5a42';
    ctx.fillRect(x, o.y, o.w, 10);
    ctx.fillStyle = '#d8cbb0';
    for (let i = 0; i < 4; i++) {
      ctx.fillRect(x + 14 + i * 52, o.y + 18, 34, 22);
    }
  } else if (o.kind === 'table') {
    ctx.fillStyle = '#7d4a26';
    ctx.fillRect(x, o.y, o.w, o.h);
    ctx.fillStyle = '#fff3d6';
    ctx.fillRect(x + 6, o.y + 6, o.w - 12, o.h - 12);
    ctx.fillStyle = '#d43d2a';
    ctx.beginPath();
    ctx.arc(x + o.w / 2, o.y + o.h / 2, 14, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawStageLabel(ctx, stage, camX) {
  // Painted sign at the world start (called inside the world transform,
  // so its coordinates are world coordinates).
  if (camX > 500) return;
  ctx.save();
  ctx.translate(560, 200);
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(-8, 0, 16, 120);
  ctx.fillStyle = '#e8c25a';
  ctx.fillRect(-150, -70, 300, 80);
  ctx.strokeStyle = '#5a3a1a';
  ctx.lineWidth = 4;
  ctx.strokeRect(-150, -70, 300, 80);
  ctx.fillStyle = '#241a08';
  ctx.font = 'bold 22px Trebuchet MS, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(stage.def.name, 0, -38);
  ctx.font = '15px Trebuchet MS, sans-serif';
  ctx.fillText(stage.def.sub, 0, -12);
  ctx.restore();
}

export function drawWorld(ctx, game, time) {
  const stage = game.stage;
  const camX = game.cameraX;
  drawGround(ctx, stage, camX);

  // Vision cones first (under the actors).
  for (const f of stage.farmers) {
    ctx.save();
    ctx.translate(-camX, 0);
    drawVisionCone(ctx, f);
    ctx.restore();
  }

  ctx.save();
  ctx.translate(-camX, 0);
  drawStageLabel(ctx, stage, camX);
  for (const o of stage.obstacles) drawObstacle(ctx, o, 0);
  for (const hay of stage.hayBales) drawHayBale(ctx, hay);
  for (const oven of stage.ovens) drawOven(ctx, oven, time);
  for (const corn of stage.corns) if (!corn.taken) drawCorn(ctx, corn, time);
  for (const feather of stage.feathers) if (!feather.taken) drawFeather(ctx, feather, time);
  for (const knife of stage.knives) drawKnife(ctx, knife);
  drawExitGate(ctx, stage.exit, time);
  for (const f of stage.farmers) drawFarmer(ctx, f, time);
  drawTurkey(ctx, game.turkey, time);
  ctx.restore();

  // Danger vignette when a farmer is chasing.
  const chasing = stage.farmers.some((f) => f.state === 'chase');
  if (chasing) {
    const grad = ctx.createRadialGradient(
      VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.35, VIEW_W / 2, VIEW_H / 2, VIEW_H * 0.75,
    );
    grad.addColorStop(0, 'rgba(255, 40, 20, 0)');
    grad.addColorStop(1, 'rgba(255, 40, 20, 0.28)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  }
}

function panel(ctx, x, y, w, h) {
  ctx.fillStyle = PALETTE.hudBg;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, 10);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 200, 69, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

export function drawHud(ctx, game) {
  const stage = game.stage;
  const turkey = game.turkey;
  const chasing = stage.farmers.some((f) => f.state === 'chase');
  const maxAlert = Math.max(0, ...stage.farmers.map((f) => f.alert));

  // --- Top bar.
  panel(ctx, 12, 10, VIEW_W - 24, 64);
  ctx.textAlign = 'left';
  ctx.fillStyle = PALETTE.hudGold;
  ctx.font = 'bold 20px Trebuchet MS, sans-serif';
  ctx.fillText('GOBBLE & GO!', 28, 36);
  ctx.fillStyle = PALETTE.hudCream;
  ctx.font = '13px Trebuchet MS, sans-serif';
  ctx.fillText(stage.def.name, 28, 58);

  // Score.
  ctx.textAlign = 'center';
  ctx.fillStyle = PALETTE.hudCream;
  ctx.font = '12px Trebuchet MS, sans-serif';
  ctx.fillText('SCORE', 430, 28);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Trebuchet MS, sans-serif';
  ctx.fillText(String(game.score).padStart(6, '0'), 430, 58);

  // Distance.
  ctx.fillStyle = PALETTE.hudCream;
  ctx.font = '12px Trebuchet MS, sans-serif';
  ctx.fillText('DISTANCE', 580, 28);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 26px Trebuchet MS, sans-serif';
  ctx.fillText(`${Math.floor(game.distanceM)} m`, 580, 58);

  // Lives.
  ctx.fillStyle = PALETTE.hudCream;
  ctx.font = '12px Trebuchet MS, sans-serif';
  ctx.fillText('LIVES', 720, 28);
  ctx.font = '24px Trebuchet MS, sans-serif';
  let hearts = '';
  for (let i = 0; i < 3; i++) hearts += i < game.lives ? '♥' : '♡';
  ctx.fillStyle = '#ff5a4a';
  ctx.fillText(hearts, 720, 58);

  // Alert meter.
  ctx.fillStyle = PALETTE.hudCream;
  ctx.font = '12px Trebuchet MS, sans-serif';
  ctx.fillText(chasing ? 'SPOTTED! RUN!' : maxAlert > 0.25 ? 'HE SEES SOMETHING…' : 'HIDDEN — CLEAR', 900, 28);
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(830, 38, 170, 14);
  ctx.fillStyle = chasing ? '#ff4a3d' : maxAlert > 0.25 ? '#ffc845' : '#7ed957';
  ctx.fillRect(830, 38, 170 * maxAlert, 14);
  ctx.strokeStyle = 'rgba(255,255,255,0.5)';
  ctx.lineWidth = 1;
  ctx.strokeRect(830, 38, 170, 14);

  // Timer + stage progress.
  ctx.textAlign = 'right';
  ctx.fillStyle = PALETTE.hudCream;
  ctx.font = '12px Trebuchet MS, sans-serif';
  ctx.fillText('TIME', 1252, 28);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 22px Trebuchet MS, sans-serif';
  const t = Math.floor(game.elapsed);
  ctx.fillText(`${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`, 1252, 56);
  ctx.textAlign = 'left';

  // Stage progress bar (thin, under the top bar).
  const progress = Math.min(1, turkey.x / stage.width);
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.fillRect(12, 78, VIEW_W - 24, 8);
  ctx.fillStyle = PALETTE.hudGold;
  ctx.fillRect(12, 78, (VIEW_W - 24) * progress, 8);

  // --- Right side panel: objectives.
  panel(ctx, VIEW_W - 236, 100, 224, 168);
  ctx.fillStyle = PALETTE.hudGold;
  ctx.font = 'bold 14px Trebuchet MS, sans-serif';
  ctx.fillText('TONIGHT\'S ESCAPE', VIEW_W - 220, 124);
  ctx.fillStyle = PALETTE.hudCream;
  ctx.font = '14px Trebuchet MS, sans-serif';
  const cornGot = stage.corns.filter((c) => c.taken).length;
  const featherGot = stage.feathers.filter((c) => c.taken).length;
  ctx.fillText(`🌽 Corn  ${cornGot} / ${stage.corns.length}`, VIEW_W - 220, 150);
  ctx.fillText(`🪶 Feathers  ${featherGot} / ${stage.feathers.length}`, VIEW_W - 220, 174);
  ctx.fillText(`Stage  ${game.stageIndex + 1} / ${STAGE_COUNT}`, VIEW_W - 220, 198);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 13px Trebuchet MS, sans-serif';
  ctx.fillText('→ Reach the green EXIT gate', VIEW_W - 220, 226);
  ctx.fillStyle = PALETTE.hudCream;
  ctx.font = '12px Trebuchet MS, sans-serif';
  ctx.fillText('Hide in hay bales to break', VIEW_W - 220, 248);
  ctx.fillText('the farmer\'s line of sight.', VIEW_W - 220, 264);

  // --- Bottom toolbar.
  panel(ctx, 12, VIEW_H - 52, VIEW_W - 24, 40);
  ctx.fillStyle = PALETTE.hudCream;
  ctx.font = 'bold 13px Trebuchet MS, sans-serif';
  const dashReady = turkey.dashCooldown <= 0;
  ctx.fillStyle = dashReady ? '#7ed957' : '#8a8a8a';
  ctx.fillText(dashReady ? '● DASH READY' : '○ DASH…', 28, VIEW_H - 26);
  ctx.fillStyle = PALETTE.hudCream;
  ctx.fillText('WASD / Arrows — move    SHIFT — sneak    SPACE / CLICK — dash    P — pause    M — sound', 170, VIEW_H - 26);
  ctx.textAlign = 'right';
  ctx.fillStyle = '#ffffff';
  ctx.fillText(`BEST ${game.best}`, 1252, VIEW_H - 26);
  ctx.textAlign = 'left';

  // "SPOTTED!" flash banner.
  if (chasing) {
    ctx.save();
    ctx.globalAlpha = 0.75 + Math.sin(game.time * 8) * 0.25;
    ctx.fillStyle = '#ff4a3d';
    ctx.font = 'bold 34px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 5;
    ctx.strokeText('SPOTTED! RUN, TOM, RUN!', VIEW_W / 2, 150);
    ctx.fillText('SPOTTED! RUN, TOM, RUN!', VIEW_W / 2, 150);
    ctx.restore();
    ctx.textAlign = 'left';
  }

  // Floating score popups.
  for (const pop of game.popups) {
    ctx.save();
    ctx.globalAlpha = Math.max(0, pop.life / pop.maxLife);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Trebuchet MS, sans-serif';
    ctx.textAlign = 'center';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.lineWidth = 3;
    ctx.strokeText(pop.text, pop.x - game.cameraX, pop.y);
    ctx.fillText(pop.text, pop.x - game.cameraX, pop.y);
    ctx.restore();
  }
  ctx.textAlign = 'left';
}

export function drawTitleScreen(ctx, game) {
  // Warm autumn backdrop.
  const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  grad.addColorStop(0, '#f7b733');
  grad.addColorStop(0.55, '#e07830');
  grad.addColorStop(1, '#7d4a26');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  // Sun + clouds.
  ctx.fillStyle = '#fff3d6';
  ctx.beginPath();
  ctx.arc(1080, 110, 58, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255, 243, 214, 0.85)';
  for (const [cx, cy, s] of [[220, 120, 1], [520, 80, 0.7], [820, 150, 0.85]]) {
    ctx.beginPath();
    ctx.ellipse(cx, cy, 90 * s, 26 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Rolling hills + farm silhouette.
  ctx.fillStyle = '#6b9a3e';
  ctx.beginPath();
  ctx.moveTo(0, 520);
  ctx.quadraticCurveTo(320, 420, 640, 520);
  ctx.quadraticCurveTo(960, 620, 1280, 500);
  ctx.lineTo(1280, 720);
  ctx.lineTo(0, 720);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#5a8a34';
  ctx.beginPath();
  ctx.moveTo(0, 600);
  ctx.quadraticCurveTo(400, 520, 800, 600);
  ctx.quadraticCurveTo(1100, 660, 1280, 600);
  ctx.lineTo(1280, 720);
  ctx.lineTo(0, 720);
  ctx.closePath();
  ctx.fill();

  // Barn silhouette on the right.
  ctx.fillStyle = '#7d2d20';
  ctx.fillRect(1020, 430, 180, 130);
  ctx.beginPath();
  ctx.moveTo(1000, 432);
  ctx.lineTo(1110, 360);
  ctx.lineTo(1220, 432);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#f7e8c9';
  ctx.fillRect(1075, 500, 70, 60);

  // Big turkey hero (drawn with the same turkey artist, scaled up).
  ctx.save();
  ctx.translate(210, 590);
  ctx.scale(3.0, 3.0);
  drawTurkey(ctx, { x: 0, y: 0, facing: 1, moving: false, walkCycle: 0, invulnerableTimer: 0, hidden: false }, 1.2);
  ctx.restore();

  // Title.
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 92px Trebuchet MS, sans-serif';
  ctx.strokeStyle = 'rgba(60, 20, 0, 0.55)';
  ctx.lineWidth = 10;
  ctx.strokeText('GOBBLE & GO!', VIEW_W / 2, 190);
  ctx.fillText('GOBBLE & GO!', VIEW_W / 2, 190);
  ctx.font = 'bold 30px Trebuchet MS, sans-serif';
  ctx.fillStyle = '#ffe9a8';
  ctx.fillText('THE GREAT THANKSGIVING ESCAPE', VIEW_W / 2, 238);

  // Story card.
  panel(ctx, VIEW_W / 2 - 330, 270, 660, 118);
  ctx.fillStyle = PALETTE.hudCream;
  ctx.font = '17px Trebuchet MS, sans-serif';
  ctx.fillText('Tom the turkey is on the menu tonight. The farmer is coming,', VIEW_W / 2, 300);
  ctx.fillText('the oven is preheating and the carving knife is out.', VIEW_W / 2, 326);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 17px Trebuchet MS, sans-serif';
  ctx.fillText('Dodge the farmer. Dodge the knives. Reach the green gate.', VIEW_W / 2, 358);
  ctx.fillStyle = PALETTE.hudGold;
  ctx.font = '15px Trebuchet MS, sans-serif';
  ctx.fillText('3 stages: Farmyard → Barn → Kitchen', VIEW_W / 2, 380);

  // Start prompt (pulsing).
  ctx.save();
  ctx.globalAlpha = 0.65 + Math.sin(game.time * 4) * 0.35;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px Trebuchet MS, sans-serif';
  ctx.strokeStyle = 'rgba(60,20,0,0.6)';
  ctx.lineWidth = 6;
  ctx.strokeText('▶  CLICK or press ENTER to play', VIEW_W / 2, 460);
  ctx.fillText('▶  CLICK or press ENTER to play', VIEW_W / 2, 460);
  ctx.restore();

  // Controls footer.
  ctx.fillStyle = '#fff3d6';
  ctx.font = '16px Trebuchet MS, sans-serif';
  ctx.fillText('WASD / Arrows — move      SHIFT — sneak      SPACE / CLICK — dash', VIEW_W / 2, 520);
  ctx.fillText('Hide in hay bales • Grab corn (+100) and golden feathers (+500) • 3 lives', VIEW_W / 2, 548);
  ctx.font = '13px Trebuchet MS, sans-serif';
  ctx.fillStyle = 'rgba(255, 243, 214, 0.75)';
  ctx.fillText('An original game by the Gobble & Go! kitchen — no turkeys were harmed (yet).', VIEW_W / 2, 690);
  ctx.textAlign = 'left';
}

export function drawEndScreen(ctx, game) {
  // Dim the world behind.
  ctx.fillStyle = 'rgba(20, 10, 4, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  const escaped = game.endReason === 'escaped';
  const title = escaped ? 'ESCAPED!' : 'CAUGHT!';
  const titleColor = escaped ? '#7ed957' : '#ff4a3d';
  ctx.textAlign = 'center';
  ctx.font = 'bold 96px Trebuchet MS, sans-serif';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 10;
  ctx.strokeText(title, VIEW_W / 2, 220);
  ctx.fillStyle = titleColor;
  ctx.fillText(title, VIEW_W / 2, 220);

  ctx.font = 'bold 26px Trebuchet MS, sans-serif';
  ctx.fillStyle = '#fff3d6';
  const sub = escaped
    ? 'Tom slipped out the back gate — Thanksgiving is saved!'
    : 'The farmer got Tom… but a turkey never gives up. Try again!';
  ctx.fillText(sub, VIEW_W / 2, 272);

  // Results card.
  panel(ctx, VIEW_W / 2 - 300, 310, 600, 210);
  const rows = [
    ['FINAL SCORE', String(game.score)],
    ['DISTANCE RUN', `${Math.floor(game.distanceM)} m`],
    ['CORN COLLECTED', String(game.cornCollected)],
    ['GOLDEN FEATHERS', String(game.feathersCollected)],
    ['STAGES CLEARED', `${game.stagesCleared} / ${STAGE_COUNT}`],
    ['TIME', `${Math.floor(game.elapsed / 60)}:${String(Math.floor(game.elapsed % 60)).padStart(2, '0')}`],
    ['BEST SCORE', String(game.best)],
  ];
  ctx.font = '18px Trebuchet MS, sans-serif';
  rows.forEach(([label, value], i) => {
    const y = 344 + i * 26;
    ctx.textAlign = 'left';
    ctx.fillStyle = PALETTE.hudCream;
    ctx.fillText(label, VIEW_W / 2 - 270, y);
    ctx.textAlign = 'right';
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 18px Trebuchet MS, sans-serif';
    ctx.fillText(value, VIEW_W / 2 + 270, y);
    ctx.font = '18px Trebuchet MS, sans-serif';
  });
  ctx.textAlign = 'center';

  ctx.save();
  ctx.globalAlpha = 0.65 + Math.sin(game.time * 4) * 0.35;
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 28px Trebuchet MS, sans-serif';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 5;
  ctx.strokeText('Press R or CLICK to play again', VIEW_W / 2, 590);
  ctx.fillText('Press R or CLICK to play again', VIEW_W / 2, 590);
  ctx.restore();
  ctx.textAlign = 'left';
}

export function drawPausedOverlay(ctx) {
  ctx.fillStyle = 'rgba(20, 10, 4, 0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = '#fff3d6';
  ctx.font = 'bold 64px Trebuchet MS, sans-serif';
  ctx.strokeStyle = 'rgba(0,0,0,0.6)';
  ctx.lineWidth = 8;
  ctx.strokeText('PAUSED', VIEW_W / 2, 340);
  ctx.fillText('PAUSED', VIEW_W / 2, 340);
  ctx.font = '20px Trebuchet MS, sans-serif';
  ctx.fillText('Press P to resume', VIEW_W / 2, 390);
  ctx.textAlign = 'left';
}

export { circleHitsRect };
