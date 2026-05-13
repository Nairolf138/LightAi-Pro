import { readFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';

const checks = [
  {
    file: 'index.html',
    description: 'index.html exposes the React root mount point',
    validate: (source) => /<div\s+id=["']root["']\s*>\s*<\/div>/i.test(source),
    failure: 'Expected index.html to contain <div id="root"></div>.',
  },
  {
    file: 'src/main.tsx',
    description: 'src/main.tsx looks up the root element',
    validate: (source) => /document\.getElementById\(\s*["']root["']\s*\)/.test(source),
    failure: 'Expected src/main.tsx to select document.getElementById("root").',
  },
  {
    file: 'src/main.tsx',
    description: 'src/main.tsx mounts React on the selected root element',
    validate: (source) => /createRoot\(\s*rootElement\s*\)\.render\(/s.test(source),
    failure: 'Expected src/main.tsx to call createRoot(rootElement).render(...).',
  },
];

for (const check of checks) {
  const source = await readFile(check.file, 'utf8');

  if (!check.validate(source)) {
    throw new Error(`${check.failure}\nFile checked: ${check.file}`);
  }

  console.log(`✓ ${check.description}`);
}

console.log('✓ Frontend mount point checks passed. Running Vite build...');

const build = spawn('npm', ['run', 'build'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

const exitCode = await new Promise((resolve, reject) => {
  build.on('error', reject);
  build.on('close', resolve);
});

if (exitCode !== 0) {
  throw new Error(`Vite build failed with exit code ${exitCode}.`);
}

console.log('✓ Vite build completed successfully.');
