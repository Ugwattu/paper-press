# Paper Press Changelog

## v31 — UI refresh + header styles
- Reworked the app visual design: updated spacing, cards, navigation, buttons, surfaces, and paper preview.
- Improved responsive layout for desktop, tablet, and mobile.
- Added named header styles: Classic, Banner, Ruled, Split, Centered, Minimal, Boxed, Academy, Compact.
- Each header style is supported in live preview and DOCX export.
- Updated cache/build identifiers.
- Browser visual screenshot test remains pending (Chromium timeout).

## v30 — Course chapter isolation
- Fixed unrelated chapters appearing in the active course chapter selector.

## v29 — Topic/exercise selection
- Added chapter-scoped topic/exercise filters and question tagging.

## v28 — Long-question table correction
- Corrected bilingual body column spans and alignment.

## v27 — Header instruction layout improvement
- Separated bilingual instruction header layout from body columns.

## v26 — Mathematics and LaTeX
- Added Mathematics 9–12 banks and formula preview/export support.

## v25 — Science banks
- Added Physics, Chemistry and Biology 9–12 scheme support.

## v24 — Rich text and figures
- Added rich text, figure attachments, and DOCX embedding.

## v23 — Computer 11/12
- Added upper-grade Computer course schemes and ALP support.

## v22 — Course foundation
- Added schema-v2 course registry and course-based settings.

## v32 — Selection UI redesign

### Improved
- Reworked Class & Subject into a clear two-step picker: choose grade, then subject.
- Grade tiles now have explicit selected states.
- Subject tiles clearly distinguish available question banks, question counts, and upcoming courses.
- Added a persistent current-course confirmation to reduce class/subject confusion.
- Topic/exercise selection now uses per-chapter tabs instead of two long side-by-side lists.
- Added selection counts for topics and exercises, chapter filter state, larger check targets, and clearer empty states.
- Kept chapter-level filtering distinct from topic/exercise narrowing.
- Preserved ALP include/exclude override controls and selection-tab state when updating/rendering.
- Added responsive layouts for narrow screens.

### Verification
- 12/12 selection UI checks passed.
- 15/15 content-selection checks passed.
- 6/6 chapter isolation checks passed.
- 9 header styles remain intact; cache versions aligned to v32.
- Bank validation: 0 errors, 0 warnings; 616 existing questions preserved.
- JavaScript syntax checks passed. Full DOM/browser visual testing remains pending because jsdom/browser dependencies are unavailable.

## v33 — Course Status Visibility & First-Run Tutorial
- Moved the current course indicator to the top of the Class & Subject selector.
- Made the active course more prominent with an ACTIVE PAPER label, larger title and accent styling.
- Added a first-run onboarding walkthrough covering course selection, syllabus selection, paper configuration, preview and export.
- Added a persistent Guide button to replay onboarding; users can skip or navigate steps.
- Tutorial completion is stored locally and does not affect paper settings.

## v34 — Detailed spotlight onboarding
- Replaced the basic text-only welcome with an 11-step guided tour covering active course, class, subject bank, ALP, chapter selection, topic/exercise filters, paper sections, pairing schemes, settings tabs, live preview and export.
- Each tour step spotlights the actual UI control being explained, scrolls it into view, and displays detailed explanation plus practical tip.
- Added visible progress dots, Back, Next feature, Skip and Finish controls.
- Guide button replays the tour. First-run completion key upgraded so v33 users receive the improved onboarding once.
- Added automated onboarding regression checks.


## v35 — Interactive feature spotlight tutorial
- Replaced text-only slides with a guided tour that dims the interface and spotlights the exact feature currently being explained.
- Tour automatically switches Paper/Header/Layout/Edit/Library panes and expands collapsed setting groups as needed.
- Expanded to 17 steps including introduction, active course, class, subject, ALP, chapters, topic/exercise filtering, section toggles, MCQ/short/long controls, pairing scheme, header, layout, pinning/editing, presets, live preview and export.
- Every step has detailed explanation and a contextual “What to notice” tip; progress, Back, Next, Skip and Finish controls.
- Spotlight ring pulses; reduced-motion preference is respected. Tutorial completion version bumped to v3 so users who dismissed the earlier tour are offered the redesigned tutorial.
- Added `tools/test-tutorial.js`; cache/build identifiers aligned to v35.

## v36 — Professional onboarding and clear spotlight
- Replaced the heavy, blurred tour overlay with an unblurred SVG mask spotlight. The app remains visible and readable behind a light 22% dim layer; only the area around the active feature is cut out.
- Removed the huge spotlight box-shadow that darkened almost the entire page. The highlighted control receives a clean white/accent outline without changing its size or layout.
- Rebuilt the guide card with a structured product-tour header, section label, feature name, progress bar, detailed explanation, practical tip and consistent Back/Next/End controls.
- The guide card dynamically positions itself beside the highlighted element, choosing the clearest available side and staying within the viewport.
- Added keyboard navigation (Escape, left/right arrows, Tab focus loop), accessible progress semantics, responsive sizing and reduced-motion support.
- Bumped the completion key to `pp.tutorial.v4` so users who previously dismissed the earlier walkthrough see this redesigned version once.
- Added regression checks for mask cut-out, lack of blur, light dimming, anchored card positioning and v36 cache alignment.


## v37 — Paper format dropdown visibility
- Fixed the Paper format selector rendering like a plain text field: the global `appearance:none` plus a later background shorthand removed its dropdown arrow.
- Restored a native dropdown indicator and pointer affordance specifically for `#selSheetMode`; it remains styled to match the app and has a clearer focus outline.
- Updated cache/build identifiers to v37.
