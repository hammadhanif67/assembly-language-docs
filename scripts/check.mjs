// Link & asset checker for dist/. Fails (exit 1) on broken internal links, anchors or missing files.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIST = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const files = [];
(function walk(d) {
  for (const e of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, e.name);
    if (e.isDirectory()) walk(p);
    else if (p.endsWith('.html') && !p.endsWith('404.html')) files.push(p);
  }
})(DIST);

const idsCache = new Map();
const idsOf = (f) => {
  if (!idsCache.has(f)) idsCache.set(f, new Set([...fs.readFileSync(f, 'utf8').matchAll(/\sid="([^"]+)"/g)].map((m) => m[1])));
  return idsCache.get(f);
};

let errors = 0, checked = 0;
for (const f of files) {
  const html = fs.readFileSync(f, 'utf8');
  const refs = [...html.matchAll(/\s(?:href|src|data-src)="([^"]+)"/g)].map((m) => m[1]);
  for (const ref of refs) {
    if (/^(https?:|mailto:|data:|javascript:)/.test(ref)) continue;
    checked++;
    const [p, hash] = ref.split('#');
    const target = p ? path.resolve(path.dirname(f), p) : f;
    if (!fs.existsSync(target)) { console.error(`✗ ${path.relative(DIST, f)} → ${ref} (missing file)`); errors++; continue; }
    if (hash && target.endsWith('.html') && !idsOf(target).has(decodeURIComponent(hash))) {
      console.error(`✗ ${path.relative(DIST, f)} → ${ref} (missing anchor)`); errors++;
    }
  }
  // duplicate ids within a page
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
  const dup = ids.filter((x, i) => ids.indexOf(x) !== i && !x.startsWith('d-'));
  if (dup.length) { console.error(`✗ ${path.relative(DIST, f)} duplicate ids: ${[...new Set(dup)].join(', ')}`); errors++; }
  // images need alt text
  for (const m of html.matchAll(/<img\b[^>]*>/g)) if (!/\salt="/.test(m[0])) { console.error(`✗ ${path.relative(DIST, f)} <img> without alt`); errors++; }
}
console.log(`${files.length} pages, ${checked} internal references checked, ${errors} problem(s).`);
process.exit(errors ? 1 : 0);
