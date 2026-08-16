/**
 * UI Module
 * Handles DOM manipulation, screen transitions, and general UI updates
 */

const UI = {
    screens: ['start', 'map', 'level', 'boss', 'end'],

    init() {
        this.updateTheme(Storage.get('darkMode'));
        this.updateSoundIcon(Storage.get('soundEnabled'));

        // Ensure top bar is shown after start screen, but we manage it in game.js usually
        // Top bar buttons
        document.getElementById('btn-theme').addEventListener('click', () => {
            const isDark = Storage.get('darkMode');
            Storage.set('darkMode', !isDark);
            this.updateTheme(!isDark);
            Sound.playClick();
        });

        document.getElementById('btn-sound').addEventListener('click', () => {
            const isEnabled = Sound.toggle();
            this.updateSoundIcon(isEnabled);
            Sound.playClick();
        });
    },

    showScreen(screenName) {
        this.screens.forEach(s => {
            const el = document.getElementById(`screen-${s}`);
            if (el) {
                if (s === screenName) {
                    el.classList.remove('hidden');
                    // Small delay to allow display:block to apply before animation classes if needed
                    setTimeout(() => el.classList.add('active'), 10);
                } else {
                    el.classList.add('hidden');
                    el.classList.remove('active');
                }
            }
        });

        // Top bar visibility
        const topBar = document.getElementById('top-bar');
        if (screenName === 'start' || screenName === 'end') {
            topBar.classList.add('hidden');
        } else {
            topBar.classList.remove('hidden');
        }
    },

    updateStats(score, stars, lives) {
        document.querySelector('#score-display span').textContent = score;
        document.querySelector('#stars-display span').textContent = stars;
        if (lives !== undefined) {
            document.querySelector('#lives-display span').textContent = lives;
        }
    },

    updateTheme(isDark) {
        if (isDark) {
            document.documentElement.setAttribute('data-theme', 'dark');
            document.getElementById('btn-theme').textContent = '☀️';
        } else {
            document.documentElement.removeAttribute('data-theme');
            document.getElementById('btn-theme').textContent = '🌙';
        }
    },

    updateSoundIcon(isEnabled) {
        document.getElementById('btn-sound').textContent = isEnabled ? '🔊' : '🔇';
    },

    renderMap(unlockedLevel, onNodeClick) {
        const container = document.getElementById('map-nodes');
        container.innerHTML = '';

        Levels.configs.forEach(level => {
            const node = document.createElement('div');
            node.className = `map-node ${level.id <= unlockedLevel ? 'unlocked' : 'locked'}`;

            const icon = document.createElement('div');
            icon.className = 'icon';
            icon.textContent = level.id <= unlockedLevel ? level.icon : '🔒';

            const label = document.createElement('div');
            label.className = 'label';
            label.textContent = level.name;

            // Optional stars display
            if (level.id < unlockedLevel || (level.id === 8 && unlockedLevel === 8 && Storage.get('stars')[8])) {
                const stars = Storage.get('stars')[level.id] || 0;
                const starsDiv = document.createElement('div');
                starsDiv.style.fontSize = '0.6rem';
                starsDiv.style.marginTop = '2px';
                starsDiv.textContent = '⭐'.repeat(stars);
                node.appendChild(starsDiv);
            }

            node.appendChild(icon);
            node.appendChild(label);

            if (level.id <= unlockedLevel) {
                node.addEventListener('click', () => {
                    Sound.playClick();
                    onNodeClick(level.id);
                });
            }

            container.appendChild(node);
        });
    },

    showFeedback(isCorrect, message, isBoss = false) {
        const prefix = isBoss ? 'boss-' : '';
        const area = document.getElementById(`${prefix}feedback-area`);
        const msgEl = document.getElementById(`${prefix}feedback-message`);
        const actionContainer = document.getElementById(`${prefix}action-container`);

        area.className = `feedback-area ${isCorrect ? 'success' : 'error'}`;
        msgEl.textContent = message;

        area.classList.remove('hidden');
        actionContainer.classList.add('hidden');

        // Add shake animation if error
        if (!isCorrect) {
            area.classList.add('shake');
            setTimeout(() => area.classList.remove('shake'), 400);
        }
    },

    hideFeedback(isBoss = false) {
        const prefix = isBoss ? 'boss-' : '';
        document.getElementById(`${prefix}feedback-area`).classList.add('hidden');
        document.getElementById(`${prefix}action-container`).classList.remove('hidden');
    },

    updateBossHealth(percentage) {
        const bar = document.getElementById('boss-health-bar');
        bar.style.width = `${percentage}%`;
        if (percentage < 30) {
            bar.style.backgroundColor = 'var(--warning-color)';
        } else {
            bar.style.backgroundColor = 'var(--danger-color)';
        }
    }
};
