// score.js
export class ScoreManager {
    constructor(data, ui, storageManager) {
        this.data = data;
        this.ui = ui;
        this.storageManager = storageManager;
        this.currentLives = 3;
        this.consecutiveCorrect = 0;
    }

    resetLives() {
        this.currentLives = 3;
        this.ui.updateHUD(this.data.bestScore, this.getTotalStars(), this.currentLives);
    }

    addPoints(points) {
        this.data.bestScore += points;
        this.storageManager(this.data);
        this.ui.updateHUD(this.data.bestScore, this.getTotalStars(), this.currentLives);
    }

    recordAnswer(isCorrect, isHintUsed) {
        if (isCorrect) {
            this.data.totalCorrect++;
            this.consecutiveCorrect++;
            let points = 10;
            if (this.consecutiveCorrect >= 3) {
                points += 5; // Combo!
                // Can trigger combo sound here
            }
            if (isHintUsed) {
                points = Math.max(0, points - 3);
            }
            this.addPoints(points);
            return true;
        } else {
            this.data.totalWrong++;
            this.consecutiveCorrect = 0;
            this.currentLives--;
            this.ui.updateHUD(this.data.bestScore, this.getTotalStars(), this.currentLives);
            return false;
        }
    }

    recordExperiment(count) {
        this.data.totalExperiments += count;
        this.storageManager(this.data);
    }

    awardStars(level, stars) {
        if (stars > (this.data.stars[level] || 0)) {
            this.data.stars[level] = stars;
            this.storageManager(this.data);
        }
    }

    getTotalStars() {
        return Object.values(this.data.stars).reduce((sum, val) => sum + val, 0);
    }

    unlockLevel(level) {
        if (!this.data.unlockedLevels.includes(level)) {
            this.data.unlockedLevels.push(level);
            this.storageManager(this.data);
        }
    }
}