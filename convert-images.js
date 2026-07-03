/**
 * convert-images.js
 *
 * Run from any target directory. Processes ONLY files directly in cwd (no recursion).
 *
 * Usage:
 *   cd notes/09-微前端
 *   node ../../convert-images.js
 *
 * What it does:
 *   1. Converts PNG/JPG/JPEG/BMP → webp (via sharp), outputs to ./assets/
 *   2. Copies GIF/SVG/ICO/webp to ./assets/ (no conversion for GIF/SVG/ICO)
 *   3. Updates image references in .md and .html files to point to ./assets/
 *   4. Skips external URLs (http/https)
 *
 * Prerequisite: npm install sharp
 */

const fs = require('fs');
const path = require('path');

// ── helpers ────────────────────────────────────────────────────────────────

const IMAGE_EXT = new Set(['.png', '.jpg', '.jpeg', '.bmp', '.gif', '.svg', '.ico', '.webp']);
const CONVERT_EXT = new Set(['.png', '.jpg', '.jpeg', '.bmp']); // → webp
const COPY_EXT = new Set(['.gif', '.svg', '.ico', '.webp']);     // keep format
const TEXT_EXT = new Set(['.md', '.html']);

function isLocalUrl(str) {
  return !/^https?:\/\//i.test(str);
}

function extnameLower(file) {
  return path.extname(file).toLowerCase();
}

// ── main ───────────────────────────────────────────────────────────────────

async function main() {
  const cwd = process.cwd();
  const assetsDir = path.join(cwd, 'assets');

  console.log(`Working directory: ${cwd}`);

  // 1. Load sharp
  let sharp;
  try {
    sharp = require('sharp');
  } catch {
    console.error('Error: "sharp" is not installed. Run: npm install sharp');
    process.exit(1);
  }

  // 2. Scan cwd (non-recursive, files only)
  const allEntries = fs.readdirSync(cwd, { withFileTypes: true });
  const files = allEntries.filter(e => e.isFile()).map(e => e.name);

  const imageFiles = files.filter(f => IMAGE_EXT.has(extnameLower(f)));
  const textFiles = files.filter(f => TEXT_EXT.has(extnameLower(f)));

  if (imageFiles.length === 0) {
    console.log('No image files found in current directory.');
    return;
  }

  // Separate: convert vs copy
  const toConvert = imageFiles.filter(f => CONVERT_EXT.has(extnameLower(f)));
  const toCopy = imageFiles.filter(f => COPY_EXT.has(extnameLower(f)));

  console.log(`\nImages to convert (→ webp): ${toConvert.length}`);
  toConvert.forEach(f => console.log(`  ${f}`));
  console.log(`Images to copy (keep format): ${toCopy.length}`);
  toCopy.forEach(f => console.log(`  ${f}`));

  // 3. Build filename mapping: original_filename → new_filename
  //    Handle collisions (e.g. pic.png + pic.jpg both → pic.webp) by appending -N suffix.
  const mapping = {};     // { 'pic.png': 'pic.webp', 'icon.svg': 'icon.svg', ... }
  const usedNames = new Set(); // track target names to avoid collisions

  function uniqueName(wanted) {
    if (!usedNames.has(wanted)) {
      usedNames.add(wanted);
      return wanted;
    }
    const base = path.basename(wanted, extnameLower(wanted));
    const ext = extnameLower(wanted);
    let n = 1;
    let candidate;
    do {
      candidate = `${base}-${n}${ext}`;
      n++;
    } while (usedNames.has(candidate));
    usedNames.add(candidate);
    return candidate;
  }

  for (const f of toConvert) {
    mapping[f] = uniqueName(path.basename(f, extnameLower(f)) + '.webp');
  }
  for (const f of toCopy) {
    mapping[f] = uniqueName(f);
  }

  // 4. Create assets dir
  if (!fs.existsSync(assetsDir)) {
    fs.mkdirSync(assetsDir);
  }

  // 5. Convert PNG/JPG/BMP → webp, then remove originals
  for (const f of toConvert) {
    const srcPath = path.join(cwd, f);
    const destPath = path.join(assetsDir, mapping[f]);
    console.log(`Converting: ${f} → assets/${mapping[f]}`);
    await sharp(srcPath).webp().toFile(destPath);
    fs.unlinkSync(srcPath);
  }

  // 6. Move GIF/SVG/ICO/webp → assets
  for (const f of toCopy) {
    const srcPath = path.join(cwd, f);
    const destPath = path.join(assetsDir, f);
    console.log(`Moving: ${f} → assets/${f}`);
    fs.copyFileSync(srcPath, destPath);
    fs.unlinkSync(srcPath);
  }

  // 7. Update references in .md and .html files
  if (textFiles.length === 0) {
    console.log('\nNo .md or .html files found to update references.');
  } else {
    console.log(`\nUpdating references in: ${textFiles.join(', ')}`);

    for (const f of textFiles) {
      const filePath = path.join(cwd, f);
      let content = fs.readFileSync(filePath, 'utf-8');
      let changed = false;

      // ── markdown image syntax: ![alt](path) ──
      content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, imgPath) => {
        if (!isLocalUrl(imgPath)) return match;
        const base = path.basename(imgPath);
        if (mapping[base]) {
          changed = true;
          return `![${alt}](./assets/${mapping[base]})`;
        }
        return match;
      });

      // ── HTML img src / data-src ──
      content = content.replace(/((?:src|data-src)=["'])([^"']+)(["'])/gi, (match, prefix, imgPath, suffix) => {
        if (!isLocalUrl(imgPath)) return match;
        const base = path.basename(imgPath);
        if (mapping[base]) {
          changed = true;
          return `${prefix}./assets/${mapping[base]}${suffix}`;
        }
        return match;
      });

      if (changed) {
        fs.writeFileSync(filePath, content, 'utf-8');
        console.log(`  Updated: ${f}`);
      }
    }
  }

  // 8. Summary
  console.log('\n─ Done ─');
  console.log(`Converted: ${toConvert.length} file(s)`);
  console.log(`Copied:   ${toCopy.length} file(s)`);
  console.log(`Assets:   ${assetsDir}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
