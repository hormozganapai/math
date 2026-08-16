// ui.js
export class UI {
    constructor() {
        this.screens = {
            start: document.getElementById('screen-start'),
            map: document.getElementById('screen-map'),
            tutorial: document.getElementById('screen-tutorial'),
            play: document.getElementById('screen-play'),
            levelComplete: document.getElementById('screen-level-complete'),
            victory: document.getElementById('screen-victory'),
            gameOver: document.getElementById('screen-game-over')
        };
        this.header = document.getElementById('game-header');
    }

    showScreen(screenName) {
        Object.values(this.screens).forEach(screen => {
            if (screen) screen.classList.add('hidden');
        });
        if (this.screens[screenName]) {
            this.screens[screenName].classList.remove('hidden');
            this.screens[screenName].classList.add('active');
        }

        // Show/hide header
        if (screenName === 'start') {
            this.header.classList.add('hidden');
        } else {
            this.header.classList.remove('hidden');
        }
    }

    updateHUD(score, stars, lives) {
        document.getElementById('score-val').textContent = score;
        document.getElementById('stars-val').textContent = stars;
        document.getElementById('lives-display').textContent = '❤️'.repeat(lives) + '🖤'.repeat(3 - lives);
    }

    updateMap(unlockedLevels, starsData) {
        for (let i = 1; i <= 6; i++) {
            const node = document.getElementById(`node-${i}`);
            const statusSpan = node.querySelector('.status');

            if (unlockedLevels.includes(i)) {
                node.removeAttribute('disabled');
                const s = starsData[i] || 0;
                statusSpan.textContent = s > 0 ? '⭐'.repeat(s) : '🔓';
            } else {
                node.setAttribute('disabled', 'true');
                statusSpan.textContent = '🔒';
            }
        }
    }

    setTheme(isDark) {
        if (isDark) {
            document.body.classList.add('dark-mode');
            document.body.classList.remove('light-mode');
        } else {
            document.body.classList.remove('dark-mode');
            document.body.classList.add('light-mode');
        }
    }
}
