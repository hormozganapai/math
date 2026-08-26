// games/kenken/game.js

const PRESETS = {
  easy: [
    {
      size: 4,
      cages: [
        { target: 7, operator: '+', cells: [[0, 0], [1, 0]] },
        { target: 4, operator: '+', cells: [[0, 1], [0, 2]] },
        { target: 2, operator: '-', cells: [[0, 3], [1, 3]] },
        { target: 2, operator: '÷', cells: [[1, 1], [1, 2]] },
        { target: 3, operator: '-', cells: [[2, 0], [2, 1]] },
        { target: 8, operator: '×', cells: [[2, 2], [3, 2]] },
        { target: 2, operator: '-', cells: [[2, 3], [3, 3]] },
        { target: 5, operator: '+', cells: [[3, 0], [3, 1]] }
      ]
    },
    {
      size: 4,
      cages: [
        { target: 8, operator: '+', cells: [[0, 0], [1, 0], [2, 0]] },
        { target: 4, operator: '+', cells: [[0, 1], [0, 2]] },
        { target: 2, operator: '÷', cells: [[0, 3], [1, 3]] },
        { target: 2, operator: '÷', cells: [[1, 1], [2, 1]] },
        { target: 3, operator: '+', cells: [[1, 2], [2, 2]] },
        { target: 4, operator: '+', cells: [[2, 3], [3, 3]] },
        { target: 5, operator: '+', cells: [[3, 0], [3, 1]] },
        { target: 4, operator: '', cells: [[3, 2]] }
      ]
    }
  ],
  medium: [
    {
      size: 5,
      cages: [
        { target: 10, operator: '×', cells: [[0, 0], [1, 0], [2, 0]] },
        { target: 6, operator: '+', cells: [[0, 1], [0, 2]] },
        { target: 8, operator: '+', cells: [[0, 3], [0, 4]] },
        { target: 6, operator: '×', cells: [[1, 1], [1, 2]] },
        { target: 4, operator: '×', cells: [[1, 3], [2, 3]] },
        { target: 3, operator: '÷', cells: [[1, 4], [2, 4]] },
        { target: 1, operator: '-', cells: [[3, 0], [4, 0]] },
        { target: 20, operator: '×', cells: [[2, 1], [2, 2]] },
        { target: 5, operator: '×', cells: [[3, 1], [4, 1]] },
        { target: 3, operator: '÷', cells: [[3, 2], [4, 2]] },
        { target: 7, operator: '+', cells: [[3, 3], [3, 4]] },
        { target: 2, operator: '÷', cells: [[4, 3], [4, 4]] }
      ]
    },
    {
      size: 5,
      cages: [
        { target: 20, operator: '×', cells: [[0, 0], [1, 0], [2, 0]] },
        { target: 2, operator: '÷', cells: [[0, 1], [0, 2]] },
        { target: 15, operator: '×', cells: [[0, 3], [0, 4]] },
        { target: 5, operator: '+', cells: [[1, 1], [1, 2]] },
        { target: 3, operator: '-', cells: [[1, 3], [2, 3]] },
        { target: 7, operator: '+', cells: [[1, 4], [2, 4]] },
        { target: 5, operator: '+', cells: [[3, 0], [4, 0]] },
        { target: 1, operator: '-', cells: [[2, 1], [2, 2]] },
        { target: 2, operator: '-', cells: [[3, 1], [4, 1]] },
        { target: 9, operator: '+', cells: [[3, 2], [4, 2]] },
        { target: 3, operator: '+', cells: [[3, 3], [3, 4]] },
        { target: 4, operator: '÷', cells: [[4, 3], [4, 4]] }
      ]
    }
  ],
  hard: [
    {
      size: 6,
      cages: [
        { target: 11, operator: '+', cells: [[0, 0], [1, 0]] },
        { target: 2, operator: '÷', cells: [[0, 1], [0, 2]] },
        { target: 20, operator: '×', cells: [[0, 3], [1, 3]] },
        { target: 6, operator: '×', cells: [[0, 4], [0, 5], [1, 5], [2, 5]] },
        { target: 3, operator: '-', cells: [[1, 1], [1, 2]] },
        { target: 3, operator: '÷', cells: [[1, 4], [2, 4]] },
        { target: 240, operator: '×', cells: [[2, 0], [2, 1], [3, 0], [3, 1]] },
        { target: 6, operator: '×', cells: [[2, 2], [2, 3]] },
        { target: 6, operator: '×', cells: [[3, 2], [4, 2]] },
        { target: 7, operator: '+', cells: [[3, 3], [4, 3], [4, 4]] },
        { target: 30, operator: '×', cells: [[3, 4], [3, 5]] },
        { target: 6, operator: '×', cells: [[4, 0], [4, 1]] },
        { target: 9, operator: '+', cells: [[4, 5], [5, 5]] },
        { target: 8, operator: '+', cells: [[5, 0], [5, 1], [5, 2]] },
        { target: 2, operator: '÷', cells: [[5, 3], [5, 4]] }
      ]
    },
    {
      size: 6,
      cages: [
        { target: 5, operator: '×', cells: [[0, 0], [1, 0]] },
        { target: 30, operator: '×', cells: [[0, 1], [1, 1]] },
        { target: 6, operator: '+', cells: [[0, 2], [0, 3]] },
        { target: 4, operator: '+', cells: [[0, 4], [0, 5]] },
        { target: 10, operator: '+', cells: [[1, 2], [1, 3]] },
        { target: 2, operator: '-', cells: [[1, 4], [2, 4]] },
        { target: 18, operator: '×', cells: [[1, 5], [2, 5]] },
        { target: 1, operator: '-', cells: [[2, 0], [2, 1]] },
        { target: 5, operator: '÷', cells: [[2, 2], [2, 3]] },
        { target: 3, operator: '÷', cells: [[3, 0], [4, 0]] },
        { target: 1, operator: '-', cells: [[3, 1], [4, 1]] },
        { target: 2, operator: '×', cells: [[3, 2], [4, 2]] },
        { target: 3, operator: '-', cells: [[3, 3], [4, 3]] },
        { target: 20, operator: '×', cells: [[3, 4], [3, 5]] },
        { target: 6, operator: '+', cells: [[4, 4], [4, 5]] },
        { target: 3, operator: '-', cells: [[5, 0], [5, 1]] },
        { target: 15, operator: '×', cells: [[5, 2], [5, 3]] },
        { target: 3, operator: '÷', cells: [[5, 4], [5, 5]] }
      ]
    }
  ]
};

const KenKenGame = {
  board: [], // 2D array of values
  cages: [],
  size: 0,
  difficulty: 'easy',
  selectedCell: null, // {r, c}
  timerInterval: null,
  secondsElapsed: 0,
  errorCount: 0,

  init() {
    this.bindEvents();
    this.startNewGame();
  },

  bindEvents() {
    // UI Controls
    document.getElementById('difficultySelect').addEventListener('change', (e) => {
      this.difficulty = e.target.value;
      this.startNewGame();
    });

    document.getElementById('newGameBtn').addEventListener('click', () => {
      this.startNewGame();
    });

    document.getElementById('checkBtn').addEventListener('click', () => this.checkBoard());
    document.getElementById('hintBtn').addEventListener('click', () => this.giveHint());
    document.getElementById('solveBtn').addEventListener('click', () => this.solveGame());
    document.getElementById('closeModalBtn').addEventListener('click', () => {
      document.getElementById('victoryModal').classList.add('hidden');
      this.startNewGame();
    });

    // Board Clicks
    document.getElementById('kenken-board').addEventListener('click', (e) => {
      const cellEl = e.target.closest('.cell');
      if (cellEl && !cellEl.classList.contains('fixed')) {
        this.selectCell(parseInt(cellEl.dataset.r), parseInt(cellEl.dataset.c));
      }
    });

    // Numpad clicks
    document.getElementById('numpad').addEventListener('click', (e) => {
      if (e.target.classList.contains('numpad-btn')) {
        if (e.target.classList.contains('clear-btn')) {
          this.inputValue(null);
        } else {
          this.inputValue(parseInt(e.target.textContent));
        }
      }
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
      if (!this.selectedCell) return;
      const { r, c } = this.selectedCell;

      if (e.key >= '1' && e.key <= this.size.toString()) {
        this.inputValue(parseInt(e.key));
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        this.inputValue(null);
      } else if (e.key === 'ArrowUp') {
        this.selectCell(Math.max(0, r - 1), c);
      } else if (e.key === 'ArrowDown') {
        this.selectCell(Math.min(this.size - 1, r + 1), c);
      } else if (e.key === 'ArrowLeft') {
        this.selectCell(r, Math.max(0, c - 1)); // LTR board means left is c-1
      } else if (e.key === 'ArrowRight') {
        this.selectCell(r, Math.min(this.size - 1, c + 1));
      }
    });
  },

  startNewGame() {
    this.stopTimer();
    this.secondsElapsed = 0;
    this.errorCount = 0;
    this.updateUI();

    const presetsForDiff = PRESETS[this.difficulty];
    const preset = presetsForDiff[Math.floor(Math.random() * presetsForDiff.length)];

    this.size = preset.size;
    this.cages = preset.cages;

    // Initialize empty board
    this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(null));
    this.selectedCell = null;

    this.renderBoard();
    this.renderNumpad();
    this.startTimer();
  },

  renderBoard() {
    const boardEl = document.getElementById('kenken-board');
    boardEl.innerHTML = '';
    boardEl.style.gridTemplateColumns = `repeat(${this.size}, 1fr)`;

    for (let r = 0; r < this.size; r++) {
      for (let c = 0; c < this.size; c++) {
        const cellEl = document.createElement('div');
        cellEl.className = 'cell';
        cellEl.dataset.r = r;
        cellEl.dataset.c = c;
        cellEl.id = `cell-${r}-${c}`;

        // Find which cage this cell belongs to
        const cageIndex = this.findCageIndex(r, c);
        if (cageIndex !== -1) {
          const cage = this.cages[cageIndex];
          cellEl.dataset.cage = cageIndex;

          // Compute Borders
          if (!this.isCellInCage(r - 1, c, cageIndex)) cellEl.classList.add('top-border');
          if (!this.isCellInCage(r + 1, c, cageIndex)) cellEl.classList.add('bottom-border');
          if (!this.isCellInCage(r, c - 1, cageIndex)) cellEl.classList.add('left-border');
          if (!this.isCellInCage(r, c + 1, cageIndex)) cellEl.classList.add('right-border');

          // Check if this is the top-left most cell in the cage to place the clue
          if (this.isTopLeftInCage(r, c, cage)) {
             const clueEl = document.createElement('div');
             clueEl.className = 'clue';
             // For RTL consistency, keep digits LTR using unicode isolation if needed,
             // but CSS handles direction: ltr on the wrapper.
             clueEl.textContent = `${cage.target}${cage.operator}`;
             cellEl.appendChild(clueEl);
          }
        }

        const valSpan = document.createElement('span');
        valSpan.className = 'val';
        cellEl.appendChild(valSpan);

        boardEl.appendChild(cellEl);
      }
    }
  },

  selectCell(r, c) {
    if (this.selectedCell) {
      const prevEl = document.getElementById(`cell-${this.selectedCell.r}-${this.selectedCell.c}`);
      if(prevEl) prevEl.classList.remove('selected');
    }
    this.selectedCell = { r, c };
    const newEl = document.getElementById(`cell-${r}-${c}`);
    if(newEl) newEl.classList.add('selected');
  },

  inputValue(val) {
    if (!this.selectedCell) return;
    const { r, c } = this.selectedCell;
    this.board[r][c] = val;
    this.updateCellDOM(r, c);
    this.clearErrors(); // clear errors on edit
  },

  updateCellDOM(r, c) {
    const el = document.getElementById(`cell-${r}-${c}`);
    if (!el) return;
    const valSpan = el.querySelector('.val');
    valSpan.textContent = this.board[r][c] !== null ? this.board[r][c] : '';
  },

  clearErrors() {
    document.querySelectorAll('.cell.error').forEach(el => el.classList.remove('error'));
  },

  checkBoard() {
    this.clearErrors();
    let hasError = false;
    let isComplete = true;

    // Check Row/Col Uniqueness
    for (let i = 0; i < this.size; i++) {
      let rowVals = new Map();
      let colVals = new Map();
      for (let j = 0; j < this.size; j++) {
        // Row check
        let rVal = this.board[i][j];
        if (rVal === null) isComplete = false;
        else {
          if (rowVals.has(rVal)) {
            document.getElementById(`cell-${i}-${j}`).classList.add('error');
            document.getElementById(`cell-${i}-${rowVals.get(rVal)}`).classList.add('error');
            hasError = true;
          } else {
            rowVals.set(rVal, j);
          }
        }

        // Col check
        let cVal = this.board[j][i];
        if (cVal !== null) {
          if (colVals.has(cVal)) {
            document.getElementById(`cell-${j}-${i}`).classList.add('error');
            document.getElementById(`cell-${colVals.get(cVal)}-${i}`).classList.add('error');
            hasError = true;
          } else {
            colVals.set(cVal, j);
          }
        }
      }
    }

    // Check Cage Rules
    for (let i = 0; i < this.cages.length; i++) {
      const cage = this.cages[i];
      let cageVals = [];
      let cageComplete = true;
      for (let cell of cage.cells) {
        let val = this.board[cell[0]][cell[1]];
        if (val === null) cageComplete = false;
        cageVals.push(val);
      }

      if (cageComplete) {
        if (!this.validateCageLogic(cage, cageVals)) {
          hasError = true;
          for (let cell of cage.cells) {
            document.getElementById(`cell-${cell[0]}-${cell[1]}`).classList.add('error');
          }
        }
      } else {
        isComplete = false;
      }
    }

    if (hasError) {
      this.errorCount++;
      this.updateUI();
    } else if (isComplete) {
      this.stopTimer();
      const m = Math.floor(this.secondsElapsed / 60).toString().padStart(2, '0');
      const s = (this.secondsElapsed % 60).toString().padStart(2, '0');
      const timeStr = `زمان شما: ${m}:${s}`.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
      document.getElementById('victoryTime').textContent = timeStr;
      document.getElementById('victoryModal').classList.remove('hidden');
    }

    return !hasError;
  },

  validateCageLogic(cage, vals) {
    if (cage.operator === '') return vals[0] === cage.target;
    if (cage.operator === '+') {
      return vals.reduce((a, b) => a + b, 0) === cage.target;
    }
    if (cage.operator === '×') {
      return vals.reduce((a, b) => a * b, 1) === cage.target;
    }
    if (cage.operator === '-') {
      if (vals.length !== 2) return false; // Safety
      return Math.abs(vals[0] - vals[1]) === cage.target;
    }
    if (cage.operator === '÷') {
      if (vals.length !== 2) return false;
      let max = Math.max(vals[0], vals[1]);
      let min = Math.min(vals[0], vals[1]);
      return max / min === cage.target;
    }
    return false;
  },

  solveGame() {
    this.stopTimer();
    this.clearErrors();
    // Simple backtracking solver
    const emptyCells = [];
    for(let r=0; r<this.size; r++) {
      for(let c=0; c<this.size; c++) {
        emptyCells.push({r, c});
        this.board[r][c] = null;
      }
    }

    const isValidPartial = () => {
       // Row/col constraint
       for(let i=0; i<this.size; i++) {
         let rowSet = new Set();
         let colSet = new Set();
         for(let j=0; j<this.size; j++) {
           let rVal = this.board[i][j];
           if (rVal !== null) {
             if(rowSet.has(rVal)) return false;
             rowSet.add(rVal);
           }
           let cVal = this.board[j][i];
           if (cVal !== null) {
             if(colSet.has(cVal)) return false;
             colSet.add(cVal);
           }
         }
       }
       // Cage constraints (only check if cage is fully filled)
       for (let cage of this.cages) {
         let vals = [];
         let complete = true;
         for(let cell of cage.cells) {
           let val = this.board[cell[0]][cell[1]];
           if(val === null) complete = false;
           vals.push(val);
         }
         if (complete && !this.validateCageLogic(cage, vals)) return false;
       }
       return true;
    };

    const solve = (idx) => {
      if (idx === emptyCells.length) return true;
      const {r, c} = emptyCells[idx];
      for(let v=1; v<=this.size; v++) {
        this.board[r][c] = v;
        if (isValidPartial() && solve(idx+1)) return true;
        this.board[r][c] = null;
      }
      return false;
    };

    if (solve(0)) {
      for(let r=0; r<this.size; r++) {
        for(let c=0; c<this.size; c++) {
          this.updateCellDOM(r, c);
          document.getElementById(`cell-${r}-${c}`).classList.add('fixed');
        }
      }
    } else {
      alert('خطا در حل پازل (پازل نامعتبر است).');
    }
  },

  giveHint() {
    // Fill one cell randomly using solver
    // Temporarily save current board
    let backup = this.board.map(row => [...row]);

    // Check if current state violates anything first
    let tempErrorCount = this.errorCount;
    if (!this.checkBoard()) {
       alert('ابتدا خطاهای فعلی را برطرف کنید.');
       this.errorCount = tempErrorCount; // restore count
       this.updateUI();
       return;
    }

    // Try to solve from empty state
    // We clear the board internally, run solver, pick a spot, restore board, place spot.
    let solvedBoard = Array(this.size).fill(null).map(() => Array(this.size).fill(null));

    const isValidPartial = (b) => {
       for(let i=0; i<this.size; i++) {
         let rS = new Set(), cS = new Set();
         for(let j=0; j<this.size; j++) {
           let rV = b[i][j]; if(rV!==null){ if(rS.has(rV)) return false; rS.add(rV); }
           let cV = b[j][i]; if(cV!==null){ if(cS.has(cV)) return false; cS.add(cV); }
         }
       }
       for (let cage of this.cages) {
         let vals = [], complete = true;
         for(let cell of cage.cells) {
           let val = b[cell[0]][cell[1]];
           if(val === null) complete = false;
           vals.push(val);
         }
         if (complete && !this.validateCageLogic(cage, vals)) return false;
       }
       return true;
    };

    const empty = [];
    for(let r=0; r<this.size; r++) for(let c=0; c<this.size; c++) empty.push({r, c});

    const solveHint = (idx) => {
      if (idx === empty.length) return true;
      const {r, c} = empty[idx];
      for(let v=1; v<=this.size; v++) {
        solvedBoard[r][c] = v;
        if (isValidPartial(solvedBoard) && solveHint(idx+1)) return true;
        solvedBoard[r][c] = null;
      }
      return false;
    };

    if (solveHint(0)) {
      // Find empty spots in current board
      let available = [];
      for(let r=0; r<this.size; r++) {
        for(let c=0; c<this.size; c++) {
          if (backup[r][c] === null) available.push({r, c});
        }
      }
      if (available.length > 0) {
        let pick = available[Math.floor(Math.random() * available.length)];
        this.board = backup; // restore
        this.board[pick.r][pick.c] = solvedBoard[pick.r][pick.c];
        this.updateCellDOM(pick.r, pick.c);
        let cellEl = document.getElementById(`cell-${pick.r}-${pick.c}`);
        cellEl.classList.add('fixed');
        cellEl.style.color = '#388e3c'; // visual hint color
      }
    } else {
      this.board = backup;
      alert('راهنمایی امکان پذیر نیست.');
    }
  },

  renderNumpad() {
    const numpadEl = document.getElementById('numpad');
    numpadEl.innerHTML = '';
    for (let i = 1; i <= this.size; i++) {
      const btn = document.createElement('button');
      btn.className = 'numpad-btn';
      btn.textContent = i;
      numpadEl.appendChild(btn);
    }
    const clearBtn = document.createElement('button');
    clearBtn.className = 'numpad-btn clear-btn';
    clearBtn.textContent = 'C';
    numpadEl.appendChild(clearBtn);
  },

  findCageIndex(r, c) {
    for (let i = 0; i < this.cages.length; i++) {
      for (let cell of this.cages[i].cells) {
        if (cell[0] === r && cell[1] === c) return i;
      }
    }
    return -1;
  },

  isCellInCage(r, c, cageIndex) {
    if (r < 0 || r >= this.size || c < 0 || c >= this.size) return false;
    const cage = this.cages[cageIndex];
    if (!cage) return false;
    return cage.cells.some(cell => cell[0] === r && cell[1] === c);
  },

  isTopLeftInCage(r, c, cage) {
    // Top-left is defined as min(r), then min(c) among those
    let minR = this.size;
    let minC = this.size;

    // Find minR
    for (let cell of cage.cells) {
      if (cell[0] < minR) minR = cell[0];
    }

    // Find minC for that minR
    for (let cell of cage.cells) {
      if (cell[0] === minR && cell[1] < minC) {
        minC = cell[1];
      }
    }

    return r === minR && c === minC;
  },

  startTimer() {
    this.timerInterval = setInterval(() => {
      this.secondsElapsed++;
      this.updateUI();
    }, 1000);
  },

  stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  },

  updateUI() {
    const m = Math.floor(this.secondsElapsed / 60).toString().padStart(2, '0');
    const s = (this.secondsElapsed % 60).toString().padStart(2, '0');

    // Persain numbers formatting
    const persianDigits = (str) => str.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

    document.getElementById('timerDisplay').textContent = `زمان: ${persianDigits(m)}:${persianDigits(s)}`;
    document.getElementById('errorCount').textContent = `خطا: ${persianDigits(this.errorCount.toString())}`;
  }
};

document.addEventListener('DOMContentLoaded', () => {
  KenKenGame.init();
});
