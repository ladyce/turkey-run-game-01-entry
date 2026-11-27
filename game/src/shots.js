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
    // Mid-run in the KITCHEN (stage 3): the brief's core on screen at
    // once — glowing ovens, sweeping carving knives, the farmer chasing
    // with a visible cone, corn and feathers, full HUD.
    game.screen = 'play';
    game.stageIndex = 2;
    game.stage = buildStage(2, game.seed);
    game.turkey = createTurkey(1700, 430);
    game.turkey.facing = 1;
    game.turkey.walkCycle = 1.4;
    game.turkey.camX = 0;
    game.cameraX = 1040;
    game.score = 9840;
    game.distanceM = 1420;
    game.elapsed = 268;
    game.lives = 2;
    game.cornCollected = 6;
    game.feathersCollected = 1;
    game.popups = [{ x: 1760, y: 370, text: '+100', life: 0.8, maxLife: 1 }];
    const corn = game.stage.corns;
    for (let i = 0; i < 6 && i < corn.length; i++) corn[i].taken = true;
    if (game.stage.feathers[0]) game.stage.feathers[0].taken = true;
    // The farmer is right behind the turkey, chasing, cone on screen.
    const farmer = game.stage.farmers[0];
    farmer.x = 1520;
    farmer.y = 450;
    farmer.state = FARMER_STATE.CHASE;
    farmer.alert = 1;
    farmer.facingAngle = 0;
    farmer.walkCycle = 2.2;
    // Second farmer patrols in view on the right (clear of the HUD panel).
    const farmer2 = game.stage.farmers[1];
    farmer2.x = 1980;
    farmer2.y = 300;
    farmer2.facingAngle = Math.PI;
    farmer2.walkCycle = 1.1;
    for (const knife of game.stage.knives) updateKnifeLane(knife, game.stage.width, 20);
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
