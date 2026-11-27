# DOCX fidelity checks

Three layers, from cheap to expensive:

1. `tools/test-docx.js` – structural validity (zip CRCs, relationships, images).
2. `tools/test-docx-xml.js` – XML assertions on four fixture papers (bilingual Computer 9, English-only Physics 11,
   Maths with formula images, Computer 10 with OMR): Urdu paragraphs are `<w:bidi/>` with no explicit left/right `jc`
   (Word mirrors `jc` inside bidi paragraphs, so "no jc" means right-aligned), OMR bubble images exist, and every table
   has `tblW` = sum of `gridCol` = sum of each row's `tcW`.
3. `npm run docx:render` – LibreOffice headless -> PDF -> 60 dpi PNG -> `pixelmatch` against `tools/baselines/docx/`.
   Fails when a page differs by more than 2 % of pixels or the page count changes. Diff images are written to
   `build/docx-render/DIFF-*.png`. After an intentional layout change run `npm run docx:baselines` and commit the PNGs.

## Limits you must know
- **LibreOffice is not Word.** It catches regressions in our own output; it does not prove Word or OnlyOffice render the same.
  A manual open-in-Word and open-in-OnlyOffice check is still required for every release (Urdu right-aligned, bubbles
  visible, table widths, page breaks).
- Baselines depend on installed fonts. If CI fonts differ from the machine that made the baselines, download the
  `docx-render` artifact, check it looks right, and regenerate baselines on that environment.
- Non-Computer banks are empty (the author writes the questions), so those fixtures use synthetic in-memory questions
  labelled `FIXTURE`. They never reach `banks/`.
- Formula images in the Maths fixture are placeholder boxes: real MathJax needs a browser. Real formula glyph rendering is verified only by a browser run.
- `tools/fixtures/Template.docx` is not in the repository, so table widths are checked for internal consistency, not against that file.
