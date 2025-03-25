#!/usr/bin/env node

import { execSync } from 'child_process';
import { copyFileSync, mkdirSync, existsSync, rmSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');
const ROOT_DIR = resolve(__dirname, '..');
const DIST_DIR = join(ROOT_DIR, 'dist');

console.log('Packaging extension...');

// Clean dist directory
if (existsSync(DIST_DIR)) {
  console.log('Cleaning dist directory...');
  rmSync(DIST_DIR, { recursive: true, force: true });
}

// Create dist directory structure
console.log('Creating directory structure...');
mkdirSync(DIST_DIR, { recursive: true });
mkdirSync(join(DIST_DIR, 'icons'), { recursive: true });
mkdirSync(join(DIST_DIR, 'assets'), { recursive: true });
mkdirSync(join(DIST_DIR, 'chunks'), { recursive: true });

// Generate placeholder icons
console.log('Generating icons...');
const ICON_SIZES = [16, 32, 48, 128];
const PLACEHOLDER_ICON = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  'base64'
);

ICON_SIZES.forEach(size => {
  const iconPath = join(DIST_DIR, 'icons', `icon${size}.png`);
  writeFileSync(iconPath, PLACEHOLDER_ICON);
  console.log(`Created icon: ${iconPath}`);
});

// Build extension
console.log('Building extension...');
execSync('vite build', { stdio: 'inherit' });

// Copy manifest
console.log('Copying manifest...');
copyFileSync(
  join(ROOT_DIR, 'manifest.json'),
  join(DIST_DIR, 'manifest.json')
);

// Verify build
console.log('Verifying build...');
const requiredFiles = [
  'content.js',
  'background.js',
  'manifest.json',
  'assets/content.css'
];

const missingFiles = requiredFiles.filter(file => !existsSync(join(DIST_DIR, file)));

if (missingFiles.length > 0) {
  console.error('Error: Missing required files:', missingFiles.join(', '));
  process.exit(1);
}

console.log('\nExtension package created successfully!');
console.log('\nTo load the extension in Chrome:');
console.log('1. Open chrome://extensions');
console.log('2. Enable Developer mode');
console.log('3. Click "Load unpacked"');
console.log('4. Select the dist/ directory');