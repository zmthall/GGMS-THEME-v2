/* scripts/generate-icon-sprite.js
   Generates snippets/ui-icon-sprite.liquid from assets/icons/*.svg
*/

const fs = require("fs");
const path = require("path");

const ICONS_DIR = path.resolve(process.cwd(), "assets", "icons");
const OUT_FILE = path.resolve(process.cwd(), "snippets", "ui-icon-sprite.liquid");

function stripSvg(svg) {
  // Remove XML/doctype/comments
  svg = svg.replace(/<\?xml[\s\S]*?\?>/g, "");
  svg = svg.replace(/<!doctype[\s\S]*?>/gi, "");
  svg = svg.replace(/<!--[\s\S]*?-->/g, "");

  // Extract viewBox
  const viewBoxMatch = svg.match(/viewBox="([^"]+)"/i);
  const viewBox = viewBoxMatch ? viewBoxMatch[1] : "0 0 24 24";

  // Extract inner contents of <svg>...</svg>
  const innerMatch = svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
  let inner = innerMatch ? innerMatch[1].trim() : svg.trim();

  // Optional cleanup: remove width/height attributes if they slipped in
  // (they won't matter inside <symbol>, but keeps things tidy)
  inner = inner.replace(/\s(width|height)="[^"]*"/gi, "");

  return { viewBox, inner };
}

function toSymbolId(filename) {
  const base = filename.replace(/\.svg$/i, "");
  return `icon-${base}`;
}

function main() {
  if (!fs.existsSync(ICONS_DIR)) {
    console.error(`Icons dir not found: ${ICONS_DIR}`);
    process.exit(1);
  }

  const files = fs
    .readdirSync(ICONS_DIR)
    .filter((f) => f.toLowerCase().endsWith(".svg"))
    .sort((a, b) => a.localeCompare(b));

  if (files.length === 0) {
    console.error("No SVG files found in assets/icons/");
    process.exit(1);
  }

  const symbols = files.map((file) => {
    const fullPath = path.join(ICONS_DIR, file);
    const svg = fs.readFileSync(fullPath, "utf8");
    const { viewBox, inner } = stripSvg(svg);
    const id = toSymbolId(file);

    return `  <symbol id="${id}" viewBox="${viewBox}">\n    ${inner}\n  </symbol>`;
  });

  const output = `{%- comment -%}
  ui-icon-sprite.liquid
  Auto-generated from assets/icons/*.svg
  Run: node scripts/generate-icon-sprite.js
{%- endcomment -%}

<svg xmlns="http://www.w3.org/2000/svg" style="display:none" aria-hidden="true" focusable="false">
${symbols.join("\n\n")}
</svg>
`;

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true });
  fs.writeFileSync(OUT_FILE, output, "utf8");
}

main();
