# Question figures

Put question illustrations in this folder as `.png` or `.svg` files. Keep PNG dimensions reasonable (suggested maximum 8,000 × 8,000 pixels and 20 MB) to avoid slow loads. Reference a figure by its filename in a question or option, for example:

```json
{
  "question": "Identify the logic gate shown below.",
  "figure": "and-gate.svg",
  "figureAlt": "A two-input AND gate symbol"
}
```

References may also use the explicit `figures/` prefix. Filenames may contain letters, numbers, dots, underscores and hyphens; nested folders and external URLs are not supported. The browser preview displays the original file. DOCX export embeds PNG images directly and rasterizes SVG files to PNG before embedding. Keep SVGs self-contained and under 2 MB: scripts, event-handler attributes, external URLs, linked stylesheets, and embedded data images are rejected during DOCX export and bank validation. Add descriptive `figureAlt` text; it is retained as the Word image accessibility description.
