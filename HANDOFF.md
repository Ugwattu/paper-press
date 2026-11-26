# Paper Press handoff — v36

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

Build/cache versioning: keep `APP_BUILD`, the `index.html` CSS/script cache query values, and `PPBanks.boot()` in sync for each release (current build: v36).


## v30 — Course-specific chapter list fix
- Fixed the chapter chip grid to display only the active course bank's chapter numbers. The previous UI rendered the union of chapter numbers across all 20 courses, causing unrelated chapter numbers (e.g. 17–33 from Grade 12 Chemistry) to appear as ‘Not supplied’ for Class 10.
- Chapter chips now come from `B().chapters`, sorted numerically; labels/counts use the active bank only.
- Build/cache version: v30.
- Regression suite: `tools/test-chapter-grid.js` (6 checks), added to `npm test`.


## v31 — UI refresh and named header styles
- Visual refresh across app shell, navigation, settings groups, controls, content selectors and paper preview; responsive desktop/tablet/mobile treatment; light/dark token updates.
- Added nine named header designs: Classic, Banner, Ruled, Split, Centered, Minimal, Boxed, Academy, Compact. New designs are implemented in both live paper preview and DOCX export.
- Header chooser is a responsive 3-column grid.
- Updated build/cache identifiers to v31.
- `tools/test-header-styles.js` verifies selector availability, preview/export branches and cache version consistency.
- Visual browser screenshot could not be completed in this sandbox; Chromium startup/renderer timed out.

## Current build v32
- UI redesign layer added with updated visual hierarchy, navigation, cards, controls, responsive behavior, and paper preview framing.
- Header style selector now includes 9 named options: Classic, Banner, Ruled, Split, Centered, Minimal, Boxed, Academy, Compact.
- All eight additional header designs are implemented in live HTML preview and DOCX export.
- New `tools/test-header-styles.js` validates the option list, rendering/export branch presence and cache version alignment.
- Verified: header-style test passes, chapter-grid regression passes, banks validate (0 errors/warnings), JavaScript syntax checks pass, and feature regression suites pass.
- `npm test` remains blocked at startup due to unavailable `jsdom`; Chromium visual screenshot timed out in this environment, so UI appearance and DOCX visual output have not been visually verified.

## Current build v32 — Selection UI redesign
- Reworked Class & Subject picker into clear numbered steps: select grade, then select subject. Grade tiles show selection state; subject tiles show bank availability/count and disabled upcoming courses; a persistent current-course confirmation reduces ambiguity.
- Topic/exercise chapter UI is redesigned with chapter rows, selection status, per-chapter Topics/Exercises tabs, counts, select-all/clear/add controls, clearer empty states and larger target rows. ALP override controls retained; selected tab persists across rerenders.
- Added `tools/test-selection-ui.js`; 12 checks pass. `test-content-selection.js` updated to verify new tabbed UI; 15 checks pass. Chapter isolation 6/6 and header styles 9/9 pass. Bank validation 0 errors/warnings; 616 questions preserved.
- Full DOM/browser testing still blocked by missing `jsdom` and browser dependencies. Syntax checks pass.

## v33 — Active Course & Onboarding
- Active course status moved above grade/subject controls so it is immediately visible, distinct from chapter cards.
- Active course indicator emphasized with ACTIVE PAPER label and accent styling.
- First-time guided tour added; steps cover course selection, ALP/topics/exercises, paper configuration, preview/export. Skip and Back/Next controls included; Guide button restarts tour.
- Tutorial completion stored in `pp.tutorial.v1` localStorage; independent from paper state.
- Verified `node --check app-runtime.js`, `node --check app-interface.js`, and bank validation: 0 errors/warnings, 616 authored questions.
- Full browser visual verification not run.

## v34 — Detailed onboarding tour
- New 11-step onboarding replaces v33 basic welcome. Every step highlights its real UI target with a spotlight and scrolls into view.
- Explains active course, grade, subject availability, ALP/full syllabus, chapter selection, topic/exercise selection, section switches, pairing schemes, Header/Layout/Edit/Library tabs, preview, and Word/PDF export. Includes tips, progress dots, Back, Next, Skip and Finish.
- Guide button can replay. Updated local completion key to `pp.tutorial.v2`, so existing v33 users are offered the redesigned tutorial once.
- `tools/test-onboarding.js`: 8/8 checks passed. Selection UI 12/12, content selection 15/15, chapter isolation 6/6, header styles 9 options. Bank validation: 0 errors/warnings; 616 questions retained.
- Browser visual test still pending.


## v35 — Guided interactive onboarding
- The tutorial is now a true spotlight tour: surrounding UI is dimmed, current target gets a bright pulsing ring, and explanation card describes that actual feature.
- Tour auto-switches to the correct pane for Header, Layout, Edit and Library steps, and expands collapsed groups before spotlighting.
- Detailed 18-step tour from introduction through class/subject, ALP, chapters, topic/exercise filters, sections, question counts, pairing scheme, header/layout, editing/pinning, presets, preview and export. Each has contextual tips.
- Back/Next/Skip/Finish and Guide replay; local completion key bumped to `pp.tutorial.v3` to show new tutorial to existing users. Reduced-motion CSS included.
- Added `tools/test-tutorial.js`; validate cache/build v35.

## v36 — Professional onboarding and spotlight visibility
- Replaced the opaque blur/heavy-shadow spotlight from v35 with an SVG mask spotlight. The background is not blurred; the surrounding app is dimmed only by 22%, and the target is visible through a rounded cut-out.
- The focused element is outlined by an SVG double ring, avoiding layout changes and huge box-shadow spread.
- Rebuilt the tour card as a polished product walkthrough with section/feature labels, an accessible progress bar, expanded explanations, practical tips and clear navigation.
- The card calculates its position around the highlighted target and selects the best side that fits the viewport. It responds to scrolling and resizing.
- Added Escape/arrow-key navigation, a keyboard focus loop, responsive card sizing and reduced-motion support.
- Completion key: `pp.tutorial.v4`. Guide button restarts the tour.
- Build/cache: v36 (`APP_BUILD`, CSS/JS query versions and `PPBanks.boot('36')`).
- `npm test` cannot complete in this runtime because `jsdom` is not installed (it stops at `tools/test-boot.js`). A Chromium headless screenshot attempt timed out, so final in-browser visual appearance is not claimed as verified. Automated tutorial, UI, course-bank and JavaScript syntax checks pass.


## v37 fix
- Paper > Header > Paper format (`#selSheetMode`) was visually appearing as a textbox because global select CSS removed native appearance and the later background shorthand erased the custom arrow image.
- Applied a specific native dropdown appearance (`appearance:auto`, `-webkit-appearance:menulist`) and cleared the arrow background image. Added pointer cursor and focus treatment.
- Build/cache bumped to v37.
