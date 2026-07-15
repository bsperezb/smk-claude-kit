---
name: pdf-from-markdown
description: Generate PDF files from Markdown using puppeteer + marked. Use when the user asks to produce a PDF from a markdown document or report.
---

# Generating PDFs from Markdown

Cross-platform method (Linux, macOS, Windows). Do not assume pandoc, weasyprint, or a system Chromium are installed — puppeteer downloads its own Chromium.

## Working method

1. Use Node.js ≥ 18 (however it is installed on the system: NVM, installer, etc.)
2. Install locally without saving: `npm install --no-save puppeteer marked`
3. Create a `.mjs` script that:
   - Reads the markdown and converts it to HTML with `marked`
   - Launches puppeteer. On Linux, pass `args: ["--no-sandbox", "--disable-setuid-sandbox"]` (required on Ubuntu 23.10+ due to AppArmor); on macOS/Windows launch with no extra args. Detect with `process.platform === "linux"`.
   - Uses `page.setContent()` + `page.pdf()` with A4 format and 20mm margins
4. For emoji rendering, include a fallback chain in the font-family: `'Noto Color Emoji'` (Linux), `'Apple Color Emoji'` (macOS), `'Segoe UI Emoji'` (Windows)
5. For a TOC: use HTML with `<div class="toc">` and anchor links inside the markdown itself

## Cleanup

Always clean up afterwards: delete the generated `.mjs` script and temp markdown, and `npm uninstall puppeteer marked` so the project is not polluted. Replace emoji shortcodes (`:red_circle:`) with real Unicode characters before generating.
