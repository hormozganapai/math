/**
 * بازی پنتومینو - منطق اصلی
 * ---------------------------------------------------------
 * شامل تعریف قطعات، وضعیت بازی، رویدادها، جابجایی (Drag & Drop)
 * و حل‌کننده (Solver).
 */

const PentominoesGame = (function() {
    // 1. تعریف ماتریس‌های ۱۲ قطعه پنتومینو
    // 1 = پر، 0 = خالی
    const PIECE_DEFINITIONS = {
        F: [[0,1,1], [1,1,0], [0,1,0]],
        I: [[1,1,1,1,1]],
        L: [[1,1,1,1], [1,0,0,0]],
        P: [[1,1], [1,1], [1,0]],
        N: [[0,1,1,1], [1,1,0,0]],
        T: [[1,1,1], [0,1,0], [0,1,0]],
        U: [[1,0,1], [1,1,1]],
        V: [[1,0,0], [1,0,0], [1,1,1]],
        W: [[1,0,0], [1,1,0], [0,1,1]],
        X: [[0,1,0], [1,1,1], [0,1,0]],
        Y: [[0,1,0,0], [1,1,1,1]],
        Z: [[1,1,0], [0,1,0], [0,1,1]]
    };

    // پیکربندی‌های مختلف تخته
    const BOARD_CONFIGS = {
        '6x10': { rows: 6, cols: 10, holes: [] },
        '5x12': { rows: 5, cols: 12, holes: [] },
        '4x15': { rows: 4, cols: 15, holes: [] },
        '3x20': { rows: 3, cols: 20, holes: [] },
        '8x8':  { rows: 8, cols: 8, holes: [ [3,3], [3,4], [4,3], [4,4] ] } // 2x2 سوراخ در وسط
    };

    // وضعیت (State)
    let state = {
        boardConfig: BOARD_CONFIGS['6x10'],
        grid: [], // ماتریس دو بعدی [row][col] حاوی شناسه قطعه یا null
        pieces: {}, // اطلاعات وضعیت هر قطعه { id, shape, matrix, row, col, isPlaced }
        selectedPieceId: null, // قطعه‌ای که الان در حال درگ یا انتخاب است
        timer: 0,
        timerInterval: null,
        isPlaying: false,
        startTime: null
    };

    const CELL_SIZE = 40; // اندازه هر سلول به پیکسل (مطابق CSS)

    // Elements
    const elements = {
        boardSize: document.getElementById('boardSize'),
        boardContainer: document.getElementById('boardContainer'),
        trayContainer: document.getElementById('trayContainer'),
        btnResetTray: document.getElementById('btnResetTray'),
        btnHint: document.getElementById('btnHint'),
        btnSolve: document.getElementById('btnSolve'),
        btnClearBoard: document.getElementById('btnClearBoard'),
        timerDisplay: document.getElementById('timer'),
        piecesRemaining: document.getElementById('piecesRemaining'),
        victoryModal: document.getElementById('victoryModal'),
        finalTime: document.getElementById('finalTime'),
        btnPlayAgain: document.getElementById('btnPlayAgain')
    };

    // مقداردهی اولیه
    function init() {
        initPieces();
        initBoard();
        bindEvents();
        renderTray();
    }

    function initPieces() {
        state.pieces = {};
        for (const [id, matrix] of Object.entries(PIECE_DEFINITIONS)) {
            state.pieces[id] = {
                id: id,
                matrix: JSON.parse(JSON.stringify(matrix)), // کپی عمیق
                isPlaced: false,
                row: -1,
                col: -1,
                element: null
            };
        }
    }

    function initBoard() {
        const configId = elements.boardSize.value;
        state.boardConfig = BOARD_CONFIGS[configId];

        // ساخت ماتریس خالی
        state.grid = Array(state.boardConfig.rows).fill(null).map(() => Array(state.boardConfig.cols).fill(null));

        // اعمال سوراخ‌ها (برای برد 8x8)
        if (state.boardConfig.holes) {
            state.boardConfig.holes.forEach(([r, c]) => {
                state.grid[r][c] = 'HOLE';
            });
        }

        renderBoard();
        updateRemainingCount();
        resetTimer();
    }

    function renderBoard() {
        elements.boardContainer.innerHTML = '';
        elements.boardContainer.style.gridTemplateColumns = `repeat(${state.boardConfig.cols}, ${CELL_SIZE}px)`;
        elements.boardContainer.style.gridTemplateRows = `repeat(${state.boardConfig.rows}, ${CELL_SIZE}px)`;
        elements.boardContainer.style.width = `${state.boardConfig.cols * CELL_SIZE}px`;
        elements.boardContainer.style.height = `${state.boardConfig.rows * CELL_SIZE}px`;

        for (let r = 0; r < state.boardConfig.rows; r++) {
            for (let c = 0; c < state.boardConfig.cols; c++) {
                const cell = document.createElement('div');
                cell.className = 'board-cell';
                cell.dataset.row = r;
                cell.dataset.col = c;

                if (state.grid[r][c] === 'HOLE') {
                    cell.classList.add('hole');
                }

                elements.boardContainer.appendChild(cell);
            }
        }
    }

    function renderTray() {
        elements.trayContainer.innerHTML = '';
        for (const [id, piece] of Object.entries(state.pieces)) {
            if (!piece.isPlaced) {
                const pieceEl = createPieceElement(id, piece.matrix);
                piece.element = pieceEl;
                elements.trayContainer.appendChild(pieceEl);
            }
        }
    }

    function createPieceElement(id, matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;

        const pieceEl = document.createElement('div');
        pieceEl.className = 'pentomino-piece';
        pieceEl.dataset.id = id;
        pieceEl.style.gridTemplateColumns = `repeat(${cols}, ${CELL_SIZE}px)`;
        pieceEl.style.gridTemplateRows = `repeat(${rows}, ${CELL_SIZE}px)`;
        pieceEl.style.width = `${cols * CELL_SIZE}px`;
        pieceEl.style.height = `${rows * CELL_SIZE}px`;

        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                const block = document.createElement('div');
                block.className = 'piece-block';
                if (matrix[r][c] === 1) {
                    block.classList.add(`piece-color-${id}`);
                } else {
                    block.classList.add('empty');
                }
                pieceEl.appendChild(block);
            }
        }

        return pieceEl;
    }

    function updateRemainingCount() {
        const placedCount = Object.values(state.pieces).filter(p => p.isPlaced).length;
        const remaining = 12 - placedCount;
        elements.piecesRemaining.textContent = `${remaining} / ۱۲`;
    }

    // تایمر
    function startTimer() {
        if (!state.isPlaying) {
            state.isPlaying = true;
            state.startTime = Date.now() - state.timer * 1000;
            state.timerInterval = setInterval(updateTimer, 1000);
        }
    }

    function stopTimer() {
        state.isPlaying = false;
        clearInterval(state.timerInterval);
    }

    function resetTimer() {
        stopTimer();
        state.timer = 0;
        updateTimerDisplay();
    }

    function updateTimer() {
        state.timer = Math.floor((Date.now() - state.startTime) / 1000);
        updateTimerDisplay();
    }

    function updateTimerDisplay() {
        const m = Math.floor(state.timer / 60).toString().padStart(2, '0');
        const s = (state.timer % 60).toString().padStart(2, '0');
        elements.timerDisplay.textContent = `${m}:${s}`;
    }

    // --- Transformations ---
    function rotateMatrix(matrix) {
        const rows = matrix.length;
        const cols = matrix[0].length;
        const rotated = Array(cols).fill(0).map(() => Array(rows).fill(0));
        for (let r = 0; r < rows; r++) {
            for (let c = 0; c < cols; c++) {
                rotated[c][rows - 1 - r] = matrix[r][c];
            }
        }
        return rotated;
    }

    function flipMatrix(matrix) {
        return matrix.map(row => [...row].reverse());
    }

    // --- Drag & Drop Mechanics ---
    let dragState = {
        isDragging: false,
        element: null,
        id: null,
        offsetX: 0,
        offsetY: 0,
        startX: 0,
        startY: 0
    };

    function startDrag(e) {
        const pieceEl = e.target.closest('.pentomino-piece');
        if (!pieceEl) return;
        if (e.type === 'mousedown' && e.button !== 0) return; // Only left click

        e.preventDefault();
        startTimer();

        dragState.isDragging = true;
        dragState.element = pieceEl;
        dragState.id = pieceEl.dataset.id;
        state.selectedPieceId = dragState.id;

        // Remove from board logical state if it was there
        const pieceData = state.pieces[dragState.id];
        if (pieceData.isPlaced) {
            removePieceFromBoard(dragState.id);
        }

        const rect = pieceEl.getBoundingClientRect();

        let clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        let clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        dragState.offsetX = clientX - rect.left;
        dragState.offsetY = clientY - rect.top;

        dragState.startX = clientX;
        dragState.startY = clientY;

        pieceEl.classList.add('dragging');
        // Move to body so it floats over everything
        document.body.appendChild(pieceEl);

        updateDragPosition(clientX, clientY);

        document.addEventListener('mousemove', onDrag);
        document.addEventListener('touchmove', onDrag, { passive: false });
        document.addEventListener('mouseup', endDrag);
        document.addEventListener('touchend', endDrag);

        // Highlight active piece globally for keyboard events
        document.querySelectorAll('.pentomino-piece').forEach(el => el.style.zIndex = 10);
        pieceEl.style.zIndex = 100;
    }

    function onDrag(e) {
        if (!dragState.isDragging) return;
        e.preventDefault();

        let clientX = e.type.includes('touch') ? e.touches[0].clientX : e.clientX;
        let clientY = e.type.includes('touch') ? e.touches[0].clientY : e.clientY;

        updateDragPosition(clientX, clientY);
        highlightHover(clientX, clientY);
    }

    function updateDragPosition(clientX, clientY) {
        if (!dragState.element) return;
        dragState.element.style.position = 'fixed';
        dragState.element.style.left = `${clientX - dragState.offsetX}px`;
        dragState.element.style.top = `${clientY - dragState.offsetY}px`;
    }

    function highlightHover(clientX, clientY) {
        clearHighlights();
        const pos = getBoardPositionFromEvent(clientX, clientY);
        if (!pos) return;

        const { r, c } = pos;
        const matrix = state.pieces[dragState.id].matrix;
        const isValid = canPlacePiece(matrix, r, c);

        for (let ir = 0; ir < matrix.length; ir++) {
            for (let ic = 0; ic < matrix[0].length; ic++) {
                if (matrix[ir][ic] === 1) {
                    const br = r + ir;
                    const bc = c + ic;
                    if (br >= 0 && br < state.boardConfig.rows && bc >= 0 && bc < state.boardConfig.cols) {
                        const cell = document.querySelector(`.board-cell[data-row="${br}"][data-col="${bc}"]`);
                        if (cell) {
                            cell.classList.add(isValid ? 'drag-hover' : 'drag-invalid');
                        }
                    }
                }
            }
        }
    }

    function clearHighlights() {
        document.querySelectorAll('.board-cell').forEach(cell => {
            cell.classList.remove('drag-hover', 'drag-invalid');
        });
    }

    function getBoardPositionFromEvent(clientX, clientY) {
        const boardRect = elements.boardContainer.getBoundingClientRect();

        // Offset by a portion of the block size so placement centers around mouse
        const mouseGridX = clientX - boardRect.left - (dragState.offsetX % CELL_SIZE) + (CELL_SIZE/2);
        const mouseGridY = clientY - boardRect.top - (dragState.offsetY % CELL_SIZE) + (CELL_SIZE/2);

        if (mouseGridX < 0 || mouseGridX > boardRect.width || mouseGridY < 0 || mouseGridY > boardRect.height) {
            return null; // Out of board
        }

        const c = Math.floor(mouseGridX / CELL_SIZE);
        const r = Math.floor(mouseGridY / CELL_SIZE);

        return { r, c };
    }

    function endDrag(e) {
        if (!dragState.isDragging) return;

        document.removeEventListener('mousemove', onDrag);
        document.removeEventListener('touchmove', onDrag);
        document.removeEventListener('mouseup', endDrag);
        document.removeEventListener('touchend', endDrag);

        dragState.isDragging = false;
        dragState.element.classList.remove('dragging');
        clearHighlights();

        let clientX = e.type.includes('touchend') ? e.changedTouches[0].clientX : e.clientX;
        let clientY = e.type.includes('touchend') ? e.changedTouches[0].clientY : e.clientY;

        const pos = getBoardPositionFromEvent(clientX, clientY);
        const pieceData = state.pieces[dragState.id];

        if (pos && canPlacePiece(pieceData.matrix, pos.r, pos.c)) {
            // Drop on board
            placePieceOnBoard(dragState.id, pieceData.matrix, pos.r, pos.c);
        } else {
            // Return to tray
            returnToTray(dragState.id);
        }

        dragState.element = null;
        dragState.id = null;

        checkWinCondition();
    }

    function canPlacePiece(matrix, row, col, ignoreId = null) {
        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[0].length; c++) {
                if (matrix[r][c] === 1) {
                    const br = row + r;
                    const bc = col + c;

                    // Check bounds
                    if (br < 0 || br >= state.boardConfig.rows || bc < 0 || bc >= state.boardConfig.cols) {
                        return false;
                    }

                    // Check holes
                    if (state.grid[br][bc] === 'HOLE') {
                        return false;
                    }

                    // Check overlap
                    if (state.grid[br][bc] !== null && state.grid[br][bc] !== ignoreId) {
                        return false;
                    }
                }
            }
        }
        return true;
    }

    function placePieceOnBoard(id, matrix, row, col) {
        const pieceData = state.pieces[id];
        pieceData.isPlaced = true;
        pieceData.row = row;
        pieceData.col = col;
        pieceData.matrix = matrix; // Apply any rotation/flips

        // Update logical grid
        for (let r = 0; r < matrix.length; r++) {
            for (let c = 0; c < matrix[0].length; c++) {
                if (matrix[r][c] === 1) {
                    state.grid[row + r][col + c] = id;
                }
            }
        }

        // Snap visual element to board
        const el = pieceData.element;
        el.style.position = 'absolute';
        // Note: CSS direction is LTR for grid, so left maps directly to column
        el.style.left = `${col * CELL_SIZE}px`;
        el.style.top = `${row * CELL_SIZE}px`;

        elements.boardContainer.appendChild(el);
        updateRemainingCount();
    }

    function removePieceFromBoard(id) {
        const pieceData = state.pieces[id];
        if (!pieceData.isPlaced) return;

        for (let r = 0; r < pieceData.matrix.length; r++) {
            for (let c = 0; c < pieceData.matrix[0].length; c++) {
                if (pieceData.matrix[r][c] === 1) {
                    state.grid[pieceData.row + r][pieceData.col + c] = null;
                }
            }
        }

        pieceData.isPlaced = false;
        pieceData.row = -1;
        pieceData.col = -1;
        updateRemainingCount();
    }

    function returnToTray(id) {
        const pieceData = state.pieces[id];
        removePieceFromBoard(id);

        const el = pieceData.element;
        el.style.position = 'relative';
        el.style.left = '';
        el.style.top = '';

        elements.trayContainer.appendChild(el);
    }

    function transformSelectedPiece(type) {
        if (!state.selectedPieceId) return;

        const pieceData = state.pieces[state.selectedPieceId];
        let newMatrix;

        if (type === 'rotate') {
            newMatrix = rotateMatrix(pieceData.matrix);
        } else if (type === 'flip') {
            newMatrix = flipMatrix(pieceData.matrix);
        }

        // If piece is on board and not dragging, validate before transform
        if (pieceData.isPlaced && !dragState.isDragging) {
            // Temp remove to check placement
            removePieceFromBoard(state.selectedPieceId);
            if (canPlacePiece(newMatrix, pieceData.row, pieceData.col)) {
                pieceData.matrix = newMatrix;
                recreatePieceElement(state.selectedPieceId);
                placePieceOnBoard(state.selectedPieceId, newMatrix, pieceData.row, pieceData.col);
            } else {
                // Revert
                placePieceOnBoard(state.selectedPieceId, pieceData.matrix, pieceData.row, pieceData.col);
                // Flash red or something to indicate invalid transform
            }
        } else {
            // Either in tray or currently dragging
            pieceData.matrix = newMatrix;
            recreatePieceElement(state.selectedPieceId);
            if (dragState.isDragging) {
                // Re-append to body to keep it floating, adjust offsets
                document.body.appendChild(pieceData.element);
                dragState.element = pieceData.element;
                dragState.element.classList.add('dragging');
                updateDragPosition(dragState.startX, dragState.startY); // Approximation
            }
        }
    }

    function recreatePieceElement(id) {
        const pieceData = state.pieces[id];
        const oldEl = pieceData.element;
        const newEl = createPieceElement(id, pieceData.matrix);

        // Copy styles
        newEl.style.position = oldEl.style.position;
        newEl.style.left = oldEl.style.left;
        newEl.style.top = oldEl.style.top;
        newEl.style.zIndex = oldEl.style.zIndex;

        if (oldEl.parentNode) {
            oldEl.parentNode.replaceChild(newEl, oldEl);
        }
        pieceData.element = newEl;

        // Reattach listeners is handled by event delegation
    }

    function checkWinCondition() {
        const placedCount = Object.values(state.pieces).filter(p => p.isPlaced).length;
        if (placedCount === 12) {
            // Verify board is fully covered (no nulls)
            let isFull = true;
            for (let r = 0; r < state.boardConfig.rows; r++) {
                for (let c = 0; c < state.boardConfig.cols; c++) {
                    if (state.grid[r][c] === null) {
                        isFull = false;
                        break;
                    }
                }
            }

            if (isFull) {
                stopTimer();
                const m = Math.floor(state.timer / 60).toString().padStart(2, '0');
                const s = (state.timer % 60).toString().padStart(2, '0');
                elements.finalTime.textContent = `${m}:${s}`;
                elements.victoryModal.setAttribute('aria-hidden', 'false');
            }
        }
    }

    function bindEvents() {
        // Pointer events for drag and drop
        document.addEventListener('mousedown', startDrag);
        document.addEventListener('touchstart', startDrag, { passive: false });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'KeyR') {
                e.preventDefault();
                transformSelectedPiece('rotate');
                if(dragState.isDragging) highlightHover(dragState.startX, dragState.startY);
            } else if (e.code === 'KeyF') {
                e.preventDefault();
                transformSelectedPiece('flip');
                if(dragState.isDragging) highlightHover(dragState.startX, dragState.startY);
            }
        });

        // Track last interacted piece for transformations when not dragging
        document.addEventListener('mousedown', (e) => {
            const piece = e.target.closest('.pentomino-piece');
            if (piece) {
                state.selectedPieceId = piece.dataset.id;
            }
        });

        // Change board size
        elements.boardSize.addEventListener('change', () => {
            initBoard();
            initPieces();
            renderTray();
        });

        elements.btnResetTray.addEventListener('click', () => {
            initPieces();
            initBoard();
            renderTray();
        });

        elements.btnClearBoard.addEventListener('click', () => {
            initPieces();
            initBoard();
            renderTray();
        });

        elements.btnPlayAgain.addEventListener('click', () => {
            elements.victoryModal.setAttribute('aria-hidden', 'true');
            initPieces();
            initBoard();
            renderTray();
        });

        elements.btnSolve.addEventListener('click', () => {
            solveBoard(true);
        });

        elements.btnHint.addEventListener('click', () => {
            solveBoard(false);
        });
    }

    // --- Solver (Backtracking) ---
    // A simplified backtracking solver for hinting/solving
    function solveBoard(fullSolve) {
        // Collect unplaced pieces
        const unplaced = Object.values(state.pieces).filter(p => !p.isPlaced);
        if (unplaced.length === 0) return; // Already full

        // All possible orientations for a piece (up to 8)
        function getOrientations(matrix) {
            const shapes = [];
            const shapeSet = new Set();
            let current = matrix;

            for (let flip = 0; flip < 2; flip++) {
                for (let rot = 0; rot < 4; rot++) {
                    const str = JSON.stringify(current);
                    if (!shapeSet.has(str)) {
                        shapeSet.add(str);
                        shapes.push(current);
                    }
                    current = rotateMatrix(current);
                }
                current = flipMatrix(matrix); // Reset and flip
            }
            return shapes;
        }

        // Find first empty cell
        function findEmptyCell(grid) {
            for (let r = 0; r < state.boardConfig.rows; r++) {
                for (let c = 0; c < state.boardConfig.cols; c++) {
                    if (grid[r][c] === null) return { r, c };
                }
            }
            return null;
        }

        // Deep copy grid for solver
        const simGrid = state.grid.map(row => [...row]);
        const pieceList = unplaced.map(p => ({
            id: p.id,
            orientations: getOrientations(p.matrix)
        }));

        let solution = null;

        function solve(pIndex) {
            if (pIndex >= pieceList.length) {
                return true; // Solved
            }

            const emptyCell = findEmptyCell(simGrid);
            if (!emptyCell) return true;

            // Optimization: check if there's any isolated empty cell group with size not multiple of 5
            // (Skipped here for simplicity, but standard for fast DLX)

            const { r: er, c: ec } = emptyCell;

            for (let i = pIndex; i < pieceList.length; i++) {
                // Swap to try every piece
                const p = pieceList[i];
                pieceList[i] = pieceList[pIndex];
                pieceList[pIndex] = p;

                for (const shape of p.orientations) {
                    // Try to place such that the piece covers (er, ec)
                    // We must find the offset of (er, ec) within the shape
                    for (let sr = 0; sr < shape.length; sr++) {
                        for (let sc = 0; sc < shape[0].length; sc++) {
                            if (shape[sr][sc] === 1) {
                                const boardR = er - sr;
                                const boardC = ec - sc;

                                // Check if valid
                                let isValid = true;
                                for (let pr = 0; pr < shape.length; pr++) {
                                    for (let pc = 0; pc < shape[0].length; pc++) {
                                        if (shape[pr][pc] === 1) {
                                            const br = boardR + pr;
                                            const bc = boardC + pc;
                                            if (br < 0 || br >= state.boardConfig.rows || bc < 0 || bc >= state.boardConfig.cols || simGrid[br][bc] !== null) {
                                                isValid = false;
                                                break;
                                            }
                                        }
                                    }
                                    if (!isValid) break;
                                }

                                if (isValid) {
                                    // Place
                                    for (let pr = 0; pr < shape.length; pr++) {
                                        for (let pc = 0; pc < shape[0].length; pc++) {
                                            if (shape[pr][pc] === 1) {
                                                simGrid[boardR + pr][boardC + pc] = p.id;
                                            }
                                        }
                                    }

                                    // Record step
                                    if (!solution) solution = [];
                                    solution.push({ id: p.id, matrix: shape, r: boardR, c: boardC });

                                    if (solve(pIndex + 1)) return true;

                                    // Backtrack
                                    solution.pop();
                                    for (let pr = 0; pr < shape.length; pr++) {
                                        for (let pc = 0; pc < shape[0].length; pc++) {
                                            if (shape[pr][pc] === 1) {
                                                simGrid[boardR + pr][boardC + pc] = null;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }

                // Swap back
                pieceList[pIndex] = pieceList[i];
                pieceList[i] = p;
            }
            return false;
        }

        // Show a brief loading indication
        elements.btnSolve.disabled = true;
        elements.btnHint.disabled = true;

        // Use setTimeout to allow UI to update (show disabled state) before heavy calculation
        setTimeout(() => {
            const success = solve(0);

            if (success && solution && solution.length > 0) {
                if (fullSolve) {
                    // Apply all
                    solution.forEach(step => {
                        // Recreate element if matrix changed
                        state.pieces[step.id].matrix = step.matrix;
                        recreatePieceElement(step.id);
                        placePieceOnBoard(step.id, step.matrix, step.r, step.c);
                    });
                } else {
                    // Apply just one
                    const step = solution[0];
                    state.pieces[step.id].matrix = step.matrix;
                    recreatePieceElement(step.id);
                    placePieceOnBoard(step.id, step.matrix, step.r, step.c);
                }
                checkWinCondition();
            } else {
                alert("با چیدمان فعلی هیچ راه‌حلی وجود ندارد! یک یا چند قطعه را بردارید و دوباره تلاش کنید.");
            }

            elements.btnSolve.disabled = false;
            elements.btnHint.disabled = false;
        }, 50);
    }

    // بازگرداندن API عمومی
    return {
        init: init
    };
})();

// راه‌اندازی پس از بارگذاری DOM
document.addEventListener('DOMContentLoaded', () => {
    PentominoesGame.init();
});
