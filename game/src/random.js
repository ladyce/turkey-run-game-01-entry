// Gobble & Go! — tiny seeded random number generator (mulberry32).
// One job: deterministic randomness so staged screenshots reproduce exactly.

export function mulberry32(seed) {
  let a = seed >>> 0;
  return function nextRandom() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickFrom(rng, list) {
  return list[Math.floor(rng() * list.length)];
}

export function rangeRandom(rng, min, max) {
  return min + rng() * (max - min);
}
