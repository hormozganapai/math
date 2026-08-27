// hanoi.js (Part 1: Initialization and Mechanics)

const HanoiGame = (() => {
  // Game State
  let state = {
    diskCount: 3,
    rods: [[], [], []], // 0: A(مبدأ), 1: B(کمکی), 2: C(مقصد)
    moves: 0,
    startTime: null,
    timerInterval: null,
    isSolved: false,
    selectedRod: null,
    history: [] // For undo feature
  };

  // Solver State
  let solverState = {
    steps: [],
    currentStepIndex: 0,
    isPlaying: false,
    intervalId: null,
    speed: 500 // ms per step
  };

  // Drag and Drop State
  let dragState = {
    isDragging: false,
    draggedDisk: null,
    sourceRodIndex: null,
    startX: 0,
    startY: 0
  };

  // DOM Elements
  const els = {
    diskCount: document.getElementById('diskCount'),
    moveCount: document.getElementById('moveCount'),
    optimalMoves: document.getElementById('optimalMoves'),
    timer: document.getElementById('timer'),
    resetBtn: document.getElementById('resetBtn'),
    undoBtn: document.getElementById('undoBtn'),
    rods: [
      document.getElementById('rod-0'),
      document.getElementById('rod-1'),
      document.getElementById('rod-2')
    ],
    disksWrappers: [
      document.getElementById('disks-0'),
      document.getElementById('disks-1'),
      document.getElementById('disks-2')
    ],
    infoBtn: document.getElementById('infoBtn'),
    infoModal: document.getElementById('infoModal'),
    infoOverlay: document.getElementById('infoModalOverlay'),
    closeInfoBtn: document.getElementById('closeInfoBtn'),

    // Solver DOM
    autoSolveBtn: document.getElementById('autoSolveBtn'),
    controlsPanel: document.querySelector('.controls-panel'),
    solverControls: document.getElementById('solverControls'),
    stepBackBtn: document.getElementById('stepBackBtn'),
    playPauseBtn: document.getElementById('playPauseBtn'),
    stepForwardBtn: document.getElementById('stepForwardBtn'),
    speedSlider: document.getElementById('speedSlider'),
    stopSolveBtn: document.getElementById('stopSolveBtn'),
    executionLog: document.getElementById('executionLog'),

    // Victory Modal DOM
    victoryModalOverlay: document.getElementById('victoryModalOverlay'),
    victoryModal: document.getElementById('victoryModal'),
    victoryMoves: document.getElementById('victoryMoves'),
    victoryOptimal: document.getElementById('victoryOptimal'),
    victoryTime: document.getElementById('victoryTime'),
    victoryMessage: document.getElementById('victoryMessage'),
    playAgainBtn: document.getElementById('playAgainBtn'),
    confettiContainer: document.getElementById('confettiContainer')
  };

  // Initialize Game
  function init() {
    bindEvents();
    startNewGame();
  }

  function startNewGame() {
    state.diskCount = parseInt(els.diskCount.value);
    state.rods = [[], [], []];
    state.moves = 0;
    state.isSolved = false;
    state.selectedRod = null;
    state.history = [];
    stopSolver();
    hideVictoryModal();

    // Populate first rod
    for (let i = state.diskCount; i >= 1; i--) {
      state.rods[0].push(i);
    }

    updateOptimalMoves();
    updateUI();
    resetTimer();
    startTimer();
    els.undoBtn.disabled = true;
  }

  function updateOptimalMoves() {
    const optimal = Math.pow(2, state.diskCount) - 1;
    els.optimalMoves.textContent = optimal;
  }

  function renderBoard() {
    for (let i = 0; i < 3; i++) {
      const wrapper = els.disksWrappers[i];
      wrapper.innerHTML = '';

      state.rods[i].forEach(diskSize => {
        const diskEl = document.createElement('div');
        diskEl.className = 'disk';
        diskEl.dataset.size = diskSize;

        // If this rod is selected and it's the top disk
        if (state.selectedRod === i && diskSize === state.rods[i][state.rods[i].length - 1]) {
          diskEl.classList.add('selected');
        }

        // Setup Drag and Drop
        if (diskSize === state.rods[i][state.rods[i].length - 1] && !state.isSolved) {
           diskEl.style.cursor = 'grab';
           diskEl.addEventListener('mousedown', (e) => handleDragStart(e, i, diskEl));
           diskEl.addEventListener('touchstart', (e) => handleDragStart(e, i, diskEl), { passive: false });
        }

        wrapper.appendChild(diskEl);
      });
    }
  }

  // Drag and Drop Logic
  function handleDragStart(e, rodIndex, diskEl) {
    if (state.isSolved) return;
    if (solverState.steps.length > 0 && solverState.currentStepIndex < solverState.steps.length && solverState.isPlaying) return;

    // Clear selection
    state.selectedRod = null;
    updateUI();

    // We need to re-find the newly rendered disk element after updateUI
    const newWrapper = els.disksWrappers[rodIndex];
    dragState.draggedDisk = newWrapper.lastElementChild;
    if (!dragState.draggedDisk) return;

    dragState.isDragging = true;
    dragState.sourceRodIndex = rodIndex;

    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

    dragState.startX = clientX;
    dragState.startY = clientY;

    const rect = dragState.draggedDisk.getBoundingClientRect();

    dragState.draggedDisk.classList.add('dragging');
    dragState.draggedDisk.style.width = rect.width + 'px';
    dragState.draggedDisk.style.left = rect.left + 'px';
    dragState.draggedDisk.style.top = rect.top + 'px';

    // Append to body so it escapes rod container
    document.body.appendChild(dragState.draggedDisk);
    if(e.cancelable) e.preventDefault();
  }

  function handleDragMove(e) {
    if (!dragState.isDragging || !dragState.draggedDisk) return;

    const clientX = e.type.includes('mouse') ? e.clientX : e.touches[0].clientX;
    const clientY = e.type.includes('mouse') ? e.clientY : e.touches[0].clientY;

    const dx = clientX - dragState.startX;
    const dy = clientY - dragState.startY;

    const currentLeft = parseFloat(dragState.draggedDisk.style.left) || 0;
    const currentTop = parseFloat(dragState.draggedDisk.style.top) || 0;

    dragState.draggedDisk.style.transform = `translate(${dx}px, ${dy}px)`;
    if(e.cancelable) e.preventDefault();
  }

  function handleDragEnd(e) {
    if (!dragState.isDragging || !dragState.draggedDisk) return;

    const clientX = e.type.includes('mouse') ? e.clientX : e.changedTouches[0].clientX;

    dragState.isDragging = false;
    dragState.draggedDisk.classList.remove('dragging');
    dragState.draggedDisk.style.transform = '';
    dragState.draggedDisk.style.width = '';
    dragState.draggedDisk.style.left = '';
    dragState.draggedDisk.style.top = '';

    // Remove from body
    if (dragState.draggedDisk.parentNode === document.body) {
        document.body.removeChild(dragState.draggedDisk);
    }
    dragState.draggedDisk = null;

    let targetRodIndex = null;

    // Determine which rod it was dropped on based on X coordinate
    els.rods.forEach((rod, index) => {
        const rect = rod.getBoundingClientRect();
        if (clientX >= rect.left && clientX <= rect.right) {
            targetRodIndex = index;
        }
    });

    if (targetRodIndex !== null && targetRodIndex !== dragState.sourceRodIndex) {
        moveDisk(dragState.sourceRodIndex, targetRodIndex);
    } else {
        updateUI(); // Snap back
    }

    dragState.sourceRodIndex = null;
  }

  function updateUI() {
    renderBoard();
    els.moveCount.textContent = state.moves;
    els.undoBtn.disabled = state.history.length === 0 || state.isSolved || solverState.steps.length > 0;
    els.autoSolveBtn.disabled = state.isSolved;
  }

  // Interaction Logic (Click-to-Move)
  function handleRodClick(rodIndex) {
    if (state.isSolved) return;

    if (state.selectedRod === null) {
      // Select rod
      if (state.rods[rodIndex].length > 0) {
        state.selectedRod = rodIndex;
        updateUI();
      }
    } else {
      // Try to move
      const fromIndex = state.selectedRod;
      const toIndex = rodIndex;

      if (fromIndex === toIndex) {
        // Deselect
        state.selectedRod = null;
        updateUI();
      } else {
        moveDisk(fromIndex, toIndex);
      }
    }
  }

  function isValidMove(fromIndex, toIndex) {
    const fromRod = state.rods[fromIndex];
    const toRod = state.rods[toIndex];

    if (fromRod.length === 0) return false;

    const diskToMove = fromRod[fromRod.length - 1];
    const targetTopDisk = toRod.length > 0 ? toRod[toRod.length - 1] : null;

    return targetTopDisk === null || diskToMove < targetTopDisk;
  }

  function moveDisk(fromIndex, toIndex) {
    if (isValidMove(fromIndex, toIndex)) {
      const disk = state.rods[fromIndex].pop();
      state.history.push({ from: fromIndex, to: toIndex, disk: disk });
      state.rods[toIndex].push(disk);
      state.moves++;
      state.selectedRod = null;
      updateUI();
      checkWin();
    } else {
      // Invalid move visual feedback
      const targetWrapper = els.disksWrappers[toIndex];
      targetWrapper.classList.add('shake');
      setTimeout(() => targetWrapper.classList.remove('shake'), 300);
      state.selectedRod = null;
      updateUI();
    }
  }

  function undoMove() {
    if (state.history.length === 0 || state.isSolved) return;
    const lastMove = state.history.pop();
    const disk = state.rods[lastMove.to].pop();
    state.rods[lastMove.from].push(disk);
    state.moves--;
    state.selectedRod = null;
    updateUI();
  }

  function checkWin() {
    if (state.rods[2].length === state.diskCount) {
      state.isSolved = true;
      stopTimer();
      showVictoryModal();
    }
  }

  function showVictoryModal() {
    const optimal = Math.pow(2, state.diskCount) - 1;
    els.victoryMoves.textContent = state.moves;
    els.victoryOptimal.textContent = optimal;
    els.victoryTime.textContent = els.timer.textContent;

    if (state.moves === optimal && solverState.steps.length === 0) {
      els.victoryMessage.textContent = "عالی! با کمترین تعداد حرکت ممکن حل کردی.";
      els.victoryMessage.style.color = "var(--green)";
      createConfetti();
    } else if (solverState.steps.length > 0) {
      els.victoryMessage.textContent = "برج توسط حل‌کننده خودکار کامل شد.";
      els.victoryMessage.style.color = "var(--ink-soft)";
    } else {
      els.victoryMessage.textContent = "خوب بود! تلاش کن به حالت بهینه نزدیک‌تر بشی.";
      els.victoryMessage.style.color = "var(--orange)";
    }

    els.victoryModalOverlay.classList.add('active');
    els.victoryModal.classList.add('active');
  }

  function hideVictoryModal() {
    els.victoryModalOverlay.classList.remove('active');
    els.victoryModal.classList.remove('active');
    els.confettiContainer.innerHTML = '';
  }

  function createConfetti() {
    els.confettiContainer.innerHTML = '';
    const colors = ['#f44336', '#e91e63', '#9c27b0', '#673ab7', '#3f51b5', '#2196f3', '#03a9f4', '#00bcd4', '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722'];
    for (let i = 0; i < 100; i++) {
      const confetti = document.createElement('div');
      confetti.classList.add('confetti');
      confetti.style.left = Math.random() * 100 + 'vw';
      confetti.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      confetti.style.animationDuration = Math.random() * 3 + 2 + 's';
      confetti.style.animationDelay = Math.random() * 2 + 's';
      els.confettiContainer.appendChild(confetti);
    }
  }

  // Auto-Solver Logic
  function generateSolverSteps() {
    solverState.steps = [];
    // Reset to start configuration for generating steps based on current disk count
    const tempRods = [[], [], []];
    for (let i = state.diskCount; i >= 1; i--) tempRods[0].push(i);

    function solveHanoiRecursive(n, source, target, aux) {
      if (n === 1) {
        const disk = tempRods[source].pop();
        tempRods[target].push(disk);
        solverState.steps.push({ disk, from: source, to: target });
        return;
      }
      solveHanoiRecursive(n - 1, source, aux, target);
      const disk = tempRods[source].pop();
      tempRods[target].push(disk);
      solverState.steps.push({ disk, from: source, to: target });
      solveHanoiRecursive(n - 1, aux, target, source);
    }

    solveHanoiRecursive(state.diskCount, 0, 2, 1);
  }

  function startAutoSolve() {
    if (state.isSolved) return;

    // Always start solver from clean state
    if (state.moves > 0) {
      startNewGame();
    }

    generateSolverSteps();
    solverState.currentStepIndex = 0;

    els.controlsPanel.classList.add('hidden');
    els.solverControls.classList.remove('hidden');

    updateLog("حل خودکار آماده است.");
    updateSolverUI();
  }

  function stopSolver() {
    pauseSolver();
    solverState.steps = [];
    solverState.currentStepIndex = 0;

    if (els.controlsPanel) {
      els.controlsPanel.classList.remove('hidden');
      els.solverControls.classList.add('hidden');
      els.executionLog.textContent = '';
    }
  }

  function applySolverStep(forward = true) {
    if (forward) {
      if (solverState.currentStepIndex >= solverState.steps.length) return false;
      const step = solverState.steps[solverState.currentStepIndex];

      const disk = state.rods[step.from].pop();
      state.rods[step.to].push(disk);
      state.moves++;

      const rodNames = ['A', 'B', 'C'];
      updateLog(`انتقال دیسک ${step.disk} از میله ${rodNames[step.from]} به ${rodNames[step.to]}`);

      solverState.currentStepIndex++;
      updateUI();
      checkWin();
      return true;
    } else {
      if (solverState.currentStepIndex <= 0) return false;
      solverState.currentStepIndex--;
      const step = solverState.steps[solverState.currentStepIndex];

      const disk = state.rods[step.to].pop();
      state.rods[step.from].push(disk);
      state.moves--;

      const rodNames = ['A', 'B', 'C'];
      updateLog(`بازگشت: انتقال دیسک ${step.disk} از ${rodNames[step.to]} به ${rodNames[step.from]}`);

      if (state.isSolved) {
          state.isSolved = false;
      }

      updateUI();
      return true;
    }
  }

  function playSolver() {
    if (solverState.currentStepIndex >= solverState.steps.length) return;
    solverState.isPlaying = true;
    els.playPauseBtn.textContent = '⏸️';

    const stepFn = () => {
      if (!applySolverStep(true)) {
        pauseSolver();
      }
      updateSolverUI();
    };

    stepFn(); // apply first step immediately
    solverState.intervalId = setInterval(stepFn, solverState.speed);
  }

  function pauseSolver() {
    solverState.isPlaying = false;
    els.playPauseBtn.textContent = '▶️';
    clearInterval(solverState.intervalId);
    updateSolverUI();
  }

  function togglePlayPause() {
    if (solverState.isPlaying) pauseSolver();
    else playSolver();
  }

  function stepForward() {
    pauseSolver();
    applySolverStep(true);
    updateSolverUI();
  }

  function stepBackward() {
    pauseSolver();
    applySolverStep(false);
    updateSolverUI();
  }

  function updateSolverSpeed() {
    const val = els.speedSlider.value;
    // 1: Slow(1000ms), 2: Normal(500ms), 3: Fast(200ms), 4: Instant(50ms)
    const speeds = [1000, 500, 200, 50];
    solverState.speed = speeds[val - 1];

    if (solverState.isPlaying) {
      pauseSolver();
      playSolver();
    }
  }

  function updateLog(msg) {
    els.executionLog.textContent = msg;
  }

  function updateSolverUI() {
    els.stepBackBtn.disabled = solverState.currentStepIndex === 0;
    els.stepForwardBtn.disabled = solverState.currentStepIndex === solverState.steps.length;
    els.playPauseBtn.disabled = solverState.currentStepIndex === solverState.steps.length;
  }

  // Timer functions
  function startTimer() {
    state.startTime = Date.now();
    state.timerInterval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - state.startTime) / 1000);
      const m = String(Math.floor(elapsed / 60)).padStart(2, '0');
      const s = String(elapsed % 60).padStart(2, '0');
      els.timer.textContent = `${m}:${s}`;
    }, 1000);
  }

  function stopTimer() {
    clearInterval(state.timerInterval);
  }

  function resetTimer() {
    stopTimer();
    els.timer.textContent = '00:00';
  }

  // Modals
  function openInfo() {
    els.infoModal.classList.add('active');
    els.infoOverlay.classList.add('active');
  }

  function closeInfo() {
    els.infoModal.classList.remove('active');
    els.infoOverlay.classList.remove('active');
  }

  // Event Listeners
  function bindEvents() {
    els.diskCount.addEventListener('change', startNewGame);
    els.resetBtn.addEventListener('click', startNewGame);
    els.undoBtn.addEventListener('click', undoMove);

    // Solver Events
    els.autoSolveBtn.addEventListener('click', startAutoSolve);
    els.stopSolveBtn.addEventListener('click', () => {
      stopSolver();
      startNewGame();
    });
    els.playPauseBtn.addEventListener('click', togglePlayPause);
    els.stepForwardBtn.addEventListener('click', stepForward);
    els.stepBackBtn.addEventListener('click', stepBackward);
    els.speedSlider.addEventListener('input', updateSolverSpeed);

    // Victory Events
    els.playAgainBtn.addEventListener('click', startNewGame);
    els.victoryModalOverlay.addEventListener('click', startNewGame);

    els.rods.forEach((rodEl, index) => {
      // Rod click hitboxes
      rodEl.querySelector('.rod-hitbox').addEventListener('click', () => handleRodClick(index));
    });

    // Global Drag Events
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);

    els.infoBtn.addEventListener('click', openInfo);
    els.closeInfoBtn.addEventListener('click', closeInfo);
    els.infoOverlay.addEventListener('click', closeInfo);
  }

  // Public API
  return {
    init,
    getState: () => state,
    els: els,
    startNewGame,
    updateUI
  };
})();

document.addEventListener('DOMContentLoaded', () => {
  HanoiGame.init();
});
