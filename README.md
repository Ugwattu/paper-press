# Paper Press — ALP Board Paper Studio (CS 9 & 10)

A static, no-build web app. Everything runs in the browser; nothing is uploaded.

## Files
| File | Purpose |
|---|---|
| `index.html`, `script.js` | the app (page structure and logic) |
| `app.css`, `paper.css` | interface styling / paper-preview styling |
| `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png`, `icon-*.png`, `manifest.webmanifest` | browser-tab icon and home-screen icons |
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
Open an issue at <https://github.com/Ugwattu/paper-press/issues> (there is also a bug icon in the top bar and a button under **Library → Help & feedback**). Attach a backup file if the problem depends on your data.

## Backup & restore
**Library → Backup & restore** downloads one JSON file with your presets, schemes, current paper, settings and logo, and restores it on any device or browser. Restoring replaces the data on that device (you are asked to confirm first). Browsers can clear site data, so back up now and then.

## Table layout (matches the Word template)
The “Q. No. …” instruction row is wider on the English side than the Urdu side (**Table & Page → Instruction row split**, default 58%), while the stems below stay equal. Text in cells is top-aligned (switchable), serial numbers are centred like the template, and every bold option applies to both the English and the Urdu text.

## Interface
Five settings sections in the left navigation (**Paper · Header · Layout · Edit · Library**), the paper in the middle, and a **Blueprint** panel (button in the top bar, or `L`) that slides in from the right and docks beside the paper on very wide screens. On phones the bottom bar switches between Settings, Paper and Blueprint. Light and dark themes; colours are CSS variables at the top of `app.css`.

## Word / OnlyOffice export notes
* Every paragraph gets an **exact** line height computed like the preview (a multiple of the font size). Word's default "auto" spacing multiplies the font's own built-in line height (about 1.15 for Times, about 2 for Nastaliq), which is what used to add extra space only in the file.
* The OMR response sheet is one flat table (no nested tables, which force extra empty paragraphs) laid out like the board sample: contiguous blocks filled down each column, shared borders, bubbles as shared PNG images.
