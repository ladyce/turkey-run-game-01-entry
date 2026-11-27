// Gobble & Go! — The Great Thanksgiving Escape.
// One job: own the game loop and the screen state machine, and wire every
// other module together. The turkey, the farmer, the hazards and the
// renderer all meet here.

import { VIEW_W, VIEW_H, PLAYER, STAGE_COUNT, SCORE } from './config.js';
import { createInput } from './input.js';
import { createSoundBank } from './audio.js';
import { createTurkey, resetTurkeyPosition, updateTurkey } from './turkey.js';
import { updateFarmer, FARMER_STATE } from './farmer.js';
import { buildStage } from './stages.js';
import { updateKnifeLane, circleHitsRect } from './hazards.js';
import { drawWorld, drawHud, drawTitleScreen, drawEndScreen, drawPausedOverlay } from './render.js';
import { applyShotState } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const input = createInput(canvas);
const sounds = createSoundBank();
const params = new URLSearchParams(window.location.search);
const shotMode = params.get('shot');

window.__gameErrors = [];
window.addEventListener('error', (e) => window.__gameErrors.push(String(e.message || e.error)));

function loadBest() {
  try {
    return Number(window.localStorage.getItem('gobble-go-best') || 0) || 0;
  } catch (err) {
    return 0;
  }
}

function saveBest(value) {
  try {
    window.localStorage.setItem('gobble-go-best', String(value));
  } catch (err) {
    /* storage unavailable (file://) — best score just lives for the session */
  }
}

const game = {
  screen: 'title', // title | play | paused | end
  stageIndex: 0,
  stage: null,
  turkey: null,
  cameraX: 0,
  score: 0,
  distanceM: 0,
  maxDistanceX: 0,
  lives: PLAYER.lives,
  elapsed: 0,
  time: 0,
  cornCollected: 0,
  feathersCollected: 0,
  stagesCleared: 0,
  endReason: null,
  best: loadBest(),
  popups: [],
  seed: 20261127,
};

function startStage(index) {
  game.stageIndex = index;
  game.stage = buildStage(index, game.seed);
  game.turkey = createTurkey(game.stage.spawn.x, game.stage.spawn.y);
  game.cameraX = 0;
  game.maxDistanceX = game.turkey.x;
}

function startGame() {
  game.score = 0;
  game.distanceM = 0;
  game.lives = PLAYER.lives;
  game.elapsed = 0;
  game.cornCollected = 0;
  game.feathersCollected = 0;
  game.stagesCleared = 0;
  game.endReason = null;
  game.popups = [];
  startStage(0);
  game.screen = 'play';
  sounds.unlock();
  sounds.startMusic();
  sounds.gobble();
}

function endGame(reason) {
  game.endReason = reason;
  game.screen = 'end';
  sounds.stopMusic();
  if (reason === 'escaped') sounds.escaped();
  else sounds.caught();
  if (game.score > game.best) {
    game.best = game.score;
    saveBest(game.best);
  }
}

function loseLife(reason) {
  game.lives -= 1;
  sounds.caught();
  game.popups.push({
    x: game.turkey.x,
    y: game.turkey.y - 50,
    text: reason === 'oven' ? 'TOO HOT!' : reason === 'knife' ? 'SLICED!' : 'CAUGHT!',
    life: 1.2,
    maxLife: 1.2,
  });
  if (game.lives <= 0) {
    endGame('caught');
    return;
  }
  // Respawn at the stage start; the farmer goes back to patrolling.
  resetTurkeyPosition(game.turkey, game.stage.spawn.x, game.stage.spawn.y);
  for (const f of game.stage.farmers) {
    f.state = FARMER_STATE.PATROL;
    f.alert = 0;
    f.x = f.waypoints[0].x;
    f.y = f.waypoints[0].y;
  }
  game.cameraX = 0;
}

function addPopup(x, y, text) {
  game.popups.push({ x, y, text, life: 1, maxLife: 1 });
}

function updatePlay(dt) {
  const stage = game.stage;
  const turkey = game.turkey;
  turkey.camX = game.cameraX;

  updateTurkey(turkey, input, dt, stage.width, stage.obstacles, stage.hayBales);
  if (turkey.dashed) sounds.dash();

  // Camera follows the turkey.
  const targetCam = Math.max(0, Math.min(stage.width - VIEW_W, turkey.x - VIEW_W * 0.42));
  game.cameraX += (targetCam - game.cameraX) * Math.min(1, dt * 6);

  // Distance score: only forward progress counts.
  if (turkey.x > game.maxDistanceX) {
    game.distanceM += (turkey.x - game.maxDistanceX) * 0.02;
    game.score += Math.round((turkey.x - game.maxDistanceX) * SCORE.distancePerPx);
    game.maxDistanceX = turkey.x;
  }

  // Farmers.
  for (const farmer of stage.farmers) {
    const wasChasing = farmer.state === FARMER_STATE.CHASE;
    updateFarmer(farmer, turkey, dt, stage.width, stage.obstacles);
    if (farmer.justSpotted) sounds.spotted();
    if (!wasChasing && farmer.state === FARMER_STATE.CHASE) {
      addPopup(turkey.x, turkey.y - 60, 'SPOTTED!');
    }
    // Caught on touch.
    if (
      turkey.invulnerableTimer <= 0 &&
      Math.hypot(farmer.x - turkey.x, farmer.y - turkey.y) < farmer.radius + turkey.radius - 6
    ) {
      loseLife('caught');
      return;
    }
  }

  // Corn + feathers.
  for (const corn of stage.corns) {
    if (!corn.taken && Math.hypot(corn.x - turkey.x, corn.y - turkey.y) < 34) {
      corn.taken = true;
      game.cornCollected += 1;
      game.score += SCORE.corn;
      addPopup(corn.x, corn.y - 24, `+${SCORE.corn}`);
      sounds.pickup();
      turkey.gobbleTimer = 0.5;
    }
  }
  for (const feather of stage.feathers) {
    if (!feather.taken && Math.hypot(feather.x - turkey.x, feather.y - turkey.y) < 34) {
      feather.taken = true;
      game.feathersCollected += 1;
      game.score += SCORE.feather;
      addPopup(feather.x, feather.y - 24, `+${SCORE.feather} FEATHER!`);
      sounds.feather();
    }
  }

  // Ovens burn on touch.
  if (turkey.invulnerableTimer <= 0) {
    for (const oven of stage.ovens) {
      if (circleHitsRect(turkey.x, turkey.y, turkey.radius - 4, oven)) {
        loseLife('oven');
        return;
      }
    }
    // Carving knives sweep their lanes.
    for (const knife of stage.knives) {
      updateKnifeLane(knife, stage.width, game.time);
      if (circleHitsRect(turkey.x, turkey.y, turkey.radius - 6, { x: knife.x - 48, y: knife.y - 8, w: 96, h: 16 })) {
        loseLife('knife');
        return;
      }
    }
  } else {
    for (const knife of stage.knives) updateKnifeLane(knife, stage.width, game.time);
  }

  // Exit gate: next stage, or escape!
  if (circleHitsRect(turkey.x, turkey.y, turkey.radius, stage.exit)) {
    game.score += SCORE.stageBonus;
    game.stagesCleared = game.stageIndex + 1;
    sounds.stageClear();
    if (game.stageIndex + 1 >= STAGE_COUNT) {
      endGame('escaped');
    } else {
      startStage(game.stageIndex + 1);
    }
    return;
  }

  // Popups age out.
  for (const pop of game.popups) {
    pop.life -= dt;
    pop.y -= dt * 30;
  }
  game.popups = game.popups.filter((p) => p.life > 0);

  game.elapsed += dt;
  if (turkey.gobbleTimer > 0 && Math.random() < dt * 2) sounds.gobble();
}

function handleScreenInput() {
  if (game.screen === 'title') {
    if (input.consume('confirm') || input.consumeClick()) {
      sounds.click();
      startGame();
    }
  } else if (game.screen === 'end') {
    if (input.consume('restart') || input.consumeClick() || input.consume('confirm')) {
      sounds.click();
      startGame();
    }
  } else if (game.screen === 'play') {
    if (input.consume('pause')) {
      game.screen = 'paused';
      sounds.click();
    }
    if (input.consume('mute')) {
      const muted = sounds.toggleMute();
      addPopup(game.turkey.x, game.turkey.y - 60, muted ? 'SOUND OFF' : 'SOUND ON');
    }
  } else if (game.screen === 'paused') {
    if (input.consume('pause') || input.consume('confirm') || input.consumeClick()) {
      game.screen = 'play';
      sounds.click();
    }
  }
}

function render() {
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  if (game.screen === 'title') {
    drawTitleScreen(ctx, game);
  } else if (game.screen === 'end') {
    // A quiet autumn dusk behind the end card — no world clutter.
    const grad = ctx.createLinearGradient(0, 0, 0, VIEW_H);
    grad.addColorStop(0, '#3a2a12');
    grad.addColorStop(1, '#1a1206');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    drawEndScreen(ctx, game);
  } else {
    drawWorld(ctx, game, game.time);
    drawHud(ctx, game);
    if (game.screen === 'paused') drawPausedOverlay(ctx);
  }
}

// --- Boot + main loop -------------------------------------------------------

let lastTimestamp = 0;
function frame(timestamp) {
  const dt = Math.min(0.05, (timestamp - lastTimestamp) / 1000 || 0.016);
  lastTimestamp = timestamp;
  game.time += dt;
  if (!shotMode) {
    handleScreenInput();
    if (game.screen === 'play') updatePlay(dt);
  }
  render();
  requestAnimationFrame(frame);
}

if (shotMode) {
  // Staged screenshot mode: freeze the game in a fixed state and keep
  // rendering it (the animation clock still runs for the pulsing prompts).
  startStage(0);
  applyShotState(game, shotMode);
  if (shotMode === 'play') {
    // In shot mode the farmer must not wander: the scene is frozen by
    // never advancing the simulation, only the render clock.
    game.screen = 'play';
  }
  game.time = 1.2;
} else {
  startStage(0);
  game.screen = 'title';
}

requestAnimationFrame(frame);
