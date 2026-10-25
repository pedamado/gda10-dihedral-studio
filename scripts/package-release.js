/* ==========================================================================
   GDA-10 DIHEDRAL STUDIO — RELEASE PACKAGING SCRIPT
   Creates versioned .zip releases of the distro for archival & distribution
   ========================================================================== */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const rootDir = path.resolve(__dirname, '..');
const pkg = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf-8'));
const version = pkg.version || '1.0.0';
const releasesDir = path.join(rootDir, 'releases');

if (!fs.existsSync(releasesDir)) {
  fs.mkdirSync(releasesDir, { recursive: true });
}

// First ensure dist is fresh
console.log('1. Building fresh dist...');
execSync('node scripts/build-dist.js', { cwd: rootDir, stdio: 'inherit' });

// Create versioned zip
const zipName = `gda10-dihedral-studio-v${version}.zip`;
const zipPath = path.join(releasesDir, zipName);

console.log(`2. Packaging ${zipName}...`);
try {
  // Zip the contents of dist folder
  execSync(`cd dist && zip -r "${zipPath}" . -x "*.DS_Store"`, { cwd: rootDir, stdio: 'inherit' });
  console.log(`✓ Release zip created successfully: releases/${zipName}`);
} catch (err) {
  console.error('Packaging failed:', err.message);
  process.exit(1);
}
