/* ==========================================================================
   Chomp Game Logic
   ========================================================================== */

const ChompGame = {
    // State variables
    rows: 3,
    cols: 5,
    state: [], // Array representing the number of available columns in each row (Young Diagram)
    history: [], // Stack of previous states for undo
    currentPlayer: 1,
    gameMode: 'ai-easy',
    gameOver: false,

    // DOM Elements
    elements: {},

    init() {
        this.cacheDOM();
        this.bindEvents();
        this.startNewGame();
    },

    cacheDOM() {
        this.elements = {
            boardSizeSelect: document.getElementById('boardSize'),
            customSizeInputs: document.getElementById('customSizeInputs'),
            customRows: document.getElementById('customRows'),
            customCols: document.getElementById('customCols'),
            gameModeSelect: document.getElementById('gameMode'),
            btnNewGame: document.getElementById('btnNewGame'),
            btnUndo: document.getElementById('btnUndo'),
            btnHint: document.getElementById('btnHint'),
            btnInsight: document.getElementById('btnInsight'),
            turnIndicator: document.getElementById('turnIndicator'),
            board: document.getElementById('board'),
            insightDrawer: document.getElementById('insightDrawer'),
            btnCloseInsight: document.getElementById('btnCloseInsight'),
            youngDiagram: document.getElementById('youngDiagram'),
            gameOverModal: document.getElementById('gameOverModal'),
            modalTitle: document.getElementById('modalTitle'),
            modalMessage: document.getElementById('modalMessage'),
            btnModalNewGame: document.getElementById('btnModalNewGame')
        };
    },

    bindEvents() {
        this.elements.boardSizeSelect.addEventListener('change', (e) => {
            if (e.target.value === 'custom') {
                this.elements.customSizeInputs.classList.remove('hidden');
            } else {
                this.elements.customSizeInputs.classList.add('hidden');
            }
            this.startNewGame();
        });

        this.elements.customRows.addEventListener('change', () => this.startNewGame());
        this.elements.customCols.addEventListener('change', () => this.startNewGame());
        this.elements.gameModeSelect.addEventListener('change', () => this.startNewGame());
        this.elements.btnNewGame.addEventListener('click', () => this.startNewGame());
        this.elements.btnModalNewGame.addEventListener('click', () => {
            this.elements.gameOverModal.classList.add('hidden');
            this.startNewGame();
        });

        this.elements.btnUndo.addEventListener('click', () => this.undoMove());
        this.elements.btnHint.addEventListener('click', () => this.showHint());

        this.elements.btnInsight.addEventListener('click', () => {
            this.elements.insightDrawer.classList.add('open');
        });

        this.elements.btnCloseInsight.addEventListener('click', () => {
            this.elements.insightDrawer.classList.remove('open');
        });

        // Board interactions
        this.elements.board.addEventListener('mouseover', (e) => this.handleHover(e));
        this.elements.board.addEventListener('mouseout', () => this.clearHighlights());
        this.elements.board.addEventListener('click', (e) => this.handleClick(e));
    },

    saveState() {
        this.history.push({
            state: [...this.state],
            currentPlayer: this.currentPlayer
        });
    },

    undoMove() {
        if (this.history.length === 0 || this.gameOver) return;

        // In AI mode, we need to pop twice (AI's move and Player's move)
        // In PvP, just pop once
        let pops = (this.gameMode !== 'pvp' && this.history.length > 1) ? 2 : 1;

        while (pops > 0 && this.history.length > 0) {
            const prevState = this.history.pop();
            this.state = [...prevState.state];
            this.currentPlayer = prevState.currentPlayer;
            pops--;
        }

        this.updateUI();
        this.renderBoard();
    },

    handleHover(e) {
        if (this.gameOver) return;

        const tile = e.target.closest('.choco-tile');
        if (!tile || tile.classList.contains('eaten')) return;

        const r = parseInt(tile.dataset.row, 10);
        const c = parseInt(tile.dataset.col, 10);

        this.clearHighlights();

        const tiles = this.elements.board.querySelectorAll('.choco-tile:not(.eaten)');
        tiles.forEach(t => {
            const tr = parseInt(t.dataset.row, 10);
            const tc = parseInt(t.dataset.col, 10);

            // Highlight squares to the right and below (in RTL, it's r' >= r and c' >= c)
            if (tr >= r && tc >= c) {
                if (tr === 0 && tc === 0) {
                    t.classList.add('highlight-poison');
                } else {
                    t.classList.add('highlight');
                }
            }
        });
    },

    clearHighlights() {
        const highlighted = this.elements.board.querySelectorAll('.highlight, .highlight-poison');
        highlighted.forEach(t => {
            t.classList.remove('highlight', 'highlight-poison');
        });
    },

    handleClick(e) {
        if (this.gameOver) return;
        if (this.gameMode !== 'pvp' && this.currentPlayer === 2) return; // AI is thinking

        const tile = e.target.closest('.choco-tile');
        if (!tile || tile.classList.contains('eaten')) return;

        const r = parseInt(tile.dataset.row, 10);
        const c = parseInt(tile.dataset.col, 10);

        this.makeMove(r, c);
    },

    makeMove(r, c) {
        this.saveState();

        // Determine eaten tiles for animation
        const eatenTiles = [];
        const domTiles = this.elements.board.querySelectorAll('.choco-tile:not(.eaten)');

        domTiles.forEach(t => {
            const tr = parseInt(t.dataset.row, 10);
            const tc = parseInt(t.dataset.col, 10);
            if (tr >= r && tc >= c) {
                eatenTiles.push(t);
            }
        });

        // Update state logic (row lengths)
        for (let i = r; i < this.rows; i++) {
            if (this.state[i] > c) {
                this.state[i] = c;
            }
        }

        // Animate
        eatenTiles.forEach(t => {
            t.classList.add('eating');
            setTimeout(() => {
                t.classList.remove('eating');
                t.classList.add('eaten');
                t.classList.remove('highlight', 'highlight-poison');
            }, 300);
        });

        this.checkWinCondition(r, c);
    },

    checkWinCondition(lastRowClicked, lastColClicked) {
        // If (0,0) was clicked, current player loses
        if (lastRowClicked === 0 && lastColClicked === 0) {
            this.gameOver = true;
            this.showGameOverModal();
            return;
        }

        // Switch turn
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateUI();

        if (this.gameMode !== 'pvp' && this.currentPlayer === 2 && !this.gameOver) {
            // Trigger AI
            setTimeout(() => {
                this.makeAIMove();
            }, 500); // Small delay for realism
        }
    },

    showGameOverModal() {
        this.elements.gameOverModal.classList.remove('hidden');

        // The person who just clicked (0,0) is the one stored in this.currentPlayer, and they lose.
        const winner = this.currentPlayer === 1 ? 2 : 1;

        let message = '';
        if (this.gameMode === 'pvp') {
            message = `بازیکن ${this.currentPlayer} قطعه سمی را خورد! بازیکن ${winner} برنده شد! 🎉`;
        } else {
            if (this.currentPlayer === 1) {
                message = 'تو قطعه سمی را خوردی! هوش مصنوعی برنده شد! 🤖';
            } else {
                message = 'هوش مصنوعی قطعه سمی را خورد! تو برنده شدی! 🎉🏆';
                // Add score integration
                if (typeof Score !== 'undefined') {
                    const difficultyMult = this.gameMode === 'ai-hard' ? 2 : 1;
                    Score.addScore(50 * difficultyMult);
                }
            }
        }

        this.elements.modalMessage.textContent = message;
    },

    makeAIMove() {
        if (this.gameOver) return;

        const validMoves = this.getValidMoves(this.state);

        if (validMoves.length === 0) return; // Should not happen

        let move;
        if (this.gameMode === 'ai-easy') {
            move = this.getEasyMove(validMoves);
        } else {
            move = this.getHardMove(this.state);
        }

        this.makeMove(move.r, move.c);
    },

    getValidMoves(currentState) {
        const moves = [];
        for (let r = 0; r < currentState.length; r++) {
            for (let c = 0; c < currentState[r]; c++) {
                moves.push({r, c});
            }
        }
        return moves;
    },

    getEasyMove(validMoves) {
        // Try to avoid (0,0) unless it's the only move
        if (validMoves.length > 1) {
            const safeMoves = validMoves.filter(m => m.r !== 0 || m.c !== 0);
            return safeMoves[Math.floor(Math.random() * safeMoves.length)];
        }
        return validMoves[0];
    },

    // AI Strategy and Memoization (Hard mode)
    memo: new Map(),

    getHardMove(currentState) {
        // Find a winning move (a move that leads to a P-position for the next player)
        const validMoves = this.getValidMoves(currentState);

        for (const move of validMoves) {
            // (0,0) is always a losing move if there are other options
            if (move.r === 0 && move.c === 0 && validMoves.length > 1) continue;

            const nextState = this.simulateMove(currentState, move.r, move.c);

            if (!this.isWinningState(nextState)) {
                // If the next state is a losing state (P-position), then making this move is winning for us.
                return move;
            }
        }

        // If no winning move exists, we are in a P-position. Pick a random safe move to delay loss.
        return this.getEasyMove(validMoves);
    },

    simulateMove(state, r, c) {
        const nextState = [...state];
        for (let i = r; i < nextState.length; i++) {
            if (nextState[i] > c) {
                nextState[i] = c;
            }
        }
        return nextState;
    },

    isWinningState(state) {
        // Check if state is just the poison square [1, 0, 0, ...]
        let sum = state.reduce((a, b) => a + b, 0);
        if (sum === 1) return false; // This is a P-position (the person who receives this board has to eat 0,0 and loses)

        const key = state.join(',');

        if (this.memo.has(key)) {
            return this.memo.get(key);
        }

        const validMoves = this.getValidMoves(state);
        let isWinning = false;

        // A state is a winning state (N-position) if there exists AT LEAST ONE move to a losing state (P-position).
        for (const move of validMoves) {
            // Don't evaluate suicidal move unless forced
            if (move.r === 0 && move.c === 0 && validMoves.length > 1) continue;

            const nextState = this.simulateMove(state, move.r, move.c);

            if (!this.isWinningState(nextState)) {
                isWinning = true;
                break;
            }
        }

        this.memo.set(key, isWinning);
        return isWinning;
    },

    showHint() {
        if (this.gameOver) return;
        if (this.gameMode !== 'pvp' && this.currentPlayer === 2) return;

        const bestMove = this.getHardMove(this.state);

        // Temporarily highlight the suggested move
        const tiles = this.elements.board.querySelectorAll('.choco-tile:not(.eaten)');

        // First clear any existing highlights
        this.clearHighlights();

        tiles.forEach(t => {
            const tr = parseInt(t.dataset.row, 10);
            const tc = parseInt(t.dataset.col, 10);
            if (tr === bestMove.r && tc === bestMove.c) {
                t.style.animation = 'pulse 1s infinite alternate';
                t.style.boxShadow = '0 0 15px var(--blue)';

                setTimeout(() => {
                    t.style.animation = '';
                    t.style.boxShadow = '';
                }, 2000);
            }
        });
    },

    startNewGame() {
        // Parse size
        const sizeVal = this.elements.boardSizeSelect.value;
        if (sizeVal === 'custom') {
            this.rows = parseInt(this.elements.customRows.value, 10);
            this.cols = parseInt(this.elements.customCols.value, 10);

            // Validate bounds
            if (this.rows < 2) this.rows = 2;
            if (this.rows > 7) this.rows = 7;
            if (this.cols < 2) this.cols = 2;
            if (this.cols > 7) this.cols = 7;

            this.elements.customRows.value = this.rows;
            this.elements.customCols.value = this.cols;
        } else {
            const parts = sizeVal.split('x');
            this.rows = parseInt(parts[0], 10);
            this.cols = parseInt(parts[1], 10);
        }

        this.gameMode = this.elements.gameModeSelect.value;
        this.currentPlayer = 1;
        this.gameOver = false;
        this.history = [];

        // Initial state: all rows are full
        this.state = new Array(this.rows).fill(this.cols);

        this.updateUI();
        this.renderBoard();
    },

    renderBoard() {
        const board = this.elements.board;
        board.innerHTML = '';

        // CSS Grid setup
        board.style.gridTemplateColumns = `repeat(${this.cols}, 60px)`;
        board.style.gridTemplateRows = `repeat(${this.rows}, 60px)`;

        for (let r = 0; r < this.rows; r++) {
            for (let c = 0; c < this.cols; c++) {
                const tile = document.createElement('div');
                tile.className = 'choco-tile';
                tile.dataset.row = r;
                tile.dataset.col = c;

                // Poison tile
                if (r === 0 && c === 0) {
                    tile.classList.add('poison');
                }

                // Check if eaten based on state array
                // state[r] gives the number of available columns in row r.
                // If c >= state[r], the tile is eaten.
                if (c >= this.state[r]) {
                    tile.classList.add('eaten');
                }

                board.appendChild(tile);
            }
        }
    },

    updateUI() {
        this.elements.btnUndo.disabled = this.history.length === 0;

        if (this.gameOver) {
            // Updated dynamically later
        } else {
            let turnText = `نوبت بازیکن ${this.currentPlayer} 🍫`;
            if (this.gameMode !== 'pvp' && this.currentPlayer === 2) {
                turnText = 'نوبت هوش مصنوعی 🤖';
            }
            this.elements.turnIndicator.textContent = turnText;
        }

        // Update insight diagram
        this.elements.youngDiagram.textContent = `[${this.state.join(', ')}]`;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    ChompGame.init();
});