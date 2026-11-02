const labelRuns = new WeakMap();
const presenceRuns = new WeakMap();
const activeLayouts = new WeakSet();

const finished = () => ({ status: 'finished' });
const cancelled = () => ({ status: 'cancelled' });

function durationValue(value, fallback) {
  const duration = Number(value);
  return Number.isFinite(duration) ? Math.max(0, duration) : fallback;
}

function prefersReducedMotion(option) {
  if (typeof option === 'boolean') return option;
  try {
    const query = '(prefers-reduced-motion: reduce)';
    const media = globalThis.matchMedia?.(query) ?? globalThis.window?.matchMedia?.(query);
    return Boolean(media?.matches);
  } catch {
    return false;
  }
}

function play(element, frames, duration, easing = 'ease-out') {
  if (duration <= 0 || typeof element?.animate !== 'function') return null;
  return element.animate(frames, { duration, easing });
}

function settleAnimation(animation) {
  return animation ? Promise.resolve(animation.finished).then(() => true, () => false) : Promise.resolve(true);
}

function assertLeafLabel(label) {
  if (label?.nodeType !== 1 || (Number(label.childElementCount) || 0) > 0) {
    throw new TypeError('shiftLabel requires an element with no child elements');
  }
}

export async function shiftLabel(label, nextText, options = {}) {
  assertLeafLabel(label);
  const duration = durationValue(options?.duration ?? 180, 180);
  const reduced = prefersReducedMotion(options?.reducedMotion);
  const text = String(nextText);
  labelRuns.get(label)?.cancel();

  let resolve;
  let reject;
  let animation = null;
  let settled = false;
  const completion = new Promise((res, rej) => { resolve = res; reject = rej; });
  const record = {
    cancel() {
      if (settled) return;
      try { animation?.cancel(); } catch { /* already ended */ }
      settle(cancelled());
    },
  };
  const settle = outcome => {
    if (settled) return;
    settled = true;
    if (labelRuns.get(label) === record) labelRuns.delete(label);
    resolve(outcome);
  };
  const fail = error => {
    if (settled) return;
    settled = true;
    if (labelRuns.get(label) === record) labelRuns.delete(label);
    reject(error);
  };

  labelRuns.set(label, record);
  if (reduced || duration === 0 || label.textContent === text) {
    label.textContent = text;
    settle(finished());
    return completion;
  }

  const phaseDuration = duration / 2;
  void (async () => {
    animation = play(label, [
      { opacity: 1, transform: 'translateY(0px)' },
      { opacity: 0, transform: 'translateY(-3px)' },
    ], phaseDuration);
    if (!await settleAnimation(animation)) {
      settle(cancelled());
      return;
    }
    if (settled || labelRuns.get(label) !== record) return;

    label.textContent = text;
    animation = play(label, [
      { opacity: 0, transform: 'translateY(3px)' },
      { opacity: 1, transform: 'translateY(0px)' },
    ], phaseDuration);
    if (!await settleAnimation(animation)) {
      settle(cancelled());
      return;
    }
    if (!settled && labelRuns.get(label) === record) settle(finished());
  })().catch(fail);

  return completion;
}

function clockNow() {
  return globalThis.performance?.now?.() ?? Date.now();
}

function requestFrame(callback) {
  if (typeof globalThis.requestAnimationFrame === 'function') {
    return { kind: 'frame', id: globalThis.requestAnimationFrame(callback) };
  }
  return { kind: 'timer', id: globalThis.setTimeout(() => callback(clockNow()), 16) };
}

function cancelFrame(frame) {
  if (!frame) return;
  if (frame.kind === 'frame') globalThis.cancelAnimationFrame?.(frame.id);
  else globalThis.clearTimeout(frame.id);
}

export function animateValue(from, to, options = {}) {
  if (!Number.isFinite(from) || !Number.isFinite(to)) {
    throw new TypeError('animateValue endpoints must be finite numbers');
  }
  const duration = durationValue(options?.duration ?? 320, 320);
  const onUpdate = typeof options?.onUpdate === 'function' ? options.onUpdate : () => {};
  const easing = typeof options?.easing === 'function'
    ? options.easing
    : progress => 1 - (1 - progress) ** 3;
  let value = from;
  let frame = null;
  let settled = false;
  let resolve;
  let reject;
  const finished = new Promise((res, rej) => { resolve = res; reject = rej; });
  const settle = (status, finalValue = value) => {
    if (settled) return;
    settled = true;
    cancelFrame(frame);
    frame = null;
    resolve({ status, value: finalValue });
  };
  const fail = error => {
    if (settled) return;
    settled = true;
    cancelFrame(frame);
    frame = null;
    reject(error);
  };
  const update = next => {
    value = next;
    onUpdate(next);
  };
  const cancel = () => settle('cancelled');

  if (prefersReducedMotion(options?.reducedMotion) || duration === 0 || from === to) {
    try {
      update(to);
      settle('finished', to);
    } catch (error) {
      fail(error);
    }
    return { cancel, finished };
  }

  const startTime = clockNow();
  const tick = timestamp => {
    frame = null;
    if (settled) return;
    const elapsed = Math.max(0, (Number.isFinite(timestamp) ? timestamp : clockNow()) - startTime);
    const progress = Math.min(1, elapsed / duration);
    try {
      update(progress === 1 ? to : from + (to - from) * easing(progress));
    } catch (error) {
      fail(error);
      return;
    }
    if (settled) return;
    if (progress === 1) settle('finished', to);
    else frame = requestFrame(tick);
  };
  frame = requestFrame(tick);
  return { cancel, finished };
}

export async function setPresence(element, visible, options = {}) {
  if (element?.nodeType !== 1) throw new TypeError('setPresence requires an element');
  const duration = durationValue(options?.duration ?? 180, 180);
  const shouldShow = Boolean(visible);
  presenceRuns.get(element)?.cancel();

  let animation = null;
  let settled = false;
  let resolve;
  let reject;
  const completion = new Promise((res, rej) => { resolve = res; reject = rej; });
  const record = {
    cancel() {
      if (settled) return;
      try { animation?.cancel(); } catch { /* already ended */ }
      finish(cancelled());
    },
  };
  const finish = outcome => {
    if (settled) return;
    settled = true;
    if (presenceRuns.get(element) === record) presenceRuns.delete(element);
    resolve(outcome);
  };
  const fail = error => {
    if (settled) return;
    settled = true;
    if (presenceRuns.get(element) === record) presenceRuns.delete(element);
    reject(error);
  };
  const complete = () => {
    if (!shouldShow) {
      element.hidden = true;
      try { options?.onAfterExit?.(); } catch (error) { fail(error); return; }
    }
    finish(finished());
  };

  presenceRuns.set(element, record);
  if (shouldShow) element.hidden = false;
  if (prefersReducedMotion(options?.reducedMotion) || duration === 0 || typeof element.animate !== 'function') {
    if (shouldShow) element.hidden = false;
    complete();
    return completion;
  }

  const keyframes = shouldShow
    ? [{ opacity: 0, transform: 'translateY(4px)' }, { opacity: 1, transform: 'translateY(0px)' }]
    : [{ opacity: 1, transform: 'translateY(0px)' }, { opacity: 0, transform: 'translateY(-4px)' }];
  try {
    animation = play(element, keyframes, duration);
  } catch (error) {
    fail(error);
    return completion;
  }
  void settleAnimation(animation).then(didFinish => {
    if (settled || presenceRuns.get(element) !== record) return;
    if (didFinish) complete();
    else finish(cancelled());
  }).catch(fail);
  return completion;
}

export async function animateLayout(container, mutate, options = {}) {
  if (container?.nodeType !== 1 || typeof mutate !== 'function') {
    throw new TypeError('animateLayout requires a container element and mutation function');
  }
  // Mutations cannot be cancelled safely, so reject overlapping runs on one container.
  if (activeLayouts.has(container)) throw new Error('animateLayout is already running for this container');
  activeLayouts.add(container);
  try {
    const duration = durationValue(options?.duration ?? 220, 220);
    const reduced = prefersReducedMotion(options?.reducedMotion);
    const before = new Map();
    const layoutItems = () => Array.from(container.children ?? []).filter(node => node?.nodeType === 1);
    for (const node of layoutItems()) before.set(node, node.getBoundingClientRect());

    await mutate();

    const retained = new Set(layoutItems());
    const animations = [];
    // Removed nodes are absent after mutation, so this only animates retained items; it does not provide exit animation.
    for (const [node, oldRect] of before) {
      if (!retained.has(node)) continue;
      const newRect = node.getBoundingClientRect();
      const x = oldRect.left - newRect.left;
      const y = oldRect.top - newRect.top;
      if (reduced || duration === 0 || (!x && !y) || typeof node.animate !== 'function') continue;
      const animation = play(node, [
        { transform: `translate(${x}px, ${y}px)` },
        { transform: 'translate(0px, 0px)' },
      ], duration);
      if (animation) animations.push(settleAnimation(animation));
    }

    await Promise.all(animations);
    return finished();
  } finally {
    activeLayouts.delete(container);
  }
}
