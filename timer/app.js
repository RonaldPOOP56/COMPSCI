// Timer app: countdown + stopwatch + local clock + presets (localStorage)
document.addEventListener('DOMContentLoaded', () => {
  const KEY = 'timer.presets.v1';

  // clock
  const localClock = document.getElementById('localClock');
  function updateClock(){ localClock.textContent = new Date().toLocaleTimeString(); }
  updateClock(); setInterval(updateClock, 1000);

  // tabs
  document.querySelectorAll('.tabs button').forEach(b => {
    b.addEventListener('click', () => {
      document.querySelectorAll('.tabs button').forEach(x=>x.classList.remove('active'));
      b.classList.add('active');
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      document.getElementById(b.dataset.tab).classList.add('active');
    });
  });

  // ===== countdown =====
  const cdH = document.getElementById('cdHours');
  const cdM = document.getElementById('cdMinutes');
  const cdS = document.getElementById('cdSeconds');
  const cdDisplay = document.getElementById('cdDisplay');
  const cdStart = document.getElementById('cdStart');
  const cdPause = document.getElementById('cdPause');
  const cdReset = document.getElementById('cdReset');
  let cdRemaining = 0, cdInterval = null, cdRunning = false, cdEnd = 0;

  function formatTime(ms, showMillis=false){
    if (ms < 0) ms = 0;
    const s = Math.floor(ms/1000);
    const hh = Math.floor(s/3600), mm = Math.floor((s%3600)/60), ss = s%60;
    if (showMillis){
      const msPart = ('000' + (ms%1000)).slice(-3);
      return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}.${msPart}`;
    }
    return `${String(hh).padStart(2,'0')}:${String(mm).padStart(2,'0')}:${String(ss).padStart(2,'0')}`;
  }

  function updateCountdownUI(){
    cdDisplay.textContent = formatTime(cdRemaining);
    cdPause.disabled = !cdRunning;
    cdReset.disabled = (!cdRunning && cdRemaining===0);
  }

  function playBeep(){
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine'; o.frequency.value = 1000;
      g.gain.value = 0.0001;
      o.connect(g); g.connect(ctx.destination);
      o.start();
      g.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1);
      o.stop(ctx.currentTime + 1.05);
    } catch(e){ console.warn('beep failed', e); }
  }

  cdStart.addEventListener('click', () => {
    if (!cdRunning){
      if (cdRemaining === 0){
        const h = Math.max(0, Number(cdH.value)||0);
        const m = Math.max(0, Number(cdM.value)||0);
        const s = Math.max(0, Number(cdS.value)||0);
        cdRemaining = ((h*3600)+(m*60)+s)*1000;
        if (cdRemaining <= 0) return;
      }
      cdRunning = true;
      cdEnd = Date.now() + cdRemaining;
      cdInterval = setInterval(() => {
        cdRemaining = cdEnd - Date.now();
        if (cdRemaining <= 0){
          clearInterval(cdInterval); cdRunning = false; cdRemaining = 0;
          updateCountdownUI(); playBeep();
        } else updateCountdownUI();
      }, 200);
    }
    updateCountdownUI();
    cdPause.disabled = false;
    cdReset.disabled = false;
  });

  cdPause.addEventListener('click', () => {
    if (!cdRunning) return;
    clearInterval(cdInterval);
    cdRunning = false;
    cdRemaining = Math.max(0, cdEnd - Date.now());
    updateCountdownUI();
  });

  cdReset.addEventListener('click', () => {
    clearInterval(cdInterval);
    cdRunning = false;
    cdRemaining = 0;
    updateCountdownUI();
  });

  // ===== presets =====
  const presetName = document.getElementById('presetName');
  const savePresetBtn = document.getElementById('savePreset');
  const presetList = document.getElementById('presetList');

  function loadPresets(){ try { return JSON.parse(localStorage.getItem(KEY)||'[]'); } catch { return []; } }
  function savePresets(arr){ localStorage.setItem(KEY, JSON.stringify(arr)); }
  function renderPresets(){
    presetList.innerHTML = '';
    const arr = loadPresets();
    for (const p of arr){
      const wrap = document.createElement('span');
      const b = document.createElement('button');
      b.className = 'preset-btn';
      b.textContent = `${p.name} — ${formatTime(p.ms)}`;
      b.addEventListener('click', () => {
        cdH.value = Math.floor(p.ms/3600000);
        cdM.value = Math.floor((p.ms%3600000)/60000);
        cdS.value = Math.floor((p.ms%60000)/1000);
      });
      const del = document.createElement('button');
      del.className = 'del'; del.textContent = '✕'; del.title='Delete';
      del.addEventListener('click', (ev) => { ev.stopPropagation(); const arr2 = loadPresets().filter(x=>x.name!==p.name); savePresets(arr2); renderPresets(); });
      wrap.appendChild(b); wrap.appendChild(del);
      presetList.appendChild(wrap);
    }
  }
  savePresetBtn.addEventListener('click', () => {
    const name = (presetName.value || '').trim(); if (!name) return alert('Enter preset name');
    const h = Math.max(0, Number(cdH.value)||0), m = Math.max(0, Number(cdM.value)||0), s = Math.max(0, Number(cdS.value)||0);
    const ms = ((h*3600)+(m*60)+s)*1000;
    if (ms <= 0) return alert('Duration must be > 0');
    const arr = loadPresets(); arr.push({name, ms}); savePresets(arr); presetName.value=''; renderPresets();
  });
  renderPresets();

  // ===== stopwatch =====
  const swDisplay = document.getElementById('swDisplay');
  const swStartBtn = document.getElementById('swStart');
  const swLapBtn = document.getElementById('swLap');
  const swResetBtn = document.getElementById('swReset');
  const lapsList = document.getElementById('laps');

  let swRunning = false, swStart = 0, swElapsed = 0, swTimer = null;

  function formatStopwatch(ms){
    const mm = Math.floor(ms/60000), ss = Math.floor((ms%60000)/1000), msr = ms%1000;
    const hh = Math.floor(mm/60); const m2 = mm%60;
    return `${String(hh).padStart(2,'0')}:${String(m2).padStart(2,'0')}:${String(ss).padStart(2,'0')}.${String(msr).padStart(3,'0')}`;
  }

  function swTick(){
    const now = performance.now();
    const total = swElapsed + (now - swStart);
    swDisplay.textContent = formatStopwatch(Math.floor(total));
  }

  function swToggle(){
    if (!swRunning){
      swRunning = true; swStart = performance.now();
      swTimer = setInterval(swTick, 50);
      swStartBtn.textContent = 'Stop';
      swLapBtn.disabled = false; swResetBtn.disabled = false;
    } else {
      swRunning = false; clearInterval(swTimer);
      swElapsed += performance.now() - swStart;
      swStartBtn.textContent = 'Start';
      swLapBtn.disabled = true;
    }
  }
  function swLap(){
    const now = performance.now();
    const total = Math.floor(swElapsed + (swRunning ? (now - swStart) : 0));
    const li = document.createElement('li'); li.textContent = formatStopwatch(total);
    lapsList.insertBefore(li, lapsList.firstChild);
  }
  function swReset(){
    swRunning = false; clearInterval(swTimer);
    swElapsed = 0; swStart = 0;
    swDisplay.textContent = formatStopwatch(0);
    swStartBtn.textContent = 'Start';
    swLapBtn.disabled = true; swResetBtn.disabled = true;
    lapsList.innerHTML = '';
  }

  swStartBtn.addEventListener('click', swToggle);
  swLapBtn.addEventListener('click', swLap);
  swResetBtn.addEventListener('click', swReset);
  swReset(); // init

  // keyboard shortcuts
  window.addEventListener('keydown', (e) => {
    if (e.code === 'Space'){
      const active = document.querySelector('.tab.active').id;
      if (active === 'countdown'){ e.preventDefault(); if (cdRunning) cdPause.click(); else cdStart.click(); }
      else if (active === 'stopwatch'){ e.preventDefault(); swToggle(); }
    }
    if (e.key.toLowerCase()==='r') {
      if (document.querySelector('.tab.active').id==='countdown') cdReset.click();
      else swReset();
    }
    if (e.key.toLowerCase()==='l' && document.querySelector('.tab.active').id==='stopwatch') swLap();
  });

  // initialize countdown display
  function initCountdownDisplay(){ cdRemaining = 0; updateCountdownUI(); cdDisplay.textContent = formatTime(0); }
  initCountdownDisplay();
});