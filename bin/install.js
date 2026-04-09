#!/usr/bin/env node

/**
 * powerapps-code-app installer
 *
 * Copies the Claude Code skill files into the correct .claude/skills/ directory.
 *
 * Usage:
 *   npx powerapps-code-app                  # Install into <cwd>/.claude/skills/powerapps-code-app/
 *   npx powerapps-code-app --global         # Install into ~/.claude/skills/powerapps-code-app/
 *   npx powerapps-code-app --path /my/dir   # Install into /my/dir/.claude/skills/powerapps-code-app/
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// ── Parse args ──────────────────────────────────────────────────────────────
const args = process.argv.slice(2);
const helpFlag = args.includes('--help') || args.includes('-h');
const globalFlag = args.includes('--global') || args.includes('-g');
const pathIdx = args.indexOf('--path');
const customPath = pathIdx !== -1 ? args[pathIdx + 1] : null;

if (helpFlag) {
  console.log(`
  powerapps-code-app — Install the Claude Code Power Apps skill

  Usage:
    npx powerapps-code-app                  Install into current project
    npx powerapps-code-app --global         Install into ~/.claude/skills/
    npx powerapps-code-app --path <dir>     Install into <dir>/.claude/skills/

  Options:
    --global, -g    Install to your home directory (available to all projects)
    --path <dir>    Install to a specific directory
    --help, -h      Show this help message
`);
  process.exit(0);
}

// ── Determine target root ───────────────────────────────────────────────────
let targetRoot;
if (customPath) {
  targetRoot = path.resolve(customPath);
} else if (globalFlag) {
  targetRoot = os.homedir();
} else {
  targetRoot = process.cwd();
}

const skillDir = path.join(targetRoot, '.claude', 'skills', 'powerapps-code-app');

// ── Determine package root (where the npm package files live) ───────────────
const pkgRoot = path.resolve(__dirname, '..');

// ── Files and directories to copy ───────────────────────────────────────────
const ITEMS_TO_COPY = [
  'SKILL.md',
  'CLAUDE.md',
  'references',
  'templates',
  'scripts',
  'evals',
  'LICENSE',
];

// ── Utility: recursive copy ─────────────────────────────────────────────────
function copyRecursive(src, dest) {
  const stat = fs.statSync(src);
  if (stat.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    for (const child of fs.readdirSync(src)) {
      copyRecursive(path.join(src, child), path.join(dest, child));
    }
  } else {
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
  }
}

// ── Main ────────────────────────────────────────────────────────────────────
console.log('');
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║   powerapps-code-app — Claude Code Skill Installer      ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');

// Check that the package files exist
const missing = ITEMS_TO_COPY.filter(
  (item) => !fs.existsSync(path.join(pkgRoot, item))
);
if (missing.length > 0) {
  console.error(`  Error: Missing package files: ${missing.join(', ')}`);
  console.error('  The npm package may be corrupted. Try reinstalling.');
  process.exit(1);
}

// Create skill directory
fs.mkdirSync(skillDir, { recursive: true });

// Copy files
let copied = 0;
for (const item of ITEMS_TO_COPY) {
  const src = path.join(pkgRoot, item);
  const dest = path.join(skillDir, item);
  try {
    copyRecursive(src, dest);
    copied++;
    console.log(`  Copied: ${item}`);
  } catch (err) {
    console.error(`  Failed to copy ${item}: ${err.message}`);
  }
}

console.log('');

if (copied === ITEMS_TO_COPY.length) {
  console.log(`  Installed to: ${skillDir}`);
  console.log('');
  console.log('  The skill is ready! Open Claude Code and say:');
  console.log('');
  console.log('    Build me an expense tracker app with SharePoint backend');
  console.log('');
} else {
  console.log('  Installation completed with errors. Check the output above.');
  process.exit(1);
}
