import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const PACKAGE_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REQUIRED_FILES = [
  'SKILL.md',
  'AGENTS.md',
  'README.md',
  'PROVENANCE.md',
  'agents/openai.yaml',
  'references/decision-guide.md',
  'references/verification.md',
  'scripts/validate.mjs',
  'scripts/serve-demo.mjs',
  'runtime/motion.mjs',
  'demo/index.html',
  'demo/style.css',
  'demo/demo.mjs',
  'tests/package.test.mjs',
  '.gitignore',
  '.github/workflows/check.yml',
  'package.json',
];
const RECIPE_FILES = [
  'recipes/press-and-status.md',
  'recipes/presence-and-overlays.md',
  'recipes/selection-and-navigation.md',
  'recipes/reorder-and-gestures.md',
  'recipes/forms-and-feedback.md',
  'recipes/data-and-content.md',
];

function readIfPresent(root, relativePath) {
  const fullPath = path.join(root, relativePath);
  return fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()
    ? fs.readFileSync(fullPath, 'utf8').replaceAll('\r\n', '\n')
    : null;
}

function markdownFiles(root, relative = '') {
  const absolute = path.join(root, relative);
  if (!fs.existsSync(absolute)) return [];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === '.git' || entry.name === 'node_modules') return [];
    const next = path.join(relative, entry.name);
    if (entry.isDirectory()) return markdownFiles(root, next);
    return entry.isFile() && entry.name.endsWith('.md') ? [next] : [];
  });
}

function linkTarget(link) {
  const trimmed = link.trim();
  const angle = trimmed.match(/^<([^>]+)>/);
  if (angle) return angle[1];
  return trimmed.split(/\s+/, 1)[0];
}

export function validatePackage(root = PACKAGE_ROOT) {
  const errors = [];
  const resolvedRoot = path.resolve(root);

  for (const relativePath of [...REQUIRED_FILES, ...RECIPE_FILES]) {
    if (readIfPresent(resolvedRoot, relativePath) === null) {
      errors.push(`Missing required file: ${relativePath}`);
    }
  }

  const runtime = readIfPresent(resolvedRoot, 'runtime/motion.mjs');
  if (runtime !== null) {
    for (const helper of ['shiftLabel', 'animateValue', 'setPresence', 'animateLayout']) {
      if (!new RegExp(`\\bexport\\s+(?:async\\s+)?function\\s+${helper}\\b`).test(runtime)) {
        errors.push(`runtime/motion.mjs must export ${helper}`);
      }
    }
  }

  const skill = readIfPresent(resolvedRoot, 'SKILL.md');
  if (skill !== null) {
    const frontmatter = skill.match(/^---\n([\s\S]*?)\n---\n/);
    if (!frontmatter) {
      errors.push('SKILL.md must begin with YAML frontmatter delimited by ---');
    } else {
      const name = frontmatter[1].match(/^name:\s*["']?([^\s"']+)["']?\s*$/m)?.[1];
      const description = frontmatter[1].match(/^description:\s*(.+?)\s*$/m)?.[1];
      if (name !== 'ui-motion') errors.push('SKILL.md frontmatter name must be ui-motion');
      if (!description || description === '""' || description === "''") {
        errors.push('SKILL.md frontmatter must include a non-empty description');
      }
    }
  }

  const openai = readIfPresent(resolvedRoot, 'agents/openai.yaml');
  if (openai !== null) {
    const fields = [
      ['interface.display_name', /^\s+display_name:\s*"[^"\n]+"\s*$/m],
      ['interface.short_description', /^\s+short_description:\s*"[^"\n]+"\s*$/m],
      ['interface.default_prompt', /^\s+default_prompt:\s*"[^"\n]*\$ui-motion[^"\n]*"\s*$/m],
    ];
    for (const [field, pattern] of fields) {
      if (!pattern.test(openai)) errors.push(`agents/openai.yaml must define quoted ${field}`);
    }
    if (!/^\s+allow_implicit_invocation:\s*true\s*$/m.test(openai)) {
      errors.push('agents/openai.yaml must allow implicit invocation');
    }
  }

  const packageJsonText = readIfPresent(resolvedRoot, 'package.json');
  if (packageJsonText !== null) {
    try {
      const packageJson = JSON.parse(packageJsonText);
      if (packageJson.dependencies || packageJson.devDependencies) {
        errors.push('package.json must not declare external dependencies');
      }
      if (packageJson.type !== 'module') errors.push('package.json must declare type module');
    } catch {
      errors.push('package.json must contain valid JSON');
    }
  }

  for (const markdownPath of markdownFiles(resolvedRoot)) {
    const markdown = readIfPresent(resolvedRoot, markdownPath);
    for (const match of markdown.matchAll(/\[[^\]]*\]\(([^)]+)\)/g)) {
      const target = linkTarget(match[1]);
      if (!target || /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(target) || target.startsWith('#')) continue;
      let decoded;
      try {
        decoded = decodeURIComponent(target);
      } catch {
        errors.push(`Invalid encoded Markdown link in ${markdownPath}: ${target}`);
        continue;
      }
      const localPath = decoded.split(/[?#]/, 1)[0];
      if (!localPath) continue;
      const targetPath = path.resolve(resolvedRoot, path.dirname(markdownPath), localPath);
      if (!targetPath.startsWith(`${resolvedRoot}${path.sep}`) && targetPath !== resolvedRoot) {
        errors.push(`Markdown link escapes package root in ${markdownPath}: ${target}`);
      } else if (!fs.existsSync(targetPath)) {
        errors.push(`Broken Markdown link in ${markdownPath}: ${target}`);
      }
    }
  }

  return errors;
}

function main() {
  const root = process.argv[2] ? path.resolve(process.argv[2]) : PACKAGE_ROOT;
  const errors = validatePackage(root);
  if (errors.length) {
    console.error(`ui-motion package validation failed (${errors.length} issue${errors.length === 1 ? '' : 's'}):`);
    for (const error of errors) console.error(`- ${error}`);
    process.exitCode = 1;
    return;
  }
  console.log(`ui-motion package is valid: ${RECIPE_FILES.length} recipe families, optional runtime/demo paths, and local links checked.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) main();
