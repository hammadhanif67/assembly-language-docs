// Dev-only: writes dist/_gallery.html showing every diagram (use ?p=0,1,2… to page, &t=theme)
const fs = require('fs');
const d = 'src/diagrams';
const meta = Object.fromEntries(fs.readdirSync(d).filter((f) => f.endsWith('.svg')).map((f) => [f.slice(0, -4), 1]));
const defs = fs.readFileSync('dist/index.html', 'utf8').match(/<svg width="0"[\s\S]*?<\/svg>/)[0];
const items = Object.keys(meta).map((n) => `<div class="it"><h4>${n}</h4><div class="diagram-canvas">${fs.readFileSync(d + '/' + n + '.svg', 'utf8')}</div></div>`);
fs.writeFileSync('dist/_gallery.html', `<!doctype html><html><head><meta charset="utf-8"><link rel="stylesheet" href="css/main.css"><style>body{padding:10px;background:var(--bg)}.g{display:grid;grid-template-columns:1fr;gap:10px}.it h4{margin:2px 0;font:11px monospace;color:var(--text)}.it .diagram-canvas{padding:6px;height:auto;min-height:300px;display:flex;align-items:center}.it svg{min-width:0!important;max-height:640px}</style></head><body>${defs}<div class="g">${items.join('')}</div>
<script>const q=new URLSearchParams(location.search);const p=+(q.get('p')||0);document.documentElement.dataset.theme=q.get('t')||'brutalist';document.querySelectorAll('.it').forEach((e,i)=>{if(i!==p)e.remove()});</script></body></html>`);
console.log('gallery written');
