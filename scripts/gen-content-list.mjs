// Workflow-internal helper (run by CI, not by hand).
//   node scripts/gen-content-list.mjs            -> full "Content promotion" issue body
//   node scripts/gen-content-list.mjs --names a,b -> markdown table rows for the given paths
// Turns templates/*.json into human-friendly, alphabetical, grouped output.

import fs from 'node:fs';

const EXACT = {
  index: 'Home', page: 'Page (default)', product: 'Product (default)',
  collection: 'Collection (default)', 'list-collections': 'Collections list',
  cart: 'Cart', search: 'Search', '404': '404 — Not found', password: 'Password',
  blog: 'Blog', article: 'Article', gift_card: 'Gift card',
};
const title = (s) => s.split(/[-_]/).filter(Boolean)
  .map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

function friendly(path) {
  const base = path.replace(/^templates\//, '').replace(/\.json$/, '');
  if (EXACT[base]) return EXACT[base];
  const dot = base.indexOf('.');
  if (dot === -1) return title(base);
  const kind = base.slice(0, dot);
  const rest = base.slice(dot + 1);
  if (kind === 'page') return title(rest);
  const kindLabel = EXACT[kind] ? EXACT[kind].replace(/ \(default\)$/, '') : title(kind);
  return `${kindLabel} · ${rest}`;
}

const namesArg = process.argv.indexOf('--names');
if (namesArg !== -1) {
  const paths = (process.argv[namesArg + 1] || '').split(',').map((s) => s.trim()).filter(Boolean);
  const rows = paths.map((p) => ({ p, name: friendly(p) })).sort((a, b) => a.name.localeCompare(b.name));
  console.log(rows.map((r) => `| ${r.name} | \`${r.p}\` |`).join('\n'));
  process.exit(0);
}

// full body mode — lists PAGE templates only, read from --dir (default: templates)
// Staging is git-connected, so this repo IS Staging's content — no theme pull needed.
const dirArg = process.argv.indexOf('--dir');
const dir = dirArg !== -1 ? process.argv[dirArg + 1] : 'templates';
const isPageFile = (f) => /^page(\..+)?\.json$/.test(f); // page.json and page.<suffix>.json only

let files = [];
try {
  files = fs.readdirSync(dir).filter(isPageFile).map((f) => `templates/${f}`);
} catch { /* dir may not exist */ }

const rows = files.map((p) => ({ p, name: friendly(p) })).sort((a, b) => a.name.localeCompare(b.name));
const line = (r) => `- [ ] ${r.name} — \`${r.p}\``;

let out = '';
out += 'Tick the page(s) to promote to **Production**, then add the **`promote`** label.\n';
out += 'List out of date? Add the **`refresh`** label — it rebuilds from the repo, then removes itself.\n\n';
out += '_Auto-generated from this repo\'s page templates (Staging is git-connected, so this **is** Staging\'s content). Do not edit the list by hand. Refreshing resets all ticks._\n\n';
out += '<!-- CONTENT-LIST:START -->\n';
out += '### Pages\n' + (rows.length ? rows.map(line).join('\n') : '_no page templates found in the repo_') + '\n';
out += '<!-- CONTENT-LIST:END -->\n';
process.stdout.write(out);
