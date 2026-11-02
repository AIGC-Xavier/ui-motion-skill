import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createBrowserFakes, FakeElement } from './browser-fakes.mjs';

const motion = await import('../runtime/motion.mjs').catch(() => ({}));
let browser;

afterEach(() => {
  browser?.restore();
  browser = undefined;
});

test('shiftLabel changes only the explicit leaf label', async () => {
  assert.equal(typeof motion.shiftLabel, 'function', 'shiftLabel export is available');
  browser = createBrowserFakes();
  const button = new FakeElement('button');
  const label = new FakeElement('span', { text: 'Continue' });
  const icon = new FakeElement('svg');
  button.append(label, icon);

  const result = await motion.shiftLabel(label, 'Saving', { reducedMotion: true });

  assert.equal(result.status, 'finished');
  assert.equal(label.textContent, 'Saving');
  assert.equal(button.children[0], label);
  assert.equal(button.children[1], icon);
  assert.equal(label.style.color, 'inherit');
});

test('shiftLabel cancels an older change when the latest request returns to current text', async () => {
  assert.equal(typeof motion.shiftLabel, 'function', 'shiftLabel export is available');
  browser = createBrowserFakes();
  const label = new FakeElement('span', { text: 'Ready' });

  const older = motion.shiftLabel(label, 'Loading', { duration: 180 });
  const staleAnimation = label.animations[0];
  const latest = await motion.shiftLabel(label, 'Ready', { duration: 180 });

  assert.equal(staleAnimation.state, 'cancelled');
  assert.deepEqual(await older, { status: 'cancelled' });
  assert.deepEqual(latest, { status: 'finished' });
  staleAnimation.finish();
  assert.equal(label.textContent, 'Ready');
});

test('shiftLabel rejects a non-leaf target without replacing nested elements', async () => {
  assert.equal(typeof motion.shiftLabel, 'function', 'shiftLabel export is available');
  browser = createBrowserFakes();
  const wrapper = new FakeElement('span', { text: 'Go' });
  const nestedIcon = new FakeElement('svg');
  wrapper.append(nestedIcon);

  await assert.rejects(motion.shiftLabel(wrapper, 'Stop', { reducedMotion: true }), TypeError);
  assert.equal(wrapper.children.at(-1), nestedIcon);
  assert.equal(wrapper.textContent, 'Go');
});

test('animateValue derives progress from elapsed time across a long frame gap', async () => {
  assert.equal(typeof motion.animateValue, 'function', 'animateValue export is available');
  browser = createBrowserFakes();
  const values = [];
  const run = motion.animateValue(10, 90, {
    duration: 100,
    easing: progress => progress,
    onUpdate: value => values.push(value),
  });

  browser.advance(0);
  browser.advance(1000);

  assert.deepEqual(await run.finished, { status: 'finished', value: 90 });
  assert.equal(values.at(-1), 90);
  assert.equal(browser.pendingFrames, 0);
});

test('animateValue cancellation removes its scheduled frame and settles cleanly', async () => {
  assert.equal(typeof motion.animateValue, 'function', 'animateValue export is available');
  browser = createBrowserFakes();
  const values = [];
  const run = motion.animateValue(0, 1, { onUpdate: value => values.push(value) });
  run.cancel();

  assert.equal(browser.pendingFrames, 0);
  assert.deepEqual(await run.finished, { status: 'cancelled', value: 0 });
  browser.advance(1000);
  assert.deepEqual(values, []);
});

test('animateValue cancellation from onUpdate does not schedule another frame', async () => {
  assert.equal(typeof motion.animateValue, 'function', 'animateValue export is available');
  browser = createBrowserFakes();
  let run;
  let updates = 0;
  run = motion.animateValue(0, 1, { onUpdate: () => { updates++; run.cancel(); } });

  browser.advance(16);

  assert.deepEqual((await run.finished).status, 'cancelled');
  assert.equal(updates, 1);
  assert.equal(browser.pendingFrames, 0);
});

test('animateValue honors the system reduced-motion preference without scheduling work', async () => {
  assert.equal(typeof motion.animateValue, 'function', 'animateValue export is available');
  browser = createBrowserFakes({ reducedMotion: true });
  const values = [];
  const run = motion.animateValue(2, 8, { onUpdate: value => values.push(value) });

  assert.deepEqual(await run.finished, { status: 'finished', value: 8 });
  assert.deepEqual(values, [8]);
  assert.equal(browser.pendingFrames, 0);
});

test('animateValue rejects endpoints that are not finite numbers', () => {
  assert.equal(typeof motion.animateValue, 'function', 'animateValue export is available');

  for (const [from, to] of [[NaN, 1], [0, Infinity], [-Infinity, 1]]) {
    assert.throws(() => motion.animateValue(from, to), TypeError);
  }
});

test('setPresence reopening cancels a stale close and its exit callback', async () => {
  assert.equal(typeof motion.setPresence, 'function', 'setPresence export is available');
  browser = createBrowserFakes();
  const element = new FakeElement('section');
  let exits = 0;

  const closing = motion.setPresence(element, false, { onAfterExit: () => exits++ });
  const closeAnimation = element.animations[0];
  const opening = motion.setPresence(element, true);
  const openAnimation = element.animations[1];
  closeAnimation.finish();
  openAnimation.finish();

  assert.deepEqual(await closing, { status: 'cancelled' });
  assert.deepEqual(await opening, { status: 'finished' });
  assert.equal(element.hidden, false);
  assert.equal(exits, 0);
});

test('setPresence runs the exit callback only after the current close finishes', async () => {
  assert.equal(typeof motion.setPresence, 'function', 'setPresence export is available');
  browser = createBrowserFakes();
  const element = new FakeElement('section');
  let exits = 0;

  const closing = motion.setPresence(element, false, { onAfterExit: () => exits++ });
  assert.equal(element.hidden, false);
  assert.equal(exits, 0);
  element.animations[0].finish();

  assert.deepEqual(await closing, { status: 'finished' });
  assert.equal(element.hidden, true);
  assert.equal(exits, 1);
});

test('setPresence defaults to immediate visibility changes for reduced motion', async () => {
  assert.equal(typeof motion.setPresence, 'function', 'setPresence export is available');
  browser = createBrowserFakes({ reducedMotion: true });
  const element = new FakeElement('section');

  const result = await motion.setPresence(element, false);

  assert.deepEqual(result, { status: 'finished' });
  assert.equal(element.hidden, true);
  assert.equal(element.animations.length, 0);
});

test('animateLayout waits for async mutation before measuring and animates retained nodes', async () => {
  assert.equal(typeof motion.animateLayout, 'function', 'animateLayout export is available');
  browser = createBrowserFakes();
  const container = new FakeElement('main');
  const retained = new FakeElement('article', { rect: { left: 10, top: 20 } });
  const removed = new FakeElement('article', { rect: { left: 40, top: 20 } });
  container.append(retained, removed);
  let releaseMutation;
  const gate = new Promise(resolve => { releaseMutation = resolve; });

  const run = motion.animateLayout(container, async () => {
    await gate;
    retained.rect.left = 50;
    container.remove(removed);
  });

  await Promise.resolve();
  assert.equal(retained.animations.length, 0);
  releaseMutation();
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(retained.animations.length, 1);
  assert.deepEqual(retained.animations[0].keyframes, [
    { transform: 'translate(-40px, 0px)' },
    { transform: 'translate(0px, 0px)' },
  ]);
  assert.equal(removed.animations.length, 0);
  retained.animations[0].finish();
  assert.deepEqual(await run, { status: 'finished' });
});

test('animateLayout animates direct layout items without applying duplicate offsets to descendants', async () => {
  assert.equal(typeof motion.animateLayout, 'function', 'animateLayout export is available');
  browser = createBrowserFakes();
  const list = new FakeElement('ul');
  const item = new FakeElement('li', { rect: { left: 10, top: 20 } });
  const nested = new FakeElement('span', { rect: { left: 12, top: 22 } });
  item.append(nested);
  list.append(item);

  const run = motion.animateLayout(list, () => {
    item.rect.left = 50;
    nested.rect.left = 52;
  });
  await Promise.resolve();
  await Promise.resolve();

  assert.equal(item.animations.length, 1);
  assert.equal(nested.animations.length, 0);
  item.animations[0].finish();
  assert.deepEqual(await run, { status: 'finished' });
});

test('animateLayout rejects overlapping runs on the same container without cancelling the first', async () => {
  assert.equal(typeof motion.animateLayout, 'function', 'animateLayout export is available');
  browser = createBrowserFakes();
  const container = new FakeElement('main');
  const child = new FakeElement('article', { rect: { left: 10 } });
  container.append(child);
  let releaseFirst;
  const gate = new Promise(resolve => { releaseFirst = resolve; });
  const first = motion.animateLayout(container, async () => {
    await gate;
    child.rect.left = 30;
  });
  const second = motion.animateLayout(container, () => { child.rect.left = 80; });
  const secondRejected = assert.rejects(second, /already running/);

  releaseFirst();
  await Promise.resolve();
  await Promise.resolve();
  for (const animation of child.animations) animation.finish();

  assert.deepEqual(await first, { status: 'finished' });
  await secondRejected;
  assert.equal(child.rect.left, 30);
  assert.equal(child.animations.length, 1);
});

test('all APIs honor the system reduced-motion preference by default', async () => {
  assert.equal(typeof motion.shiftLabel, 'function', 'shiftLabel export is available');
  assert.equal(typeof motion.animateValue, 'function', 'animateValue export is available');
  assert.equal(typeof motion.setPresence, 'function', 'setPresence export is available');
  assert.equal(typeof motion.animateLayout, 'function', 'animateLayout export is available');
  browser = createBrowserFakes({ reducedMotion: true });

  const label = new FakeElement('span', { text: 'One' });
  const valueUpdates = [];
  const presence = new FakeElement('aside');
  const container = new FakeElement('main');
  const child = new FakeElement('div');
  container.append(child);

  const labelResult = await motion.shiftLabel(label, 'Two');
  const valueRun = motion.animateValue(1, 3, { onUpdate: value => valueUpdates.push(value) });
  const presenceResult = await motion.setPresence(presence, false);
  const layoutResult = await motion.animateLayout(container, () => { child.rect.left = 4; });

  assert.deepEqual(labelResult, { status: 'finished' });
  assert.deepEqual(await valueRun.finished, { status: 'finished', value: 3 });
  assert.deepEqual(presenceResult, { status: 'finished' });
  assert.deepEqual(layoutResult, { status: 'finished' });
  assert.equal(label.textContent, 'Two');
  assert.deepEqual(valueUpdates, [3]);
  assert.equal(presence.hidden, true);
  assert.equal(child.animations.length, 0);
});
