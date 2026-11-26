# Paper Press — PECTAA Board Paper Studio (Classes 9–12)

Paper Press is a static web app for building PECTAA / BISE ALP question papers. It creates a live paper preview and exports a `.docx` file. It runs in the browser; it does not upload question-bank content.

## Supported courses

The course picker contains 20 combinations: Classes 9, 10, 11 and 12, each with Computer, Physics, Chemistry, Biology and Mathematics. Classes 9/10 support English and Urdu; Classes 11/12 are English-only. The Computer banks for Classes 9 and 10 contain the currently authored questions. Computer 11 and 12 include their unit names, 2026–27 ALP metadata and PECTAA pairing schemes. All 12 Physics, Chemistry and Biology banks and all four Mathematics banks include chapter registers, ALP chapter lists and course-specific pairing patterns. Science and Mathematics question arrays are intentionally empty so the author can add original questions. Topic-level ALP exclusions are recorded where transcribed; review the applicable revised PECTAA notice for the complete deletion schedule before authoring questions against finer-grained exclusions. Mathematics 9/10 use two independent long-question groups; Mathematics 11/12 use five part-based long questions.

The app has no in-app question editor. Questions and official ALP/pairing patterns are maintained as JSON by the author. Write original questions; do not copy PCTB textbook passages or model-paper questions.

## Run locally

From the project folder, start a local static server:

```sh
python -m http.server 8000
```

Then open <http://localhost:8000/>. Avoid opening `index.html` directly from the file system because the app loads its course manifest and banks using `fetch()`.

## Project files

| File / folder | Purpose |
|---|---|
| `index.html` | App shell, settings panes, paper stage, dialogs and preview tabs |
| `bank-loader.js` | Loads and validates the v2 course manifest/banks, then loads the app modules sequentially |
| `app-*.js` | Twelve ordered classic scripts, including the part-based long-question planner. They share one global scope and are grouped by app subsystem |
| `app.css`, `paper.css` | Interface and paper-preview / print styling |
| `banks/manifest.json` | Registry of the 20 courses |
| `banks/<class>-<subject>.json` | One schema-v2 bank per course |
| `banks/class-*-computer-science.json` | Retained schema-v1 source snapshots; not loaded by the v2 manifest |
| `banks/_template.json` | Schema-v2 authoring template with rich-text, LaTeX and figure examples |
| `figures/` | Local PNG/SVG question figures referenced from question or option JSON |
| `tools/` | Bank validator and regression tests |
| `icons/`, `manifest.webmanifest` | Browser and home-screen icons |

`APP_BUILD` in `app-runtime.js`, the cache-busting query values in `index.html`, and the version passed to `PPBanks.boot()` must be bumped together when publishing an update.

## Editing a course bank

1. For a new course, copy `banks/_template.json` to a filename such as `banks/11-physics.json`; for an existing course, edit its current bank file.
2. Set `courseId`, `class`, `classLabel`, `classUr`, `subjectId`, `code`, `subject`, `subjectUr`, `language` and `marks`. `courseId` must match `<class>-<subjectId>`.
3. Set `times.objective` and `times.subjective` in minutes. `basis` must be `stated` or `inferred`. An inferred value is labelled in the UI.
4. Add the ALP chapter list, excluded chapters, summary, any `exclusionRules`, and official `patterns`.
5. Add each chapter and its `mcq`, `short` and `long` questions. Urdu fields may be empty for English-only courses.
6. Add the course to `banks/manifest.json` with `{ "id": "11-computer", "class": 11, "subject": "computer", "file": "11-computer.json" }`.
7. Run `node tools/validate-banks.js` before committing.

### Bank schema notes

- Every bank uses `schemaVersion: 2` and includes `courseId`, course metadata, `language`, `marks`, `times`, `alp`, `patterns`, `exclusionRules` and `chapters`.
- Each MCQ has `question`, optional `questionUr`, exactly four `options` entries (`{ "en": "...", "ur": "..." }`) and an `answer` of `A`, `B`, `C` or `D`. Questions and options may also include optional `figure` and `figureAlt` strings.
- Short and long questions have `question` and optional `questionUr`, plus optional `figure` / `figureAlt`. Add `alpExcluded: true` when a question is excluded from ALP papers. Long questions may set `source` to `bank` or `composed`.
- A pattern records the chapter distribution and marks: `mcq`, `mcqMark`, `short` groups (`ch` and `attempt`), and `shortMark`. Computer-style long questions use the legacy `long` chapter slots with `longAttempt` / `longMark`. Split-part subjects use `longGroups`: each group has its own `attempt` count, printed question list and `totalMarks`; each question contains ordered parts with their own `marks` and `chapterRule`. Rules are `fixed` (one chapter), `either` (choose from listed chapters), `any` (choose from the active ALP chapters, optionally restricted by a list), and `different-from-a` (choose a chapter other than part (a)). Each part is drawn independently from the matching chapter bank. Groups can have independent attempt counts and mark totals; the same course can use different part marks in different groups. Do not combine non-empty legacy `long` slots with `longGroups`. `totalMarks` is optional; when supplied it must agree with the calculated pattern and the course's maximum marks.
- Chapter numbers are numeric identifiers and do not need to start at 1 or be consecutive.

### Rich text and figures

Question and option text supports a small, safe inline-markup vocabulary: `<sup>...</sup>` for superscripts, `<sub>...</sub>` for subscripts, `<b>...</b>` / `<strong>...</strong>` for bold, `<i>...</i>` / `<em>...</em>` for italic, and `<br>` for a line break. Chemical formulas can be written as `H<sub>2</sub>O`; powers and units as `x<sup>2</sup>`, `m·s<sup>−2</sup>` or `kg·m<sup>−3</sup>`. Use isotope shorthand such as `^{14}_{6}C` or `^{235}_{92}U`; ordinary unit symbols (for example `36 °C`, `5 kPa`) can be entered as normal text. Arbitrary HTML is escaped and displayed as text; script, image and style tags are not interpreted.

Put figure files in `figures/` as `.png` or `.svg`, then set `"figure": "and-gate.svg"` on a question or MCQ option. Add `figureAlt` for descriptive alternative text. References accept only a filename (or `figures/filename.png`), not a URL or nested path. SVG files must be self-contained, under 2 MB, and contain no scripts, event handlers, embedded data images, or external resources. The live preview uses the original image; `.docx` export embeds PNG files and converts SVG figures to PNG before embedding. Figure `figureAlt` text is also written into the DOCX image accessibility description.

Mathematical notation can be authored with LaTeX delimiters: `$x^2$` or `\(\frac{a}{b}\)` for inline expressions, and `\[\int_0^1 f(x)\,dx\]` or `$$...$$` for centered display equations. MathJax supports common TeX and AMS environments such as `\sqrt`, `\sum`, `\int`, `matrix`, `cases` and `aligned`. The live preview renders MathJax SVG; `.docx` export converts those SVG equations into embedded PNG images. MathJax 3 is loaded on demand from jsDelivr, so an internet connection is required when a paper contains LaTeX. If it cannot load, the preview keeps the source visible and Word export reports the conversion error. Unsafe HTML and resource-loading macros (for example `\href`, `\input`, `\includegraphics` and `\require`) are rejected as math and remain inert text.

Computer 11/12, Physics/Chemistry/Biology 9–12 and Mathematics 9–12 use PECTAA 2026–27 ALP/pairing data. Mathematics 10 uses the revised notification dated 20-11-2026 (Notification No. 1266), which supersedes the 14-11-2026 notice. The source's duplicate “Q-6” label for the fifth Class 12 Mathematics long question is retained in the scheme note; Paper Press numbers the five printed slots sequentially. The official upper-grade science notifications are: [Grade 11 (06-11-2026)](https://pectaa.edu.pk/wp-content/uploads/2026/11/ALP-Notification-Grade-11.pdf) and [Grade 12 (14-11-2026)](https://pectaa.edu.pk/wp-content/uploads/2026/11/ALPs-Notification-14.11.2026-1258-2.pdf). The Grade 10 science banks use the revised PECTAA notification dated 20-11-2026, which supersedes the earlier Grade 10 notice. Class 12 Computer has a 2:30 total and a 20-minute objective model-paper limit; the 2:10 subjective split is inferred and labelled accordingly. The science and Mathematics banks contain patterns and chapter metadata; their question arrays are intentionally empty.

The validator also checks manifest-to-bank consistency, chapter references, question option counts, answer keys, pattern totals and exclusion-rule references. A course may have empty `chapters` and `patterns` while it is still awaiting authoring; it remains visible in the course picker as having no questions yet.

## Paper formats and timing

**Single paper** produces one paper with the combined Objective + Subjective duration. **Objective + Subjective sheets** keeps both sheets in one `.docx`: each sheet repeats its header and student fields and has its own marks, duration and paper-code suffix. MCQs, the board's answer-sheet note and OMR belong only to the Objective sheet. The preview can show Both, Objective or Subjective.

Objective and Subjective times default to the selected course's ALP values. You can override either duration in minutes, reset both to the ALP defaults, and save the overrides with presets. Defaults inferred from a notice are labelled as inferred.

## Presets, data and privacy

Presets and pairing schemes can be saved and reused. The user's current paper, settings, presets and schemes stay in that browser's local storage; the logo is stored in IndexedDB. A different browser, profile, host or port has separate storage. Use **Library → Backup & restore** to move the data. On a new app build, the app saves a safety copy of existing settings before migration.

## Tests

Install the development dependencies once, then run:

```sh
npm install
npm test
```

The test command validates all banks, boots the real app in jsdom, checks preview/export question ordering, inspects generated DOCX structure and images, checks persistence and keyboard shortcuts, and runs the timing, language, split-sheet, module-loading, template, Computer 11/12 ALP, rich-text/figure, LaTeX, Mathematics 9–12, part-based long-group, and Physics/Chemistry/Biology 9–12 bank regression tests. The optional `@napi-rs/canvas` dependency improves PNG checks in the DOCX tests; without it, the harness uses a small canvas stub.

For bank-only validation without the DOM test dependencies:

```sh
node tools/validate-banks.js
```

## Deploy on GitHub Pages

Publish the project folder at the repository root or in a `/docs` folder, then choose **Settings → Pages → Deploy from a branch** and select that branch and folder. All local paths are relative, so project-page subpaths are supported. `.nojekyll` is included.

## Reporting bugs

Use the bug icon in the top bar or **Library → Help & feedback**. Each report opens a GitHub issue prefilled with a unique report ID and diagnostics. You can also submit an issue directly at <https://github.com/Ugwattu/paper-press/issues>.

## Topic and exercise selection (v29)

The chapter picker supports finer filters. Add per-chapter `contentCatalog` entries (`topics` and `exercises`, each optionally `alpExcluded`) and tag bank questions using `questionContent` (chapter → question type → zero-based index → topic/exercise IDs). The authoring template includes a sample mapping. In-app, you can add local topic/exercise labels and tag questions from the question browser. Selecting content filters the random MCQ/short/long pools and blueprint counts. Untagged questions can optionally remain included. Local catalogs, tags, and selection state are saved in browser storage; for permanent bank-wide metadata, add the fields to course JSON.
