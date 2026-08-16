// simulation.js
export class Simulation {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    clear() {
        this.container.innerHTML = '';
    }

    renderCoin() {
        this.clear();
        const coin = document.createElement('div');
        coin.className = 'coin';
        coin.id = 'sim-coin';
        coin.textContent = '🪙';
        this.container.appendChild(coin);
        return coin;
    }

    animateCoin(resultText, callback) {
        const coin = document.getElementById('sim-coin');
        if (!coin) return;

        coin.classList.remove('flip');
        // Trigger reflow
        void coin.offsetWidth;
        coin.classList.add('flip');

        setTimeout(() => {
            coin.textContent = resultText;
            if (callback) callback();
        }, 1000);
    }

    renderDice() {
        this.clear();
        const dice = document.createElement('div');
        dice.className = 'dice';
        dice.id = 'sim-dice';
        dice.textContent = '🎲';
        this.container.appendChild(dice);
        return dice;
    }

    animateDice(result, callback) {
        const dice = document.getElementById('sim-dice');
        if (!dice) return;

        dice.classList.remove('roll');
        void dice.offsetWidth;
        dice.classList.add('roll');

        setTimeout(() => {
            dice.textContent = result;
            if (callback) callback();
        }, 1000);
    }

    renderWheel(segments) {
        this.clear();
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';

        const wheel = document.createElement('div');
        wheel.className = 'wheel-container';
        wheel.id = 'sim-wheel';

        let currentAngle = 0;
        const totalWeight = segments.reduce((sum, seg) => sum + seg.weight, 0);

        segments.forEach(seg => {
            const angle = (seg.weight / totalWeight) * 360;
            const segmentDiv = document.createElement('div');
            segmentDiv.className = 'wheel-segment';
            segmentDiv.style.backgroundColor = seg.color;
            segmentDiv.style.transform = `rotate(${currentAngle}deg) skewY(${90 - angle}deg)`;

            // Note: Exact CSS for pie slices needs more trickery, using simplified approach for now
            // For a robust implementation we might use conic-gradient
            wheel.appendChild(segmentDiv);
            currentAngle += angle;
        });

        // Better wheel rendering with conic-gradient
        const gradientStops = [];
        let acc = 0;
        segments.forEach(seg => {
            const pct = (seg.weight / totalWeight) * 100;
            gradientStops.push(`${seg.color} ${acc}% ${acc + pct}%`);
            acc += pct;
        });
        wheel.style.background = `conic-gradient(${gradientStops.join(', ')})`;
        wheel.innerHTML = ''; // clear divs, just use background

        const pointer = document.createElement('div');
        pointer.className = 'wheel-pointer';

        wrapper.appendChild(pointer);
        wrapper.appendChild(wheel);
        this.container.appendChild(wrapper);
        return wheel;
    }

    animateWheel(targetDegree, callback) {
        const wheel = document.getElementById('sim-wheel');
        if (!wheel) return;

        const spinSpins = 360 * 5; // 5 full spins
        const finalDegree = spinSpins + targetDegree;

        wheel.style.transform = `rotate(${finalDegree}deg)`;

        setTimeout(() => {
            if (callback) callback();
        }, 3000); // matches CSS transition time
    }

    renderBag(marbles) {
        this.clear();
        const bag = document.createElement('div');
        bag.className = 'bag-container';
        bag.textContent = '?';

        const display = document.createElement('div');
        display.className = 'marbles-display';

        marbles.forEach(color => {
            const m = document.createElement('div');
            m.className = 'marble';
            m.style.backgroundColor = color;
            display.appendChild(m);
        });

        this.container.appendChild(display);
        this.container.appendChild(bag);
    }

    renderBarChart(resultsArea, data) {
        resultsArea.innerHTML = '';
        const maxVal = Math.max(...data.map(d => d.value), 1); // avoid div by 0

        data.forEach(item => {
            const row = document.createElement('div');
            row.className = 'bar-chart-row';

            const label = document.createElement('span');
            label.className = 'bar-label';
            label.textContent = item.label;

            const barContainer = document.createElement('div');
            barContainer.className = 'bar-container';

            const fill = document.createElement('div');
            fill.className = 'bar-fill';
            fill.style.backgroundColor = item.color || 'var(--primary-color)';

            const val = document.createElement('span');
            val.className = 'bar-value';
            val.textContent = `${item.value} (${Math.round((item.value/item.total)*100 || 0)}%)`;

            row.appendChild(label);
            row.appendChild(barContainer);
            row.appendChild(val);
            resultsArea.appendChild(row);

            // Animate fill
            setTimeout(() => {
                fill.style.width = `${(item.value / maxVal) * 100}%`;
            }, 50);
            barContainer.appendChild(fill);
        });
    }
}
