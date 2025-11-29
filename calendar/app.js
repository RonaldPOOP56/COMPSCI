// calendar with start/end datetimes, multi-day events and local clock
document.addEventListener('DOMContentLoaded', () => {
  const KEY = 'calendar.events.v1';
  const daysGrid = document.getElementById('daysGrid');
  const monthTitle = document.getElementById('monthTitle');
  const prevBtn = document.getElementById('prevMonth');
  const nextBtn = document.getElementById('nextMonth');
  const todayBtn = document.getElementById('todayBtn');
  const selectedDateEl = document.getElementById('selectedDate');
  const eventForm = document.getElementById('eventForm');
  const titleInput = document.getElementById('eventTitle');
  const startDateInput = document.getElementById('eventStartDate');
  const startTimeInput = document.getElementById('eventStartTime');
  const endDateInput = document.getElementById('eventEndDate');
  const endTimeInput = document.getElementById('eventEndTime');
  const notesInput = document.getElementById('eventNotes');
  const eventsList = document.getElementById('eventsList');
  const upcomingList = document.getElementById('upcomingList');
  const clearBtn = document.getElementById('clearBtn');
  const localClockEl = document.getElementById('localClock');

  let now = new Date();
  let viewDate = new Date(now.getFullYear(), now.getMonth(), 1);
  let selectedDate = formatYMD(now);
  // events stored as map: YYYY-MM-DD -> array of event objects (copies for each day)
  let events = loadEvents();
  // editing id when editing an existing event
  let editingId = null;

  init();

  function init(){
    renderMonth();
    attach();
    selectDate(selectedDate);
    renderUpcoming();
    updateClock();
    setInterval(updateClock, 1000);
    window.addEventListener('beforeunload', persistEvents);
  }

  function updateClock(){
    const d = new Date();
    const timeStr = d.toLocaleTimeString(undefined, {hour:'2-digit',minute:'2-digit',second:'2-digit'});
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || '';
    localClockEl.textContent = `${timeStr} ${tz ? `(${tz.split('/').pop()})` : ''}`;
    // refresh event visuals every minute/second so past/ongoing updates
    updateVisualStates();
  }

  function attach(){
    prevBtn.addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth() - 1); renderMonth(); });
    nextBtn.addEventListener('click', () => { viewDate.setMonth(viewDate.getMonth() + 1); renderMonth(); });
    todayBtn.addEventListener('click', () => { viewDate = new Date(now.getFullYear(), now.getMonth(), 1); renderMonth(); });
    eventForm.addEventListener('submit', onSaveEvent);
    clearBtn.addEventListener('click', clearForm);
  }

  function renderMonth(){
    daysGrid.innerHTML = '';
    const year = viewDate.getFullYear(), month = viewDate.getMonth();
    monthTitle.textContent = viewDate.toLocaleString(undefined, {month:'long', year:'numeric'});
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const prevDays = startDay;
    const prevMonthLast = new Date(year, month, 0).getDate();

    for (let i = 0; i < 42; i++) {
      const cell = document.createElement('div');
      cell.className = 'day';
      let cellDate;
      if (i < prevDays) {
        const d = prevMonthLast - (prevDays - 1) + i;
        cellDate = new Date(year, month -1, d);
        cell.classList.add('other');
      } else if (i >= prevDays + daysInMonth) {
        const d = i - (prevDays + daysInMonth) + 1;
        cellDate = new Date(year, month +1, d);
        cell.classList.add('other');
      } else {
        const d = i - prevDays + 1;
        cellDate = new Date(year, month, d);
      }
      const ymd = formatYMD(cellDate);
      const num = document.createElement('div');
      num.className = 'date-num';
      num.textContent = cellDate.getDate();
      cell.appendChild(num);

      const evWrap = document.createElement('div');
      evWrap.className = 'events';
      // get unique events for that day
      const dayEvents = (events[ymd] || []).slice();
      dayEvents.sort((a,b) => (a._sortKey || '').localeCompare(b._sortKey || ''));
      for (let ev of dayEvents.slice(0,3)) {
        const pill = document.createElement('div');
        const state = eventState(ev);
        pill.className = 'event-pill' + (state === 'past' ? ' past' : state === 'ongoing' ? ' ongoing' : '');
        pill.title = ev.notes || '';
        // include date when the event started if it doesn't start on this cell's day
        const startOnThisDay = formatYMD(new Date(ev.start)) === ymd;
        let timeLabel = '';
        if (ev.start) {
          if (startOnThisDay) {
            timeLabel = new Date(ev.start).toTimeString().slice(0,5);
          } else {
            // show short start date (MM-DD) so it's clear this is a continued/multi-day event
            timeLabel = formatYMD(new Date(ev.start)).slice(5).replace('-', '/') + '↪';
          }
        }
        pill.textContent = (timeLabel ? timeLabel + ' ' : '') + ev.title;
        evWrap.appendChild(pill);
      }
      if (dayEvents.length > 3) {
        const more = document.createElement('div');
        more.className = 'event-pill more';
        more.textContent = `+${dayEvents.length - 3} more`;
        evWrap.appendChild(more);
      }
      cell.appendChild(evWrap);

      cell.addEventListener('click', () => selectDate(ymd));
      daysGrid.appendChild(cell);
    }

    highlightSelected();
  }

  function eventState(ev){
    // determine past/ongoing/future using full datetimes (ISO strings)
    const nowD = new Date();
    const start = ev.start ? new Date(ev.start) : new Date(ev.day + 'T00:00:00');
    const end = ev.end ? new Date(ev.end) : new Date(ev.day + 'T23:59:59');
    if (end < nowD) return 'past';
    if (start <= nowD && nowD <= end) return 'ongoing';
    return 'future';
  }

  function selectDate(ymd){
    selectedDate = ymd;
    selectedDateEl.textContent = new Date(ymd).toDateString();
    // pre-fill start/end date inputs with selected date
    startDateInput.value = ymd;
    endDateInput.value = ymd;
    startTimeInput.value = '';
    endTimeInput.value = '';
    titleInput.value = '';
    notesInput.value = '';
    editingId = null;
    renderEventsForSelected();
    highlightSelected();
  }

  // show full date in event lists and upcoming so user can see exact day
  function renderEventsForSelected(){
    eventsList.innerHTML = '';
    const list = (events[selectedDate] || []).slice();
    if (list.length === 0) {
      eventsList.innerHTML = '<li class="empty">No events</li>';
      return;
    }
    list.sort((a,b) => {
      const aStart = a.start ? a.start : a.day + 'T00:00:00';
      const bStart = b.start ? b.start : b.day + 'T00:00:00';
      return aStart.localeCompare(bStart);
    });

    for (const ev of list) {
      const state = eventState(ev);
      const li = document.createElement('li');
      li.className = 'event-item' + (state === 'past' ? ' past' : state === 'ongoing' ? ' ongoing' : '');
      const startOnThisDay = formatYMD(new Date(ev.start)) === selectedDate;
      const startLabel = ev.start ? (startOnThisDay ? new Date(ev.start).toTimeString().slice(0,5) : `Starts ${formatYMD(new Date(ev.start))}`) : 'All day';
      const endLabel = ev.end ? ` → ${formatYMD(new Date(ev.end))}${ev.end ? ' ' + new Date(ev.end).toTimeString().slice(0,5) : ''}` : '';
      const meta = `${startLabel}${endLabel} ${escapeHtml(ev.notes || '')}`;
      const liHtml = `<div><div class="title">${escapeHtml(ev.title)}</div><div class="meta">${meta}</div></div>
                      <div><button class="btn edit">Edit</button> <button class="btn del">Delete</button></div>`;
      li.innerHTML = liHtml;
      li.querySelector('.del').addEventListener('click', () => { deleteEventById(ev.id); });
      li.querySelector('.edit').addEventListener('click', () => { editEventById(ev.id); });
      eventsList.appendChild(li);
    }
  }

  function computeOccurrencesRange(startIso, endIso){
    // returns array of YYYY-MM-DD from start date to end date inclusive
    const start = new Date(startIso);
    const end = new Date(endIso);
    const days = [];
    for (let d = new Date(start.getFullYear(), start.getMonth(), start.getDate()); d <= end; d.setDate(d.getDate() + 1)) {
      days.push(formatYMD(new Date(d)));
    }
    return days;
  }

  function onSaveEvent(e){
    e.preventDefault();
    const title = titleInput.value.trim();
    if (!title) return alert('Enter a title');

    // build ISO start/end
    const sDate = startDateInput.value;
    const sTime = startTimeInput.value;
    const eDate = endDateInput.value || sDate;
    const eTime = endTimeInput.value;

    if (!sDate) return alert('Select start date');
    // default times if empty: start at 00:00, end at 23:59:59
    const startIso = sTime ? `${sDate}T${sTime}:00` : `${sDate}T00:00:00`;
    const endIso = eTime ? `${eDate}T${eTime}:00` : `${eDate}T23:59:59`;

    if (new Date(endIso) < new Date(startIso)) return alert('End must be after start');

    const notes = notesInput.value || '';
    const id = editingId || String(Date.now());
    // event master object (kept identical copies stored on each day)
    const master = { id, title, start: startIso, end: endIso, notes };

    // remove any previous occurrences with same id
    removeEventById(id);

    // add copies for each day in range
    const days = computeOccurrencesRange(startIso, endIso);
    for (const day of days) {
      events[day] = events[day] || [];
      // push a lightweight copy; include _sortKey so today's rendering sorts correctly
      const copy = {
        id: master.id,
        title: master.title,
        start: master.start,
        end: master.end,
        notes: master.notes,
        day,
        _sortKey: master.start
      };
      events[day].push(copy);
    }

    persistEvents();
    renderMonth();
    renderEventsForSelected();
    renderUpcoming();
    clearForm();
  }

  function editEventById(id){
    const ev = getEventById(id);
    if (!ev) return;
    // populate form with master start/end
    const start = new Date(ev.start);
    const end = new Date(ev.end);
    titleInput.value = ev.title;
    startDateInput.value = formatYMD(start);
    startTimeInput.value = start.toTimeString().slice(0,5);
    endDateInput.value = formatYMD(end);
    endTimeInput.value = end.toTimeString().slice(0,5);
    notesInput.value = ev.notes || '';
    editingId = id;
    // remove existing occurrences (we will re-add on save)
    removeEventById(id);
    renderMonth();
    renderEventsForSelected();
    renderUpcoming();
  }

  function deleteEventById(id){
    if (!confirm('Delete event?')) return;
    removeEventById(id);
    persistEvents();
    renderMonth();
    renderEventsForSelected();
    renderUpcoming();
  }

  function removeEventById(id){
    // iterate days and remove entries with id
    for (const day of Object.keys(events)) {
      events[day] = (events[day] || []).filter(x => x.id !== id);
      if (events[day].length === 0) delete events[day];
    }
  }

  function getEventById(id){
    for (const arr of Object.values(events)) {
      const found = arr.find(x => x.id === id);
      if (found) return { id: found.id, title: found.title, start: found.start, end: found.end, notes: found.notes };
    }
    return null;
  }

  function renderUpcoming(){
    upcomingList.innerHTML = '';
    const all = [];
    const seen = new Set();
    for (const [day, arr] of Object.entries(events)) {
      for (const ev of arr) {
        if (seen.has(ev.id)) continue;
        seen.add(ev.id);
        all.push({dayStart: ev.start, day: ev.day, ...ev});
      }
    }
    all.sort((a,b) => (a.dayStart || '') > (b.dayStart || '') ? 1 : -1);
    const soon = all.slice(0,8);
    if (soon.length === 0) { upcomingList.innerHTML = '<li class="empty">No upcoming events</li>'; return; }
    for (const ev of soon) {
      const state = eventState(ev);
      const li = document.createElement('li');
      li.className = 'event-item' + (state === 'past' ? ' past' : state === 'ongoing' ? ' ongoing' : '');
      const start = ev.start ? new Date(ev.start) : null;
      const startLabel = start ? `${formatYMD(start)} ${start.toTimeString().slice(0,5)}` : 'All day';
      const end = ev.end ? new Date(ev.end) : null;
      const dur = end ? ` → ${formatYMD(end)} ${end.toTimeString().slice(0,5)}` : '';
      li.innerHTML = `<div><div class="title">${escapeHtml(ev.title)}</div><div class="meta">${startLabel}${dur}</div></div>`;
      upcomingList.appendChild(li);
    }
  }

  function clearForm(){
    titleInput.value = '';
    startDateInput.value = selectedDate;
    endDateInput.value = selectedDate;
    startTimeInput.value = '';
    endTimeInput.value = '';
    notesInput.value = '';
    editingId = null;
  }

  function loadEvents(){
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { return {}; }
  }
  function persistEvents(){
    try { localStorage.setItem(KEY, JSON.stringify(events || {})); } catch (err) { console.error('Failed to save events', err); }
  }

  // utilities
  function formatYMD(d){
    if (!(d instanceof Date)) d = new Date(d);
    return d.toISOString().slice(0,10);
  }

  function highlightSelected(){
    const cells = daysGrid.querySelectorAll('.day');
    if (!cells.length) return;
    const year = viewDate.getFullYear(), month = viewDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const startDay = firstDay.getDay();
    const daysInMonth = new Date(year, month+1, 0).getDate();
    const prevMonthLast = new Date(year, month, 0).getDate();

    for (let i = 0; i < cells.length; i++) {
      const cell = cells[i];
      let cellDate;
      if (i < startDay) {
        const d = prevMonthLast - (startDay - 1) + i;
        cellDate = new Date(year, month -1, d);
      } else if (i >= startDay + daysInMonth) {
        const d = i - (startDay + daysInMonth) + 1;
        cellDate = new Date(year, month +1, d);
      } else {
        const d = i - startDay + 1;
        cellDate = new Date(year, month, d);
      }
      const ymd = formatYMD(cellDate);
      cell.classList.toggle('active', ymd === selectedDate);
    }
  }

  function updateVisualStates(){
    // re-render lists that depend on time states
    renderMonth();
    renderEventsForSelected();
    renderUpcoming();
  }

  function escapeHtml(s){ return String(s || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":"&#39;"}[c])); }

  // export/import helpers
  window.calendarEvents = {
    export: () => JSON.stringify(events, null, 2),
    import: (json) => {
      try {
        const obj = typeof json === 'string' ? JSON.parse(json) : json;
        if (obj && typeof obj === 'object') {
          events = obj; persistEvents(); renderMonth(); renderEventsForSelected(); renderUpcoming(); return true;
        }
      } catch (e) { console.error(e); }
      return false;
    }
  };

  // initial selection and form defaults
  selectedDate = formatYMD(new Date());
  startDateInput.value = selectedDate;
  endDateInput.value = selectedDate;
  highlightSelected();
  renderEventsForSelected();
  renderUpcoming();
});