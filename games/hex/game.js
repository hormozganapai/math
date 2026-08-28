/**
 * Hex Game Logic
 */

const HexGame = {
    // State
    size: 9,
    board: [], // 2D array: 0 (empty), 1 (player 1 / Red), 2 (player 2 / Blue)
    currentPlayer: 1, // 1 or 2
    gameOver: false,
    history: [], // Array of {r, c, player, swapped}
    mode: 'pvp', // pvp, ai-easy, ai-hard
    swapAvailable: false,
    aiTimeoutId: null,

    // UI Elements
    boardEl: null,
    statusTextEl: null,
    turnIndicatorEl: null,
    btnUndo: null,
    btnSwap: null,
    victoryModal: null,
    victoryTitle: null,
    victoryMessage: null,

    // Geometry
    hexRadius: 20,

    init() {
        this.boardEl = document.getElementById('hexBoard');
        this.statusTextEl = document.getElementById('statusText');
        this.turnIndicatorEl = document.getElementById('turnIndicator');
        this.btnUndo = document.getElementById('btnUndo');
        this.btnSwap = document.getElementById('btnSwap');
        this.victoryModal = document.getElementById('victoryModal');
        this.victoryTitle = document.getElementById('victoryTitle');
        this.victoryMessage = document.getElementById('victoryMessage');

        // Event Listeners
        document.getElementById('boardSize').addEventListener('change', (e) => {
            this.size = parseInt(e.target.value);
            this.resetGame();
        });

        document.getElementById('gameMode').addEventListener('change', (e) => {
            this.mode = e.target.value;
            this.resetGame();
        });

        document.getElementById('btnRestart').addEventListener('click', () => this.resetGame());
        document.getElementById('btnPlayAgain').addEventListener('click', () => {
            this.victoryModal.classList.remove('active');
            this.resetGame();
        });

        this.btnUndo.addEventListener('click', () => this.undoMove());
        this.btnSwap.addEventListener('click', () => this.executeSwap());

        this.resetGame();
    },

    resetGame() {
        if (this.aiTimeoutId) {
            clearTimeout(this.aiTimeoutId);
            this.aiTimeoutId = null;
        }
        this.board = Array(this.size).fill(null).map(() => Array(this.size).fill(0));
        this.currentPlayer = 1;
        this.gameOver = false;
        this.history = [];
        this.swapAvailable = false;
        this.victoryModal.classList.remove('active');

        this.drawBoard();
        this.updateStatus();
    },

    // Render Board
    drawBoard() {
        this.boardEl.innerHTML = '';

        // Calculations for SVG sizing
        const hexWidth = Math.sqrt(3) * this.hexRadius;
        const hexHeight = 2 * this.hexRadius;
        const xOffset = hexWidth;
        const yOffset = 3/4 * hexHeight;

        // The rhombus shape skews horizontally
        // Max width will be at the last row
        const totalWidth = hexWidth * this.size + (this.size - 1) * (hexWidth / 2) + hexWidth;
        const totalHeight = yOffset * this.size + hexHeight / 4 + hexHeight;

        this.boardEl.setAttribute('viewBox', `-20 -20 ${totalWidth + 40} ${totalHeight + 40}`);

        // Draw Borders
        this.drawBorders(hexWidth, hexHeight, yOffset);

        // Draw Cells
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                const cx = (c + r/2.0) * hexWidth + hexWidth/2;
                const cy = r * yOffset + hexHeight/2;

                const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
                polygon.setAttribute('points', this.getHexPoints(cx, cy, this.hexRadius));
                polygon.setAttribute('class', 'hex-cell');
                polygon.setAttribute('data-r', r);
                polygon.setAttribute('data-c', c);

                polygon.addEventListener('click', () => this.handleCellClick(r, c));
                polygon.addEventListener('mouseenter', () => this.handleCellHover(r, c, true));
                polygon.addEventListener('mouseleave', () => this.handleCellHover(r, c, false));

                this.boardEl.appendChild(polygon);
            }
        }
    },

    getHexPoints(cx, cy, radius) {
        let points = [];
        // Flat topped hexagon
        for (let i = 0; i < 6; i++) {
            const angle_deg = 60 * i;
            const angle_rad = Math.PI / 180 * angle_deg;
            const px = cx + radius * Math.cos(angle_rad);
            const py = cy + radius * Math.sin(angle_rad);
            points.push(`${px},${py}`);
        }
        return points.join(' ');
    },

    drawBorders(hexWidth, hexHeight, yOffset) {
        // We draw simple lines for borders to show connecting goals
        const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');

        // Top border (Player 1 - Red/Pink)
        const topPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let topD = `M ${0} ${0} L ${hexWidth * this.size} ${0}`;
        topPath.setAttribute('d', topD);
        topPath.setAttribute('class', 'board-border-top');
        group.appendChild(topPath);

        // Bottom border (Player 1)
        const botPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let botStart = (this.size - 1) * hexWidth/2;
        let botY = (this.size - 1) * yOffset + hexHeight;
        let botD = `M ${botStart} ${botY} L ${botStart + hexWidth * this.size} ${botY}`;
        botPath.setAttribute('d', botD);
        botPath.setAttribute('class', 'board-border-bottom');
        group.appendChild(botPath);

        // Left border (Player 2 - Blue)
        const leftPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let leftD = `M ${0} ${0} L ${(this.size - 1) * hexWidth/2} ${botY}`;
        leftPath.setAttribute('d', leftD);
        leftPath.setAttribute('class', 'board-border-left');
        group.appendChild(leftPath);

        // Right border (Player 2)
        const rightPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        let rightD = `M ${hexWidth * this.size} ${0} L ${botStart + hexWidth * this.size} ${botY}`;
        rightPath.setAttribute('d', rightD);
        rightPath.setAttribute('class', 'board-border-right');
        group.appendChild(rightPath);

        this.boardEl.appendChild(group);
    },

    // Interactivity
    handleCellHover(r, c, isEnter) {
        if (this.gameOver || this.board[r][c] !== 0) return;

        // If AI's turn, disable hover for human
        if (this.currentPlayer === 2 && this.mode.startsWith('ai')) return;

        const cell = document.querySelector(`.hex-cell[data-r="${r}"][data-c="${c}"]`);
        if (!cell) return;

        if (isEnter) {
            cell.classList.add(`preview-${this.currentPlayer}`);
        } else {
            cell.classList.remove(`preview-1`, `preview-2`);
        }
    },

    handleCellClick(r, c) {
        if (this.gameOver || this.board[r][c] !== 0) return;

        // If AI's turn, human cannot click
        if (this.currentPlayer === 2 && this.mode.startsWith('ai')) return;

        this.makeMove(r, c);
    },

    makeMove(r, c, isAi = false) {
        // Place stone
        this.board[r][c] = this.currentPlayer;
        this.history.push({r, c, player: this.currentPlayer});

        // Update DOM
        const cell = document.querySelector(`.hex-cell[data-r="${r}"][data-c="${c}"]`);
        if (cell) {
            cell.classList.remove('preview-1', 'preview-2');
            cell.classList.add(`player-${this.currentPlayer}`);
        }

        // Handle Swap Rule (قانون معاوضه)
        if (this.history.length === 1) {
            this.swapAvailable = true;
            this.btnSwap.style.display = 'inline-block';
        } else {
            this.swapAvailable = false;
            this.btnSwap.style.display = 'none';
        }

        // Check win
        const winningPath = this.checkWin(this.currentPlayer);
        if (winningPath) {
            this.handleWin(this.currentPlayer, winningPath);
            return;
        }

        // Switch turn
        this.currentPlayer = this.currentPlayer === 1 ? 2 : 1;
        this.updateStatus();

        // Trigger AI if needed
        if (this.currentPlayer === 2 && this.mode.startsWith('ai') && !this.gameOver) {
            this.aiTimeoutId = setTimeout(() => this.makeAIMove(), 500); // Small delay for UX
        }
    },

    executeSwap() {
        if (!this.swapAvailable || this.history.length !== 1) return;

        const firstMove = this.history[0];

        // In Hex, swapping physically means mirroring the coordinate over the diagonal.
        // This is equivalent to Player 2 taking Player 1's move but conceptually rotating/mirroring it
        // to fit Player 2's goal, balancing the first-move advantage.

        // Remove the original stone
        this.board[firstMove.r][firstMove.c] = 0;
        const oldCell = document.querySelector(`.hex-cell[data-r="${firstMove.r}"][data-c="${firstMove.c}"]`);
        oldCell.classList.remove('player-1');

        // Calculate mirrored position (swap row and col)
        const mirroredR = firstMove.c;
        const mirroredC = firstMove.r;

        // Place new stone for Player 2
        this.board[mirroredR][mirroredC] = 2;

        // Record swap in history
        this.history.push({
            r: mirroredR,
            c: mirroredC,
            player: 2,
            swapped: true,
            originalR: firstMove.r,
            originalC: firstMove.c
        });

        // Update DOM
        const newCell = document.querySelector(`.hex-cell[data-r="${mirroredR}"][data-c="${mirroredC}"]`);
        newCell.classList.add('player-2');

        // Now it's Player 1's turn (Red) again
        this.currentPlayer = 1;
        this.swapAvailable = false;
        this.btnSwap.style.display = 'none';

        this.updateStatus();
    },

    undoMove() {
        if (this.gameOver || this.history.length === 0) return;

        if (this.aiTimeoutId) {
            clearTimeout(this.aiTimeoutId);
            this.aiTimeoutId = null;
        }

        // Check if the last action was a swap
        const lastAction = this.history[this.history.length - 1];

        if (lastAction.swapped) {
            // Undo the swap
            this.history.pop(); // Remove swap action
            this.board[lastAction.r][lastAction.c] = 0;
            const newCell = document.querySelector(`.hex-cell[data-r="${lastAction.r}"][data-c="${lastAction.c}"]`);
            if (newCell) newCell.classList.remove('player-2');

            // Restore original move
            const firstMove = this.history[0];
            this.board[firstMove.r][firstMove.c] = 1;
            const oldCell = document.querySelector(`.hex-cell[data-r="${firstMove.r}"][data-c="${firstMove.c}"]`);
            if (oldCell) oldCell.classList.add('player-1');

            this.currentPlayer = 2;
        } else {
            // Normal undo
            const movesToUndo = (this.mode.startsWith('ai') && this.history.length > 1) ? 2 : 1;

            for (let i = 0; i < movesToUndo; i++) {
                if (this.history.length === 0) break;

                // If we encounter a swap while undoing normally (shouldn't happen with AI unless AI swapped, but AI doesn't swap yet), break
                if (this.history[this.history.length - 1].swapped) break;

                const lastMove = this.history.pop();
                this.board[lastMove.r][lastMove.c] = 0;

                const cell = document.querySelector(`.hex-cell[data-r="${lastMove.r}"][data-c="${lastMove.c}"]`);
                if (cell) {
                    cell.classList.remove('player-1', 'player-2');
                }

                this.currentPlayer = lastMove.player;
            }
        }

        // Reset swap state
        if (this.history.length === 1 && !this.history[0].swapped) {
            this.swapAvailable = true;
            this.btnSwap.style.display = 'inline-block';
        } else {
            this.swapAvailable = false;
            this.btnSwap.style.display = 'none';
        }

        this.gameOver = false;
        this.victoryModal.classList.remove('active');
        this.updateStatus();
    },

    updateStatus() {
        if (this.gameOver) return;

        this.turnIndicatorEl.className = `player-indicator ${this.currentPlayer === 1 ? 'red' : 'blue'}`;

        if (this.currentPlayer === 1) {
            this.statusTextEl.textContent = 'نوبت بازیکن ۱ (قرمز - بالا به پایین)';
        } else {
            let aiText = this.mode.startsWith('ai') ? ' (رایانه)' : '';
            this.statusTextEl.textContent = `نوبت بازیکن ۲${aiText} (آبی - چپ به راست)`;
        }

        // Disable Undo if history is empty
        this.btnUndo.disabled = this.history.length === 0;
        this.btnUndo.style.opacity = this.history.length === 0 ? '0.5' : '1';
    },

    // Win Detection (BFS)
    getNeighbors(r, c) {
        // Hexagonal neighbors in axial coordinates
        const directions = [
            [0, -1], [1, -1], [1, 0],
            [0, 1], [-1, 1], [-1, 0]
        ];

        let neighbors = [];
        for (let dir of directions) {
            let nr = r + dir[0];
            let nc = c + dir[1];
            if (nr >= 0 && nr < this.size && nc >= 0 && nc < this.size) {
                neighbors.push({r: nr, c: nc});
            }
        }
        return neighbors;
    },

    checkWin(player) {
        let queue = [];
        let visited = Array(this.size).fill(null).map(() => Array(this.size).fill(false));
        let parent = Array(this.size).fill(null).map(() => Array(this.size).fill(null));

        // Find starting nodes
        for (let i = 0; i < this.size; i++) {
            if (player === 1) { // Player 1 (Red): Top to Bottom
                if (this.board[0][i] === player) {
                    queue.push({r: 0, c: i});
                    visited[0][i] = true;
                }
            } else { // Player 2 (Blue): Left to Right
                if (this.board[i][0] === player) {
                    queue.push({r: i, c: 0});
                    visited[i][0] = true;
                }
            }
        }

        // BFS
        while (queue.length > 0) {
            let current = queue.shift();

            // Check if we reached the opposite side
            if (player === 1 && current.r === this.size - 1) {
                return this.reconstructPath(current, parent);
            }
            if (player === 2 && current.c === this.size - 1) {
                return this.reconstructPath(current, parent);
            }

            let neighbors = this.getNeighbors(current.r, current.c);
            for (let n of neighbors) {
                if (this.board[n.r][n.c] === player && !visited[n.r][n.c]) {
                    visited[n.r][n.c] = true;
                    parent[n.r][n.c] = current;
                    queue.push(n);
                }
            }
        }

        return null;
    },

    reconstructPath(endNode, parentMap) {
        let path = [];
        let current = endNode;
        while (current != null) {
            path.push(current);
            current = parentMap[current.r][current.c];
        }
        return path;
    },

    handleWin(player, path) {
        this.gameOver = true;

        // Highlight path
        for (let node of path) {
            const cell = document.querySelector(`.hex-cell[data-r="${node.r}"][data-c="${node.c}"]`);
            if (cell) {
                cell.classList.add('winning-path');
            }
        }

        // Show modal
        this.victoryTitle.textContent = 'پیروزی!';
        this.victoryTitle.style.color = player === 1 ? 'var(--pink)' : 'var(--blue)';

        let winnerText = player === 1 ? 'بازیکن ۱ (قرمز)' : 'بازیکن ۲ (آبی)';
        if (this.mode.startsWith('ai') && player === 2) {
            winnerText = 'رایانه (آبی)';
        }
        this.victoryMessage.textContent = `${winnerText} با موفقیت دو طرف تخته را به هم متصل کرد!`;

        setTimeout(() => {
            this.victoryModal.classList.add('active');
            this.triggerConfetti();
        }, 800);
    },

    triggerConfetti() {
        const canvas = document.getElementById('confetti');
        const ctx = canvas.getContext('2d');
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;

        const pieces = [];
        const colors = ['#FF4785', '#2E9BFF', '#FFC845', '#00BFA6', '#7C4DFF'];

        for (let i = 0; i < 150; i++) {
            pieces.push({
                x: Math.random() * canvas.width,
                y: Math.random() * canvas.height - canvas.height,
                vx: Math.random() * 4 - 2,
                vy: Math.random() * 3 + 2,
                size: Math.random() * 10 + 5,
                color: colors[Math.floor(Math.random() * colors.length)],
                rotation: Math.random() * 360,
                rs: Math.random() * 10 - 5
            });
        }

        let animationId;
        const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let active = false;
            for (let p of pieces) {
                p.x += p.vx;
                p.y += p.vy;
                p.rotation += p.rs;
                if (p.y < canvas.height) active = true;

                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(p.rotation * Math.PI / 180);
                ctx.fillStyle = p.color;
                ctx.fillRect(-p.size/2, -p.size/2, p.size, p.size);
                ctx.restore();
            }
            if (active && this.gameOver) {
                animationId = requestAnimationFrame(render);
            }
        };
        render();

        // Clean up when modal closes
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.attributeName === 'class' && !this.victoryModal.classList.contains('active')) {
                    cancelAnimationFrame(animationId);
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    observer.disconnect();
                }
            });
        });
        observer.observe(this.victoryModal, { attributes: true });
    },

    makeAIMove() {
        if (this.gameOver) return;

        this.aiTimeoutId = null;

        let move = null;
        if (this.mode === 'ai-easy') {
            move = this.getRandomValidMove();
        } else {
            // Hard Mode AI - Dijkstra resistance heuristic
            move = this.getDijkstraMove();
        }

        if (move) {
            this.makeMove(move.r, move.c, true);
        }
    },

    getRandomValidMove() {
        let validMoves = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === 0) {
                    validMoves.push({r, c});
                }
            }
        }
        if (validMoves.length === 0) return null;
        return validMoves[Math.floor(Math.random() * validMoves.length)];
    },

    getDijkstraMove() {
        // Dijkstra shortest path resistance heuristic
        // AI (Player 2) wants to connect Left (c=0) to Right (c=size-1)
        // Player 1 wants to connect Top (r=0) to Bottom (r=size-1)

        // We will evaluate each valid move by calculating the difference in
        // shortest path resistance for AI and Player 1 if that move is made.

        let bestMove = null;
        let maxScore = -Infinity;

        let validMoves = [];
        for (let r = 0; r < this.size; r++) {
            for (let c = 0; c < this.size; c++) {
                if (this.board[r][c] === 0) {
                    validMoves.push({r, c});
                }
            }
        }

        if (validMoves.length === 0) return null;

        // If it's the first move of AI, place near the center
        if (this.history.length <= 1) {
            const center = Math.floor(this.size / 2);
            // find empty cell near center
            validMoves.sort((a, b) => {
                let distA = Math.abs(a.r - center) + Math.abs(a.c - center);
                let distB = Math.abs(b.r - center) + Math.abs(b.c - center);
                return distA - distB;
            });
            return validMoves[0];
        }

        // To save computation time, we only evaluate a subset of sensible moves
        // Sensible moves are empty cells adjacent to existing pieces
        let candidateMoves = validMoves.filter(m => {
            let neighbors = this.getNeighbors(m.r, m.c);
            return neighbors.some(n => this.board[n.r][n.c] !== 0);
        });

        if (candidateMoves.length === 0) {
            candidateMoves = validMoves;
        }

        for (let move of candidateMoves) {
            // Simulate AI move
            this.board[move.r][move.c] = 2;
            let aiDistAfterAiMove = this.shortestPathDistance(2);
            let p1DistAfterAiMove = this.shortestPathDistance(1);
            this.board[move.r][move.c] = 0; // undo

            // Score: How much shorter is my path compared to their path?
            // Shorter path distance means closer to winning.
            // So we want aiDist to be small, and p1Dist to be large.
            // Also, handle cases where a path is blocked completely (Infinity).

            let score = 0;

            if (aiDistAfterAiMove === 0) {
                // AI can win with this move!
                return move;
            }

            if (p1DistAfterAiMove === Infinity) {
                // Blocked P1 completely! Very good.
                score += 1000;
            } else {
                score += (this.size * this.size) / (p1DistAfterAiMove + 1); // Prefer increasing P1's distance
            }

            if (aiDistAfterAiMove !== Infinity) {
                score -= aiDistAfterAiMove; // Prefer shorter AI distance
            }

            // Add slight randomness to break ties
            score += Math.random() * 0.1;

            if (score > maxScore) {
                maxScore = score;
                bestMove = move;
            }
        }

        return bestMove || validMoves[Math.floor(Math.random() * validMoves.length)];
    },

    shortestPathDistance(player) {
        // Calculate the minimum number of empty cells needed to connect the two sides
        let dist = Array(this.size).fill(null).map(() => Array(this.size).fill(Infinity));
        // Priority Queue (simplified using array and sort, fine for small board size)
        let pq = [];

        // Init starting nodes
        for (let i = 0; i < this.size; i++) {
            if (player === 1) { // Top to Bottom
                let cost = this.board[0][i] === 1 ? 0 : (this.board[0][i] === 0 ? 1 : Infinity);
                if (cost !== Infinity) {
                    dist[0][i] = cost;
                    pq.push({r: 0, c: i, d: cost});
                }
            } else { // Left to Right
                let cost = this.board[i][0] === 2 ? 0 : (this.board[i][0] === 0 ? 1 : Infinity);
                if (cost !== Infinity) {
                    dist[i][0] = cost;
                    pq.push({r: i, c: 0, d: cost});
                }
            }
        }

        while (pq.length > 0) {
            pq.sort((a, b) => a.d - b.d);
            let curr = pq.shift();

            // Check end condition
            if (player === 1 && curr.r === this.size - 1) return curr.d;
            if (player === 2 && curr.c === this.size - 1) return curr.d;

            if (curr.d > dist[curr.r][curr.c]) continue;

            let neighbors = this.getNeighbors(curr.r, curr.c);
            for (let n of neighbors) {
                let cellVal = this.board[n.r][n.c];
                if (cellVal === (player === 1 ? 2 : 1)) continue; // Blocked by opponent

                let edgeCost = cellVal === player ? 0 : 1;
                let newDist = curr.d + edgeCost;

                if (newDist < dist[n.r][n.c]) {
                    dist[n.r][n.c] = newDist;
                    pq.push({r: n.r, c: n.c, d: newDist});
                }
            }
        }

        return Infinity;
    }
};

document.addEventListener('DOMContentLoaded', () => {
    HexGame.init();
});
