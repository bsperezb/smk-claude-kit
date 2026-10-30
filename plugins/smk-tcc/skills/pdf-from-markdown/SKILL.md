---
name: pdf-from-markdown
description: Generate PDF files from Markdown using puppeteer + marked. Use when the user asks to produce a PDF from a markdown document or report. Also use it when the PDF must carry the SMk brand ("estilos SMk", "branding SMk", "estilos de la empresa") — it takes precedence over the generic pdf skill in that case.
---

# Generating PDFs from Markdown

Cross-platform method (Linux, macOS, Windows). Do not assume pandoc, weasyprint, or a system Chromium are installed — puppeteer downloads its own Chromium.

## Working method

1. Use Node.js ≥ 18 (however it is installed on the system: NVM, installer, etc.)
2. Install locally without saving: `npm install --no-save puppeteer marked`
3. Create a `.mjs` script that:
   - Reads the markdown and converts it to HTML with `marked`
   - Launches puppeteer. On Linux, pass `args: ["--no-sandbox", "--disable-setuid-sandbox"]` (required on Ubuntu 23.10+ due to AppArmor); on macOS/Windows launch with no extra args. Detect with `process.platform === "linux"`.
   - Uses `page.setContent()` + `page.pdf()` with **`format: "Letter"` (carta), portrait, 20mm margins** — see "Page size" below
4. For emoji rendering, include a fallback chain in the font-family: `'Noto Color Emoji'` (Linux), `'Apple Color Emoji'` (macOS), `'Segoe UI Emoji'` (Windows)
5. For a TOC: use HTML with `<div class="toc">` and anchor links inside the markdown itself
6. **Tables always need `table-layout: fixed; width: 100%` on `table` and `word-wrap: break-word; overflow-wrap: anywhere` on `th`/`td`.** Without this, a table with long unbroken strings (paths, code spans, URLs) silently overflows the page width and Puppeteer clips the last column(s) mid-word instead of wrapping — no error, just a broken-looking PDF. Also use a body font-size of at least 12pt (10–10.5pt for table cells) — smaller reads as low-effort.

## Page size (standard — do not deviate)

- **Default: `Letter` (carta, 8.5 × 11 in), portrait.** This is the team standard.
- If the user asks for *oficio*, use `Legal` (8.5 × 14 in), also portrait. Never use `A4`, and never pass a custom `width`/`height`.
- **Never use `landscape: true`** to make a wide table fit. A landscape or A4 PDF looks non-standard when printed, shared or attached. Fix the content instead:
  - Keep tables to **6 columns or fewer**. Split a wide table into two or three tables that share the first column (for example, "specs" and "usage"), or transpose it (attributes as rows, items as columns).
  - Keep cell text short; move long descriptions out of the table into a paragraph below it.
- Add page numbers with `displayHeaderFooter` + a `footerTemplate` using `<span class="pageNumber"></span> / <span class="totalPages"></span>` (and an empty `headerTemplate`).
- After generating, check the size with `pdfinfo <file>.pdf | grep "Page size"`: it must read `612 x 792 pts (letter)` (or `612 x 1008 pts (legal)` for oficio). Render a page or two with `pdftoppm -r 80 -png -f 2 -l 2` and look at the tables before delivering.

## SMk branding mode

Only when the user explicitly asks for the SMk look ("estilos SMk", "branding SMk", "estilos de la empresa", "con la marca"). Otherwise ignore this section.

- **Source of the rules:** load the `smk-branding` skill (it ships through the organization, e.g. `anthropic-skills:smk-branding`) and read its `SKILL.md`. Use its assets from that skill's base directory (`assets/fonts/web/*.woff2`, `assets/logos/*.png`, `assets/formas/`). Never copy them into this plugin or the repo (it is public).
- **Precedence:** this skill owns the *engine* (puppeteer + marked, Letter, margins, table CSS, minimum font sizes, verification, cleanup). `smk-branding` owns the *look*. If they conflict on layout mechanics, this skill wins; on colors, fonts, logo and shapes, `smk-branding` wins.
- **Print mapping** (its type scale is for slides, not for paper):
  - `h1`/`h2`: Nunito Sans 900, UPPERCASE, line-height ~0.95, slight negative tracking. `em` inside a heading: Nunito Sans italic 300, lowercase.
  - Body, tables, code, labels: Inconsolata. Body ≥ 12pt, table cells 10–10.5pt.
  - Colors: page `#f9f7f4`, ink `#262626`, accent `#c7ff00` only for emphasis (key word/figure, never body backgrounds). Only palette hexes (no `#000`). Set `printBackground: true`. A `body` background alone leaves the 20mm margins white: declare `@page { size: Letter; margin: 20mm; background: #f9f7f4 }` and call `page.pdf({ preferCSSPageSize: true, printBackground: true, ... })` instead of passing `format`/`margin` (still Letter, still 20mm).
  - Left-aligned, never justified. Flat cards and tables, no shadows.
- **Assets inline:** embed the fonts with `@font-face` and base64 data URIs (the PDF must not depend on installed fonts). Footer via `footerTemplate`: black logo (`SMK_logo_black.png`, base64) bottom-left, page number bottom-right.
- **Cover** only if the user asks for it: black page, white title in Nunito, `SMK_logo_white.png` bottom-right, one shape from `assets/formas/`.
- **Text:** keep it literal by default and do not ask for the format (it is already PDF). If the source says "SMK", ask before changing it to "SMk". Never invent figures. No mention of Claude or AI in the document.
- **Fallback:** if `smk-branding` is not available (user outside the organization), say so and generate the standard PDF.
- **Verify** with `pdffonts` (Nunito Sans and Inconsolata embedded) in addition to the Page size checks.

## Document content

The PDF is read on its own, without access to the repo, the folder or the session it came from. Do not mention sibling files, evidence folders, scripts, other reports or paths of the working directory in the body of the document. If the reader needs a piece of information, put it in the document itself.

## Cleanup

Always clean up afterwards: delete the generated `.mjs` script and temp markdown, and `npm uninstall puppeteer marked` so the project is not polluted. Replace emoji shortcodes (`:red_circle:`) with real Unicode characters before generating.
