// Simple Tic Tac Toe with localStorage save/load
document.addEventListener('DOMContentLoaded', () => {
  const KEY = 'tictactoe.state.v1';
  const boardEl = document.getElementById('board');
  const statusEl = document.getElementById('status');
  const scoreXEl = document.getElementById('scoreX');
  const scoreOEl = document.getElementById('scoreO');
  const scoreDEl = document.getElementById('scoreD');
  const newBtn = document.getElementById('newBtn');
  const resetBtn = document.getElementById('resetBtn');
  const saveBtn = document.getElementById('saveBtn');
  const loadBtn = document.getElementById('loadBtn');

  const emptyState = () => ({
    board: Array(9).fill(''),
    current: 'X',
    scores: { X: 0, O: 0, D: 0 },
    winner: null,
    moves: 0
  });

  let state = loadState() || emptyState();

  function persist() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { console.error(e); }
  }

  function loadState() {
    try { const s = localStorage.getItem(KEY); return s ? JSON.parse(s) : null; } catch (e) { return null; }
  }

  function render() {
    boardEl.innerHTML = '';
    for (let i = 0; i < 9; i++) {
      const v = state.board[i];
      const cell = document.createElement('div');
      cell.className = 'cell' + (v ? ' disabled' : '');
      cell.setAttribute('data-i', i);
      cell.setAttribute('role', 'button');
      cell.setAttribute('aria-label', `Square ${i+1} ${v ? v : 'empty'}`);
      cell.textContent = v;
      cell.addEventListener('click', onCellClick);
      boardEl.appendChild(cell);
    }

    if (state.winner) {
      // bold the winner or the word "draw"
      if (state.winner === 'draw') {
        statusEl.innerHTML = `It's a <strong>draw</strong>.`;
      } else {
        statusEl.innerHTML = `<strong>${state.winner}</strong> wins!`;
      }
      markWinningCells(state.winningLine || []);
      disableBoard();
    } else {
      // show current player with bold X/O
      statusEl.innerHTML = `Turn: <strong class="turn">${state.current}</strong>`;
      enableBoard();
    }

    scoreXEl.textContent = state.scores.X;
    scoreOEl.textContent = state.scores.O;
    scoreDEl.textContent = state.scores.D;
  }

  function onCellClick(e) {
    const idx = Number(e.currentTarget.dataset.i);
    if (state.board[idx] || state.winner) return;
    state.board[idx] = state.current;
    state.moves++;
    const res = checkWinner(state.board);
    if (res.winner) {
      state.winner = res.winner;
      state.winningLine = res.line;
      if (res.winner === 'draw') state.scores.D++;
      else state.scores[res.winner]++;
    } else {
      state.current = state.current === 'X' ? 'O' : 'X';
    }
    persist();
    render();
  }

  function checkWinner(b) {
    const lines = [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
    for (const l of lines) {
      const [a,b1,c] = l;
      if (b[a] && b[a] === b[b1] && b[a] === b[c]) return { winner: b[a], line: l };
    }
    if (b.every(Boolean)) return { winner: 'draw', line: [] };
    return { winner: null, line: [] };
  }

  function markWinningCells(line) {
    if (!line || line.length === 0) return;
    line.forEach(i => {
      const cell = boardEl.querySelector(`.cell[data-i="${i}"]`);
      if (cell) cell.classList.add('win');
    });
  }

  function disableBoard() {
    boardEl.querySelectorAll('.cell').forEach(c => c.classList.add('disabled'));
  }
  function enableBoard() {
    boardEl.querySelectorAll('.cell').forEach(c => {
      if (!c.textContent) c.classList.remove('disabled');
    });
  }

  newBtn.addEventListener('click', () => {
    // new round: clear board but keep scores and current starts as loser of last round (or alternate)
    const lastWinner = state.winner;
    state.board = Array(9).fill('');
    state.winner = null;
    state.winningLine = null;
    state.moves = 0;
    // if lastWinner was X or O, next current should be the opposite to give loser start; otherwise alternate
    if (lastWinner === 'X') state.current = 'O';
    else if (lastWinner === 'O') state.current = 'X';
    else state.current = state.current === 'X' ? 'O' : 'X';
    persist();
    render();
  });

  resetBtn.addEventListener('click', () => {
    if (!confirm('Reset scores and clear saved game?')) return;
    state = emptyState();
    persist();
    render();
  });

  saveBtn.addEventListener('click', () => { persist(); statusEl.textContent = 'Game saved.'; setTimeout(render, 800); });
  loadBtn.addEventListener('click', () => { const s = loadState(); if (s) { state = s; render(); statusEl.textContent = 'Game loaded.'; } else statusEl.textContent = 'No save found.'; setTimeout(render,800); });

  // keyboard: 1-9 map to cells
  window.addEventListener('keydown', (e) => {
    const k = e.key;
    if (/^[1-9]$/.test(k)) {
      const idx = Number(k) - 1;
      const cell = boardEl.querySelector(`.cell[data-i="${idx}"]`);
      if (cell) cell.click();
    }
    if (k === 'n') newBtn.click();
    if (k === 'r') resetBtn.click();
    if (k === 's') saveBtn.click();
    if (k === 'l') loadBtn.click();
  });

  // initial render
  render();
});