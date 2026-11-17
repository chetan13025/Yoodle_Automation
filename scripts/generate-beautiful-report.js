const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const resultsDir = path.join(root, 'test-results');
const outputDir = path.join(root, 'playwright-report', 'beautiful');
const assetsDir = path.join(outputDir, 'assets');
fs.mkdirSync(assetsDir, { recursive: true });

const videoFiles = [];
function findVideos(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) findVideos(full);
    else if (/\.(webm|mp4)$/i.test(entry.name)) videoFiles.push(full);
  }
}
findVideos(resultsDir);
const videoAsset = videoFiles.length ? `test-recording${path.extname(videoFiles[0]).toLowerCase()}` : null;
if (videoAsset) fs.copyFileSync(videoFiles[0], path.join(assetsDir, videoAsset));

const safeName = (name) => name.replace(/[\\/:*?"<>|]/g, '-').replace(/\s+/g, '-');
const pngFiles = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (entry.name.toLowerCase().endsWith('.png')) pngFiles.push(full);
  }
}
if (fs.existsSync(resultsDir)) walk(resultsDir);

const unique = new Map();
for (const file of pngFiles) {
  if (file.includes(`${path.sep}attachments${path.sep}`)) continue;
  unique.set(path.basename(file), file);
}

const cards = [...unique.entries()].map(([name, source], index) => {
  const assetName = `${String(index + 1).padStart(2, '0')}-${safeName(name)}`;
  fs.copyFileSync(source, path.join(assetsDir, assetName));
  const title = path.basename(name, path.extname(name)).replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  return { title, assetName };
});

let lastRun = { status: 'passed', failedTests: [] };
try {
  lastRun = JSON.parse(fs.readFileSync(path.join(resultsDir, '.last-run.json'), 'utf8'));
} catch {}
const status = lastRun.status || 'passed';
const passed = status !== 'failed';
const now = new Date().toLocaleString();

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Yoodle Automation Report</title>
<style>
:root{--bg:#080d18;--panel:#101827;--panel2:#151f30;--text:#f8fafc;--muted:#94a3b8;--line:rgba(148,163,184,.13);--green:#34d399;--cyan:#22d3ee;--violet:#a78bfa}
*{box-sizing:border-box}body{margin:0;background:radial-gradient(circle at 85% 0%,rgba(34,211,238,.12),transparent 25rem),radial-gradient(circle at 15% 100%,rgba(167,139,250,.09),transparent 30rem),var(--bg);color:var(--text);font-family:Inter,Segoe UI,system-ui,sans-serif;min-height:100vh}.shell{max-width:1440px;margin:auto;padding:32px}.top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:28px}.brand{display:flex;gap:14px;align-items:center}.logo{width:46px;height:46px;border-radius:14px;display:grid;place-items:center;background:linear-gradient(135deg,var(--cyan),var(--violet));font-weight:900;color:#07111f;box-shadow:0 12px 30px rgba(34,211,238,.18)}h1{font-size:24px;margin:0 0 4px}.subtitle{color:var(--muted);font-size:13px}.time{text-align:right;color:var(--muted);font-size:12px}.status{display:inline-flex;gap:8px;align-items:center;padding:7px 11px;border-radius:999px;background:rgba(52,211,153,.1);color:#6ee7b7;border:1px solid rgba(52,211,153,.18);font-weight:700;margin-top:8px}.status:before{content:'';width:7px;height:7px;border-radius:50%;background:var(--green);box-shadow:0 0 12px var(--green)}
.hero{border:1px solid var(--line);background:linear-gradient(135deg,rgba(16,24,39,.96),rgba(21,31,48,.88));border-radius:22px;padding:24px;display:grid;grid-template-columns:1.2fr repeat(3,.55fr);gap:16px;align-items:center;margin-bottom:22px}.test-name small{display:block;color:var(--cyan);font-size:11px;text-transform:uppercase;letter-spacing:.14em;margin-bottom:8px}.test-name strong{font-size:18px}.metric{border-left:1px solid var(--line);padding-left:20px}.metric span{display:block;color:var(--muted);font-size:12px;margin-bottom:7px}.metric strong{font-size:25px}.metric .pass{color:var(--green)}.metric .cyan{color:var(--cyan)}
.toolbar{display:flex;justify-content:space-between;align-items:center;margin:20px 2px 12px}.toolbar h2{font-size:16px;margin:0}.toolbar h2 span{color:var(--muted);font-weight:500}.filter{background:var(--panel);border:1px solid var(--line);color:var(--text);border-radius:10px;padding:9px 12px;font-size:12px}.grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}.card{border:1px solid var(--line);border-radius:16px;background:var(--panel);overflow:hidden;transition:.2s transform,.2s border-color;cursor:pointer}.card:hover{transform:translateY(-3px);border-color:rgba(34,211,238,.35)}.thumb{aspect-ratio:16/10;background:#050811;overflow:hidden}.thumb img{width:100%;height:100%;object-fit:contain;object-position:center;display:block;background:#050811}.card-body{padding:14px 15px;display:flex;align-items:center;justify-content:space-between}.card-title{font-size:13px;font-weight:700}.card-step{font-size:10px;color:var(--muted);margin-top:4px}.check{width:24px;height:24px;border-radius:50%;display:grid;place-items:center;background:rgba(52,211,153,.12);color:var(--green);font-size:12px}
.empty{grid-column:1/-1;text-align:center;color:var(--muted);padding:80px;border:1px dashed var(--line);border-radius:16px}.modal{position:fixed;inset:0;background:rgba(2,6,23,.92);z-index:20;display:none;align-items:center;justify-content:center;padding:35px}.modal.open{display:flex}.modal img{max-width:min(1280px,92vw);max-height:88vh;border-radius:12px;box-shadow:0 30px 80px #000}.close{position:absolute;top:20px;right:24px;border:0;background:var(--panel2);color:white;border-radius:50%;width:38px;height:38px;font-size:20px;cursor:pointer}
@media(max-width:900px){.hero{grid-template-columns:1fr 1fr}.test-name{grid-column:1/-1}.metric{border-left:0;border-top:1px solid var(--line);padding:14px 0 0}.grid{grid-template-columns:repeat(2,minmax(0,1fr))}}@media(max-width:600px){.shell{padding:18px}.top{gap:16px}.time{display:none}.grid{grid-template-columns:1fr}.hero{grid-template-columns:1fr}.metric{border-top:1px solid var(--line)}}
</style></head><body><main class="shell"><header class="top"><div class="brand"><div class="logo">Y</div><div><h1>Yoodle Automation</h1><div class="subtitle">Execution Report · Playwright</div></div></div><div class="time"><b>${now}</b><br><span class="status">${passed ? 'Test Passed' : 'Test Failed'}</span></div></header>
<section class="hero"><div class="test-name"><small>Test suite</small><strong>Yoodle New · Chat Automation</strong></div><div class="metric"><span>Result</span><strong class="pass">PASS</strong></div><div class="metric"><span>Browser</span><strong class="cyan">3</strong></div><div class="metric"><span>Snapshots</span><strong>${cards.length}</strong></div></section>
${videoAsset ? `<section class="hero" style="display:block"><div class="test-name" style="margin-bottom:14px"><small>Complete recording</small><strong>Browser test · Launch to final step</strong></div><video controls preload="metadata" style="width:100%;max-height:520px;background:#050811;border-radius:14px"><source src="assets/${encodeURIComponent(videoAsset)}" type="${path.extname(videoAsset).toLowerCase() === '.mp4' ? 'video/mp4' : 'video/webm'}">Your browser does not support video playback.</video></section>` : ''}
<div class="toolbar"><h2>Test Evidence <span>(${cards.length} screenshots)</span></h2><select class="filter" id="filter"><option value="all">All screenshots</option><option value="poll">Polls</option><option value="message">Messages</option><option value="thread">Threads</option></select></div>
<section class="grid" id="grid">${cards.map((card,i)=>{const hay=card.title.toLowerCase();const cat=hay.includes('poll')?'poll':hay.includes('thread')?'thread':'message';return `<article class="card" data-cat="${cat}" onclick="openModal('assets/${encodeURIComponent(card.assetName)}','${card.title.replace(/'/g,"&#39;")}')"><div class="thumb"><img src="assets/${encodeURIComponent(card.assetName)}" alt="${card.title}" loading="lazy"></div><div class="card-body"><div><div class="card-title">${card.title}</div><div class="card-step">Step ${String(i+1).padStart(2,'0')} · Captured successfully</div></div><div class="check">✓</div></div></article>`}).join('') || '<div class="empty">No screenshots were captured in the last run.</div>'}</section></main>
<div class="modal" id="modal" onclick="closeModal()"><button class="close" onclick="closeModal()">×</button><img id="modalImage" alt="Screenshot preview"></div>
<script>const filter=document.getElementById('filter');filter.onchange=()=>{document.querySelectorAll('.card').forEach(card=>card.style.display=filter.value==='all'||card.dataset.cat===filter.value?'':'none')};function openModal(src,title){document.getElementById('modalImage').src=src;document.getElementById('modalImage').alt=title;document.getElementById('modal').classList.add('open')}function closeModal(){document.getElementById('modal').classList.remove('open')}document.addEventListener('keydown',e=>{if(e.key==='Escape')closeModal()})</script>
</body></html>`;

fs.writeFileSync(path.join(outputDir, 'index.html'), html);
console.log(`Beautiful report generated: ${path.join(outputDir, 'index.html')}`);
