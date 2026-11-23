// Regenerates every src/diagrams/*.svg from the specs. Run: npm run diagrams
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, '..', '..', 'src', 'diagrams');
const files = fs.readdirSync(here).filter((f) => /^specs-.*\.mjs$/.test(f)).sort();
const all = {};
for (const f of files) Object.assign(all, (await import(`./${f}`)).specs);

fs.mkdirSync(OUT, { recursive: true });
for (const f of fs.readdirSync(OUT)) if (f.endsWith('.svg')) fs.unlinkSync(path.join(OUT, f));
for (const [name, make] of Object.entries(all)) fs.writeFileSync(path.join(OUT, `${name}.svg`), make().svg());
console.log(`Generated ${Object.keys(all).length} diagrams → src/diagrams/`);
