/**
 * MathPlay - 15 Puzzle Logic
 */

const PuzzleState = {
  n: 4, // Grid size (n x n)
  tiles: [], // 1D array representing the board. 0 is the empty space.
  moves: 0,
  startTime: null,
  timerInterval: null,
  isPlaying: false,
  boardElement: document.getElementById('gameBoard'),
  tileSize: 0,

  // Solvability check
  // https://www.geeksforgeeks.org/check-instance-15-puzzle-solvable/
  getInversions(arr) {
    let invCount = 0;
    for (let i = 0; i < arr.length - 1; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        if (arr[i] > 0 && arr[j] > 0 && arr[i] > arr[j]) {
          invCount++;
        }
      }
    }
    return invCount;
  },

  isSolvable(puzzleArray) {
    const invCount = this.getInversions(puzzleArray);

    // If N is odd, then puzzle instance is solvable if number of inversions is even in the input state.
    if (this.n % 2 !== 0) {
      return invCount % 2 === 0;
    }

    // If N is even, puzzle instance is solvable if:
    // the blank is on an even row counting from the bottom (second-last, fourth-last, etc.) and number of inversions is odd.
    // the blank is on an odd row counting from the bottom (last, third-last, fifth-last, etc.) and number of inversions is even.
    const emptyPos = puzzleArray.indexOf(0);
    const emptyRowFromTop = Math.floor(emptyPos / this.n);
    const emptyRowFromBottom = this.n - emptyRowFromTop;

    if (emptyRowFromBottom % 2 === 0) {
      return invCount % 2 !== 0;
    } else {
      return invCount % 2 === 0;
    }
  },

  generateSolvableBoard() {
    let arr = [];
    const maxVal = this.n * this.n;

    // Keep generating random permutations until a solvable one is found
    do {
      arr = Array.from({length: maxVal}, (_, i) => i);
      // Shuffle array (Fisher-Yates)
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
    } while (!this.isSolvable(arr) || this.isSolved(arr));

    return arr;
  },

  isSolved(arr = this.tiles) {
    const max = this.n * this.n;
    // Check if the empty space is at the very end
    if (arr[max - 1] !== 0) return false;

    // Check if all other tiles are in ascending order
    for (let i = 0; i < max - 1; i++) {
      if (arr[i] !== i + 1) return false;
    }
    return true;
  }
};

const UI = {
  moveDisplay: document.getElementById('moveCountDisplay'),
  timeDisplay: document.getElementById('timerDisplay'),
  board: document.getElementById('gameBoard'),
  modal: document.getElementById('victoryModal'),
  finalTime: document.getElementById('victoryTime'),
  finalMoves: document.getElementById('victoryMoves'),

  formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  },

  updateStats() {
    this.moveDisplay.textContent = PuzzleState.moves;
    if (PuzzleState.startTime) {
      const elapsed = Math.floor((Date.now() - PuzzleState.startTime) / 1000);
      this.timeDisplay.textContent = this.formatTime(elapsed);
    } else {
      this.timeDisplay.textContent = "00:00";
    }
  },

  showVictory() {
    const elapsed = Math.floor((Date.now() - PuzzleState.startTime) / 1000);
    this.finalTime.textContent = this.formatTime(elapsed);
    this.finalMoves.textContent = PuzzleState.moves;
    this.modal.classList.add('active');
  },

  hideVictory() {
    this.modal.classList.remove('active');
  }
};

const Engine = {
  init() {
    this.bindEvents();
    this.startNewGame();

    // Resize observer to handle responsive tile sizing
    window.addEventListener('resize', () => {
      if (PuzzleState.isPlaying) {
        this.renderBoard();
      }
    });
  },

  startNewGame() {
    const sizeSelect = document.getElementById('gridSizeSelect');
    PuzzleState.n = parseInt(sizeSelect.value);
    PuzzleState.tiles = PuzzleState.generateSolvableBoard();
    PuzzleState.moves = 0;
    PuzzleState.isPlaying = true;
    PuzzleState.startTime = Date.now();

    if (PuzzleState.timerInterval) clearInterval(PuzzleState.timerInterval);
    PuzzleState.timerInterval = setInterval(() => UI.updateStats(), 1000);

    UI.hideVictory();
    UI.updateStats();
    this.renderBoard();
  },

  renderBoard(fullRebuild = true) {
    const board = PuzzleState.boardElement;
    const boardRect = board.getBoundingClientRect();
    // Inner width considering the 8px border
    const boardWidth = boardRect.width - 16;
    const tileSize = boardWidth / PuzzleState.n;
    PuzzleState.tileSize = tileSize;

    // Dynamic font size based on grid size
    const fontSize = PuzzleState.n === 5 ? '1.2rem' : PuzzleState.n === 4 ? '1.5rem' : '2rem';
    const tileGap = 4; // Visual gap simulated by shrinking the tile slightly

    if (fullRebuild) {
      board.innerHTML = '';
    }

    PuzzleState.tiles.forEach((value, index) => {
      if (value === 0) return; // Don't render the empty space

      const row = Math.floor(index / PuzzleState.n);
      const col = index % PuzzleState.n;

      let tile = document.getElementById(`tile-${value}`);
      if (!tile && fullRebuild) {
        tile = document.createElement('div');
        tile.className = 'tile';
        tile.textContent = value;
        tile.id = `tile-${value}`;
        // Event listener
        tile.addEventListener('click', () => {
          // Find current index of this tile in the state
          const currentIndex = PuzzleState.tiles.indexOf(value);
          this.tryMove(currentIndex);
        });
        board.appendChild(tile);
      }

      if (tile) {
        // Calculate position
        const x = col * tileSize;
        const y = row * tileSize;

        // Style
        tile.style.width = `${tileSize - tileGap}px`;
        tile.style.height = `${tileSize - tileGap}px`;
        tile.style.fontSize = fontSize;
        tile.style.transform = `translate(${x + tileGap/2}px, ${y + tileGap/2}px)`;

        // Update classes
        tile.className = 'tile'; // Reset classes
        // Check if this tile is in correct final position (1-indexed based on position)
        if (value === index + 1) {
          tile.classList.add('solved');
        }

        // Is movable? (adjacent to 0)
        if (this.isMovable(index)) {
          tile.classList.add('movable');
        }
      }
    });
  },

  isMovable(index) {
    const emptyPos = PuzzleState.tiles.indexOf(0);
    const n = PuzzleState.n;

    const row = Math.floor(index / n);
    const col = index % n;

    const emptyRow = Math.floor(emptyPos / n);
    const emptyCol = emptyPos % n;

    // Check adjacency (up, down, left, right)
    return (Math.abs(row - emptyRow) === 1 && col === emptyCol) ||
           (Math.abs(col - emptyCol) === 1 && row === emptyRow);
  },

  tryMove(index) {
    if (!PuzzleState.isPlaying) return;

    // Multi-tile slide support
    const emptyPos = PuzzleState.tiles.indexOf(0);
    const n = PuzzleState.n;

    const row = Math.floor(index / n);
    const col = index % n;
    const emptyRow = Math.floor(emptyPos / n);
    const emptyCol = emptyPos % n;

    // If not in same row or column, can't slide
    if (row !== emptyRow && col !== emptyCol) return;

    // Calculate path of tiles to move
    const path = [];
    if (row === emptyRow) {
      // Horizontal slide
      const dir = col > emptyCol ? 1 : -1;
      for (let c = emptyCol + dir; c !== col + dir; c += dir) {
        path.push(row * n + c);
      }
    } else {
      // Vertical slide
      const dir = row > emptyRow ? 1 : -1;
      for (let r = emptyRow + dir; r !== row + dir; r += dir) {
        path.push(r * n + emptyCol);
      }
    }

    if (path.length > 0) {
      this.executeMove(path);
    }
  },

  executeMove(path) {
    // path is ordered from closest to empty to furthest (clicked)
    // We shift them one by one into the empty space

    for (let i = 0; i < path.length; i++) {
      const tileIndex = path[i];
      const emptyPos = PuzzleState.tiles.indexOf(0);

      // Swap in state array
      PuzzleState.tiles[emptyPos] = PuzzleState.tiles[tileIndex];
      PuzzleState.tiles[tileIndex] = 0;
    }

    PuzzleState.moves++;
    UI.updateStats();

    // Re-render (smooth animation happens via CSS transition on transform)
    this.renderBoard(false);

    // Check win condition
    if (PuzzleState.isSolved()) {
      this.handleWin();
    }
  },

  handleWin() {
    PuzzleState.isPlaying = false;
    clearInterval(PuzzleState.timerInterval);

    // Make all tiles show as solved
    document.querySelectorAll('.tile').forEach(t => {
      t.classList.add('solved');
      t.classList.remove('movable');
    });

    setTimeout(() => {
      UI.showVictory();
    }, 500);
  },

  bindEvents() {
    document.getElementById('restartBtn').addEventListener('click', () => this.startNewGame());
    document.getElementById('playAgainBtn').addEventListener('click', () => this.startNewGame());
    document.getElementById('gridSizeSelect').addEventListener('change', () => this.startNewGame());

    // Keyboard support
    window.addEventListener('keydown', (e) => {
      if (!PuzzleState.isPlaying) return;

      const emptyPos = PuzzleState.tiles.indexOf(0);
      const n = PuzzleState.n;
      const row = Math.floor(emptyPos / n);
      const col = emptyPos % n;

      let targetIndex = -1;

      // Arrow keys move the tiles INTO the empty space.
      // So if you press UP, the tile BELOW the empty space moves UP.
      if (e.key === 'ArrowUp' || e.key === 'w') {
        if (row < n - 1) targetIndex = emptyPos + n; // tile below
      } else if (e.key === 'ArrowDown' || e.key === 's') {
        if (row > 0) targetIndex = emptyPos - n; // tile above
      } else if (e.key === 'ArrowLeft' || e.key === 'a') {
        // In LTR board, ArrowLeft moves the tile on the RIGHT into the empty space
        if (col < n - 1) targetIndex = emptyPos + 1;
      } else if (e.key === 'ArrowRight' || e.key === 'd') {
        if (col > 0) targetIndex = emptyPos - 1; // tile on the left
      }

      if (targetIndex !== -1) {
        e.preventDefault();
        this.tryMove(targetIndex);
      }
    });

    // Touch swipe support
    let touchStartX = 0;
    let touchStartY = 0;

    PuzzleState.boardElement.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
      touchStartY = e.changedTouches[0].screenY;
    }, {passive: true});

    PuzzleState.boardElement.addEventListener('touchend', (e) => {
      if (!PuzzleState.isPlaying) return;

      const touchEndX = e.changedTouches[0].screenX;
      const touchEndY = e.changedTouches[0].screenY;

      const dx = touchEndX - touchStartX;
      const dy = touchEndY - touchStartY;

      if (Math.abs(dx) < 30 && Math.abs(dy) < 30) return; // Too short to be a swipe

      const emptyPos = PuzzleState.tiles.indexOf(0);
      const n = PuzzleState.n;
      const row = Math.floor(emptyPos / n);
      const col = emptyPos % n;
      let targetIndex = -1;

      if (Math.abs(dx) > Math.abs(dy)) {
        // Horizontal swipe
        if (dx > 0) {
          // Swipe Right: User wants to move tile from Left into empty space
          if (col > 0) targetIndex = emptyPos - 1;
        } else {
          // Swipe Left: User wants to move tile from Right into empty space
          if (col < n - 1) targetIndex = emptyPos + 1;
        }
      } else {
        // Vertical swipe
        if (dy > 0) {
          // Swipe Down: User wants to move tile from Above into empty space
          if (row > 0) targetIndex = emptyPos - n;
        } else {
          // Swipe Up: User wants to move tile from Below into empty space
          if (row < n - 1) targetIndex = emptyPos + n;
        }
      }

      if (targetIndex !== -1) {
        this.tryMove(targetIndex);
      }
    }, {passive: true});
  }
};

// Start the game when the page loads
document.addEventListener('DOMContentLoaded', () => Engine.init());
