// Gobble & Go! — shared constants, palette and stage definitions.
// One job: every number the rest of the game agrees on lives here.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const WORLD_H = 720;

export const PALETTE = {
  sky: '#f7e8c9',
  grass: '#7fae4e',
  grassDark: '#6b9a3e',
  dirt: '#c98f4e',
  dirtDark: '#b57a3c',
  fence: '#8a5a2b',
  hay: '#e8c25a',
  hayDark: '#c9a13a',
  barnWood: '#7d4a26',
  barnRed: '#a03d2d',
  kitchenFloor: '#e8ddc8',
  kitchenTile: '#d8cbb0',
  oven: '#3d3d4a',
  ovenGlow: '#ff7a2a',
  knife: '#dfe6ee',
  knifeHandle: '#5a2d1a',
  turkeyBody: '#8a5a2b',
  turkeyDark: '#6b4420',
  turkeyTail: '#c96a2e',
  turkeyHead: '#d98a4a',
  wattle: '#d43d2a',
  farmerShirt: '#4a7ab8',
  farmerOveralls: '#2e4a6b',
  farmerSkin: '#e8b88a',
  farmerHat: '#e8c25a',
  hudBg: 'rgba(24, 16, 8, 0.88)',
  hudGold: '#ffc845',
  hudCream: '#fff3d6',
  danger: '#ff4a3d',
  ok: '#7ed957',
};

export const PLAYER = {
  radius: 22,
  walkSpeed: 260,
  sneakSpeed: 140,
  dashSpeed: 720,
  dashTime: 0.18,
  dashCooldown: 1.1,
  lives: 3,
};

export const FARMER = {
  radius: 24,
  patrolSpeed: 120,
  chaseSpeed: 285,
  searchSpeed: 170,
  visionRange: 270,
  visionHalfAngle: 0.62, // radians (~35 deg)
  catchRadius: 30,
  loseSightTime: 3.0,
  searchTime: 4.0,
};

export const SCORE = {
  corn: 100,
  feather: 500,
  stageBonus: 1000,
  distancePerPx: 0.05,
};

export const STAGE_DEFS = [
  {
    name: 'STAGE 1 — THE FARMYARD',
    sub: 'Dawn. The farmer is coming for Thanksgiving dinner. RUN, Tom!',
    width: 3400,
    ground: 'farm',
    farmerCount: 1,
    corn: 14,
    feathers: 2,
    hayBales: 7,
    knives: 0,
    ovens: 0,
  },
  {
    name: 'STAGE 2 — THE BARN',
    sub: 'Dark, dusty, full of pitchforks. The farmer knows every corner.',
    width: 3600,
    ground: 'barn',
    farmerCount: 1,
    corn: 12,
    feathers: 2,
    hayBales: 6,
    knives: 2,
    ovens: 0,
  },
  {
    name: 'STAGE 3 — THE KITCHEN',
    sub: 'The oven is preheating. The carving knife is out. This is it.',
    width: 3800,
    ground: 'kitchen',
    farmerCount: 2,
    corn: 10,
    feathers: 3,
    hayBales: 4,
    knives: 4,
    ovens: 3,
  },
];

export const STAGE_COUNT = STAGE_DEFS.length;
