const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const sourceDir = path.join(rootDir, 'frontend', 'dist');
const targetDir = path.join(rootDir, 'public');

if (!fs.existsSync(sourceDir)) {
    console.error(`Frontend build output not found: ${sourceDir}`);
    process.exit(1);
}

fs.rmSync(targetDir, { recursive: true, force: true });
fs.mkdirSync(targetDir, { recursive: true });
fs.cpSync(sourceDir, targetDir, { recursive: true });

console.log(`Copied frontend build from ${sourceDir} to ${targetDir}`);
