// js/ui.js

const UI = {
    screens: ['screen-start', 'screen-map', 'screen-level', 'screen-boss', 'screen-data-lab', 'screen-end'],

    showScreen(screenId) {
        this.screens.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (id === screenId) {
                    el.classList.remove('hidden');
                    el.classList.add('active');
                } else {
                    el.classList.add('hidden');
                    el.classList.remove('active');
                }
            }
        });

        // Show header only outside start screen
        const header = document.getElementById('game-header');
        if (screenId === 'screen-start') {
            header.classList.add('hidden');
        } else {
            header.classList.remove('hidden');
        }
    },

    updateStats(score, lives, starsObj) {
        const scoreEl = document.getElementById('score-display');
        const livesEl = document.getElementById('lives-display');
        const starsEl = document.getElementById('stars-display');

        if (scoreEl) scoreEl.textContent = `🏆 امتیاز: ${score}`;

        let hearts = '';
        for (let i = 0; i < 3; i++) {
            hearts += (i < lives) ? '❤️' : '🤍';
        }
        if (livesEl) livesEl.textContent = hearts;

        // Calculate total stars
        let totalStars = 0;
        for (const level in starsObj) {
            totalStars += starsObj[level];
        }
        if (starsEl) starsEl.textContent = `⭐ ${totalStars}`;
    },

    updateMapNodes(unlockedLevels) {
        for (let i = 1; i <= 10; i++) {
            const node = document.getElementById(`node-${i}`);
            if (node) {
                if (i <= unlockedLevels) {
                    node.classList.remove('locked');
                    node.innerHTML = node.innerHTML.replace('🔒 ', '');
                } else {
                    node.classList.add('locked');
                    if (!node.innerHTML.includes('🔒')) {
                         // Very basic prepend, actual text is maintained in HTML mostly
                    }
                }
            }
        }
    },

    showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;

        container.appendChild(toast);

        setTimeout(() => {
            toast.style.opacity = '0';
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    showModal(title, text) {
        const modal = document.getElementById('modal');
        const modalTitle = document.getElementById('modal-title');
        const modalText = document.getElementById('modal-text');

        modalTitle.textContent = title;
        modalText.textContent = text;
        modal.classList.remove('hidden');
    },

    hideModal() {
        const modal = document.getElementById('modal');
        modal.classList.add('hidden');
    },

    applyTheme(isDark) {
        if (isDark) {
            document.body.setAttribute('data-theme', 'dark');
        } else {
            document.body.removeAttribute('data-theme');
        }
    }
};

// Global Event Listeners for UI components
document.addEventListener('DOMContentLoaded', () => {
    const closeModal = document.querySelector('.close-modal');
    if (closeModal) {
        closeModal.addEventListener('click', UI.hideModal);
    }
});