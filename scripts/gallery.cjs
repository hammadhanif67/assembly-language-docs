// Dev-only: writes dist/_gallery.html showing every diagram (use ?p=0,1,2… to page, &t=theme)
const fs = require('fs');
const d = 'src/diagrams';
const meta = JSON.parse(fs.readFileSync(d + '/_meta.json'));
const defs = fs.readFileSync('dist/index.html', 'utf8').match(/<svg width="0"[\s\S]*?<\/svg>/)[0];
const items = Object.keys(meta).map((n) => `<div class="it"><h4>${n}</h4><div class="diagram-canvas">${fs.readFileSync(d + '/' + n + '.svg', 'utf8')}</div></div>`);
fs.writeFileSync('dist/_gallery.html', `<!doctype html><html data-theme="brutalist"><head><meta charset="utf-8"><link rel="stylesheet" href="css/main.css"><style>body{padding:10px;background:var(--bg)}.g{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.it h4{margin:2px 0;font:11px monospace;color:var(--text)}.it .diagram-canvas{padding:6px;height:400px;display:flex;align-items:center}.it svg{min-width:0!important;max-height:385px}</style></head><body>${defs}<div class="g">${items.join('')}</div>
<script>const q=new URLSearchParams(location.search);const p=+(q.get('p')||0);document.documentElement.dataset.theme=q.get('t')||'brutalist';document.querySelectorAll('.it').forEach((e,i)=>{if(i<p*6||i>=p*6+6)e.remove()});</script></body></html>`);
console.log('gallery written');
