// Gobble & Go! — keyboard and mouse input.
// One job: turn raw DOM events into a clean, queryable input state.

export function createInput(canvas) {
  const keys = new Set();
  const state = {
    keys,
    mouseX: 0,
    mouseY: 0,
    mouseDown: false,
    clicked: false,
    clickX: 0,
    clickY: 0,
  };

  const KEYMAP = {
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowDown: 'down',
    KeyS: 'down',
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
    ShiftLeft: 'sneak',
    ShiftRight: 'sneak',
    Space: 'dash',
    Enter: 'confirm',
    KeyR: 'restart',
    KeyP: 'pause',
    KeyM: 'mute',
  };

  function onKeyDown(e) {
    const action = KEYMAP[e.code];
    if (action) {
      keys.add(action);
      if (action === 'dash' || action === 'confirm' || action === 'restart') e.preventDefault();
    }
  }
  function onKeyUp(e) {
    const action = KEYMAP[e.code];
    if (action) keys.delete(action);
  }
  function onMouseMove(e) {
    const rect = canvas.getBoundingClientRect();
    state.mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
    state.mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;
  }
  function onMouseDown(e) {
    onMouseMove(e);
    state.mouseDown = true;
    state.clicked = true;
    state.clickX = state.mouseX;
    state.clickY = state.mouseY;
  }
  function onMouseUp() {
    state.mouseDown = false;
  }

  window.addEventListener('keydown', onKeyDown);
  window.addEventListener('keyup', onKeyUp);
  canvas.addEventListener('mousemove', onMouseMove);
  canvas.addEventListener('mousedown', onMouseDown);
  window.addEventListener('mouseup', onMouseUp);

  state.isDown = (action) => keys.has(action);
  state.consume = (action) => {
    if (keys.has(action)) {
      keys.delete(action);
      return true;
    }
    return false;
  };
  state.consumeClick = () => {
    if (state.clicked) {
      state.clicked = false;
      return { x: state.clickX, y: state.clickY };
    }
    return null;
  };
  state.clearTransient = () => {
    state.clicked = false;
  };
  return state;
}
