// simple note-taking app with localStorage save
document.addEventListener('DOMContentLoaded', () => {
  const KEY = 'notetaking.notes.v1';
  const searchEl = document.getElementById('search');
  const newBtn = document.getElementById('newBtn');
  const notesList = document.getElementById('notesList');
  const titleEl = document.getElementById('title');
  const bodyEl = document.getElementById('body');
  const saveBtn = document.getElementById('saveBtn');
  const deleteBtn = document.getElementById('deleteBtn');
  const previewToggle = document.getElementById('previewToggle');
  const previewEl = document.getElementById('preview');

  let notes = load();
  let activeId = null;
  let previewVisible = false;

  renderList();

  searchEl.addEventListener('input', renderList);
  newBtn.addEventListener('click', createNew);
  saveBtn.addEventListener('click', saveActive);
  deleteBtn.addEventListener('click', deleteActive);
  previewToggle.addEventListener('click', togglePreview);
  notesList.addEventListener('click', (e) => {
    const li = e.target.closest('li');
    if (!li) return;
    loadNote(li.dataset.id);
  });

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; }
  }
  function persist() { localStorage.setItem(KEY, JSON.stringify(notes)); }

  function renderList() {
    const q = (searchEl.value || '').toLowerCase();
    notesList.innerHTML = '';
    const filtered = notes.filter(n => (n.title || '').toLowerCase().includes(q) || (n.body || '').toLowerCase().includes(q));
    if (filtered.length === 0) {
      notesList.innerHTML = '<div class="empty">No notes — click New to create one.</div>';
      return;
    }
    filtered.sort((a,b) => b.updated - a.updated);
    for (const n of filtered) {
      const li = document.createElement('li');
      li.dataset.id = n.id;
      li.className = (n.id === activeId) ? 'active' : '';
      li.innerHTML = `<div class="note-title">${escape(n.title || 'Untitled')}</div>
                      <div class="note-meta">${new Date(n.updated).toLocaleString()}</div>`;
      notesList.appendChild(li);
    }
  }

  function createNew() {
    const now = Date.now();
    const note = { id: String(now), title: '', body: '', created: now, updated: now };
    notes.push(note);
    activeId = note.id;
    persist();
    renderList();
    loadNote(activeId);
    titleEl.focus();
  }

  function loadNote(id) {
    const note = notes.find(n => n.id === id);
    if (!note) return;
    activeId = id;
    titleEl.value = note.title;
    bodyEl.value = note.body;
    previewEl.innerHTML = renderMarkdown(note.body);
    renderList();
  }

  function saveActive() {
    if (!activeId) {
      createNew();
      return;
    }
    const note = notes.find(n => n.id === activeId);
    if (!note) return;
    note.title = titleEl.value;
    note.body = bodyEl.value;
    note.updated = Date.now();
    persist();
    renderList();
    if (previewVisible) previewEl.innerHTML = renderMarkdown(note.body);
  }

  function deleteActive() {
    if (!activeId) return;
    if (!confirm('Delete this note?')) return;
    notes = notes.filter(n => n.id !== activeId);
    persist();
    activeId = null;
    titleEl.value = '';
    bodyEl.value = '';
    previewEl.innerHTML = '';
    renderList();
  }

  function togglePreview() {
    previewVisible = !previewVisible;
    previewEl.classList.toggle('hidden', !previewVisible);
    bodyEl.classList.toggle('hidden', previewVisible);
    if (previewVisible) previewEl.innerHTML = renderMarkdown(bodyEl.value);
  }

  // minimal markdown
  function renderMarkdown(md) {
    if (!md) return '<div class="empty">Nothing to preview</div>';
    let s = escape(md);
    s = s.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    s = s.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    s = s.replace(/^# (.*$)/gim, '<h1>$1</h1>');
    s = s.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*(.*?)\*/g, '<em>$1</em>');
    s = s.replace(/\[(.*?)\]\((https?:\/\/[^\s)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    s = s.replace(/\n/g, '<br>');
    return s;
  }

  function escape(s) {
    return String(s || '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
  }

  // quick save on Ctrl+S
  window.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
      e.preventDefault();
      saveActive();
    }
  });
});