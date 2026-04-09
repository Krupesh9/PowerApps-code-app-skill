#!/usr/bin/env node

/**
 * Power Apps Code App — Prerequisite Checker
 * Run this before starting a new project to verify all tools are installed.
 *
 * Usage: node scripts/check-prereqs.js
 */

const { execSync } = require('child_process');
const os = require('os');

const results = [];

function check(name, command, minVersion) {
  try {
    const output = execSync(command, { encoding: 'utf-8', timeout: 10000 }).trim();
    const version = output.match(/(\d+\.\d+\.\d+)/)?.[1] || output;
    results.push({ name, status: 'OK', version, detail: '' });
    return true;
  } catch {
    results.push({ name, status: 'MISSING', version: '-', detail: `Run: ${getInstallHint(name)}` });
    return false;
  }
}

function getInstallHint(name) {
  const hints = {
    'Node.js': 'https://nodejs.org → Download LTS',
    'npm': 'Comes with Node.js',
    'Git': 'https://git-scm.com/downloads',
    'pac CLI': 'Install "Power Platform Tools" VS Code extension (needed for auth & connections)',
    '@microsoft/power-apps': 'npm install @microsoft/power-apps@latest (installed per-project during scaffold)',
  };
  return hints[name] || 'See documentation';
}

console.log('');
console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║    Power Apps Code App — Prerequisite Check             ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');

check('Node.js', 'node --version', '18.0.0');
check('npm', 'npm --version', '9.0.0');
check('Git', 'git --version', '2.0.0');

// pac CLI — might be in VS Code extension path on Windows
let pacFound = check('pac CLI', 'pac --version', '1.0.0');
if (!pacFound && os.platform() === 'win32') {
  try {
    const vscodeExtDir = `${os.homedir()}\\.vscode\\extensions`;
    const output = execSync(
      `dir "${vscodeExtDir}" /b /ad | findstr powerplatform`,
      { encoding: 'utf-8', timeout: 5000 }
    ).trim();
    if (output) {
      const extPath = output.split('\n')[0].trim();
      const pacPath = `${vscodeExtDir}\\${extPath}\\dist\\pac\\tools\\pac.exe`;
      try {
        const ver = execSync(`"${pacPath}" --version`, { encoding: 'utf-8', timeout: 5000 }).trim();
        results[results.length - 1] = {
          name: 'pac CLI',
          status: 'OK (VS Code)',
          version: ver.match(/(\d+\.\d+\.\d+)/)?.[1] || ver,
          detail: `Found at: ${pacPath} — consider adding to PATH`,
        };
      } catch { /* still missing */ }
    }
  } catch { /* no VS Code extension found */ }
}

// @microsoft/power-apps — check if available in local project's node_modules
try {
  const ver = execSync('npm ls @microsoft/power-apps --json', {
    encoding: 'utf-8', timeout: 10000, stdio: ['pipe', 'pipe', 'pipe'],
  });
  const parsed = JSON.parse(ver);
  const depVersion = parsed.dependencies?.['@microsoft/power-apps']?.version;
  if (depVersion) {
    results.push({ name: '@microsoft/power-apps', status: 'OK', version: depVersion, detail: '' });
  } else {
    throw new Error('not in project');
  }
} catch {
  // Not found locally — that's fine, it gets installed per-project during scaffold
  results.push({
    name: '@microsoft/power-apps',
    status: 'OK (per-project)',
    version: '-',
    detail: 'Installed during scaffold (npm install @microsoft/power-apps@latest)',
  });
}

// Print results
const maxName = Math.max(...results.map(r => r.name.length));
results.forEach(r => {
  const icon = r.status.startsWith('OK') ? '✅' : '❌';
  const name = r.name.padEnd(maxName + 2);
  const status = r.status.padEnd(14);
  const detail = r.detail ? ` — ${r.detail}` : '';
  console.log(`  ${icon} ${name} ${status} ${r.version}${detail}`);
});

const allOk = results.every(r => r.status.startsWith('OK'));
console.log('');
if (allOk) {
  console.log('  🎉 All prerequisites met! Ready to create a Power Apps Code App.');
} else {
  console.log('  ⚠️  Some prerequisites are missing. Install them before proceeding.');
}
console.log('');

process.exit(allOk ? 0 : 1);
