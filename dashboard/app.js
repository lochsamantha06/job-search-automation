const params = new URLSearchParams(window.location.search);
const token = params.get('token') || '';

async function loadApplications() {
  const res = await fetch('data/applications.json?t=' + Date.now());
  if (!res.ok) throw new Error('Failed to load applications.json');
  return res.json();
}

function renderCard(app) {
  const card = document.createElement('div');
  card.className = 'card';
  card.id = 'card-' + app.id;

  const screenshotEl = app.screenshot
    ? `<img class="card-screenshot" src="${app.screenshot}" alt="Filled application screenshot" />`
    : `<div class="card-screenshot-missing">Screenshot unavailable</div>`;

  const isActionable = app.status === 'staged';
  const statusText = {
    staged: '', approved: '✅ Approved', skipped: '⏭ Skipped',
    submitted: '🚀 Submitted', fill_failed: '⚠️ Fill failed — manual apply',
    unknown_portal: 'ℹ️ Unknown portal — manual apply',
  }[app.status] || app.status;

  card.innerHTML = `
    <div class="card-header">
      <div>
        <div class="card-title">${app.title}</div>
        <div class="card-company">${app.company} · ${app.location} · ${app.portal}</div>
      </div>
      <span class="badge badge-${app.priority}">${app.priority} (${app.score})</span>
    </div>
    ${screenshotEl}
    <div class="card-actions">
      ${isActionable
        ? `<button class="btn btn-approve" onclick="approve('${app.id}', this)">✅ Approve & Submit</button>
           <button class="btn btn-skip" onclick="skip('${app.id}', this)">⏭ Skip</button>`
        : `<span class="status-label">${statusText}</span>`
      }
      <a href="${app.job_url}" target="_blank" style="margin-left:auto;font-size:0.85rem;color:#6366f1;align-self:center;">View job ↗</a>
    </div>`;
  return card;
}

async function approve(jobId, btn) {
  btn.disabled = true;
  btn.nextElementSibling.disabled = true;
  btn.textContent = 'Submitting...';
  const res = await fetch('/.netlify/functions/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId, token }),
  });
  const data = await res.json();
  const card = document.getElementById('card-' + jobId);
  card.querySelector('.card-actions').innerHTML =
    `<span class="status-label">${res.ok ? '✅ Submitted!' : '❌ Error: ' + data.error}</span>`;
}

async function skip(jobId, btn) {
  btn.disabled = true;
  btn.previousElementSibling.disabled = true;
  const res = await fetch('/.netlify/functions/skip', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ job_id: jobId, token }),
  });
  const card = document.getElementById('card-' + jobId);
  card.querySelector('.card-actions').innerHTML =
    `<span class="status-label">⏭ Skipped</span>`;
}

(async () => {
  try {
    const apps = await loadApplications();
    document.getElementById('loading').remove();
    const staged = apps.filter(a => a.status === 'staged');
    document.getElementById('subtitle').textContent =
      `${staged.length} application${staged.length !== 1 ? 's' : ''} waiting for review`;
    if (apps.length === 0) {
      document.getElementById('empty').hidden = false;
      return;
    }
    const container = document.getElementById('cards');
    apps.forEach(app => container.appendChild(renderCard(app)));
  } catch (e) {
    document.getElementById('loading').textContent = 'Error loading applications: ' + e.message;
  }
})();
