// simple to-do with localStorage persistence
document.addEventListener('DOMContentLoaded', () => {
  const input = document.getElementById('taskInput');
  const addBtn = document.getElementById('addBtn');
  const listEl = document.getElementById('taskList');
  const remainingEl = document.getElementById('remaining');
  const filterBtns = document.querySelectorAll('.filters button');
  const clearBtn = document.getElementById('clearCompleted');

  let tasks = load();
  let filter = 'all';

  render();

  addBtn.addEventListener('click', addTask);
  input.addEventListener('keydown', (e) => { if (e.key === 'Enter') addTask(); });
  listEl.addEventListener('click', onListClick);
  listEl.addEventListener('dblclick', onItemDoubleClick);
  filterBtns.forEach(b => b.addEventListener('click', onFilter));
  clearBtn.addEventListener('click', clearCompleted);

  function load() {
    try {
      return JSON.parse(localStorage.getItem('todo.tasks') || '[]');
    } catch {
      return [];
    }
  }

  function save() { localStorage.setItem('todo.tasks', JSON.stringify(tasks)); }

  function addTask() {
    const title = (input.value || '').trim();
    if (!title) return;
    tasks.unshift({ id: Date.now(), title, done: false });
    input.value = '';
    save();
    render();
  }

  function render() {
    listEl.innerHTML = '';
    const visible = tasks.filter(t => filter === 'all' ? true : filter === 'active' ? !t.done : t.done);
    visible.forEach(t => listEl.appendChild(renderTask(t)));
    remainingEl.textContent = String(tasks.filter(t => !t.done).length);
    updateFilterUI();
  }

  function renderTask(task) {
    const li = document.createElement('li');
    li.className = 'task-item';
    li.dataset.id = task.id;

    li.innerHTML = `
      <div class="task-left">
        <input type="checkbox" ${task.done ? 'checked' : ''} />
        <div class="task-title ${task.done ? 'completed' : ''}">${escapeHtml(task.title)}</div>
      </div>
      <div class="task-actions">
        <button class="edit" title="Edit">✏️</button>
        <button class="delete" title="Delete">🗑️</button>
      </div>
    `;
    return li;
  }

  function onListClick(e) {
    const li = e.target.closest('li');
    if (!li) return;
    const id = Number(li.dataset.id);
    if (e.target.matches('input[type="checkbox"]')) {
      toggleDone(id, e.target.checked);
    } else if (e.target.closest('.delete')) {
      deleteTask(id);
    } else if (e.target.closest('.edit')) {
      startEdit(li, id);
    }
  }

  function onItemDoubleClick(e) {
    const li = e.target.closest('li');
    if (!li) return;
    const id = Number(li.dataset.id);
    startEdit(li, id);
  }

  function toggleDone(id, done) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    t.done = !!done;
    save();
    render();
  }

  function deleteTask(id) {
    tasks = tasks.filter(x => x.id !== id);
    save();
    render();
  }

  function startEdit(li, id) {
    const t = tasks.find(x => x.id === id);
    if (!t) return;
    const titleEl = li.querySelector('.task-title');
    const inputEdit = document.createElement('input');
    inputEdit.type = 'text';
    inputEdit.value = t.title;
    inputEdit.className = 'edit-input';
    // replace title with input
    titleEl.replaceWith(inputEdit);
    inputEdit.focus();
    inputEdit.select();

    function finish(saveChange) {
      if (saveChange) {
        const v = (inputEdit.value || '').trim();
        if (v) t.title = v;
      }
      save();
      render();
    }

    inputEdit.addEventListener('blur', () => finish(true), { once: true });
    inputEdit.addEventListener('keydown', (ev) => {
      if (ev.key === 'Enter') finish(true);
      if (ev.key === 'Escape') finish(false);
    });
  }

  function onFilter(e) {
    filter = e.target.dataset.filter;
    render();
  }

  function updateFilterUI() {
    filterBtns.forEach(b => b.classList.toggle('active', b.dataset.filter === filter));
  }

  function clearCompleted() {
    tasks = tasks.filter(t => !t.done);
    save();
    render();
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c]));
  }
});