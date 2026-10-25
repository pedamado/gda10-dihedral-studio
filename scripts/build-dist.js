/* ==========================================================================
   GDA-10 DIHEDRAL STUDIO — DISTRIBUTION BUILD SCRIPT
   Builds the standalone distribution into the dist/ directory
   ========================================================================== */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src, dest) {
  const destDir = path.dirname(dest);
  ensureDir(destDir);
  fs.copyFileSync(src, dest);
  console.log(`Copied: ${path.relative(rootDir, src)} -> ${path.relative(rootDir, dest)}`);
}

function copyDirRecursive(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

console.log('--- Building GDA-10 Dihedral Studio Distro ---');
ensureDir(distDir);

// Copy src folder (css, js) into dist/src
copyDirRecursive(path.join(rootDir, 'src'), path.join(distDir, 'src'));

// Copy index.html into dist/index.html
copyFile(path.join(rootDir, 'index.html'), path.join(distDir, 'index.html'));

// Copy LICENSE and README.md into dist
if (fs.existsSync(path.join(rootDir, 'LICENSE'))) {
  copyFile(path.join(rootDir, 'LICENSE'), path.join(distDir, 'LICENSE'));
}
if (fs.existsSync(path.join(rootDir, 'README.md'))) {
  copyFile(path.join(rootDir, 'README.md'), path.join(distDir, 'README.md'));
}

console.log('✓ Distribution build ready in dist/');
