// Gobble & Go! — stage layouts: farmyard, barn, kitchen.
// One job: turn a stage definition into a playable world (obstacles,
// pickups, farmers, hazards, exit gate), deterministically seeded.

import { STAGE_DEFS, WORLD_H } from './config.js';
import { mulberry32, rangeRandom } from './random.js';
import { createCorn, createFeather, createHayBale, createOven, createKnifeLane, createExitGate } from './hazards.js';
import { createFarmer } from './farmer.js';

function makeFenceRun(x, y, count) {
  const fences = [];
  for (let i = 0; i < count; i++) {
    fences.push({ kind: 'fence', x: x + i * 46, y, w: 44, h: 16, solid: true });
  }
  return fences;
}

function scatter(rng, count, width, minX, maxX, minY, maxY, minGap, placed) {
  const out = [];
  let tries = 0;
  while (out.length < count && tries < count * 120) {
    tries++;
    const x = rangeRandom(rng, minX, maxX);
    const y = rangeRandom(rng, minY, maxY);
    const ok = placed.every((p) => Math.hypot(p.x - x, p.y - y) > minGap);
    if (ok) {
      out.push({ x, y });
      placed.push({ x, y });
    }
  }
  return out;
}

export function buildStage(stageIndex, seed) {
  const def = STAGE_DEFS[stageIndex];
  const rng = mulberry32(seed + stageIndex * 7919);
  const width = def.width;
  const placed = [{ x: 120, y: 400 }]; // keep the spawn clear
  const obstacles = [];
  const corns = [];
  const feathers = [];
  const hayBales = [];
  const ovens = [];
  const knives = [];
  const farmers = [];

  // --- Ground dressing per stage.
  if (def.ground === 'farm') {
    // Fence runs along the top and bottom edges of the field.
    obstacles.push(...makeFenceRun(300, 108, 10));
    obstacles.push(...makeFenceRun(1800, 108, 8));
    obstacles.push(...makeFenceRun(900, WORLD_H - 40, 12));
    obstacles.push(...makeFenceRun(2400, WORLD_H - 40, 10));
    // Pumpkin patches (solid, round-ish blocks).
    for (const p of scatter(rng, 5, width, 500, width - 600, 180, 620, 260, placed)) {
      obstacles.push({ kind: 'pumpkin', x: p.x - 26, y: p.y - 20, w: 52, h: 40, solid: true });
    }
  } else if (def.ground === 'barn') {
    // Crates and feed sacks.
    for (const p of scatter(rng, 8, width, 500, width - 600, 180, 620, 240, placed)) {
      obstacles.push({ kind: 'crate', x: p.x - 28, y: p.y - 28, w: 56, h: 56, solid: true });
    }
    // Barn support posts.
    for (let x = 700; x < width - 400; x += 620) {
      obstacles.push({ kind: 'post', x, y: 130, w: 26, h: 120, solid: true });
      obstacles.push({ kind: 'post', x: x + 300, y: WORLD_H - 150, w: 26, h: 120, solid: true });
    }
  } else {
    // Kitchen: counters along the top, tables in the middle.
    for (let x = 420; x < width - 500; x += 540) {
      obstacles.push({ kind: 'counter', x, y: 118, w: 220, h: 54, solid: true });
    }
    for (const p of scatter(rng, 5, width, 600, width - 700, 300, 560, 320, placed)) {
      obstacles.push({ kind: 'table', x: p.x - 70, y: p.y - 34, w: 140, h: 68, solid: true });
    }
    // Ovens glow along the back wall.
    const ovenXs = [900, 1900, 2900].filter((x) => x < width - 400);
    for (const ox of ovenXs.slice(0, def.ovens)) {
      const oven = createOven(ox, 120);
      oven.heatPhase = rng() * Math.PI * 2;
      ovens.push(oven);
    }
  }

  // --- Hay bales: the turkey's hiding spots.
  for (const p of scatter(rng, def.hayBales, width, 450, width - 500, 200, 600, 240, placed)) {
    hayBales.push(createHayBale(p.x - 46, p.y - 32));
  }

  // --- Pickups (phases seeded so staged screenshots reproduce exactly).
  for (const p of scatter(rng, def.corn, width, 400, width - 350, 170, 640, 170, placed)) {
    const corn = createCorn(p.x, p.y);
    corn.bobPhase = rng() * Math.PI * 2;
    corns.push(corn);
  }
  // Feathers use their own spacing set (spawn + hay bales only): sharing
  // the corn spacing set makes the region mathematically saturated.
  const featherPlaced = [{ x: 120, y: 400 }, ...hayBales.map((h) => ({ x: h.x + 46, y: h.y + 32 }))];
  for (const p of scatter(rng, def.feathers, width, 700, width - 500, 180, 620, 120, featherPlaced)) {
    const feather = createFeather(p.x, p.y);
    feather.bobPhase = rng() * Math.PI * 2;
    feathers.push(feather);
  }

  // --- Carving knives sweep across lanes.
  const lanes = [240, 380, 520, 620];
  for (let i = 0; i < def.knives; i++) {
    knives.push(createKnifeLane(lanes[i % lanes.length], 0.22 + i * 0.05, i * 0.7));
  }

  // --- Farmers with patrol routes.
  for (let i = 0; i < def.farmerCount; i++) {
    const baseX = 900 + i * 1400;
    const waypoints = [
      { x: baseX, y: 260 },
      { x: baseX + 420, y: 480 },
      { x: baseX + 800, y: 260 },
      { x: baseX + 420, y: 560 },
    ].map((w) => ({ x: Math.min(w.x, width - 300), y: w.y }));
    farmers.push(createFarmer(baseX, 300, waypoints, 1 + stageIndex * 0.12 + i * 0.08));
  }

  // --- Exit gate at the far right.
  const exit = createExitGate(width - 130, 260);

  return {
    index: stageIndex,
    def,
    width,
    obstacles,
    corns,
    feathers,
    hayBales,
    ovens,
    knives,
    farmers,
    exit,
    spawn: { x: 120, y: 400 },
  };
}
