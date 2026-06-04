const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const repoUrl = 'https://github.com/enthec/webappanalyzer.git';
const tmpDir = path.join(__dirname, '.tmp_webappanalyzer');

console.log("Starting dataset update...");

// 1. Cleanup old tmp dir
if (fs.existsSync(tmpDir)) {
  console.log("Cleaning up old temporary directory...");
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// 2. Clone repository
console.log(`Cloning latest dataset from ${repoUrl}...`);
execSync(`git clone --depth 1 ${repoUrl} "${tmpDir}"`, { stdio: 'inherit' });

// 3. Merge technologies
console.log("Merging technology JSON files...");
const techDir = path.join(tmpDir, 'src', 'technologies');
const files = fs.readdirSync(techDir).filter(f => f.endsWith('.json'));

let mergedTechnologies = {};

for (const file of files) {
  const filePath = path.join(techDir, file);
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    mergedTechnologies = { ...mergedTechnologies, ...data };
  } catch (err) {
    console.error(`Failed to parse ${file}:`, err.message);
  }
}

const outTechPath = path.join(__dirname, 'technologies.json');
fs.writeFileSync(outTechPath, JSON.stringify(mergedTechnologies, null, 2));
console.log(`Merged ${Object.keys(mergedTechnologies).length} technologies into technologies.json.`);

// 4. Copy categories
console.log("Copying categories.json...");
fs.copyFileSync(
  path.join(tmpDir, 'src', 'categories.json'),
  path.join(__dirname, 'categories.json')
);

// 5. Copy images
console.log("Copying icons and images...");
const srcImagesDir = path.join(tmpDir, 'src', 'images');
const destImagesDir = path.join(__dirname, 'images');

function copyDirRecursiveSync(source, target) {
  if (!fs.existsSync(target)) {
    fs.mkdirSync(target, { recursive: true });
  }
  const items = fs.readdirSync(source);
  for (const item of items) {
    const srcPath = path.join(source, item);
    const destPath = path.join(target, item);
    if (fs.statSync(srcPath).isDirectory()) {
      copyDirRecursiveSync(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

copyDirRecursiveSync(srcImagesDir, destImagesDir);
console.log("Images copied successfully.");

// 6. Clean up
console.log("Cleaning up temporary repository...");
fs.rmSync(tmpDir, { recursive: true, force: true });

console.log("Update complete. The extension is now using the latest dataset.");
