// replace existing script.js — inject cards and use per-app emoji instead of generic file icon
document.addEventListener('DOMContentLoaded', () => {
  const apps = [
    { id: 'bmi', title: 'BMI', folder: 'bmi', img: 'bmi.png', emoji: '⚖️' },
    { id: 'calculator', title: 'Calculator', folder: 'calculator', img: 'calculator.png', emoji: '🧮' },
    { id: 'calendar', title: 'Calendar', folder: 'calendar', img: 'calendar.png', emoji: '📅' },
    { id: 'game', title: 'Tic Tac Toe', folder: 'game', img: 'game.png', emoji: '🎮' },
    { id: 'notetaking', title: 'Note-taking', folder: 'notetaking', img: 'notetaking.png', emoji: '📝' },
    { id: 'timer', title: 'Timer', folder: 'timer', img: 'timer.png', emoji: '⏱️' },
    { id: 'to_do_list', title: 'To‑Do List', folder: 'to_do_list', img: 'to_do_list.png', emoji: '✅' },
    { id: 'unit', title: 'Unit Converter', folder: 'unit', img: 'unit.png', emoji: '🔁' },
    { id: 'weather-website', title: 'Weather', folder: 'weather-website', img: 'weather.png', emoji: '☀️' },
  ];

  // ensure nav/grid exists
  let grid = document.querySelector('.grid');
  if (!grid) {
    grid = document.createElement('nav');
    grid.className = 'grid';
    const main = document.querySelector('main') || document.body;
    main.insertBefore(grid, main.querySelector('.note') || null);
  }

  grid.innerHTML = ''; // clear existing

  apps.forEach((app, i) => {
    const link = document.createElement('a');
    link.className = 'card enter';
    link.href = `${app.folder}/index.html`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.setAttribute('aria-label', `Open ${app.title}`);

    const localSrc = `media/${app.img}`;
    const picsum = `https://picsum.photos/seed/${encodeURIComponent(app.id)}/600/360`;

    link.innerHTML = `
      <div class="card-media img-shimmer" aria-hidden="true">
        <img alt="${app.title} preview" src="${localSrc}" loading="lazy">
      </div>
      <div class="card-body">
        <div class="card-emoji">${app.emoji}</div>
        <div class="card-title">${app.title}</div>
        <div class="card-sub">Open ${app.title}</div>
      </div>
      <span class="vh">Opens ${app.title} in a new tab</span>
    `;

    const img = link.querySelector('img');
    const media = link.querySelector('.card-media');

    // fallback to picsum if local file not found
    img.addEventListener('error', () => {
      if (img.src !== picsum) img.src = picsum;
      else media.classList.remove('img-shimmer');
    });
    img.addEventListener('load', () => media.classList.remove('img-shimmer'));
    if (img.complete) media.classList.remove('img-shimmer');

    grid.appendChild(link);

    // staggered entrance
    setTimeout(() => link.classList.add('show'), 40 * i);
  });
});