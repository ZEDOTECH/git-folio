// ─── Utilities ───────────────────────────────────────────────────────────────

function $(id) { return document.getElementById(id); }

function showOutputModal(outputDir) {
  return new Promise(resolve => {
    $('modal-msg').textContent = `"${outputDir}" already exists and will be deleted before regenerating. This cannot be undone.`;
    const overlay = $('modal-overlay');
    overlay.classList.add('show');
    const done = (confirmed) => { overlay.classList.remove('show'); resolve(confirmed); };
    $('modal-confirm').onclick = () => done(true);
    $('modal-cancel').onclick  = () => done(false);
    overlay.onclick = (e) => { if (e.target === overlay) done(false); };
  });
}

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
      const confirmed = await showOutputModal(outputDir);
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
    maxRepos:                 10000,
    author:                   $('opt-author').value,
    skipAi:                   $('opt-skip-ai').checked,
    cleanOutput,
  };

  // Attach includedRepos from Visibility selection (if any repos were loaded)
  try {
    const allStored = JSON.parse(localStorage.getItem('git-folio:all-repos-list') || 'null');
    if (allStored && allStored.length > 0) {
      const excluded = new Set(JSON.parse(localStorage.getItem('git-folio:excluded-repos') || '[]'));
      opts.includedRepos = allStored.map(r => r.name).filter(n => !excluded.has(n));
    }
  } catch { /* ignore localStorage errors, generate all repos */ }

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


// ─── Visibility tab ───────────────────────────────────────────────────────────

let allReposList = [];
let visibilitySearch = '';
let visibilityFilter = 'all'; // 'all' | 'included' | 'excluded'

function getExcluded() {
  try { return JSON.parse(localStorage.getItem('git-folio:excluded-repos') || '[]'); }
  catch { return []; }
}

function setExcluded(arr) {
  localStorage.setItem('git-folio:excluded-repos', JSON.stringify(arr));
}

function updateCounter(visibleRepos) {
  const excluded = new Set(getExcluded());
  const list = visibleRepos ?? allReposList;
  const selected = list.filter(r => !excluded.has(r.name)).length;
  const counter = $('visibility-counter');
  if (counter) counter.textContent = `${selected} / ${list.length} selected`;
  // Reflect selected count in Generate tab
  const genInput = $('opt-max-repos');
  if (genInput) {
    const totalSelected = allReposList.filter(r => !excluded.has(r.name)).length;
    genInput.value = totalSelected > 0
      ? `${totalSelected} repo${totalSelected !== 1 ? 's' : ''} selected (from Visibility tab)`
      : 'All selected repos (configure in Visibility tab)';
  }
}

function toggleRepo(name, isIncluded) {
  const excl = getExcluded();
  if (isIncluded) {
    setExcluded(excl.filter(n => n !== name));
  } else {
    if (!excl.includes(name)) setExcluded([...excl, name]);
  }
  updateCounter();
}

function renderPreselectRepos() {
  const container = $('repo-preselect-list');
  const empty = $('repos-preselect-empty');
  const toolbar = $('visibility-toolbar');
  const excluded = new Set(getExcluded());

  const query = visibilitySearch.toLowerCase();
  const visible = allReposList.filter(r => {
    if (!r.name.toLowerCase().includes(query)) return false;
    if (visibilityFilter === 'included') return !excluded.has(r.name);
    if (visibilityFilter === 'excluded') return excluded.has(r.name);
    return true;
  });

  container.innerHTML = '';

  for (const repo of visible) {
    const included = !excluded.has(repo.name);

    const card = document.createElement('div');
    card.className = 'repo-card' + (included ? ' is-included' : '');

    // Header row: checkbox + name + badge
    const header = document.createElement('div');
    header.className = 'repo-card-header';

    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.checked = included;

    const nameEl = document.createElement('span');
    nameEl.className = 'repo-card-name';
    nameEl.textContent = repo.name;
    nameEl.title = repo.name;

    const badge = document.createElement('span');
    badge.className = repo.isPrivate ? 'badge badge-private' : 'badge';
    badge.textContent = repo.isPrivate ? 'private' : 'public';

    header.appendChild(cb);
    header.appendChild(nameEl);
    header.appendChild(badge);
    card.appendChild(header);

    // Description row (if available)
    if (repo.description) {
      const desc = document.createElement('div');
      desc.className = 'repo-card-desc';
      desc.textContent = repo.description;
      desc.title = repo.description;
      card.appendChild(desc);
    }

    card.addEventListener('click', () => {
      const nowIncluded = !cb.checked;
      cb.checked = nowIncluded;
      card.classList.toggle('is-included', nowIncluded);
      toggleRepo(repo.name, nowIncluded);
    });

    container.appendChild(card);
  }

  const hasRepos = allReposList.length > 0;
  empty.style.display = hasRepos ? 'none' : 'block';
  toolbar.style.display = hasRepos ? 'flex' : 'none';
  updateCounter(visible);
}

$('btn-load-repos').addEventListener('click', async () => {
  const btn = $('btn-load-repos');
  const empty = $('repos-preselect-empty');
  const container = $('repo-preselect-list');
  btn.disabled = true;
  btn.textContent = 'Loading…';

  try {
    const res = await fetch('/api/repos/list?refresh=true');
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      empty.textContent = data.message || 'Failed to load repos. Check your GitHub PAT in Settings.';
      empty.style.display = 'block';
      container.innerHTML = '';
      return;
    }
    const data = await res.json();
    allReposList = data.repos || [];
    localStorage.setItem('git-folio:all-repos-list', JSON.stringify(allReposList));
    visibilitySearch = '';
    const searchEl = $('visibility-search');
    if (searchEl) searchEl.value = '';
    renderPreselectRepos();
  } catch (err) {
    empty.textContent = `Failed to load repos: ${err.message}`;
    empty.style.display = 'block';
    container.innerHTML = '';
  } finally {
    btn.disabled = false;
    btn.textContent = 'Load Repos';
  }
});

document.querySelectorAll('.seg-ctrl button[data-filter]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.seg-ctrl button[data-filter]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    visibilityFilter = btn.dataset.filter;
    renderPreselectRepos();
  });
});

$('visibility-search').addEventListener('input', e => {
  visibilitySearch = e.target.value;
  renderPreselectRepos();
});

function getVisibleRepos() {
  const excluded = new Set(getExcluded());
  const query = visibilitySearch.toLowerCase();
  return allReposList.filter(r => {
    if (!r.name.toLowerCase().includes(query)) return false;
    if (visibilityFilter === 'included') return !excluded.has(r.name);
    if (visibilityFilter === 'excluded') return excluded.has(r.name);
    return true;
  });
}

$('btn-select-all').addEventListener('click', () => {
  const excl = getExcluded();
  const visibleNames = new Set(getVisibleRepos().map(r => r.name));
  setExcluded(excl.filter(n => !visibleNames.has(n)));
  renderPreselectRepos();
});

$('btn-deselect-all').addEventListener('click', () => {
  const excl = new Set(getExcluded());
  getVisibleRepos().forEach(r => excl.add(r.name));
  setExcluded([...excl]);
  renderPreselectRepos();
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
loadEnv();

// Restore repos list from previous session
try {
  const stored = JSON.parse(localStorage.getItem('git-folio:all-repos-list') || 'null');
  if (Array.isArray(stored) && stored.length > 0) {
    allReposList = stored;
    renderPreselectRepos();
  }
} catch { /* ignore */ }
