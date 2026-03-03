// ─── Utilities ───────────────────────────────────────────────────────────────

function $(id) { return document.getElementById(id); }

function toast(msg, duration = 2500) {
  const el = $('toast');
  el.textContent = msg;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), duration);
}

// ─── Tab switching ────────────────────────────────────────────────────────────

document.querySelectorAll('nav button[data-tab]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('nav button[data-tab]').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    btn.classList.add('active');
    $(`tab-${btn.dataset.tab}`).classList.add('active');

    if (btn.dataset.tab === 'visibility') loadRepos();
    if (btn.dataset.tab === 'settings') loadEnv();
    if (btn.dataset.tab === 'preview') pollPreviewStatus();
  });
});

// ─── Status bar ───────────────────────────────────────────────────────────────

async function loadStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    setDot('dot-github', data.env?.githubPat);
    setDot('dot-openai', data.env?.openaiKey);
    setDot('dot-cache', data.cache?.exists);
    setDot('dot-output', data.outputExists);
  } catch {
    // ignore
  }
}

function setDot(id, ok) {
  const el = $(id);
  if (!el) return;
  el.classList.toggle('ok', Boolean(ok));
  el.classList.toggle('warn', !ok);
}

// ─── Generate tab ─────────────────────────────────────────────────────────────

const logEl = $('gen-log');

$('btn-copy-log').addEventListener('click', () => {
  const text = logEl.innerText;
  navigator.clipboard.writeText(text).then(() => toast('Log copied!')).catch(() => toast('Copy failed'));
});

function appendLog(text, cls) {
  const line = document.createElement('div');
  if (cls) line.className = cls;
  line.textContent = text;
  logEl.appendChild(line);
  logEl.scrollTop = logEl.scrollHeight;
}

function clearLog() {
  logEl.innerHTML = '';
}

$('btn-generate').addEventListener('click', async () => {
  const btn = $('btn-generate');
  const outputDir = $('opt-output').value || './output';

  // Check if output exists, and confirm deletion before proceeding
  let cleanOutput = false;
  try {
    const statusRes = await fetch('/api/status');
    const status = await statusRes.json();
    if (status.outputExists) {
      const confirmed = window.confirm(
        `Output directory "${outputDir}" already exists.\n\nDelete it and regenerate from scratch?`
      );
      if (!confirmed) return;
      cleanOutput = true;
    }
  } catch {
    // If status check fails, proceed without cleaning
  }

  btn.disabled = true;
  clearLog();
  appendLog('Starting generate...');

  const opts = {
    output:                   outputDir,
    maxRepos:                 parseInt($('opt-max-repos').value) || 100,
    author:                   $('opt-author').value,
    publicOnly:               !$('opt-include-private').checked,
    skipAi:                   $('opt-skip-ai').checked,
    skipPrivateDescriptions:  $('opt-skip-private-desc').checked,
    cache:                    !$('opt-no-cache').checked,
    cleanOutput,
  };

  // SSE via POST — use fetch + ReadableStream
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(opts),
    });

    if (res.status === 409) {
      appendLog('⚠ Generate already running.', 'log-warn');
      btn.disabled = false;
      return;
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const parts = buffer.split('\n\n');
      buffer = parts.pop();

      for (const part of parts) {
        const eventLine = part.split('\n').find(l => l.startsWith('event:'));
        const dataLine  = part.split('\n').find(l => l.startsWith('data:'));
        const eventType = eventLine ? eventLine.slice(6).trim() : 'message';
        const data      = dataLine  ? dataLine.slice(5).trim()  : '';

        if (eventType === 'done') {
          const payload = JSON.parse(data || '{}');
          appendLog(`✓ Done! Portfolio generated at: ${payload.output || './output'}`, 'log-done');
          loadStatus();
          try {
            const ps = await fetch('/api/preview/status');
            const pd = await ps.json();
            if (!pd.running) appendLog('  → Go to the Preview tab to start previewing your portfolio', null);
          } catch { /* ignore */ }
        } else if (eventType === 'error') {
          const payload = JSON.parse(data || '{}');
          appendLog(`✗ Error: ${payload.message || data}`, 'log-error');
        } else {
          const text = data || part.replace(/^data:/, '').trim();
          if (text) {
            const cls = text.startsWith('✗') ? 'log-error'
                      : text.startsWith('⚠') ? 'log-warn'
                      : text.startsWith('✓') ? 'log-done'
                      : null;
            appendLog(text, cls);
          }
        }
      }
    }
  } catch (err) {
    appendLog(`✗ ${err.message}`, 'log-error');
  }

  btn.disabled = false;
});

$('btn-clear-cache').addEventListener('click', async () => {
  const btn = $('btn-clear-cache');
  btn.disabled = true;
  try {
    const res = await fetch('/api/clear-cache', { method: 'POST' });
    const data = await res.json();
    appendLog(data.message || 'Cache cleared.');
    loadStatus();
  } catch (err) {
    appendLog(`✗ ${err.message}`, 'log-error');
  }
  btn.disabled = false;
});

// ─── Visibility tab ───────────────────────────────────────────────────────────

let allRepos = [];

async function loadRepos() {
  const list = $('repo-list');
  const empty = $('repos-empty');
  list.innerHTML = '<div style="color:var(--text-dim);padding:.5rem">Loading...</div>';

  try {
    const res = await fetch('/api/repos');
    const data = await res.json();
    allRepos = data.repos || [];
    renderRepos($('repos-search').value);
    empty.style.display = allRepos.length === 0 ? 'block' : 'none';
    list.style.display  = allRepos.length === 0 ? 'none'  : 'flex';
  } catch {
    list.innerHTML = '';
    empty.style.display = 'block';
  }
}

function renderRepos(filter) {
  const list = $('repo-list');
  const query = (filter || '').toLowerCase();
  const filtered = allRepos.filter(r => r.name.toLowerCase().includes(query));

  list.innerHTML = '';
  for (const repo of filtered) {
    const row = document.createElement('div');
    row.className = 'repo-row';
    row.dataset.name = repo.name;

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = repo.enable;
    cb.addEventListener('change', () => {
      const r = allRepos.find(x => x.name === repo.name);
      if (r) r.enable = cb.checked;
    });

    const name = document.createElement('span');
    name.className = 'repo-name';
    name.textContent = repo.name;

    const meta = document.createElement('div');
    meta.className = 'repo-meta';
    if (repo.primaryLanguage) {
      const lang = document.createElement('span');
      lang.className = 'badge';
      lang.textContent = repo.primaryLanguage;
      meta.appendChild(lang);
    }
    if (repo.stargazerCount > 0) {
      const stars = document.createElement('span');
      stars.textContent = `★${repo.stargazerCount}`;
      meta.appendChild(stars);
    }
    if (repo.isPrivate) {
      const priv = document.createElement('span');
      priv.className = 'badge badge-private';
      priv.textContent = '🔒 private';
      meta.appendChild(priv);
    }

    row.appendChild(cb);
    row.appendChild(name);
    row.appendChild(meta);
    list.appendChild(row);
  }
}

$('repos-search').addEventListener('input', e => renderRepos(e.target.value));

$('btn-save-repos').addEventListener('click', async () => {
  const btn = $('btn-save-repos');
  btn.disabled = true;
  try {
    const res = await fetch('/api/repos', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ repos: allRepos.map(r => ({ name: r.name, enable: r.enable })) }),
    });
    const data = await res.json();
    toast(data.ok ? 'Saved!' : `Error: ${data.message}`);
  } catch (err) {
    toast(`Error: ${err.message}`);
  }
  btn.disabled = false;
});

// ─── Settings tab ─────────────────────────────────────────────────────────────

async function loadEnv() {
  try {
    const res = await fetch('/api/env');
    const data = await res.json();
    const fields = ['GITHUB_PAT', 'OPENAI_API_KEY', 'OPENAI_MODEL', 'AUTHOR_NAME', 'SITE_URL'];
    for (const key of fields) {
      const el = $(`env-${key}`);
      if (el && data[key] !== undefined) el.value = data[key];
    }
  } catch {
    // ignore
  }
}

document.querySelectorAll('.eye-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const input = $(btn.dataset.target);
    if (input) input.type = input.type === 'password' ? 'text' : 'password';
  });
});

$('btn-save-env').addEventListener('click', async () => {
  const btn = $('btn-save-env');
  btn.disabled = true;
  const fields = ['GITHUB_PAT', 'OPENAI_API_KEY', 'OPENAI_MODEL', 'AUTHOR_NAME', 'SITE_URL'];
  const body = {};
  for (const key of fields) {
    const el = $(`env-${key}`);
    if (el) body[key] = el.value;
  }
  try {
    const res = await fetch('/api/env', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await res.json();
    toast(data.ok ? 'Settings saved!' : `Error: ${data.message}`);
    loadStatus();
  } catch (err) {
    toast(`Error: ${err.message}`);
  }
  btn.disabled = false;
});

// ─── Preview tab ──────────────────────────────────────────────────────────────

async function pollPreviewStatus() {
  try {
    const res = await fetch('/api/preview/status');
    const data = await res.json();
    updatePreviewUI(data.running);
  } catch {
    // ignore
  }
}

function updatePreviewUI(running) {
  const dot      = $('preview-dot');
  const text     = $('preview-status-text');
  const link     = $('preview-link');
  const hint     = $('preview-hint');
  const btnStart = $('btn-preview-start');
  const btnStop  = $('btn-preview-stop');

  dot.classList.toggle('running', running);
  text.textContent = running ? 'Running — localhost:4321' : 'Stopped';
  btnStart.disabled = running;
  btnStop.disabled  = !running;
  link.style.display = running ? 'inline-flex' : 'none';
  hint.style.display = running ? 'block' : 'none';
}

$('btn-preview-start').addEventListener('click', async () => {
  const btn = $('btn-preview-start');
  btn.disabled = true;
  $('preview-status-text').textContent = 'Starting...';
  try {
    const output = $('opt-output')?.value || './output';
    const res = await fetch('/api/preview/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ outputDir: output }),
    });
    const data = await res.json();
    if (!data.ok) {
      toast(data.message || 'Failed to start preview');
      btn.disabled = false;
      $('preview-status-text').textContent = 'Stopped';
      return;
    }
    // Poll until Astro server is ready (up to 30s), then show link
    let attempts = 0;
    const poll = setInterval(async () => {
      attempts++;
      try {
        await fetch('http://localhost:4321');
        clearInterval(poll);
        updatePreviewUI(true);
      } catch {
        if (attempts > 30) { clearInterval(poll); btn.disabled = false; }
      }
    }, 1000);
  } catch (err) {
    toast(`Error: ${err.message}`);
    btn.disabled = false;
  }
});

$('btn-preview-stop').addEventListener('click', async () => {
  try {
    await fetch('/api/preview/stop', { method: 'POST' });
    updatePreviewUI(false);
  } catch (err) {
    toast(`Error: ${err.message}`);
  }
});

// ─── Init ─────────────────────────────────────────────────────────────────────

loadStatus();
