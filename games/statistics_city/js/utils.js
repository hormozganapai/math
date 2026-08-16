// js/utils.js

const Utils = {
    sortAscending(arr) {
        return [...arr].sort((a, b) => a - b);
    },

    getSum(arr) {
        return arr.reduce((sum, val) => sum + val, 0);
    },

    getMean(arr) {
        if (arr.length === 0) return 0;
        return this.getSum(arr) / arr.length;
    },

    getMedian(arr) {
        if (arr.length === 0) return 0;
        const sorted = this.sortAscending(arr);
        const mid = Math.floor(sorted.length / 2);

        if (sorted.length % 2 === 0) {
            return (sorted[mid - 1] + sorted[mid]) / 2;
        } else {
            return sorted[mid];
        }
    },

    getMode(arr) {
        if (arr.length === 0) return [];
        const freq = this.getFrequencies(arr);
        let maxFreq = 0;
        let modes = [];

        for (const val in freq) {
            if (freq[val] > maxFreq) {
                maxFreq = freq[val];
                modes = [Number(val)];
            } else if (freq[val] === maxFreq) {
                modes.push(Number(val));
            }
        }
        return modes;
    },

    getFrequencies(arr) {
        const freq = {};
        for (const val of arr) {
            freq[val] = (freq[val] || 0) + 1;
        }
        return freq;
    },

    shuffleArray(array) {
        const arr = [...array];
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
        return arr;
    },

    generateRandomData(count, min, max) {
        const data = [];
        for (let i = 0; i < count; i++) {
            data.push(Math.floor(Math.random() * (max - min + 1)) + min);
        }
        return data;
    },

    drawBarChart(canvasId, labels, data) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (data.length === 0) return;

        const maxData = Math.max(...data, 10);
        const padding = 30;
        const width = canvas.width - padding * 2;
        const height = canvas.height - padding * 2;

        const barWidth = width / data.length;

        // Draw axes
        ctx.beginPath();
        ctx.moveTo(padding, padding);
        ctx.lineTo(padding, canvas.height - padding);
        ctx.lineTo(canvas.width - padding, canvas.height - padding);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.stroke();

        // Draw bars
        data.forEach((val, index) => {
            const barHeight = (val / maxData) * height;
            const x = padding + index * barWidth + barWidth * 0.1;
            const y = canvas.height - padding - barHeight;
            const w = barWidth * 0.8;

            ctx.fillStyle = '#4facfe';
            ctx.fillRect(x, y, w, barHeight);

            ctx.fillStyle = '#333';
            ctx.font = '14px Vazirmatn';
            ctx.textAlign = 'center';
            // Value
            ctx.fillText(val, x + w / 2, y - 5);
            // Label
            ctx.fillText(labels[index] || val, x + w / 2, canvas.height - padding + 20);
        });
    }
};