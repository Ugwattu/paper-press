# Paper Press — ALP Board Paper Studio (CS 9 & 10)

A static, no-build web app. Everything runs in the browser; nothing is uploaded.

## Files
| File | Purpose |
|---|---|
| `index.html`, `styles.css`, `script.js` | the app |
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
