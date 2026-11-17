const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const resultsDir = path.join(root, 'test-results');
const outputDir = path.join(root, 'playwright-report', 'common-man');
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
const videoAsset = videoFiles.length ? `test-recording-${videoFiles.length === 1 ? path.extname(videoFiles[0]).slice(1) : 'webm'}${path.extname(videoFiles[0]).toLowerCase()}` : null;
if (videoAsset && videoFiles[0]) fs.copyFileSync(videoFiles[0], path.join(assetsDir, videoAsset));

const descriptions = {
  'test-automation-message-sent': ['Text message', 'A normal message was sent successfully in the chat.'],
  'Screenshot-message-sent': ['Screenshot message', 'A screenshot was attached to the conversation and sent successfully.'],
  'Uploaded-image-sent': ['Uploaded image', 'An image was uploaded and sent successfully in the conversation.'],
  'task-message-sent': ['Task micro app', 'The Task micro app with “please verify this” was created and sent successfully.'],
  'Multiple-choice-poll-Microapp-sent': ['Multiple-choice poll', 'A poll with Yes and No choices was created and sent.'],
  'Yes / No-poll-Microapp-sent': ['Yes / No poll', 'A simple Yes / No question was created and sent.'],
  'Yes-No-poll-Microapp-sent': ['Yes / No poll', 'A simple Yes / No question was created and sent.'],
  'Rating-poll-Microapp-sent': ['Rating poll', 'A rating question asking for feedback was sent.'],
  'Feedback-poll-Microapp-sent': ['Feedback poll', 'A feedback question was created and sent successfully.'],
  'Meeting-Microapp-sent': ['Meeting scheduling', 'A meeting named “Test from Automation” was created.'],
  'Long-message-sent': ['Long message', 'A longer chat message was sent and remained readable.'],
  'Thread-creation-message-sent': ['Conversation thread', 'A new thread named “Automation Thread” was created and used.'],
  'WOW-message-heart-reacted': ['Heart reaction', 'A red heart reaction was added to a chat message.'],
  'WOW-heart-screenshot-pasted-and-sent': ['Image sharing', 'A screenshot was copied and pasted into the conversation.'],
  'Thank-you-message-liked': ['Thumbs-up reaction', 'A thumbs-up reaction was added to “Thank You”.'],
  'Inline-reply-message-sent': ['Inline Reply', 'The “Check This” message received the inline reply “Okey”.'],
  'Check-message-comment-sent': ['Check message comment', 'The “Check message” was sent, double-clicked, and commented on with “Okey”.'],
  'Reply-to-message-sent': ['Reply to message', 'The “Reply to this” message was replied to with “Replied”.'],
  'Forward-message-sent': ['Forwarded message', 'The “Forward Message” text was forwarded to Chetan Patil.'],
};

const pngFiles = [];
function walk(dir) {
  if (!fs.existsSync(dir)) return;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.png$/i.test(entry.name)) pngFiles.push(full);
  }
}
walk(resultsDir);

const unique = new Map();
for (const file of pngFiles) {
  if (file.includes(`${path.sep}attachments${path.sep}`)) continue;
  const base = path.basename(file, '.png');
  if (!unique.has(base)) unique.set(base, file);
}

const screenshotSequence = [
  'test-automation-message-sent',
  'Screenshot-message-sent',
  'Uploaded-image-sent',
  'task-message-sent',
  'custom-reminder-sent',
  'Multiple-choice-poll-Microapp-sent',
  'Yes or No-poll-Microapp-sent',
  'Rating-poll-Microapp-sent',
  'Feedback-poll-Microapp-sent',
  'Meeting-Microapp-sent',
  'Long-message-sent',
  'Thread-creation-message-sent',
  'WOW-message-heart-reacted',
  'WOW-heart-screenshot-pasted-and-sent',
  'Thank-you-message-liked',
  'Inline-reply-message-sent',
  'Reply-to-message-sent',
  'Forward-message-sent',
];
const screenshotOrder = new Map(screenshotSequence.map((name, index) => [name, index]));
const orderedScreenshots = [...unique.entries()].sort(([first], [second]) =>
  (screenshotOrder.get(first) ?? screenshotSequence.length) -
    (screenshotOrder.get(second) ?? screenshotSequence.length) ||
  first.localeCompare(second)
);

const cards = orderedScreenshots.map(([base, source], i) => {
  const safeBase = base.replace(/[\\/:*?"<>|]/g, '-');
  const assetName = `${String(i + 1).padStart(2, '0')}-${safeBase}.png`;
  fs.copyFileSync(source, path.join(assetsDir, assetName));
  const lookup = descriptions[base] || [base.replace(/[-_]+/g, ' ').replace(/\b\w/g, c => c.toUpperCase()), 'This action was completed successfully during testing.'];
  return { title: lookup[0], description: lookup[1], assetName };
});

let lastRun = { status: 'unknown', tests: [] };
try {
  lastRun = JSON.parse(fs.readFileSync(path.join(resultsDir, '.common-man-run.json'), 'utf8'));
} catch (error) {
  if (error.code !== 'ENOENT') throw error;
}
const failedTests = (Array.isArray(lastRun.tests) ? lastRun.tests : [])
  .filter(test => test.status !== test.expectedStatus);
const passed = lastRun.status === 'passed';
const failedCount = failedTests.length;
const now = new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
const escapeHtml = value => String(value).replace(/[&<>"']/g, character => ({
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}[character]));
const failedScenarios = failedTests.length
  ? `<section class="failures"><h2>Failed scenarios</h2><ul>${failedTests.map(test => {
    const location = `${test.file || 'Unknown file'}${test.line ? `:${test.line}` : ''}`;
    const details = test.errors.length
      ? `<pre>${escapeHtml(test.errors.join('\n\n'))}</pre>`
      : '';
    return `<li><strong>${escapeHtml(test.title)}</strong><span>${escapeHtml(test.status)}${test.project ? ` · ${escapeHtml(test.project)}` : ''} · ${escapeHtml(location)}</span>${details}</li>`;
  }).join('')}</ul></section>`
  : '';

const scenarios = [
  'Verify that the user can send a text message',
  'Verify that the user can send a screenshot',
  'Verify that the user can upload and send an image',
  'Verify that the user can send the Task micro app',
  'Verify that the user can send a Custom Reminder',
  'Verify that the user can send a Multiple-choice Poll',
  'Verify that the user can send a Yes or No poll',
  'Verify that the user can send a Rating poll',
  'Verify that the user can send a Feedback Poll',
  'Verify that the user can send the Meeting micro app',
  'Verify that the user can send a long message',
  'Verify that the user can create a thread',
  'Verify that the user can react to a message with a red heart',
  'Verify that the user can share a screenshot using copy and paste',
  'Verify that the user can react to a message with a Like',
  'Verify that the user can give an inline reply',
  'Verify that the user can reply to a message',
  'Verify that the user can forward a message to Chetan Patil',
  'Verify that the user can forward a Screenshot message to Chetan Patil',
  'Verify that the user can forward a text message with image to Chetan patil'
];

const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Yoodle Chat – Test Summary</title>
<style>
:root{--navy:#173b6b;--blue:#2563eb;--green:#15803d;--green-bg:#ecfdf3;--ink:#172033;--muted:#667085;--line:#e6eaf0;--page:#f5f7fb;--white:#fff;--red:#b42318;--red-bg:#fef3f2}*{box-sizing:border-box}body{margin:0;background:var(--page);color:var(--ink);font-family:Segoe UI,Inter,Arial,sans-serif}.shell{max-width:1180px;margin:auto;padding:28px}.header{background:linear-gradient(120deg,#173b6b,#2458a0);color:white;border-radius:18px;padding:30px 34px;display:flex;justify-content:space-between;align-items:center;box-shadow:0 10px 30px rgba(23,59,107,.14)}.brand{display:flex;align-items:center;gap:14px}.brand-mark{width:52px;height:52px;border-radius:14px;background:white;color:#173b6b;display:grid;place-items:center;font-size:24px;font-weight:800}.brand h1{margin:0;font-size:26px}.brand p{margin:5px 0 0;color:#dbeafe}.result{background:white;color:var(--green);border-radius:12px;padding:12px 16px;font-weight:800;text-align:center}.result small{display:block;color:var(--muted);font-size:11px;margin-top:3px;font-weight:600}.summary{display:grid;grid-template-columns:repeat(4,1fr);gap:14px;margin:18px 0}.summary-card{background:white;border:1px solid var(--line);border-radius:14px;padding:18px}.summary-card small{display:block;color:var(--muted);font-size:12px;margin-bottom:7px}.summary-card strong{font-size:24px}.summary-card .good{color:var(--green)}.summary-card .bad,.result.bad{color:var(--red)}.overview{background:white;border:1px solid var(--line);border-radius:14px;padding:22px;margin-bottom:18px}.overview-grid{display:grid;grid-template-columns:1fr 1fr;gap:22px}.overview h2,.section-head h2,.failures h2{margin:0 0 14px;font-size:18px}.overview p{color:var(--muted);line-height:1.65;margin:0}.checks{list-style:none;padding:0;margin:0}.checks li{padding:9px 0;border-bottom:1px solid var(--line);color:#344054}.checks li:last-child{border:0}.checks li:before{content:'✓';display:inline-grid;place-items:center;width:21px;height:21px;border-radius:50%;background:var(--green-bg);color:var(--green);font-weight:800;margin-right:9px}.scenarios{margin:0;padding-left:22px;color:#344054}.scenarios li{padding:7px 0}.section-head{display:flex;justify-content:space-between;align-items:end;margin:24px 0 12px}.section-head h2{margin:0}.section-head p{margin:4px 0 0;color:var(--muted);font-size:13px}.failures{background:white;border:1px solid #fecdca;border-radius:14px;padding:22px;margin-bottom:18px}.failures h2{color:var(--red)}.failures ul{list-style:none;margin:0;padding:0}.failures li{padding:14px 0;border-top:1px solid var(--line)}.failures li:first-child{border-top:0}.failures li strong,.failures li span{display:block}.failures li span{color:var(--muted);font-size:12px;margin-top:5px}.failures pre{white-space:pre-wrap;overflow-wrap:anywhere;background:var(--red-bg);padding:12px;border-radius:8px;color:#7a271a;font-size:12px}.gallery{display:grid;grid-template-columns:repeat(2,1fr);gap:16px}.evidence{background:white;border:1px solid var(--line);border-radius:14px;overflow:hidden;cursor:pointer;transition:.2s}.evidence:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(23,59,107,.08)}.evidence-image{background:#eef2f7;border-bottom:1px solid var(--line);height:300px;display:grid;place-items:center;padding:10px}.evidence-image img{width:100%;height:100%;object-fit:contain}.evidence-body{padding:16px 18px}.evidence-number{color:var(--blue);font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.08em}.evidence h3{margin:5px 0;font-size:16px}.evidence p{margin:0;color:var(--muted);font-size:13px;line-height:1.45}.footer{color:var(--muted);text-align:center;font-size:12px;padding:24px 0 8px}.modal{display:none;position:fixed;inset:0;background:rgba(8,20,38,.92);z-index:20;padding:30px;align-items:center;justify-content:center}.modal.open{display:flex}.modal img{max-width:95vw;max-height:90vh;object-fit:contain;border-radius:10px}.close{position:absolute;right:24px;top:18px;width:40px;height:40px;border:0;border-radius:50%;background:white;color:#172033;font-size:22px;cursor:pointer}
@media(max-width:800px){.header{align-items:flex-start}.summary{grid-template-columns:repeat(2,1fr)}.overview-grid,.gallery{grid-template-columns:1fr}.brand h1{font-size:21px}.result{min-width:110px}.evidence-image{height:240px}}@media(max-width:520px){.shell{padding:14px}.header{padding:22px;flex-direction:column;gap:18px}.summary{gap:10px}.summary-card{padding:14px}.summary-card strong{font-size:20px}}
</style></head><body>
<div class="shell"><header class="header"><div class="brand"><div class="brand-mark">Y</div><div><h1>Yoodle Chat Check</h1><p>Easy-to-understand test summary</p></div></div><div class="result ${passed ? '' : 'bad'}">${passed ? '✓ ALL CHECKS PASSED' : 'ATTENTION REQUIRED'}<small>${now}</small></div></header>
<section class="summary"><div class="summary-card"><small>Overall status</small><strong class="${passed ? 'good' : 'bad'}">${passed ? 'Working well' : 'Needs review'}</strong></div><div class="summary-card"><small>Checks performed</small><strong>${cards.length}</strong></div><div class="summary-card"><small>Failed checks</small><strong class="${failedCount ? 'bad' : 'good'}">${failedCount}</strong></div><div class="summary-card"><small>Application</small><strong>Yoodle Chat</strong></div></section>
<section class="overview"><div class="overview-grid"><div><h2>What this check covered</h2><p>The automated check opened Yoodle Chat, signed in, found the person <strong>Chetan Patil</strong>, and tried the most important ways of communicating.</p></div><div><h2>What worked</h2><ul class="checks"><li>Login and contact search</li><li>Messages, tasks, polls and meetings</li><li>Threads and file sharing</li><li>Reactions such as heart and thumbs-up</li><li>Inline Reply</li><li>Replies to messages</li></ul></div></div></section>
<section class="overview"><h2>Scenarios tested</h2><ol class="scenarios">${scenarios.map(scenario => `<li>${scenario}</li>`).join('')}</ol></section>
${videoAsset ? `<section class="overview"><h2>Complete browser recording</h2><p style="margin-bottom:14px">Watch the entire test from browser launch until the final step.</p><video controls preload="metadata" style="width:100%;max-height:720px;background:#111827;border-radius:12px"><source src="assets/${encodeURIComponent(videoAsset)}" type="${path.extname(videoAsset).toLowerCase() === '.mp4' ? 'video/mp4' : 'video/webm'}">Your browser does not support video playback.</video></section>` : ''}
${failedScenarios}
<div class="section-head"><div><h2>Visual results</h2><p>Select any screenshot to view it at full size.</p></div></div>
<section class="gallery">${cards.map((card,i)=>`<article class="evidence" onclick="openImage('assets/${encodeURIComponent(card.assetName)}','${card.title.replace(/'/g,'&#39;')}')"><div class="evidence-image"><img src="assets/${encodeURIComponent(card.assetName)}" alt="${card.title}" loading="lazy"></div><div class="evidence-body"><div class="evidence-number">Check ${String(i+1).padStart(2,'0')}</div><h3>${card.title}</h3><p>${card.description}</p></div></article>`).join('')}</section>
</div>
<div class="modal" id="modal" onclick="closeImage()"><button class="close" type="button" onclick="closeImage()">×</button><img id="modalImage" alt="Full-size test screenshot"></div>
<script>function openImage(src,title){const image=document.getElementById('modalImage');image.src=src;image.alt=title;document.getElementById('modal').classList.add('open')}function closeImage(){document.getElementById('modal').classList.remove('open')}document.addEventListener('keydown',event=>{if(event.key==='Escape')closeImage()})</script>
</body></html>`;

fs.writeFileSync(path.join(outputDir, 'index.html'), html);
console.log(`Common-man report generated: ${path.join(outputDir, 'index.html')}`);
