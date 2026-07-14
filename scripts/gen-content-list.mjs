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

// full body mode
const paths = fs.readdirSync('templates').filter((f) => f.endsWith('.json')).map((f) => `templates/${f}`);
const rows = paths.map((p) => ({ p, name: friendly(p) })).sort((a, b) => a.name.localeCompare(b.name));
const isPage = (p) => p === 'templates/page.json' || p.startsWith('templates/page.');
const pages = rows.filter((r) => isPage(r.p));
const others = rows.filter((r) => !isPage(r.p));
const line = (r) => `- [ ] ${r.name} — \`${r.p}\``;

let out = '';
out += 'Tick the page(s) to promote to **Production**, then add the **`promote`** label.\n';
out += 'The list needs refreshing? Add the **`refresh`** label (it rebuilds this list, then removes itself).\n\n';
out += '_Auto-generated from `templates/*.json`. Do not edit the list by hand. Refreshing resets all ticks._\n\n';
out += '<!-- CONTENT-LIST:START -->\n';
out += '### Pages\n' + (pages.length ? pages.map(line).join('\n') : '_none_') + '\n\n';
out += '### Other templates\n' + (others.length ? others.map(line).join('\n') : '_none_') + '\n';
out += '<!-- CONTENT-LIST:END -->\n';
process.stdout.write(out);
