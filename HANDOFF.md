# Paper Press handoff — v39 (2026-11-27)

Static PECTAA board-paper builder. The current course registry is `banks/manifest.json`; the app derives available class/subject options from it. Current manifest has 20 course entries, and the banks contain 616 authored Computer questions; other courses currently have empty question arrays. These are current data counts, not application constants.

## Current architecture
- `index.html`: shell, CSS and versioned bank-loader entry (`v39`).
- `bank-loader.js`: validates manifest entries, loads bank JSON in parallel (shared files are fetch-cached), converts question data, isolates a broken course entry, and injects `app.bundle.js`.
- `app.bundle.js`: generated ordered bundle of the 12 classic modules. Sources remain `app-*.js`; run `npm run build` after changing a module. Shared global state remains intentionally compatible with the classic scripts.
- `banks/manifest.json`: registry; each course may reference a shared file using `bankCourseId` and optional `overrides`. This permits file reuse without copying question content. Picker classes and subject cards are manifest-driven.
- Bank question objects now have stable IDs (`q-…`). Runtime pins and local tags use IDs. `questionContent` exports/imports stable-ID keys; numeric keys are accepted as legacy and translated. Existing positional question tags in saved state are migrated at boot.
- `app-runtime.js`: state restore sanitizes with `cleanCfg`, schemes with `cleanScheme`, preserves supported auxiliary state, snapshots storage before writes and rolls back localStorage on a write failure. Build-change autobackups are slimmed (logo excluded and payload capped/pruned).
- `doDoc()` labels and confirms the legacy HTML-as-`.doc` export; `.docx` is recommended.

## Build and tests
```sh
npm install
npm run build
npm test
node tools/validate-banks.js
```
`npm test` first rebuilds the bundle, validates banks, and runs the regression suite. `jsdom`/`jszip` are required for boot, persistence and DOCX integration tests.

## Completed in v39
- Picker regression fixed (`classNo`/`subjectId`); `test-boot` caught it, so always run the full `npm test` with dependencies installed.
- Group filter (Pre-Medical, Pre-Engineering, ICS, FA) driven by `banks/manifest.json` `groups`. **FA membership (maths + computer) and the other group memberships are editable data; confirm them against the PECTAA scheme.**
- MathJax SRI (`sha384-KKWa9jJ1MZvssLeOoXG6FiOAZfAgmzsIIfw8BXwI9+kYm0lPCbC6yTQPBC00F1/L`, computed from the npm `mathjax@3.2.2` `es5/tex-svg.js`) with cdnjs → jsDelivr fallback. If a CDN ever serves a different build the script is refused and TeX source stays visible.
- Safety copy stored in IndexedDB (`autobackup`), localStorage fallback.
- Margin slider uses batched repaint (render batching via `requestAnimationFrame` already existed for other controls).

## Completed in v38
- Step 1 repo hygiene: head correction retained, C2PA metadata stripped, `.gitignore` expanded, obsolete Computer Science files removed, `node_modules` absent.
- Step 2 stale assertions updated for manifest courses and non-option Urdu paragraphs.
- Stable question IDs added across authored banks; positional local tags migrated; question-content export uses stable IDs.
- Restore validation/rollback and smaller build safety copies.
- Manifest-derived class/subject picker and validation. Shared-file aliases supported by loader.
- Twelve sequential module requests replaced with one ordered generated bundle; banks are fetched in parallel and cached. Invalid bank entries are isolated.
- MathJax CDN URL pinned to 3.2.2; CDN failure leaves TeX source and reports a warning.
- Legacy `.doc` clearly marked. Build/cache values aligned to v38.

## Verification status
- Bank validation: **0 errors, 0 warnings; 616 questions**.
- Standalone regression suites: **20/20 passed** (header styles, onboarding, chapter grid, timing, language, sheets, module/bundle/shared-bank/isolation, template, upper Computer, rich text, long groups/engine, science banks, LaTeX, Maths, long table, content selection, selection UI, tutorial, stable IDs).
- Additional hygiene assertions: corrected head, Urdu font reference, CSS links, no stray body fragment, SVG metadata removal, version alignment, ignored/absent `node_modules`, obsolete bank files absent: **8/8 passed**.
- Full `npm test` (27 suites incl. `test-boot`, `test-parity`, `test-docx`, `test-persistence`, `test-groups`) passes with dependencies installed (`npm install`).
- Real-browser visual verification: not performed. Check the spotlight tour, drawer, mobile tab bar, dark mode, restore/rollback, DOCX in Word/OnlyOffice, and the paper-format dropdown.
- Offline verification: not performed. Google Fonts and MathJax are external; offline fallbacks should be checked. MathJax is version-pinned with SRI (see v39).

## Known deferred work
- Lazy-loading course banks: deliberately not done. All 20 banks are ~83 KB gzipped (the active one is 5–25 KB), cached after first visit, and MathJax (2 MB) already loads only when a paper contains math. Lazy loading would make course switching, presets, undo/redo and restore asynchronous for a small saving. Revisit if banks pass roughly 1 MB gzipped; the manifest would then need per-course summary metadata.
- Render-slot patching: edits are batched per animation frame, but each paint still rebuilds the sheet DOM. MathJax is skipped for roots without math, but edits can still rebuild and re-typeset math-bearing papers.
- Deeper global-state decoupling across the 12 modules remains future work.
- Groups are a picker filter only. Group-specific papers (different marks or scheme for the same subject per group) would need `bankCourseId` alias entries per group.

## Storage keys
Keep existing storage names: `pp.state.v7`, `pp.presets.v7`, `pp.schemes.v7`, `pp.hiddenFactory.v1`, `pp.theme`, `pp.groups.v2`, `pp.pane`, `pp.bp`, `pp.autobackup`, `pp.build`, `pp.tutorial.v4`; logo is in IndexedDB (`paper-press` / `kv`).
