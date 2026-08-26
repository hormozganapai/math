import re

with open('games/kakuro/game.js', 'r') as f:
    content = f.read()

# Replace hard layout
old_hard = """    hard: { // 6x6
        size: 6,
        layout: [
            [ 0,       {v: 11}, {v: 24}, 0,       {v: 17}, {v: 4}  ],
            [ {h: 16}, 1,       1,       {h: 12}, 1,       1       ],
            [ {h: 21}, 1,       1,       1,       1,       1       ],
            [ 0,       0,       {v: 15}, {v: 16}, 0,       0       ],
            [ {h: 14}, {v: 4},  1,       1,       {v: 10}, {v: 11} ],
            [ {h: 23}, 1,       1,       1,       1,       1       ]
        ]
    }"""

new_hard = """    hard: { // 8x8
        size: 8,
        layout: [
            [ 0, 0, {v:16}, {v:24}, 0, 0, {v:17}, {v:28} ],
            [ 0, {h:17}, 1, 1, {v:16}, {h:12}, 1, 1 ],
            [ {h:21}, 1, 1, 1, 1, 1, 1, 1 ],
            [ {h:24}, 1, 1, 1, 1, {v:15}, {v:16}, 0 ],
            [ 0, 0, {h:25}, 1, 1, 1, 1, {v:16} ],
            [ 0, {v:16}, {v:10}, {h:29}, 1, 1, 1, 1 ],
            [ {h:14}, 1, 1, {h:14}, 1, 1, 0, 0 ],
            [ {h:12}, 1, 1, 0, 0, 0, 0, 0 ]
        ]
    }"""

content = content.replace(old_hard, new_hard)

# Update solver logic
old_solver = """// A simple recursive backtracking solver for Hints/Solve
function solveKakuro(grid, layout, size, runs) {
    // Find empty
    let er = -1, ec = -1;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (layout[r][c] === 1 && grid[r][c] === null) {
                er = r; ec = c; break;
            }
        }
        if (er !== -1) break;
    }

    if (er === -1) {
        // Full, check if valid
        return validateRunLogic(grid, runs);
    }

    for (let val = 1; val <= 9; val++) {
        grid[er][ec] = val;
        // Optimization: Quick partial validation could go here
        if (solveKakuro(grid, layout, size, runs)) {
            return true;
        }
        grid[er][ec] = null;
    }

    return false;
}"""

new_solver = """// Advanced recursive backtracking solver with branch pruning
function isValidPartialRun(grid, run) {
    let sum = 0;
    let emptyCount = 0;
    let seen = new Set();

    for (let {r, c} of run.cells) {
        let val = grid[r][c];
        if (val === null) {
            emptyCount++;
        } else {
            if (seen.has(val)) return false; // Duplicate
            seen.add(val);
            sum += val;
        }
    }

    if (sum > run.target) return false;
    if (emptyCount === 0 && sum !== run.target) return false;

    // Also check if we need to reach target but can't even with max values
    // Max possible sum with emptyCount cells (e.g. 9+8+7...)
    let maxSum = sum;
    let maxVal = 9;
    for(let i=0; i<emptyCount; i++) {
        while(seen.has(maxVal) && maxVal > 0) maxVal--;
        maxSum += maxVal;
        maxVal--;
    }
    if (maxSum < run.target) return false;

    return true;
}

function solveKakuro(grid, layout, size, runs) {
    // Find empty
    let er = -1, ec = -1;
    for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
            if (layout[r][c] === 1 && grid[r][c] === null) {
                er = r; ec = c; break;
            }
        }
        if (er !== -1) break;
    }

    if (er === -1) {
        // Full, check if valid
        return validateRunLogic(grid, runs);
    }

    // Find runs affecting this cell
    const cellRuns = runs.filter(run => run.cells.some(cell => cell.r === er && cell.c === ec));

    for (let val = 1; val <= 9; val++) {
        grid[er][ec] = val;

        // Pruning: check if adding this value invalidates any run
        let isValid = true;
        for(let run of cellRuns) {
            if (!isValidPartialRun(grid, run)) {
                isValid = false;
                break;
            }
        }

        if (isValid) {
            if (solveKakuro(grid, layout, size, runs)) {
                return true;
            }
        }
        grid[er][ec] = null;
    }

    return false;
}"""

content = content.replace(old_solver, new_solver)

with open('games/kakuro/game.js', 'w') as f:
    f.write(content)
