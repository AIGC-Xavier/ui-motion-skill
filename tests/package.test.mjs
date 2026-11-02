import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { validatePackage } from '../scripts/validate.mjs';

const RECIPE_FILES = [
  'press-and-status.md',
  'presence-and-overlays.md',
  'selection-and-navigation.md',
  'reorder-and-gestures.md',
  'forms-and-feedback.md',
  'data-and-content.md',
];
const temporaryRoots = new Set();

function makeFixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'ui-motion-package-'));
  temporaryRoots.add(root);
  for (const directory of ['agents', 'references', 'recipes', 'scripts', 'tests', 'runtime', 'demo', '.github/workflows']) {
    fs.mkdirSync(path.join(root, directory), { recursive: true });
  }

  const files = {
    'SKILL.md': '---\nname: ui-motion\ndescription: Review or implement Web and H5 component motion.\n---\nSee [guide](references/decision-guide.md) and [optional runtime](runtime/motion.mjs).\n',
    'AGENTS.md': '# Notes\n',
    'README.md': '# ui-motion\n[Demo](demo/index.html)\n',
    'PROVENANCE.md': '# Provenance\n',
    'agents/openai.yaml': 'interface:\n  display_name: "UI Motion"\n  short_description: "Web and H5 component motion review and implementation"\n  default_prompt: "Use $ui-motion to review motion."\npolicy:\n  allow_implicit_invocation: true\n',
    'references/decision-guide.md': '# Guide\n',
    'references/verification.md': '# Verification\n',
    'scripts/validate.mjs': '// fixture\n',
    'scripts/serve-demo.mjs': '// fixture\n',
    'runtime/motion.mjs': 'export async function shiftLabel() {}\nexport function animateValue() {}\nexport async function setPresence() {}\nexport async function animateLayout() {}\n',
    'demo/index.html': '<!doctype html>\n',
    'demo/style.css': '/* fixture */\n',
    'demo/demo.mjs': '// fixture\n',
    'tests/package.test.mjs': '// fixture\n',
    '.gitignore': 'node_modules/\n',
    '.github/workflows/check.yml': 'name: check\n',
    'package.json': '{"name":"fixture","type":"module","scripts":{"test":"node --test tests/*.test.mjs"}}\n',
  };
  for (const recipe of RECIPE_FILES) files[`recipes/${recipe}`] = `# ${recipe}\n`;
  for (const [relativePath, content] of Object.entries(files)) {
    fs.writeFileSync(path.join(root, relativePath), content);
  }
  return root;
}

afterEach(() => {
  for (const root of temporaryRoots) fs.rmSync(root, { recursive: true, force: true });
  temporaryRoots.clear();
});

test('accepts a complete package fixture', () => {
  const root = makeFixture();
  assert.deepEqual(validatePackage(root), []);
});

test('rejects missing paths and any missing recipe family', () => {
  const root = makeFixture();
  fs.rmSync(path.join(root, 'recipes/reorder-and-gestures.md'));
  fs.rmSync(path.join(root, 'references/verification.md'));
  fs.rmSync(path.join(root, 'runtime/motion.mjs'));
  fs.rmSync(path.join(root, 'demo/index.html'));
  fs.rmSync(path.join(root, 'demo/style.css'));
  fs.rmSync(path.join(root, 'demo/demo.mjs'));
  fs.rmSync(path.join(root, 'PROVENANCE.md'));
  fs.rmSync(path.join(root, 'scripts/serve-demo.mjs'));
  const errors = validatePackage(root);
  assert.ok(errors.some((error) => error.includes('Missing required file: recipes/reorder-and-gestures.md')));
  assert.ok(errors.some((error) => error.includes('Missing required file: references/verification.md')));
  assert.ok(errors.some((error) => error.includes('Missing required file: runtime/motion.mjs')));
  assert.ok(errors.some((error) => error.includes('Missing required file: demo/index.html')));
  assert.ok(errors.some((error) => error.includes('Missing required file: demo/style.css')));
  assert.ok(errors.some((error) => error.includes('Missing required file: demo/demo.mjs')));
  assert.ok(errors.some((error) => error.includes('Missing required file: PROVENANCE.md')));
  assert.ok(errors.some((error) => error.includes('Missing required file: scripts/serve-demo.mjs')));
});

test('requires the four optional runtime helper exports', () => {
  const root = makeFixture();
  fs.writeFileSync(path.join(root, 'runtime/motion.mjs'), 'export async function shiftLabel() {}\nexport function animateValue() {}\nexport async function setPresence() {}\n');
  const errors = validatePackage(root);
  assert.ok(errors.some((error) => error.includes('runtime/motion.mjs must export animateLayout')));
});

test('rejects unsupported skill identity and incomplete invocation metadata', () => {
  const root = makeFixture();
  fs.writeFileSync(path.join(root, 'SKILL.md'), '---\nname: other-skill\n---\n');
  fs.writeFileSync(path.join(root, 'agents/openai.yaml'), 'interface:\n  display_name: "UI Motion"\npolicy:\n  allow_implicit_invocation: false\n');
  const errors = validatePackage(root);
  assert.ok(errors.some((error) => error.includes('frontmatter name must be ui-motion')));
  assert.ok(errors.some((error) => error.includes('non-empty description')));
  assert.ok(errors.some((error) => error.includes('interface.short_description')));
  assert.ok(errors.some((error) => error.includes('interface.default_prompt')));
  assert.ok(errors.some((error) => error.includes('allow implicit invocation')));
});

test('rejects broken local links, path escapes, and external dependencies', () => {
  const root = makeFixture();
  fs.writeFileSync(path.join(root, 'references/decision-guide.md'), '# Guide\n[missing](./absent.md) [escape](../../outside.md)\n');
  fs.writeFileSync(path.join(root, 'package.json'), '{"type":"module","dependencies":{"motion":"*"}}\n');
  const errors = validatePackage(root);
  assert.ok(errors.some((error) => error.includes('Broken Markdown link') && error.includes('absent.md')));
  assert.ok(errors.some((error) => error.includes('escapes package root') && error.includes('outside.md')));
  assert.ok(errors.some((error) => error.includes('must not declare external dependencies')));
});

test('validates this package root', () => {
  const packageRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  assert.deepEqual(validatePackage(packageRoot), []);
});
