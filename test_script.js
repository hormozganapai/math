const fs = require('fs');

const gameJs = fs.readFileSync('games/probability_island/js/game.js', 'utf8');

if (gameJs.includes("document.getElementById('experiment-controls').classList.add('hidden');") &&
    gameJs.includes("document.getElementById('experiment-controls').classList.remove('hidden');")) {
    console.log("Success: Code changes are present in game.js");
} else {
    console.error("Error: Code changes not found in game.js");
}
