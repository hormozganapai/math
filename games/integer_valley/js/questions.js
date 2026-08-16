/**
 * Question Generator Module
 * Generates dynamic questions for each level based on specific learning goals.
 */

class QuestionGenerator {
    static getRandomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static getNonZeroInt(min, max) {
        let num = 0;
        while (num === 0) {
            num = this.getRandomInt(min, max);
        }
        return num;
    }

    static generateOptions(correctAnswer, generateWrongFn, count = 3) {
        const options = new Set([correctAnswer]);
        while (options.size < count) {
            options.add(generateWrongFn());
        }
        return Array.from(options).sort(() => Math.random() - 0.5);
    }

    // Level 1: Recognition of Positive/Negative
    static generateLevel1() {
        const num = this.getNonZeroInt(-15, 15);
        const isPositive = num > 0;

        const questionText = `عدد <span dir="ltr">${num > 0 ? '+'+num : num}</span> در کدام بخش دره قرار دارد؟`;
        const correctAnswer = isPositive ? '🏔️ بالای صفر (مثبت)' : '🕳️ پایین صفر (منفی)';
        const options = ['🏔️ بالای صفر (مثبت)', '🌊 روی صفر', '🕳️ پایین صفر (منفی)'];

        const feedback = isPositive
            ? `چون علامت عدد مثبت (+) است، پس بالای سطح صفر قرار دارد.`
            : `چون علامت عدد منفی (-) است، پس پایین سطح صفر در غارها قرار دارد.`;

        return {
            type: 'multiple-choice',
            question: questionText,
            options: options,
            correct: correctAnswer,
            feedback: feedback,
            number: num
        };
    }

    // Level 2: Finding Zero & Number Line position (Interactive)
    static generateLevel2() {
        const target = this.getRandomInt(-5, 5);

        return {
            type: 'number-line-find',
            question: `عدد <span dir="ltr">${target > 0 ? '+'+target : target}</span> را روی خط اعداد پیدا کن و روی آن کلیک کن.`,
            correct: target,
            range: [-5, 5],
            feedback: `عالی! جایگاه دقیق <span dir="ltr">${target > 0 ? '+'+target : target}</span> را پیدا کردی.`
        };
    }

    // Level 3: Comparing Numbers
    static generateLevel3() {
        const type = this.getRandomInt(0, 1); // 0: Greater, 1: Smaller
        let a, b;
        do {
            a = this.getRandomInt(-10, 10);
            b = this.getRandomInt(-10, 10);
        } while (a === b);

        const questionText = type === 0 ? 'کدام عدد بزرگ‌تر است؟' : 'کدام عدد کوچک‌تر است؟';
        const correctAnswer = type === 0 ? Math.max(a, b) : Math.min(a, b);

        const strA = a > 0 ? '+'+a : a.toString();
        const strB = b > 0 ? '+'+b : b.toString();

        const feedback = type === 0
            ? `روی خط اعداد، هر عددی که سمت راست باشد بزرگ‌تر است. پس <span dir="ltr">${correctAnswer > 0 ? '+'+correctAnswer : correctAnswer}</span> بزرگ‌تر است.`
            : `روی خط اعداد، هر عددی که سمت چپ باشد کوچک‌تر است. پس <span dir="ltr">${correctAnswer > 0 ? '+'+correctAnswer : correctAnswer}</span> کوچک‌تر است.`;

        return {
            type: 'multiple-choice',
            question: questionText,
            options: [strA, strB],
            correct: correctAnswer > 0 ? '+'+correctAnswer : correctAnswer.toString(),
            feedback: feedback
        };
    }

    // Level 4: Movement on Number Line
    static generateLevel4() {
        const start = this.getRandomInt(-5, 5);
        const move = this.getNonZeroInt(-5, 5); // + goes right, - goes left
        const target = start + move;

        const directionStr = move > 0 ? 'مثبت (راست)' : 'منفی (چپ)';
        const absMove = Math.abs(move);

        return {
            type: 'number-line-move',
            question: `شخصیت روی <span dir="ltr">${start > 0 ? '+'+start : start}</span> است. ${absMove} قدم به سمت ${directionStr} حرکت کن. به چه عددی می‌رسی؟`,
            start: start,
            move: move,
            correct: target,
            options: this.generateOptions(target, () => target + this.getRandomInt(-3, 3), 4),
            range: [-10, 10],
            feedback: `از ${start} شروع کردیم، ${absMove} قدم به سمت ${directionStr} رفتیم و به ${target} رسیدیم.`
        };
    }

    // Level 5: Addition
    static generateLevel5() {
        const a = this.getRandomInt(-10, 10);
        const b = this.getRandomInt(-10, 10);
        const result = a + b;

        const strA = a > 0 ? '+'+a : a.toString();
        const strB = b > 0 ? '+'+b : b.toString();

        const direction = b >= 0 ? 'راست (مثبت)' : 'چپ (منفی)';
        const feedback = `برای جمع <span dir="ltr">${strA} + (${strB})</span>: از ${strA} شروع کن و ${Math.abs(b)} قدم به سمت ${direction} برو. به ${result} می‌رسی.`;

        return {
            type: 'number-line-equation',
            question: `حاصل جمع زیر را پیدا کن:`,
            equation: `<span dir="ltr">${strA} + (${strB}) = ?</span>`,
            start: a,
            move: b,
            correct: result > 0 ? '+'+result : result.toString(),
            options: this.generateOptions(result.toString(), () => (result + this.getNonZeroInt(-5, 5)).toString(), 4).map(o => parseInt(o)>0 ? '+'+parseInt(o) : o),
            range: [-20, 20],
            feedback: feedback
        };
    }

    // Level 6: Subtraction
    static generateLevel6() {
        const a = this.getRandomInt(-10, 10);
        const b = this.getRandomInt(-10, 10);
        const result = a - b;

        const strA = a > 0 ? '+'+a : a.toString();
        const strB = b > 0 ? '+'+b : b.toString();

        // Explain subtraction as moving opposite of b
        const direction = b > 0 ? 'چپ (چون تفریق یک عدد مثبت است)' : 'راست (چون تفریق یک عدد منفی، مثل جمع با عدد مثبت است)';
        const feedback = `برای تفریق <span dir="ltr">${strA} - (${strB})</span>: از ${strA} شروع کن. چون تفریق می‌کنیم، برعکس علامت عدد دوم حرکت می‌کنیم یعنی ${Math.abs(b)} قدم به سمت ${direction}. به ${result} می‌رسی.`;

        return {
            type: 'number-line-equation',
            question: `حاصل تفریق زیر را پیدا کن:`,
            equation: `<span dir="ltr">${strA} - (${strB}) = ?</span>`,
            start: a,
            move: -b, // Movement is opposite for subtraction
            correct: result > 0 ? '+'+result : result.toString(),
            options: this.generateOptions(result.toString(), () => (result + this.getNonZeroInt(-5, 5)).toString(), 4).map(o => parseInt(o)>0 ? '+'+parseInt(o) : o),
            range: [-20, 20],
            feedback: feedback
        };
    }

    // Level 7: Multiplication Cave
    static generateLevel7() {
        const a = this.getNonZeroInt(-6, 6);
        const b = this.getNonZeroInt(-6, 6);
        const result = a * b;

        const strA = a > 0 ? '+'+a : a.toString();
        const strB = b > 0 ? '+'+b : b.toString();

        let rule = "";
        if (a > 0 && b > 0) rule = "مثبت در مثبت = مثبت";
        else if (a < 0 && b < 0) rule = "منفی در منفی = مثبت (برعکسِ برعکس)";
        else rule = "مثبت در منفی = منفی";

        const feedback = `حاصل ضرب <span dir="ltr">${strA} × (${strB})</span> برابر است با ${result}. قانون: ${rule}.`;

        return {
            type: 'multiple-choice',
            question: `حاصل ضرب زیر را پیدا کن:`,
            equation: `<span dir="ltr">${strA} × (${strB}) = ?</span>`,
            correct: result > 0 ? '+'+result : result.toString(),
            options: this.generateOptions(result.toString(), () => (result + this.getNonZeroInt(-10, 10)).toString(), 4).map(o => parseInt(o)>0 && o!=="0" ? '+'+parseInt(o) : o),
            feedback: feedback
        };
    }

    // Level 8: Boss Battle (Mixed)
    static generateBossQuestion() {
        const types = [5, 6, 7]; // Add, Sub, Mult
        const type = types[this.getRandomInt(0, types.length - 1)];

        if (type === 5) return this.generateLevel5();
        if (type === 6) return this.generateLevel6();
        if (type === 7) return this.generateLevel7();
    }

    static getQuestionForLevel(level, questionNumber = 1) {
        switch(level) {
            case 1: return this.generateLevel1();
            case 2: return this.generateLevel2();
            case 3: return this.generateLevel3();
            case 4: return this.generateLevel4();
            case 5: return this.generateLevel5();
            case 6: return this.generateLevel6();
            case 7: return this.generateLevel7();
            case 8: return this.generateBossQuestion();
            default: return this.generateLevel1();
        }
    }
}