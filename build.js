import fs from 'fs';
import path from 'path';

const root = process.cwd();
const outDir = path.join(root, 'dist');

function rimrafSync(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir)) {
    const p = path.join(dir, entry);
    const stat = fs.statSync(p);
    if (stat.isDirectory()) rimrafSync(p);
    else fs.unlinkSync(p);
  }
  fs.rmdirSync(dir);
}

async function main() {
  // Prepare dist
  if (fs.existsSync(outDir)) rimrafSync(outDir);
  fs.mkdirSync(outDir, { recursive: true });

  const entries = fs.readdirSync(root);

  // Collect JS files (exclude this build file and node-related files)
  const jsFiles = entries.filter(f => f.endsWith('.js') && f !== path.basename(import.meta.url) && f !== 'build.js' && f !== 'bundle.js')
    .filter(f => fs.statSync(path.join(root, f)).isFile())
    .sort();

  // If no JS files found, exit
  if (jsFiles.length === 0) {
    console.log('No JS files found to bundle.');
  }

  // Create a single bundle
  const bundlePath = path.join(outDir, 'bundle.js');
  let out = '';
  for (const f of jsFiles) {
    const content = fs.readFileSync(path.join(root, f), 'utf8');
    out += `\n// ---- ${f} ----\n` + content + '\n';
  }
  fs.writeFileSync(bundlePath, out, 'utf8');
  console.log('Wrote', bundlePath);

  // Copy HTML files
  const htmlFiles = entries.filter(f => f.endsWith('.html') && fs.statSync(path.join(root, f)).isFile());
  for (const h of htmlFiles) {
    fs.copyFileSync(path.join(root, h), path.join(outDir, h));
    console.log('Copied', h, '-> dist');
  }

  // Copy appsscript.json if present
  const manifest = path.join(root, 'appsscript.json');
  if (fs.existsSync(manifest)) {
    fs.copyFileSync(manifest, path.join(outDir, 'appsscript.json'));
    console.log('Copied appsscript.json -> dist');
  }

  console.log('Build complete. Files in dist:');
  console.log(fs.readdirSync(outDir));
}

main().catch(err => { console.error(err); process.exit(1); });
