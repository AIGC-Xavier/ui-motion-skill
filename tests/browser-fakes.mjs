export function createBrowserFakes({ reducedMotion = false } = {}) {
  let time = 0;
  let nextFrameId = 1;
  const frames = new Map();
  const animations = [];
  const original = new Map();

  function installValue(name, value) {
    original.set(name, Object.getOwnPropertyDescriptor(globalThis, name));
    Object.defineProperty(globalThis, name, {
      configurable: true,
      writable: true,
      value,
    });
  }

  installValue('performance', { now: () => time });
  installValue('requestAnimationFrame', callback => {
    const id = nextFrameId++;
    frames.set(id, callback);
    return id;
  });
  installValue('cancelAnimationFrame', id => frames.delete(id));
  installValue('matchMedia', query => ({
    matches: query === '(prefers-reduced-motion: reduce)' && reducedMotion,
    media: query,
    addEventListener() {},
    removeEventListener() {},
  }));

  return {
    animations,
    get pendingFrames() {
      return frames.size;
    },
    advance(milliseconds) {
      time += milliseconds;
      const queued = [...frames.entries()];
      frames.clear();
      for (const [, callback] of queued) callback(time);
    },
    restore() {
      for (const [name, descriptor] of original) {
        if (descriptor) Object.defineProperty(globalThis, name, descriptor);
        else delete globalThis[name];
      }
    },
  };
}

export class FakeAnimation {
  constructor(keyframes, options) {
    this.keyframes = keyframes;
    this.options = options;
    this.state = 'running';
    this.finished = new Promise((resolve, reject) => {
      this.resolve = resolve;
      this.reject = reject;
    });
  }

  finish() {
    if (this.state !== 'running') return;
    this.state = 'finished';
    this.resolve(this);
  }

  cancel() {
    if (this.state !== 'running') return;
    this.state = 'cancelled';
    const error = new Error('Animation cancelled');
    error.name = 'AbortError';
    this.reject(error);
  }
}

export class FakeText {
  constructor(value) {
    this.nodeType = 3;
    this.nodeValue = String(value);
    this.parentElement = null;
  }

  get textContent() {
    return this.nodeValue;
  }

  set textContent(value) {
    this.nodeValue = String(value);
  }
}

export class FakeElement {
  constructor(tagName = 'div', { text = '', rect = {} } = {}) {
    this.tagName = tagName.toUpperCase();
    this.nodeType = 1;
    this.children = [];
    this.parentElement = null;
    this.hidden = false;
    this.style = { color: 'inherit' };
    this.rect = { left: 0, top: 0, width: 10, height: 10, ...rect };
    this.animations = [];
    this._textContent = '';
    if (text !== '') {
      const textNode = new FakeText(text);
      textNode.parentElement = this;
      this.children.push(textNode);
    }
  }

  get childElementCount() {
    return this.children.filter(child => child.nodeType === 1).length;
  }

  get textContent() {
    return this.children.length
      ? this.children.map(child => child.textContent).join('')
      : this._textContent;
  }

  set textContent(value) {
    for (const child of this.children) child.parentElement = null;
    this.children = [];
    const text = String(value);
    this._textContent = '';
    if (text !== '') {
      const textNode = new FakeText(text);
      textNode.parentElement = this;
      this.children.push(textNode);
    }
  }

  append(...nodes) {
    for (const node of nodes) {
      node.parentElement = this;
      this.children.push(node);
    }
  }

  remove(...nodes) {
    const removed = new Set(nodes);
    this.children = this.children.filter(child => {
      if (!removed.has(child)) return true;
      child.parentElement = null;
      return false;
    });
  }

  animate(keyframes, options) {
    const animation = new FakeAnimation(keyframes, options);
    this.animations.push(animation);
    return animation;
  }

  getBoundingClientRect() {
    return { ...this.rect, right: this.rect.left + this.rect.width, bottom: this.rect.top + this.rect.height };
  }

  querySelectorAll(selector) {
    if (selector !== '*') throw new Error(`Unsupported selector: ${selector}`);
    const result = [];
    const visit = parent => {
      for (const child of parent.children) {
        if (child.nodeType === 1) {
          result.push(child);
          visit(child);
        }
      }
    };
    visit(this);
    return result;
  }

  contains(node) {
    for (let current = node; current; current = current.parentElement) {
      if (current === this) return true;
    }
    return false;
  }
}
