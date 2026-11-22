# Paper Press — ALP Board Paper Studio (CS 9 & 10)

A static, no-build web app. Everything runs in the browser; nothing is uploaded.

## Files
| File | Purpose |
|---|---|
| `index.html`, `script.js` | the app (page structure and logic) |
| `app.css`, `paper.css` | interface styling / paper-preview styling |
| `icons/` (`favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`) and `manifest.webmanifest` | browser-tab icon and home-screen icons |
| `banks.js` | question banks (edit here) |
| `tools/validate-banks.js` | checks banks.js for malformed rows |

## Deploy on GitHub Pages
1. Put these files in a repository (root of the branch, or a `/docs` folder).
2. **Settings → Pages → Build and deployment → Deploy from a branch**, pick the branch and folder.
3. Open `https://<user>.github.io/<repo>/`.

All paths are relative, so it works under a project-page sub-path. `.nojekyll` is included so GitHub serves the files as-is.
The `?v=9` on the script/style tags is a cache-buster: bump it whenever you publish a change so visitors don't get stale files.

## Editing questions
Edit `banks.js`, then run `node tools/validate-banks.js` before committing. Row formats are documented at the top of the file.

## Notes
* Settings, presets and schemes are stored in the visitor's browser (localStorage); the logo is kept in IndexedDB.
* Fonts load from Google Fonts. The `.docx` uses the fonts you choose, which must be installed where it is opened.

## Tests
`npm install && npm test` runs the bank validator and a parity test that loads the real app in jsdom and checks the on-screen preview and the generated `.docx` contain the same questions in the same order (48 scenarios: both classes, ALP on/off, bilingual on/off, seeds, option layouts). A GitHub Actions workflow runs it on every push.

## Shortcuts


## Keyboard shortcuts (press `?` in the app for the live list)
`Ctrl/⌘+S` save .docx · `Ctrl/⌘+P` print · `Ctrl/⌘+Z` undo · `Ctrl/⌘+Shift+Z` redo · `S` shuffle · `K` answer key · `B` bilingual · `O` OMR · `E` edit tools · `T` chapter tags · `+`/`−` zoom · `0` 100% · `F` fit · `[` `]` collapse/expand groups · `1 2 3` phone tabs.

## Reporting bugs & feature requests
Use the bug icon in the top bar or **Library → Help & feedback**. Each click opens a new GitHub issue (<https://github.com/Ugwattu/paper-press/issues>) pre-filled with a **unique report ID** in the title and body plus diagnostics (app build, browser, screen, class/scheme, paper seed and counts, options). *Copy diagnostics* gives you the same text for pasting elsewhere. Attach a backup file if the problem depends on your data.

## Backup & restore
**Library → Backup & restore** downloads one JSON file with your presets, schemes, current paper, settings and logo, and restores it on any device or browser. Restoring replaces the data on that device (you are asked to confirm first). Browsers can clear site data, so back up now and then.

## Table layout (matches the Word template)
The “Q. No. …” instruction row is wider on the English side than the Urdu side, while the stems below stay equal. **Auto-fit instruction row** (on by default) measures each table's English instruction and widens that cell just enough to keep it on one line, e.g. “Q. No. 4: Write short answers to any FOUR (4) questions. (4 × 2 = 8)”; switch it off to use the manual **Instruction row split** slider. Text and serial numbers (including “Q. No. 5” and “سوال نمبر 5”) are top-aligned by default (each switchable), and every bold option applies to both the English and the Urdu text.

## Interface
Five settings sections in the left navigation (**Paper · Header · Layout · Edit · Library**), the paper in the middle, and a **Blueprint** panel (button in the top bar, or `L`) that slides in from the right and docks beside the paper on very wide screens. On phones the bottom bar switches between Settings, Paper and Blueprint. Light and dark themes; colours are CSS variables at the top of `app.css`.

## Word / OnlyOffice export notes
* Every paragraph gets an **exact** line height computed like the preview (a multiple of the font size). Word's default "auto" spacing multiplies the font's own built-in line height (about 1.15 for Times, about 2 for Nastaliq), which is what used to add extra space only in the file.
* The OMR response sheet is one flat table (no nested tables, which force extra empty paragraphs) laid out like the board sample: contiguous blocks filled down each column, shared borders, bubbles as shared PNG images.

## Your data survives updates
Everything is stored in the browser for the exact address the app is opened from (`https://<user>.github.io/<repo>/`, or `http://localhost:8000`, …). Updating the files never touches it: new versions read the stored settings, presets and schemes and fill in any new options with defaults. Two things to know:
* A *different* address (another port, `localhost` vs `127.0.0.1`, a file opened from disk, another browser/profile) has its own empty storage. Use **Library → Backup & restore** to move data between them.
* Each time a new build opens existing data it first saves a raw safety copy; **Library → Backup & restore → “Download the safety copy…”** gives it back as a normal backup file.
`npm test` includes a persistence test that loads a profile saved by the original version of the app.

## Header and student-field styles
**Header → Header style:** *Classic* (title block + boxed Class/Subject/Marks/Time strip), *Banner* (shaded title box with the strip attached), *Ruled* (borderless strip between two rules) and *Split* (Class/Subject left, title centre, Time/Marks right).
**Header → Student fields style:** *Boxed* (table cells), *Lines* (one row of fill-in lines), *Stacked* (Name on its own line, the rest below) and *Roll boxes* (Roll No. as six digit boxes). All of them work in the preview and the .docx, honour the Name / Roll No. / Section / Date toggles, and can sit at the top or the end of the paper.
The *Paper code & examiner line* is printed at the very top of the paper. Text and serial numbers in the question tables are always top-aligned.

## System presets
The built-in presets can be removed with **Remove** on their card (undo is offered) and brought back with **Restore system presets**. Which ones you removed is saved with your other data.
