# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is an EasyEDA Pro extension that provides an interactive BOM (Bill of Materials) viewer for PCB designs. The extension displays component lists with real-time PCB preview, allowing users to click components in the BOM to highlight them on the board.

## Build Commands

```bash
# Install dependencies
npm install

# Compile TypeScript to dist/
npm run compile

# Build the .eext extension package
npm run build

# Lint code
npm run lint

# Auto-fix linting issues
npm run fix
```

Build output: `build/dist/eext-interative-bom_v1.0.0.eext`

## Architecture

### Two-Part System

1. **Extension Entry** (`src/index.ts`): TypeScript code that registers menu commands and opens the viewer iframe
2. **Viewer Interface** (`iframe/ibom-viewer.html` + `iframe/js/*.js`): Vanilla JavaScript that runs inside the iframe and handles all BOM/PCB rendering

### Why This Split?

The iframe viewer uses `blob:` protocol which prevents loading external JS files. All viewer functionality must be inline or in the `iframe/js/` directory, which gets bundled as extension resources.

### Viewer Module Structure

The `iframe/js/` directory contains modular JavaScript files:

- `state.js`: Global state management via `window.state`
- `api.js`: EasyEDA API calls to fetch PCB data
- `bom.js`: BOM data processing and aggregation
- `render.js`: Canvas rendering for PCB preview
- `footprint-parser.js`: Parse footprint source code from elibz2 files
- `footprint-renderer.js`: Render footprint pads and silkscreen
- `ui.js`: UI interactions (table rendering, highlighting)
- `interaction.js`: User interactions (drag, zoom, pan)
- `main.js`: Initialization and event binding

All modules are loaded via `<script>` tags in `ibom-viewer.html`.

## EasyEDA API Usage

The viewer accesses EasyEDA Pro APIs through the global `eda` object:

```javascript
// Get current document info
const docInfo = await eda.dmt_SelectControl.getCurrentDocumentInfo();

// Get all PCB components
const components = await eda.pcb_PrimitiveComponent.getAll();

// Get board outline polylines
const polylines = await eda.pcb_PrimitivePolyline.getAll();

// Get footprint source code
const footprintData = await eda.sys_FileManager.getFootprintFileByFootprintUuid(uuid);

// Show dialog
await eda.sys_Dialog.showConfirmationMessage('message', 'title');

// Open iframe
await eda.sys_IFrame.openIFrame(htmlPath, width, height, id, options);
```

## Key Concepts

### State Management

All viewer state lives in `window.state` (defined in `state.js`):
- `components`: Raw PCB component data
- `bomData`: Aggregated BOM (grouped by value/footprint)
- `flatBomData`: Flat BOM list
- `boardOutline`: Board boundary path
- `currentLayer`: 'F' (front), 'B' (back), or 'FB' (both)
- `darkMode`: Theme toggle
- `highlightedRefs`: Currently highlighted component references

### Footprint Rendering

Components are rendered with their actual footprint shapes:
1. Fetch footprint elibz2 file (a zip) via `SYS_FileManager.getFootprintFileByFootprintUuid()`
2. Parse the zip to extract JSON source code
3. Parse footprint primitives (pads, lines, arcs, circles) using `footprint-parser.js`
4. Render shapes on canvas using `footprint-renderer.js`

Footprint format documentation: https://image.lceda.cn/files/lceda-pro-file-format-v3_2025.10.21.md

## Extension Packaging

The build process:
1. `npm run compile`: esbuild bundles `src/index.ts` → `dist/index.js`
2. `npm run build`: `build/packaged.ts` creates a zip with all files not in `.edaignore`
3. Output: `.eext` file (renamed zip) in `build/dist/`

The `.edaignore` file excludes source files but includes `dist/` and `iframe/` directories.

## Code Style

- Extension logic: TypeScript with strict mode
- Viewer code: Vanilla JavaScript (no build step for iframe files)
- ESLint with `@antfu/eslint-config`
- Pre-commit hook runs `lint-staged` to auto-fix issues

## Important Notes

- Document type 3 = PCB (check before running extension)
- The viewer must run inside EasyEDA's iframe environment to access `eda.*` APIs
- Exported standalone HTML files won't have full functionality in browsers (no `eda` API)
- Canvas coordinates use EasyEDA's internal units (need conversion for display)
- Component rotation is in degrees, stored in `rotation` property
