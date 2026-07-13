#!/usr/bin/env node
// -----------------------------------------------------------------------------
// promote-content.mjs — multi-select CLI dispatcher for content patch releases.
//
// Lists page templates from `main` (git = source of truth for which pages exist),
// lets you pick one OR MANY, and dispatches the "Publish Content Patch to
// Production" workflow with a comma-separated `files=` input. The workflow still
// pulls the chosen pages from Staging and pushes only those to Prod (and still
// pauses for production-approval).
//
// This is the "external dispatcher" — it exists only because GitHub's native
// Run-workflow form supports neither multi-select nor a dynamic dropdown. The
// page list here is fully dynamic (read live from git); there is no array to
// maintain when pages are added or removed.
//
// It lists every templates/*.json (editor-owned CONTENT — Home/index.json,
// pages, product, collection, etc.). The .liquid phase pages (Microsystems,
// etc.) are CODE and go via "Publish Code to Production", so they intentionally
// do NOT appear here.
//
// Usage:
//   node scripts/promote-content.mjs                       # interactive multi-select
//   node scripts/promote-content.mjs page.about-us.json page.faqs.json
//   node scripts/promote-content.mjs --list                # just print the pages
//   node scripts/promote-content.mjs --dry-run page.faqs.json   # show the dispatch, don't run it
//
// Requires: gh CLI logged in (`gh auth status`), Node 18+.
// -----------------------------------------------------------------------------

import { execFileSync } from 'node:child_process';
import readline from 'node:readline';

const WORKFLOW = 'publish-content-production.yml';
const REF = 'main';
const DIR = 'templates';

const argv = process.argv.slice(2);
const DRY = argv.includes('--dry-run');
const LIST = argv.includes('--list');
const pageArgs = argv.filter((a) => !a.startsWith('--'));

function gh(args, opts = {}) {
  return execFileSync('gh', args, { encoding: 'utf8', ...opts });
}
function fail(msg) {
  console.error(`\n✖ ${msg}`);
  process.exit(1);
}
function ask(q) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((res) => rl.question(q, (a) => { rl.close(); res(a); }));
}

// 0. gh present & authed
try {
  gh(['auth', 'status'], { stdio: ['ignore', 'ignore', 'ignore'] });
} catch {
  fail('GitHub CLI not authenticated. Run:  gh auth login');
}

// 1. repo (owner/name)
let repo;
try {
  repo = gh(['repo', 'view', '--json', 'nameWithOwner', '-q', '.nameWithOwner']).trim();
} catch {
  fail('Could not resolve the GitHub repo (are you inside the repo?).');
}

// 2. dynamic page list from git `main`
let entries;
try {
  entries = JSON.parse(gh(['api', `repos/${repo}/contents/${DIR}?ref=${REF}`]));
} catch (e) {
  fail(`Could not list ${DIR}/ on ${REF}: ${String(e.message).split('\n')[0]}`);
}
const pages = entries
  .filter((e) => e.type === 'file' && e.name.endsWith('.json'))
  .map((e) => `${DIR}/${e.name}`)
  .sort();

if (!pages.length) fail(`No *.json content templates found in ${DIR}/ on ${REF}.`);

if (LIST) {
  console.log(`\nPromotable content pages on ${REF} (${pages.length}):\n`);
  pages.forEach((p) => console.log(`  ${p}`));
  process.exit(0);
}

// 3. selection — from args (non-interactive) or interactive multi-select
let selected;
if (pageArgs.length) {
  selected = pageArgs.map((a) => (a.includes('/') ? a : `${DIR}/${a}`));
  const unknown = selected.filter((s) => !pages.includes(s));
  if (unknown.length) fail(`Unknown page(s): ${unknown.join(', ')}\nRun with --list to see valid pages.`);
} else {
  console.log(`\nPromotable content pages on ${REF}:\n`);
  pages.forEach((p, i) => console.log(`  ${String(i + 1).padStart(2)}. ${p.slice(DIR.length + 1)}`));
  const ans = (await ask('\nEnter numbers to promote (e.g. 1,3,5  or  1 3 5), "a" for all, blank to cancel: ')).trim();
  if (!ans) fail('Cancelled.');
  if (ans.toLowerCase() === 'a') {
    selected = pages;
  } else {
    const idx = ans.split(/[\s,]+/).filter(Boolean).map((n) => Number(n));
    const bad = idx.filter((n) => !Number.isInteger(n) || n < 1 || n > pages.length);
    if (bad.length) fail(`Invalid selection: ${bad.join(', ')}`);
    selected = [...new Set(idx)].map((n) => pages[n - 1]);
  }
}
if (!selected.length) fail('Nothing selected.');

// 4. confirm + dispatch
const filesArg = selected.join(',');
console.log('\nWill promote to PRODUCTION:');
selected.forEach((s) => console.log(`  • ${s}`));

if (DRY) {
  console.log(`\n[dry-run] would dispatch:\n  gh workflow run ${WORKFLOW} --ref ${REF} -f files=${filesArg}`);
  process.exit(0);
}

const ok = (await ask(`\nDispatch to ${selected.length} page(s)? Runs will pause for production-approval. (y/N) `)).trim();
if (!/^y(es)?$/i.test(ok)) fail('Cancelled.');

try {
  gh(['workflow', 'run', WORKFLOW, '--ref', REF, '-f', `files=${filesArg}`]);
} catch (e) {
  fail(`Dispatch failed: ${String(e.message).split('\n')[0]}`);
}
console.log('\n✔ Dispatched. Approve it in the Actions tab (production-approval), then it promotes.');
console.log(`  Tip:  gh run list --workflow=${WORKFLOW} --limit 1`);
