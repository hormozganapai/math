// State variables
const State = {
  piles: [],
  currentPlayer: 1, // 1 for Player 1, 2 for Player 2 / AI
  gameMode: 'ai', // 'ai' or 'pvp'
  aiDifficulty: 'hard', // 'easy', 'medium', 'hard'
  winCondition: 'misere', // 'normal' (last to move wins) or 'misere' (last to move loses)
  setupType: 'classic', // 'classic', 'standard', 'quick', 'custom'
  selectedPileIndex: -1,
  selectedTokens: 0,
  gameOver: false,
  scoreP1: 0,
  scoreP2: 0
};

const PRESETS = {
  classic: [3, 4, 5],
  standard: [1, 3, 5, 7],
  quick: [3, 3]
};

// Core Math
function calculateNimSum(piles) {
  return piles.reduce((sum, count) => sum ^ count, 0);
}

function toBinaryString(num, padding = 4) {
  return num.toString(2).padStart(padding, '0');
}

// AI Logic
function getAIMove() {
  const nonEmptyPiles = State.piles.map((count, index) => ({ count, index })).filter(p => p.count > 0);
  if (nonEmptyPiles.length === 0) return null;

  let move = null;

  if (State.aiDifficulty === 'easy' || (State.aiDifficulty === 'medium' && Math.random() < 0.5)) {
    move = getRandomMove(nonEmptyPiles);
  } else {
    move = getOptimalMove(nonEmptyPiles);
  }

  return move;
}

function getRandomMove(nonEmptyPiles) {
  const randomPile = nonEmptyPiles[Math.floor(Math.random() * nonEmptyPiles.length)];
  const takeCount = Math.floor(Math.random() * randomPile.count) + 1;
  return { pileIndex: randomPile.index, count: takeCount };
}

function getOptimalMove(nonEmptyPiles) {
  const nimSum = calculateNimSum(State.piles);

  // Misere Play adjustments
  if (State.winCondition === 'misere') {
    let countGreaterThanOne = 0;
    for (let p of State.piles) {
      if (p > 1) countGreaterThanOne++;
    }

    // Near-endgame misere logic: if there is exactly one pile > 1,
    // leave an odd number of size-1 piles.
    if (countGreaterThanOne === 1) {
      for (let i = 0; i < State.piles.length; i++) {
        if (State.piles[i] > 1) {
          let currentSize1Piles = State.piles.filter(p => p === 1).length;
          let target = (currentSize1Piles % 2 === 0) ? 1 : 0;
          return { pileIndex: i, count: State.piles[i] - target };
        }
      }
    }
  }

  // Normal optimal play (or general Misere state before endgame)
  if (nimSum !== 0) {
    for (let i = 0; i < State.piles.length; i++) {
      const targetSize = State.piles[i] ^ nimSum;
      if (targetSize < State.piles[i]) {
        return { pileIndex: i, count: State.piles[i] - targetSize };
      }
    }
  }

  // If in a losing position (NimSum == 0), just make a random valid move to stall
  return getRandomMove(nonEmptyPiles);
}

// DOM Rendering
const Elements = {
  pilesContainer: null,
  analyzerPanel: null,
  turnIndicator: null,
  confirmBtn: null,
  modalOverlay: null,
  modalTitle: null,
  modalDesc: null
};

function initElements() {
  Elements.pilesContainer = document.getElementById('piles-container');
  Elements.analyzerPanel = document.getElementById('analyzer-rows');
  Elements.analyzerSum = document.getElementById('analyzer-sum-val');
  Elements.turnIndicator = document.getElementById('turn-indicator');
  Elements.confirmBtn = document.getElementById('confirm-btn');
  Elements.modalOverlay = document.getElementById('modal-overlay');
  Elements.modalTitle = document.getElementById('modal-title');
  Elements.modalDesc = document.getElementById('modal-desc');
  Elements.toggleAnalyzerBtn = document.getElementById('toggle-analyzer-btn');
  Elements.analyzerContainer = document.getElementById('analyzer-panel');
  Elements.scoreP1 = document.getElementById('score-p1');
  Elements.scoreP2 = document.getElementById('score-p2');
  Elements.scoreP2Label = document.getElementById('score-p2-label');
}

function renderPiles() {
  if (!Elements.pilesContainer) return;
  Elements.pilesContainer.innerHTML = '';

  State.piles.forEach((count, pileIndex) => {
    const pileDiv = document.createElement('div');
    pileDiv.className = 'pile';

    // Dim piles that are empty, or if another pile is currently selected
    if (count === 0 || (State.selectedPileIndex !== -1 && State.selectedPileIndex !== pileIndex)) {
      pileDiv.classList.add('disabled');
    }

    if (State.selectedPileIndex === pileIndex) {
      pileDiv.classList.add('active-pile');
    }

    // Render tokens for this pile
    // We add placeholder removed tokens if we want to keep the width stable,
    // but for simplicity we will just render active tokens + selected tokens.
    // Actually, to make removal look good, we could just re-render.
    for (let i = 0; i < count; i++) {
      const token = document.createElement('div');
      token.className = 'token';

      // If this pile is selected, we highlight the last N tokens based on selectedTokens
      if (State.selectedPileIndex === pileIndex && i >= count - State.selectedTokens) {
        token.classList.add('selected');
      }

      token.addEventListener('click', () => selectToken(pileIndex, i, count));
      pileDiv.appendChild(token);
    }

    Elements.pilesContainer.appendChild(pileDiv);
  });

  // Update button state
  if (Elements.confirmBtn) {
    Elements.confirmBtn.disabled = State.selectedTokens === 0;
  }

  renderAnalyzer();
}

function renderAnalyzer() {
  if (!Elements.analyzerPanel) return;
  Elements.analyzerPanel.innerHTML = '';

  const nimSum = calculateNimSum(State.piles);
  const maxVal = Math.max(...State.piles, nimSum, 1);
  const padding = maxVal.toString(2).length;

  State.piles.forEach((count, i) => {
    const row = document.createElement('div');
    row.className = 'analyzer-row';
    row.innerHTML = `<span>Pile ${i + 1} (${count})</span> <span>${toBinaryString(count, padding)}</span>`;
    Elements.analyzerPanel.appendChild(row);
  });

  if (Elements.analyzerSum) {
    Elements.analyzerSum.textContent = toBinaryString(nimSum, padding);
    if (nimSum === 0) {
      Elements.analyzerSum.classList.add('sum-zero');
      Elements.analyzerSum.classList.remove('sum-nonzero');
    } else {
      Elements.analyzerSum.classList.remove('sum-zero');
      Elements.analyzerSum.classList.add('sum-nonzero');
    }
  }
}

function renderTurnIndicator() {
  if (!Elements.turnIndicator) return;

  Elements.turnIndicator.className = 'turn-indicator';
  if (State.currentPlayer === 1) {
    Elements.turnIndicator.textContent = 'نوبت بازیکن ۱';
    Elements.turnIndicator.classList.add('turn-player1');
  } else {
    Elements.turnIndicator.textContent = State.gameMode === 'ai' ? 'نوبت هوش مصنوعی' : 'نوبت بازیکن ۲';
    Elements.turnIndicator.classList.add('turn-player2');
  }
}

// Event Listeners & Game Flow
function selectToken(pileIndex, tokenIndex, totalCount) {
  if (State.currentPlayer === 2 && State.gameMode === 'ai') return; // Prevent selection during AI turn
  if (State.gameOver) return;

  // If clicking a different pile, reset selection
  if (State.selectedPileIndex !== -1 && State.selectedPileIndex !== pileIndex) {
    State.selectedPileIndex = pileIndex;
  } else {
    State.selectedPileIndex = pileIndex;
  }

  // Calculate how many to select (from clicked token to end of pile)
  const toSelect = totalCount - tokenIndex;

  // Toggle off if clicking the exact same number
  if (State.selectedTokens === toSelect) {
    State.selectedPileIndex = -1;
    State.selectedTokens = 0;
  } else {
    State.selectedTokens = toSelect;
  }

  renderPiles();
}

function applyMove(pileIndex, count) {
  State.piles[pileIndex] -= count;
  State.selectedPileIndex = -1;
  State.selectedTokens = 0;

  renderPiles();
  checkWinCondition();

  if (!State.gameOver) {
    State.currentPlayer = State.currentPlayer === 1 ? 2 : 1;
    renderTurnIndicator();

    if (State.currentPlayer === 2 && State.gameMode === 'ai') {
      setTimeout(makeAITurn, 800); // Small delay for UX
    }
  }
}

function confirmMove() {
  if (State.selectedPileIndex === -1 || State.selectedTokens === 0) return;
  applyMove(State.selectedPileIndex, State.selectedTokens);
}

function makeAITurn() {
  if (State.gameOver) return;
  const move = getAIMove();
  if (move) {
    applyMove(move.pileIndex, move.count);
  }
}

function checkWinCondition() {
  const totalRemaining = State.piles.reduce((a, b) => a + b, 0);
  if (totalRemaining === 0) {
    State.gameOver = true;
    showModal();
  }
}

function fireConfetti() {
  const duration = 3000;
  const end = Date.now() + duration;

  (function frame() {
    const confetti = document.createElement('div');
    confetti.className = 'confetti';
    confetti.style.left = Math.random() * 100 + 'vw';
    confetti.style.top = '-10px';
    confetti.style.backgroundColor = ['#7C4DFF', '#00BFA6', '#FF6B35', '#FF4785', '#FFC845', '#2E9BFF'][Math.floor(Math.random() * 6)];

    document.body.appendChild(confetti);

    const animation = confetti.animate([
      { transform: `translate3d(0, 0, 0) rotate(0)`, opacity: 1 },
      { transform: `translate3d(${Math.random() * 200 - 100}px, 100vh, 0) rotate(${Math.random() * 720}deg)`, opacity: 0 }
    ], {
      duration: Math.random() * 1000 + 1000,
      easing: 'cubic-bezier(.37,0,.63,1)'
    });

    animation.onfinish = () => confetti.remove();

    if (Date.now() < end) {
      requestAnimationFrame(frame);
    }
  }());
}

function showModal() {
  if (!Elements.modalOverlay) return;

  let winner = 1;
  if (State.winCondition === 'misere') {
    // In misere, the person who made the LAST move (took the last token) loses.
    // The current player just made the move that left 0 tokens.
    winner = State.currentPlayer === 1 ? 2 : 1;
  } else {
    // In normal, the person who made the LAST move wins.
    winner = State.currentPlayer;
  }

  // Update Score
  if (winner === 1) {
    State.scoreP1++;
    if (Elements.scoreP1) Elements.scoreP1.textContent = State.scoreP1;
  } else {
    State.scoreP2++;
    if (Elements.scoreP2) Elements.scoreP2.textContent = State.scoreP2;
  }

  let title = '';
  let desc = '';
  let isWin = false;

  if (State.gameMode === 'ai') {
    if (winner === 1) {
      title = 'شما بردید! 🎉';
      desc = 'عالی بود! هوش مصنوعی را شکست دادید.';
      isWin = true;
    } else {
      title = 'شما باختید! 🤖';
      desc = 'هوش مصنوعی پیروز شد. دوباره تلاش کنید.';
    }
  } else {
    title = `بازیکن ${winner} پیروز شد! 🎉`;
    desc = 'یک بازی عالی!';
    isWin = true;
  }

  Elements.modalTitle.textContent = title;
  Elements.modalTitle.className = `modal-title ${isWin ? 'modal-win' : 'modal-lose'}`;
  Elements.modalDesc.textContent = desc;

  Elements.modalOverlay.classList.add('active');

  if (isWin) {
    fireConfetti();
  }
}

function initGame() {
  // Read settings
  const modeSelect = document.getElementById('mode-select');
  const diffSelect = document.getElementById('difficulty-select');
  const winSelect = document.getElementById('win-condition-select');
  const setupSelect = document.getElementById('setup-select');

  if (modeSelect) State.gameMode = modeSelect.value;
  if (diffSelect) State.aiDifficulty = diffSelect.value;
  if (winSelect) State.winCondition = winSelect.value;
  if (setupSelect) State.setupType = setupSelect.value;

  // Toggle difficulty visibility based on mode
  if (diffSelect) {
     diffSelect.parentElement.style.display = State.gameMode === 'pvp' ? 'none' : 'block';
  }

  if (State.setupType === 'custom') {
    let customInput = prompt("لطفاً تعداد و اندازه دسته‌ها را با فاصله وارد کنید (مثال: 2 4 6):", "2 4 6");
    if (customInput) {
      let parsed = customInput.trim().split(/\s+/).map(Number).filter(n => !isNaN(n) && n > 0);
      if (parsed.length > 0) {
        State.piles = parsed;
      } else {
        alert("ورودی نامعتبر بود. از چینش کلاسیک استفاده می‌شود.");
        State.setupType = 'classic';
        if (setupSelect) setupSelect.value = 'classic';
        State.piles = [...PRESETS['classic']];
      }
    } else {
      State.setupType = 'classic';
      if (setupSelect) setupSelect.value = 'classic';
      State.piles = [...PRESETS['classic']];
    }
  } else {
    State.piles = [...PRESETS[State.setupType]];
  }
  State.currentPlayer = 1;
  State.selectedPileIndex = -1;
  State.selectedTokens = 0;
  State.gameOver = false;

  if (Elements.modalOverlay) {
    Elements.modalOverlay.classList.remove('active');
  }

  renderTurnIndicator();
  renderPiles();
}

// Setup Listeners
document.addEventListener('DOMContentLoaded', () => {
  initElements();

  if (Elements.confirmBtn) {
    Elements.confirmBtn.addEventListener('click', confirmMove);
  }

  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) restartBtn.addEventListener('click', initGame);

  const modalRestartBtn = document.getElementById('modal-restart-btn');
  if (modalRestartBtn) modalRestartBtn.addEventListener('click', initGame);

  if (Elements.toggleAnalyzerBtn) {
    Elements.toggleAnalyzerBtn.addEventListener('click', () => {
      if (Elements.analyzerContainer) {
        Elements.analyzerContainer.classList.toggle('hidden');
      }
    });
  }

  // Update Score Label when mode changes
  const modeSelect = document.getElementById('mode-select');
  if (modeSelect && Elements.scoreP2Label) {
    modeSelect.addEventListener('change', () => {
       Elements.scoreP2Label.textContent = modeSelect.value === 'ai' ? 'هوش مصنوعی' : 'بازیکن ۲';
    });
  }

  // Settings change listeners
  ['mode-select', 'difficulty-select', 'win-condition-select', 'setup-select'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('change', initGame);
  });

  initGame();
});
