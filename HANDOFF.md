# Paper Press handoff — v30

Static PECTAA paper generator for Classes 9, 10, 11, 12; Computer, Physics, Chemistry, Biology, Maths (20 courses).

## Existing features
- Course-specific schema-v2 banks and ALP/pairing schemes; chapter-level selection.
- Objective/Subjective timings and split sheets in one DOCX.
- English-only 11/12, bilingual 9/10.
- Long-question parts/groups, rich text, figures, LaTeX, preview + DOCX.
- 616 authored Computer questions preserved; other course banks are intentionally empty pending original authored content.
- v28 hotfix corrected bilingual long-question body colspans for grouped and legacy long questions.

## v29 — Topic/exercise selection
- Added chapter-scoped Topic and Exercise selector with independent checkboxes, select-all/clear, untagged-question option, and reset filters per chapter.
- Catalog items may be supplied in each course bank as `contentCatalog` keyed by chapter number, containing `topics` and `exercises` entries `{id,name,alpExcluded?}`.
- Question tags use `questionContent` keyed by chapter, section (`mcq|short|long`), and zero-based question index, with arrays of topic/exercise IDs. The loader validates chapters, indexes, catalog IDs, and ALP flags.
- Question browser has **Tag topic** and **Tag exercise** actions. These create/assign local catalog labels and tags, saved in local browser state. Existing bank tags and local tags are combined.
- Topic/exercise filters affect MCQ, short, and long pools; therefore allocation caps, blueprint counts, chapter availability and random generation reflect filters. Tag selections use union matching. When a finer filter is active, untagged questions are excluded by default; checkbox can include them. No selected content filter means all chapter questions remain eligible.
- ALP-excluded catalog entries can be marked, are disabled while ALP is on, and selected exclusions are removed when ALP is enabled. ALP exclusion flags in authored banks are honored.
- Presets persist content selections. Custom catalogs/tags persist in browser state and can be exported as `<courseId>-content-tags.json` for merging into the bank JSON.
- **Catalogs are not pre-populated with textbook topic/exercise titles.** Avoid inventing these. The current user can add labels in-app and tag existing questions; exact catalog population should be based on the course textbook or uploaded contents.

## Validation / tests
- `tools/test-content-selection.js`: 15 checks, including selection logic, ALP exclusion, tag catalog merge, bank loader validation and UI wiring.
- Bank validator: 0 errors/warnings, 616 questions preserved.
- Syntax checks for all JS modules/tools pass.
- Standalone test suites pass (long table, rich text, LaTeX, Maths, science, upper Computer, timing, language, sheets, modules, template, long engine/groups, topic selection).
- Full `npm test` is blocked at `test-boot.js` because `jsdom` is not installed. Visual browser testing remains unverified.

## Files
- `index.html`, `app.css`, `paper.css`
- Ordered classic scripts: `app-core.js`, `app-schemes.js`, `app-long.js`, `app-planning.js`, `app-paper.js`, `app-docx.js`, `app-analysis.js`, `app-presets.js`, `app-render.js`, `app-editors.js`, `app-interface.js`, `app-runtime.js`
- `banks/` includes manifest, 20 schema-v2 course files, legacy snapshots, and authoring template.
- `tools/` contains bank validator and regression suites.

Build/cache string is v30; keep `APP_BUILD`, `index.html` bank-loader cache, and `PPBanks.boot()` in sync.


## v30 — Course-specific chapter list fix
- Fixed the chapter chip grid to display only the active course bank's chapter numbers. The previous UI rendered the union of chapter numbers across all 20 courses, causing unrelated chapter numbers (e.g. 17–33 from Grade 12 Chemistry) to appear as ‘Not supplied’ for Class 10.
- Chapter chips now come from `B().chapters`, sorted numerically; labels/counts use the active bank only.
- Build/cache version: v30.
- Regression suite: `tools/test-chapter-grid.js` (6 checks), added to `npm test`.
