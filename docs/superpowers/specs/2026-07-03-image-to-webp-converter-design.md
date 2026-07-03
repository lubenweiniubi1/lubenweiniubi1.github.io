# Image-to-WebP Converter Script Design

## Overview

A Node.js script (`convert-images.js`) placed at repo root. Run from any target directory to:
1. Convert non-webp images (PNG/JPG/JPEG/BMP) to webp
2. Move/copy all local image assets to `./assets/` (relative to cwd)
3. Update image references in `.md` and `.html` files to point to the new locations

## Scope

- **Only processes files in the current working directory (cwd)** — no recursion into subdirectories
- Skips external URLs (http/https)
- Runs via: `node ../convert-images.js` from the target dir

## Conversion Rules

| Format | Action |
|--------|--------|
| PNG / JPG / JPEG / BMP | Convert to `.webp` via `sharp`, output to `./assets/` |
| GIF | Keep original format, copy to `./assets/` |
| SVG / ICO | Keep original format, copy to `./assets/` |
| Already webp | Skip conversion, copy to `./assets/` |

## Reference Replacement

- `.md` files: replace `![alt](path)` image paths
- `.html` files: replace `src` and `data-src` attributes in `<img>` tags
- Paths updated to `./assets/<filename>.<ext>` (webp or original)

## Dependencies

- `sharp` — Node.js image processing (npm package)

## Usage

```bash
cd notes/09-微前端
node ../../convert-images.js
```
