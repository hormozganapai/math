/**
 * 8queens/game.js
 * Core logic for 8 Queens Puzzle and Backtracking visualizer
 */

const NQueens = (() => {
  // State
  let N = 8;
  let queens = []; // Array of {row, col}
  let showThreats = true;

  // DOM Elements
  const boardEl = document.getElementById('chessboard');
  const overlayEl = document.getElementById('threatOverlay');
  const labelsTop = document.getElementById('labelsTop');
  const labelsBottom = document.getElementById('labelsBottom');
  const labelsLeft = document.getElementById('labelsLeft');
  const labelsRight = document.getElementById('labelsRight');
  const countEl = document.getElementById('queensCount');

  // Initialization
  function init() {
    setupBoard();
    updateUI();
  }

  function setN(newN) {
    N = parseInt(newN, 10);
    queens = [];
    setupBoard();
    updateUI();
  }

  function toggleThreats() {
    showThreats = !showThreats;
    updateUI();
    return showThreats;
  }

  function clearBoard() {
    queens = [];
    updateUI();
  }

  // Board Setup
  function setupBoard() {
    // Set CSS grid template based on N
    boardEl.style.gridTemplateColumns = `repeat(${N}, 1fr)`;
    boardEl.style.gridTemplateRows = `repeat(${N}, 1fr)`;
    boardEl.innerHTML = '';

    // Generate Labels
    labelsTop.innerHTML = ''; labelsBottom.innerHTML = '';
    labelsLeft.innerHTML = ''; labelsRight.innerHTML = '';

    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    for(let c = 0; c < N; c++) {
      const letter = letters[c] || c;
      labelsTop.innerHTML += `<div class="label-cell">${letter}</div>`;
      labelsBottom.innerHTML += `<div class="label-cell">${letter}</div>`;
    }
    for(let r = 0; r < N; r++) {
      const num = N - r; // Standard chess: 8 at top, 1 at bottom
      labelsLeft.innerHTML += `<div class="label-cell">${num}</div>`;
      labelsRight.innerHTML += `<div class="label-cell">${num}</div>`;
    }

    // Generate Cells
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const cell = document.createElement('div');
        cell.className = `cell ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
        cell.dataset.row = r;
        cell.dataset.col = c;
        cell.addEventListener('click', () => handleCellClick(r, c));
        boardEl.appendChild(cell);
      }
    }
  }

  function handleCellClick(r, c) {
    const existingIdx = queens.findIndex(q => q.row === r && q.col === c);
    if (existingIdx >= 0) {
      // Remove queen
      queens.splice(existingIdx, 1);
    } else {
      // Add queen
      queens.push({ row: r, col: c });
    }
    updateUI();
    if (onInteraction) onInteraction();
  }

  // Conflict Logic
  function getConflicts() {
    let conflicts = [];
    for (let i = 0; i < queens.length; i++) {
      for (let j = i + 1; j < queens.length; j++) {
        const q1 = queens[i];
        const q2 = queens[j];
        if (q1.row === q2.row || q1.col === q2.col || Math.abs(q1.row - q2.row) === Math.abs(q1.col - q2.col)) {
          conflicts.push({q1, q2});
        }
      }
    }
    return conflicts;
  }

  function getThreatenedCells() {
    let threatened = new Set();
    for (let q of queens) {
      for (let r = 0; r < N; r++) {
        for (let c = 0; c < N; c++) {
          if (r === q.row && c === q.col) continue; // Don't mark queen's own cell as threatened by itself
          if (r === q.row || c === q.col || Math.abs(r - q.row) === Math.abs(c - q.col)) {
            threatened.add(`${r},${c}`);
          }
        }
      }
    }
    return threatened;
  }

  // Rendering
  function updateUI() {
    countEl.innerText = `وزیرهای قرار داده شده: ${queens.length} از ${N}`;

    // Reset all cells
    Array.from(boardEl.children).forEach(cell => {
      cell.innerHTML = '';
      cell.classList.remove('threatened');
    });

    const conflicts = getConflicts();
    const threatenedSet = showThreats ? getThreatenedCells() : new Set();
    let conflictQueens = new Set();

    if (showThreats) {
      conflicts.forEach(c => {
        conflictQueens.add(`${c.q1.row},${c.q1.col}`);
        conflictQueens.add(`${c.q2.row},${c.q2.col}`);
      });
    }

    // Highlight threats
    if (showThreats) {
      threatenedSet.forEach(key => {
        const [r, c] = key.split(',');
        const cell = getCell(r, c);
        if (cell) cell.classList.add('threatened');
      });
    }

    // Place queens
    queens.forEach(q => {
      const cell = getCell(q.row, q.col);
      if (cell) {
        const qEl = document.createElement('div');
        qEl.className = 'queen';
        qEl.innerText = '♛';
        if (showThreats && conflictQueens.has(`${q.row},${q.col}`)) {
          qEl.classList.add('conflict');
        }
        cell.appendChild(qEl);
      }
    });

    drawThreatLines(conflicts);
  }

  function getCell(r, c) {
    return boardEl.querySelector(`.cell[data-row="${r}"][data-col="${c}"]`);
  }

  function drawThreatLines(conflicts) {
    overlayEl.innerHTML = '';
    if (!showThreats) return;

    conflicts.forEach(c => {
      const cell1 = getCell(c.q1.row, c.q1.col);
      const cell2 = getCell(c.q2.row, c.q2.col);
      if (cell1 && cell2) {
        const x1 = cell1.offsetLeft + cell1.offsetWidth / 2;
        const y1 = cell1.offsetTop + cell1.offsetHeight / 2;
        const x2 = cell2.offsetLeft + cell2.offsetWidth / 2;
        const y2 = cell2.offsetTop + cell2.offsetHeight / 2;

        const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        line.setAttribute('x1', x1);
        line.setAttribute('y1', y1);
        line.setAttribute('x2', x2);
        line.setAttribute('y2', y2);
        line.setAttribute('class', 'threat-line');
        overlayEl.appendChild(line);
      }
    });
  }

  // Getters & Setters
  function getState() { return { N, queens, conflictsCount: getConflicts().length }; }
  function setQueens(newQueens) { queens = [...newQueens]; updateUI(); }
  let onInteraction = null;
  function setOnInteraction(cb) { onInteraction = cb; }

  return {
    init, setN, clearBoard, toggleThreats,
    getState, setQueens, setOnInteraction
  };
})();

const BacktrackingVisualizer = (() => {
  let isSolving = false;
  let isPaused = false;
  let speedMs = 500;
  let resolveStep = null;

  const statusEl = document.getElementById('visualizerStatus');

  function updateStatus(msg, isRtl = false) {
    statusEl.innerText = msg;
    if(isRtl) statusEl.classList.add('rtl-text');
    else statusEl.classList.remove('rtl-text');
  }

  function setSpeed(val) {
    // val is 1 (slow) to 10 (fast)
    // Map to 1000ms to 50ms
    speedMs = 1050 - (val * 100);
    if(speedMs < 50) speedMs = 50;
  }

  function pause() { isPaused = true; }

  function play() {
    isPaused = false;
    if(resolveStep) {
      resolveStep();
      resolveStep = null;
    }
  }

  function step() {
    if(resolveStep) {
      resolveStep();
      resolveStep = null;
    }
  }

  function stop() {
    isSolving = false;
    if(resolveStep) {
      resolveStep();
      resolveStep = null;
    }
  }

  async function waitStep() {
    if (!isSolving) return;
    if (isPaused) {
      await new Promise(res => { resolveStep = res; });
    } else {
      await new Promise(res => {
        const timeoutId = setTimeout(res, speedMs);
        resolveStep = () => { clearTimeout(timeoutId); res(); };
      });
    }
  }

  async function solveVisual(N) {
    isSolving = true;
    isPaused = false;
    let board = []; // array of col indices for each row

    function isSafe(row, col) {
      for (let r = 0; r < row; r++) {
        let c = board[r];
        if (c === col || Math.abs(r - row) === Math.abs(c - col)) return false;
      }
      return true;
    }

    async function place(row) {
      if (!isSolving) return false;
      if (row === N) {
        updateStatus('جواب پیدا شد!', true);
        return true; // Found first solution
      }

      for (let col = 0; col < N; col++) {
        if (!isSolving) return false;

        // Show attempting
        updateStatus(`تست کردن سطر ${row + 1}، ستون ${col + 1} (R:${row} C:${col})`, false);
        const currentQueens = board.map((c, r) => ({row: r, col: c}));
        currentQueens.push({row: row, col: col});
        NQueens.setQueens(currentQueens);

        await waitStep();
        if (!isSolving) return false;

        if (isSafe(row, col)) {
          updateStatus(`خانه امن پیدا شد. رفتن به سطر بعدی. (Safe R:${row} C:${col})`, false);
          board[row] = col;
          await waitStep();

          if (await place(row + 1)) return true;

          if (!isSolving) return false;
          updateStatus(`برگشت به عقب (Backtracking) از سطر ${row + 1}`, true);
          currentQueens.pop();
          NQueens.setQueens(currentQueens);
          await waitStep();
        } else {
          updateStatus(`تضاد! (Conflict at R:${row} C:${col})`, false);
          await waitStep();
        }
      }

      return false;
    }

    const result = await place(0);
    isSolving = false;
    return result;
  }

  return {
    setSpeed, pause, play, step, stop, solveVisual,
    isSolving: () => isSolving,
    isPaused: () => isPaused
  };
})();

const SolutionBrowser = (() => {
  let solutions = [];
  let currentIndex = 0;

  function findAllSolutions(N) {
    solutions = [];
    let board = [];

    function isSafe(row, col) {
      for (let r = 0; r < row; r++) {
        let c = board[r];
        if (c === col || Math.abs(r - row) === Math.abs(c - col)) return false;
      }
      return true;
    }

    function solve(row) {
      if (row === N) {
        solutions.push([...board]);
        return;
      }
      for (let col = 0; col < N; col++) {
        if (isSafe(row, col)) {
          board[row] = col;
          solve(row + 1);
        }
      }
    }
    solve(0);
    return solutions;
  }

  function getSolutions(N) {
    return findAllSolutions(N);
  }

  return { getSolutions };
})();

// UI Controller & Integration
const GameController = (() => {
  // DOM
  const sizeSelect = document.getElementById('boardSize');
  const clearBtn = document.getElementById('clearBtn');
  const hintBtn = document.getElementById('hintBtn');
  const toggleThreatBtn = document.getElementById('toggleThreatBtn');
  const autoSolveBtn = document.getElementById('autoSolveBtn');
  const allSolutionsBtn = document.getElementById('allSolutionsBtn');
  const educationalBtn = document.getElementById('educationalBtn');

  const visPanel = document.getElementById('visualizerPanel');
  const visPlayPauseBtn = document.getElementById('visPlayPause');
  const visStepBtn = document.getElementById('visStep');
  const visSpeedInput = document.getElementById('visSpeed');

  const solBrowserPanel = document.getElementById('solutionBrowserPanel');
  const solPrevBtn = document.getElementById('solPrev');
  const solNextBtn = document.getElementById('solNext');
  const closeSolutionsBtn = document.getElementById('closeSolutionsBtn');
  const solN = document.getElementById('solN');
  const solCount = document.getElementById('solCount');
  const solCurrent = document.getElementById('solCurrent');
  const solTotal = document.getElementById('solTotal');

  const timerVal = document.getElementById('timerVal');
  const eduModal = document.getElementById('educationalModal');
  const closeEduBtn = document.getElementById('closeEducationalBtn');
  const victoryModal = document.getElementById('victoryModal');
  const victoryN = document.getElementById('victoryN');
  const victoryTime = document.getElementById('victoryTime');
  const playAgainBtn = document.getElementById('playAgainBtn');

  // State
  let timerInterval = null;
  let secondsElapsed = 0;
  let isTimerRunning = false;
  let currentSolutions = [];
  let currentSolIdx = 0;

  function init() {
    NQueens.init();
    NQueens.setOnInteraction(handleUserInteraction);

    // Listeners
    sizeSelect.addEventListener('change', (e) => {
      resetGame();
      NQueens.setN(e.target.value);
    });

    clearBtn.addEventListener('click', resetGame);

    toggleThreatBtn.addEventListener('click', () => {
      const isShowing = NQueens.toggleThreats();
      toggleThreatBtn.innerText = isShowing ? 'پنهان کردن خطوط تهدید' : 'نمایش خطوط تهدید';
    });

    autoSolveBtn.addEventListener('click', startVisualizer);

    // Educational Modal
    educationalBtn.addEventListener('click', () => {
      eduModal.classList.remove('hidden');
    });
    closeEduBtn.addEventListener('click', () => {
      eduModal.classList.add('hidden');
    });

    // Solution Browser
    allSolutionsBtn.addEventListener('click', openSolutionBrowser);
    closeSolutionsBtn.addEventListener('click', () => {
      solBrowserPanel.classList.add('hidden');
      resetGame();
    });
    solPrevBtn.addEventListener('click', () => showSolution(currentSolIdx - 1));
    solNextBtn.addEventListener('click', () => showSolution(currentSolIdx + 1));

    // Visualizer Controls
    visPlayPauseBtn.addEventListener('click', () => {
      if (BacktrackingVisualizer.isPaused()) {
        BacktrackingVisualizer.play();
        visPlayPauseBtn.innerText = '⏸️ توقف';
        visStepBtn.disabled = true;
      } else {
        BacktrackingVisualizer.pause();
        visPlayPauseBtn.innerText = '▶️ ادامه';
        visStepBtn.disabled = false;
      }
    });
    visStepBtn.addEventListener('click', () => {
      BacktrackingVisualizer.step();
    });
    visSpeedInput.addEventListener('input', (e) => {
      BacktrackingVisualizer.setSpeed(e.target.value);
    });

    playAgainBtn.addEventListener('click', () => {
      victoryModal.classList.add('hidden');
      resetGame();
    });

    // Hint
    hintBtn.addEventListener('click', giveHint);

    // Initial UI state
    visStepBtn.disabled = true;

    // Start play record
    if (typeof MathPlayScore !== 'undefined') {
      MathPlayScore.recordPlay('8queens');
    }
  }

  function formatTime(sec) {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function startTimer() {
    if (isTimerRunning) return;
    isTimerRunning = true;
    timerInterval = setInterval(() => {
      secondsElapsed++;
      timerVal.innerText = formatTime(secondsElapsed);
    }, 1000);
  }

  function stopTimer() {
    isTimerRunning = false;
    clearInterval(timerInterval);
  }

  function resetGame() {
    BacktrackingVisualizer.stop();
    visPanel.classList.add('hidden');
    solBrowserPanel.classList.add('hidden');
    NQueens.clearBoard();
    stopTimer();
    secondsElapsed = 0;
    timerVal.innerText = "00:00";
    isTimerRunning = false;
    currentSolutions = [];
  }

  function handleUserInteraction() {
    startTimer();
    checkVictory();
  }

  function checkVictory() {
    const state = NQueens.getState();
    if (state.queens.length === state.N && state.conflictsCount === 0) {
      stopTimer();
      showVictory();
    }
  }

  function showVictory() {
    const state = NQueens.getState();
    victoryN.innerText = state.N;
    victoryTime.innerText = formatTime(secondsElapsed);
    victoryModal.classList.remove('hidden');

    if (typeof MathPlayScore !== 'undefined') {
      // Score could be based on time. Faster is better.
      // A simple formula: max(100 - secondsElapsed, 10) * N
      const score = Math.max(100 - secondsElapsed, 10) * state.N;
      MathPlayScore.submitScore('8queens', score);
    }
  }

  function startVisualizer() {
    resetGame();
    visPanel.classList.remove('hidden');
    visPlayPauseBtn.innerText = '⏸️ توقف';
    visStepBtn.disabled = true;
    const N = NQueens.getState().N;
    BacktrackingVisualizer.setSpeed(visSpeedInput.value);
    BacktrackingVisualizer.solveVisual(N).then(() => {
      visPlayPauseBtn.innerText = '▶️ شروع مجدد';
      visPlayPauseBtn.onclick = startVisualizer; // Restart
    });
  }

  function openSolutionBrowser() {
    resetGame();
    solBrowserPanel.classList.remove('hidden');
    const N = NQueens.getState().N;
    currentSolutions = SolutionBrowser.getSolutions(N);

    solN.innerText = N;
    solCount.innerText = currentSolutions.length;
    solTotal.innerText = currentSolutions.length;

    if (currentSolutions.length > 0) {
      showSolution(0);
    }
  }

  function showSolution(idx) {
    if (idx < 0) idx = currentSolutions.length - 1;
    if (idx >= currentSolutions.length) idx = 0;
    currentSolIdx = idx;

    solCurrent.innerText = idx + 1;

    const sol = currentSolutions[idx];
    const queens = sol.map((col, row) => ({row, col}));
    NQueens.setQueens(queens);
  }

  function giveHint() {
    const state = NQueens.getState();
    const N = state.N;

    // Very simple hint: if current board is part of a valid solution, place one more queen.
    // To do this, we can use the SolutionBrowser to find all solutions and see if any matches current.
    const allSols = SolutionBrowser.getSolutions(N);

    // Check if current placed queens have any conflicts. If yes, no hint possible until fixed.
    if (state.conflictsCount > 0) {
      alert('ابتدا باید وزیرهایی که در خطر هستند را جابه‌جا کنید.');
      return;
    }

    // Find a solution that matches current placed queens
    let validSol = null;
    for (let sol of allSols) {
      let matches = true;
      for (let q of state.queens) {
        if (sol[q.row] !== q.col) {
          matches = false;
          break;
        }
      }
      if (matches) {
        validSol = sol;
        break;
      }
    }

    if (validSol) {
      // Find the first empty row
      const filledRows = new Set(state.queens.map(q => q.row));
      for (let r = 0; r < N; r++) {
        if (!filledRows.has(r)) {
          const newQueens = [...state.queens, {row: r, col: validSol[r]}];
          NQueens.setQueens(newQueens);
          startTimer();
          checkVictory();
          return;
        }
      }
    } else {
      alert('چینش فعلی به جواب نمی‌رسد. لطفاً برخی از وزیرها را تغییر دهید.');
    }
  }

  return { init };
})();

// Start
document.addEventListener('DOMContentLoaded', () => {
  GameController.init();
});
