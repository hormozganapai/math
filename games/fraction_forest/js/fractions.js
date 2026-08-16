/**
 * Fractions Module
 * Logic for Fraction Builder, visual representation, and math
 */

const Fractions = {
    // Generate a visual fraction block based on denominator and selected parts (numerator)
    createVisual(numerator, denominator, interactive = false, onPartClick = null) {
        const container = document.createElement('div');
        container.className = 'fraction-visual';

        for (let i = 0; i < denominator; i++) {
            const part = document.createElement('div');
            part.className = 'fraction-part';
            if (i < numerator) {
                part.classList.add('selected');
            }

            if (interactive) {
                part.addEventListener('click', () => {
                    part.classList.toggle('selected');
                    if (onPartClick) onPartClick();
                });
            }

            container.appendChild(part);
        }

        return container;
    },

    // Create text representation e.g. 3/4
    createText(numerator, denominator) {
        const span = document.createElement('span');
        span.className = 'fraction-text';

        const numSpan = document.createElement('span');
        numSpan.className = 'numerator';
        numSpan.textContent = numerator;

        const denSpan = document.createElement('span');
        denSpan.className = 'denominator';
        denSpan.textContent = denominator;

        span.appendChild(numSpan);
        span.appendChild(denSpan);

        return span;
    },

    // Count selected parts in a visual container
    getSelectedCount(container) {
        return container.querySelectorAll('.fraction-part.selected').length;
    },

    // Math Helpers
    gcd(a, b) {
        return b === 0 ? a : this.gcd(b, a % b);
    },

    simplify(numerator, denominator) {
        const divisor = this.gcd(numerator, denominator);
        return {
            n: numerator / divisor,
            d: denominator / divisor
        };
    },

    isEquivalent(n1, d1, n2, d2) {
        return (n1 * d2) === (n2 * d1);
    },

    compare(n1, d1, n2, d2) {
        const val1 = n1 * d2;
        const val2 = n2 * d1;
        if (val1 > val2) return '>';
        if (val1 < val2) return '<';
        return '=';
    }
};

/**
 * Interactive Fraction Builder class for DOM use
 */
class FractionBuilder {
    constructor(containerElement, initialDenominator = 1, options = {}) {
        this.container = containerElement;
        this.denominator = initialDenominator;
        this.maxDenominator = options.maxDenominator || 12;
        this.canChangeDenominator = options.canChangeDenominator !== false;

        this.render();
    }

    render() {
        this.container.innerHTML = '';
        this.container.className = 'fraction-builder';

        // Controls for denominator
        if (this.canChangeDenominator) {
            const controls = document.createElement('div');
            controls.className = 'fraction-controls';

            const minusBtn = document.createElement('button');
            minusBtn.className = 'btn secondary-btn';
            minusBtn.textContent = '-';
            minusBtn.onclick = () => this.changeDenominator(-1);

            const denomLabel = document.createElement('span');
            denomLabel.textContent = `تعداد قسمت‌ها: ${this.denominator}`;
            denomLabel.style.fontWeight = 'bold';

            const plusBtn = document.createElement('button');
            plusBtn.className = 'btn secondary-btn';
            plusBtn.textContent = '+';
            plusBtn.onclick = () => this.changeDenominator(1);

            controls.appendChild(minusBtn);
            controls.appendChild(denomLabel);
            controls.appendChild(plusBtn);

            this.container.appendChild(controls);
        }

        // The visual representation
        this.visualContainer = Fractions.createVisual(0, this.denominator, true, () => {
            // Callback when a part is clicked, can be used to update live text if needed
        });

        this.container.appendChild(this.visualContainer);
    }

    changeDenominator(delta) {
        const newD = this.denominator + delta;
        if (newD >= 1 && newD <= this.maxDenominator) {
            this.denominator = newD;
            this.render();
        }
    }

    getFraction() {
        const num = Fractions.getSelectedCount(this.visualContainer);
        return { n: num, d: this.denominator };
    }

    setFraction(n, d) {
        this.denominator = d;
        this.render();
        const parts = this.visualContainer.querySelectorAll('.fraction-part');
        for (let i = 0; i < n; i++) {
            if(parts[i]) parts[i].classList.add('selected');
        }
    }
}
