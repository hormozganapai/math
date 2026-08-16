/**
 * Questions Module
 * Generates dynamic questions based on level type and difficulty
 */

const Questions = {
    getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    },

    generate(type, difficulty = 'easy') {
        switch (type) {
            case 'identify_parts':
                return this.genIdentifyParts();
            case 'split':
                return this.genSplit();
            case 'build_fraction':
                return this.genBuildFraction();
            case 'compare':
                return this.genCompare(difficulty);
            case 'equivalent':
                return this.genEquivalent();
            case 'add':
                return this.genAdd(difficulty);
            case 'subtract':
                return this.genSubtract(difficulty);
            case 'boss':
                // Randomize type for boss
                const types = ['build_fraction', 'compare', 'equivalent', 'add', 'subtract'];
                const randomType = types[this.getRandomInt(0, types.length - 1)];
                return this.generate(randomType, 'hard');
            default:
                return this.genBuildFraction();
        }
    },

    // Level 1: Identify parts
    genIdentifyParts() {
        const d = this.getRandomInt(2, 6);
        const n = this.getRandomInt(1, d - 1);
        return {
            type: 'identify_parts',
            text: `این شکل به ${d} قسمت مساوی تقسیم شده است. کسر مربوط به ${n} قسمت را بساز.`,
            targetN: n,
            targetD: d,
            hint: `باید ${n} قسمت را انتخاب کنی.`
        };
    },

    // Level 2: Split
    genSplit() {
        const d = this.getRandomInt(2, 8);
        return {
            type: 'split',
            text: `شکل را به ${d} قسمت مساوی تقسیم کن.`,
            targetD: d,
            hint: `از دکمه‌های + و - برای تغییر تعداد قسمت‌ها به ${d} استفاده کن.`
        };
    },

    // Level 3: Build Fraction
    genBuildFraction() {
        const d = this.getRandomInt(2, 8);
        const n = this.getRandomInt(1, d);
        return {
            type: 'build_fraction',
            text: `کسر زیر را بساز:`,
            targetN: n,
            targetD: d,
            displayFraction: { n, d },
            hint: `ابتدا تعداد کل قسمت‌ها را ${d} کن، سپس ${n} قسمت را رنگ کن.`
        };
    },

    // Level 4: Compare
    genCompare(difficulty) {
        let d1, n1, d2, n2;
        if (difficulty === 'easy') {
            d1 = this.getRandomInt(3, 8);
            d2 = d1;
            n1 = this.getRandomInt(1, d1);
            n2 = this.getRandomInt(1, d2);
            while (n1 === n2) n2 = this.getRandomInt(1, d2);
        } else {
            d1 = this.getRandomInt(2, 6);
            d2 = this.getRandomInt(2, 6);
            n1 = this.getRandomInt(1, d1);
            n2 = this.getRandomInt(1, d2);
        }

        const answer = Fractions.compare(n1, d1, n2, d2);

        return {
            type: 'compare',
            text: `علامت مناسب را انتخاب کن:`,
            f1: { n: n1, d: d1 },
            f2: { n: n2, d: d2 },
            answer: answer,
            hint: answer === '=' ? `این دو کسر با هم برابرند.` : `به قسمت‌های رنگ شده دقت کن، کدام بزرگتر است؟`
        };
    },

    // Level 5: Equivalent
    genEquivalent() {
        // e.g. 1/2 -> 2/4
        const n1 = this.getRandomInt(1, 3);
        const d1 = this.getRandomInt(2, 4);
        const multiplier = this.getRandomInt(2, 3);

        const n2 = n1 * multiplier;
        const d2 = d1 * multiplier;

        return {
            type: 'equivalent',
            text: `کسری مساوی با کسر زیر بساز:`,
            f1: { n: n1, d: d1 },
            targetN: n2, // Expected answers could vary, but we'll ask for a specific equivalent or check value
            targetD: d2,
            targetValue: n1 / d1, // Used for generic checking
            hint: `اگر تعداد قسمت‌ها را ${multiplier} برابر کنی، باید صورت هم ${multiplier} برابر شود.`
        };
    },

    // Level 6: Add
    genAdd(difficulty) {
        let d, n1, n2;
        d = this.getRandomInt(3, 8);
        n1 = this.getRandomInt(1, d - 1);
        n2 = this.getRandomInt(1, d - n1); // Ensure sum is <= 1

        return {
            type: 'add',
            text: `حاصل جمع زیر را با ساختن کسر نهایی نمایش بده:`,
            f1: { n: n1, d: d },
            f2: { n: n2, d: d },
            targetN: n1 + n2,
            targetD: d,
            hint: `چون مخرج‌ها مساوی است، کافیست صورت‌ها را جمع کنی: ${n1} + ${n2}`
        };
    },

    // Level 7: Subtract
    genSubtract(difficulty) {
        let d, n1, n2;
        d = this.getRandomInt(3, 8);
        n1 = this.getRandomInt(2, d);
        n2 = this.getRandomInt(1, n1 - 1);

        return {
            type: 'subtract',
            text: `حاصل تفریق زیر را با ساختن کسر نهایی نمایش بده:`,
            f1: { n: n1, d: d },
            f2: { n: n2, d: d },
            targetN: n1 - n2,
            targetD: d,
            hint: `از ${n1} قسمت، ${n2} قسمت را بردار.`
        };
    }
};
