# Gobble & Go! — The Great Thanksgiving Escape

A complete, original turkey escape game for make.fun's
`turkey-run-game-01` bounty. Tom the turkey is on the menu tonight:
outrun the farmer, dodge the carving knives, survive the preheating
oven, and slip out the back gate — across three stages, from the
farmyard to the barn to the kitchen.

## Play

Open `game/index.html` in a desktop browser (or serve `game/` with any
static server — no build step, no network requests, everything is a
file under `game/`).

- **WASD / Arrow keys** — move
- **SHIFT** — sneak (slower, harder to spot)
- **SPACE / mouse click** — dash toward the cursor
- **P** — pause · **M** — mute

The farmer patrols with a visible vision cone. Step into it and his
alert meter fills — get caught in the open and he chases. Break line
of sight by hiding in a hay bale and he searches, then gives up.
Corn is +100, golden feathers +500, clearing a stage is +1000. You
have 3 lives; ovens and carving knives cost one too.

## Structure

- `main.ts` — the hand-in program: copies `game/` + `screenshots/` to
  `/output` and writes `dossier.json` with the vendored library.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.
- `game/index.html` — the page; `game/src/main.js` is the entry module.
- `game/src/config.js` — constants, palette, stage definitions.
- `game/src/random.js` — seeded RNG (deterministic staged screenshots).
- `game/src/input.js` — keyboard + mouse state.
- `game/src/audio.js` — synthesized WebAudio sound effects, no files.
- `game/src/turkey.js` — the player: movement, dash, sneak, drawing.
- `game/src/farmer.js` — farmer AI (patrol / chase / search) + vision cone.
- `game/src/hazards.js` — corn, feathers, hay bales, ovens, knives, exit gate.
- `game/src/stages.js` — farmyard / barn / kitchen layouts.
- `game/src/render.js` — world, HUD, title and end screens.
- `game/src/shots.js` — staged screenshot states (`?shot=title|play|end`).
- `screenshots/` — real renders of the game's own code in a browser.

## Screenshots

Taken with headless Chromium (Playwright) at 1280×720:

1. `1-title.png` — title screen (cover)
2. `2-play.png` — a run in play, farmer chasing, HUD visible
3. `3-end.png` — the ESCAPED end screen with results + restart

## License

MIT — see `LICENSE`.
