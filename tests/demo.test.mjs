import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';
import { createBrowserFakes, FakeElement } from './browser-fakes.mjs';

let environment;
let importNumber = 0;

function installGlobal(name, value) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, name);
  Object.defineProperty(globalThis, name, { configurable: true, writable: true, value });
  return () => {
    if (descriptor) Object.defineProperty(globalThis, name, descriptor);
    else delete globalThis[name];
  };
}

class DemoElement extends FakeElement {
  constructor(document, tagName = 'div', options = {}) {
    super(tagName, options);
    this.ownerDocument = document;
    this.disabled = false;
    this.inert = false;
    this.value = '';
    this.listeners = new Map();
  }

  get firstElementChild() {
    return this.children.find(child => child.nodeType === 1) ?? null;
  }

  get lastElementChild() {
    return [...this.children].reverse().find(child => child.nodeType === 1) ?? null;
  }

  addEventListener(type, listener) {
    const listeners = this.listeners.get(type) ?? [];
    listeners.push(listener);
    this.listeners.set(type, listeners);
  }

  fire(type, event = {}) {
    if (type === 'click' && this.disabled) return [];
    const dispatched = {
      ...event,
      target: event.target ?? this,
      defaultPrevented: false,
      preventDefault() { this.defaultPrevented = true; },
    };
    return (this.listeners.get(type) ?? []).map(listener => listener(dispatched));
  }

  focus() {
    this.ownerDocument.activeElement = this;
  }

  prepend(node) {
    if (node.parentElement) node.parentElement.remove(node);
    node.parentElement = this;
    this.children.unshift(node);
  }

  querySelectorAll(selector) {
    if (selector === 'button:not(:disabled),input:not(:disabled)') {
      return [this.ownerDocument.getElementById('preview-name'),
        this.ownerDocument.getElementById('close-panel'),
        this.ownerDocument.getElementById('reverse-panel')];
    }
    return super.querySelectorAll(selector);
  }
}

function createTimerQueue(restoreGlobal) {
  let now = 0;
  let nextId = 1;
  const timers = new Map();
  restoreGlobal.push(installGlobal('setTimeout', (callback, delay = 0) => {
    const id = nextId++;
    timers.set(id, { due: now + Math.max(0, Number(delay) || 0), callback });
    return id;
  }));
  restoreGlobal.push(installGlobal('clearTimeout', id => timers.delete(id)));

  return {
    advance(milliseconds) {
      now += milliseconds;
      while (true) {
        const due = [...timers.entries()]
          .filter(([, timer]) => timer.due <= now)
          .sort((left, right) => left[1].due - right[1].due || left[0] - right[0])[0];
        if (!due) return;
        timers.delete(due[0]);
        due[1].callback();
      }
    },
  };
}

async function loadDemo({ reducedMotion = true } = {}) {
  const restoreGlobal = [];
  const document = {
    activeElement: null,
    elements: new Map(),
    getElementById(id) { return this.elements.get(id); },
    querySelector(selector) {
      if (selector === 'header' || selector === 'footer') return this.elements.get(selector);
      return null;
    },
  };
  const make = (id, tag = 'div', options = {}) => {
    const element = new DemoElement(document, tag, options);
    document.elements.set(id, element);
    return element;
  };

  const ids = [
    'motion-preference', 'state-button', 'state-label', 'state-status', 'cancel-state', 'rapid-state',
    'detail-panel', 'workbench', 'header', 'footer', 'preview-name', 'open-panel', 'close-panel',
    'reverse-panel', 'panel-status', 'run-value', 'value-output', 'value-bar', 'value-status',
    'stop-value', 'reorder-list', 'list-status', 'motion-list',
  ];
  for (const id of ids) make(id, id === 'preview-name' ? 'input' : 'button');
  document.elements.get('state-label').textContent = '开始演示';
  document.elements.get('detail-panel').hidden = true;
  document.elements.get('value-output').value = '0';
  document.elements.get('value-bar').style.width = '0%';

  const list = document.elements.get('motion-list');
  for (const label of ['表单反馈', '导航切换', '列表排序']) {
    const item = new DemoElement(document, 'li');
    const text = new DemoElement(document, 'span', { text: label });
    item.append(text);
    item.getBoundingClientRect = () => {
      const index = list.children.indexOf(item);
      return { left: index * 10, top: 0, width: 10, height: 10, right: index * 10 + 10, bottom: 10 };
    };
    list.append(item);
  }
  document.activeElement = document.getElementById('open-panel');

  restoreGlobal.push(installGlobal('document', document));
  const browser = createBrowserFakes({ reducedMotion });
  const timers = createTimerQueue(restoreGlobal);
  const moduleUrl = new URL(`../demo/demo.mjs?demo-test=${++importNumber}`, import.meta.url);
  await import(moduleUrl.href);

  environment = {
    browser,
    document,
    timers,
    restore() {
      for (const restore of restoreGlobal.reverse()) restore();
      browser.restore();
    },
  };
  return { document, ui: document.elements };
}

async function flushMicrotasks() {
  for (let i = 0; i < 8; i++) await Promise.resolve();
}

afterEach(() => {
  environment?.restore();
  environment = undefined;
});

test('an older rapid-state timer cannot replace a newer state operation', async () => {
  const { ui } = await loadDemo();

  ui.get('rapid-state').fire('click');
  ui.get('state-button').fire('click');
  await flushMicrotasks();
  environment.timers.advance(45);
  await flushMicrotasks();

  assert.equal(ui.get('state-label').textContent, '处理中');
  assert.equal(ui.get('state-status').textContent, '正在演示异步处理');
});

test('a cancelled state reset cannot overwrite a newer operation status', async () => {
  const { ui } = await loadDemo();

  ui.get('cancel-state').fire('click');
  ui.get('state-button').fire('click');
  await flushMicrotasks();

  assert.equal(ui.get('state-label').textContent, '处理中');
  assert.equal(ui.get('state-status').textContent, '正在演示异步处理');
});

test('Escape during a delayed reverse leaves the detail panel closed', async () => {
  const { ui } = await loadDemo();

  await ui.get('open-panel').fire('click')[0];
  const reverse = ui.get('reverse-panel').fire('click')[0];
  ui.get('detail-panel').fire('keydown', { key: 'Escape' });
  environment.timers.advance(40);
  await flushMicrotasks();
  await reverse;

  assert.equal(ui.get('detail-panel').hidden, true);
  assert.notEqual(ui.get('panel-status').textContent, '反转完成：面板应保持打开');
  assert.equal(environment.document.activeElement, ui.get('open-panel'));
});

test('Escape during reversed reopening still returns focus to the original opener', async () => {
  const { ui } = await loadDemo({ reducedMotion: false });
  const panel = ui.get('detail-panel');

  const opening = ui.get('open-panel').fire('click')[0];
  panel.animations[0].finish();
  await opening;

  const reverse = ui.get('reverse-panel').fire('click')[0];
  environment.timers.advance(40);
  await flushMicrotasks();
  ui.get('detail-panel').fire('keydown', { key: 'Escape' });
  panel.animations.at(-1).finish();
  await flushMicrotasks();
  await reverse;

  assert.equal(panel.hidden, true);
  assert.equal(environment.document.activeElement, ui.get('open-panel'));
});

test('reordering stays disabled while layout animation is pending and reenables after completion', async () => {
  const { ui } = await loadDemo({ reducedMotion: false });
  const list = ui.get('motion-list');

  const firstRun = ui.get('reorder-list').fire('click')[0];
  assert.equal(ui.get('reorder-list').disabled, true);
  assert.deepEqual(ui.get('reorder-list').fire('click'), []);
  assert.equal(list.firstElementChild.firstElementChild.textContent, '列表排序');

  environment.browser.advance(16);
  await flushMicrotasks();
  assert.equal(ui.get('reorder-list').disabled, true);
  for (const item of list.children) item.animations[0].finish();
  await firstRun;

  assert.equal(ui.get('reorder-list').disabled, false);
  assert.equal(ui.get('list-status').textContent, '当前首项：列表排序');
  assert.equal(list.lastElementChild.firstElementChild.textContent, '导航切换');
});

test('reordering reenables its control and reports a recoverable status after animation errors', async () => {
  const { ui } = await loadDemo({ reducedMotion: false });
  const list = ui.get('motion-list');
  list.children[0].animate = () => { throw new Error('native animation unavailable'); };

  const run = ui.get('reorder-list').fire('click')[0];
  assert.equal(ui.get('reorder-list').disabled, true);
  environment.browser.advance(16);
  await flushMicrotasks();
  await run;

  assert.equal(ui.get('reorder-list').disabled, false);
  assert.equal(ui.get('list-status').textContent, '排序失败，可重试');
});
