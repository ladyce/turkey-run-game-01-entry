// Gobble & Go! — staged screenshot states (?shot=title|play|end).
// One job: put the game into a fixed, lively, deterministic state so a
// screenshot shows the game at its best without a human playing it.

import { buildStage } from './stages.js';
import { createTurkey } from './turkey.js';
import { FARMER_STATE } from './farmer.js';
import { updateKnifeLane } from './hazards.js';

export function applyShotState(game, shot) {
  if (shot === 'title') {
    game.screen = 'title';
    return;
  }

  if (shot === 'play') {
    // Mid-run on stage 1: turkey near the middle of the farmyard, the
    // farmer mid-chase with a visible cone, some corn already eaten.
    game.screen = 'play';
    game.stageIndex = 0;
    game.stage = buildStage(0, game.seed);
    game.turkey = createTurkey(1500, 420);
    game.turkey.facing = 1;
    game.turkey.walkCycle = 1.4;
    game.turkey.camX = 0;
    game.cameraX = 860;
    game.score = 2840;
    game.distanceM = 412;
    game.elapsed = 96;
    game.lives = 3;
    game.cornCollected = 6;
    game.feathersCollected = 1;
    game.popups = [{ x: 1560, y: 360, text: '+100', life: 0.8, maxLife: 1 }];
    const corn = game.stage.corns;
    for (let i = 0; i < 6 && i < corn.length; i++) corn[i].taken = true;
    if (game.stage.feathers[0]) game.stage.feathers[0].taken = true;
    // The farmer is right behind the turkey, chasing, cone on screen.
    const farmer = game.stage.farmers[0];
    farmer.x = 1330;
    farmer.y = 440;
    farmer.state = FARMER_STATE.CHASE;
    farmer.alert = 1;
    farmer.facingAngle = 0;
    farmer.walkCycle = 2.2;
    for (const knife of game.stage.knives) updateKnifeLane(knife, game.stage.width, 12);
    return;
  }

  if (shot === 'end') {
    // The escaped end screen with a full results card.
    game.screen = 'end';
    game.endReason = 'escaped';
    game.score = 12840;
    game.distanceM = 1876;
    game.elapsed = 342;
    game.cornCollected = 31;
    game.feathersCollected = 5;
    game.stagesCleared = 3;
    game.lives = 2;
    game.best = 12840;
    return;
  }

  if (shot === 'caught') {
    game.screen = 'end';
    game.endReason = 'caught';
    game.score = 3120;
    game.distanceM = 640;
    game.elapsed = 154;
    game.cornCollected = 9;
    game.feathersCollected = 1;
    game.stagesCleared = 0;
    game.lives = 0;
    game.best = 12840;
    return;
  }
}
