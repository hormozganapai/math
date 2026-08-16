// questions.js
export class QuestionGenerator {

    // Level 1: Coin (Basic Probability)
    generateCoinQuestion() {
        return {
            type: 'prediction',
            text: 'اگر یک سکه را پرتاب کنیم، احتمال آمدن شیر بیشتر است یا خط؟',
            options: [
                { text: 'شیر', isCorrect: false },
                { text: 'خط', isCorrect: false },
                { text: 'هر دو برابر', isCorrect: true }
            ],
            hint: 'یک سکه سالم دو طرف دارد و شانس هر دو طرف مساوی است.',
            simType: 'coin'
        };
    }

    // Level 2: Dice
    generateDiceQuestion() {
        const type = Math.random() > 0.5 ? 'even' : 'specific';
        if (type === 'even') {
            return {
                type: 'prediction',
                text: 'کدام اتفاق احتمال بیشتری دارد؟',
                options: [
                    { text: 'آمدن عدد زوج (۲، ۴، ۶)', isCorrect: true },
                    { text: 'آمدن عدد ۶', isCorrect: false },
                    { text: 'هر دو برابر', isCorrect: false }
                ],
                hint: 'تعداد اعداد زوج ۳ تا است، اما عدد ۶ فقط ۱ بار وجود دارد.',
                simType: 'dice'
            };
        } else {
            return {
                type: 'prediction',
                text: 'در پرتاب یک تاس، احتمال آمدن کدام عدد بیشتر است؟',
                options: [
                    { text: 'عدد ۱', isCorrect: false },
                    { text: 'عدد ۶', isCorrect: false },
                    { text: 'همه برابرند', isCorrect: true }
                ],
                hint: 'هر وجه تاس ۱ شانس از ۶ شانس را دارد.',
                simType: 'dice'
            };
        }
    }

    // Level 3: Wheel
    generateWheelQuestion() {
        return {
            type: 'prediction',
            text: 'کدام رنگ احتمال بیشتری دارد؟',
            options: [
                { text: 'قرمز (۴ بخش)', isCorrect: true },
                { text: 'آبی (۲ بخش)', isCorrect: false },
                { text: 'سبز (۱ بخش)', isCorrect: false }
            ],
            hint: 'رنگی که بخش بیشتری از دایره را پوشانده، احتمال بیشتری دارد.',
            simType: 'wheel',
            segments: [
                { color: 'red', weight: 4, name: 'قرمز' },
                { color: 'blue', weight: 2, name: 'آبی' },
                { color: 'green', weight: 1, name: 'سبز' },
                { color: 'yellow', weight: 1, name: 'زرد' }
            ]
        };
    }

    // Level 4: Cave (Marbles)
    generateBagQuestion() {
        return {
            type: 'prediction',
            text: 'اگر بدون نگاه کردن یک مهره برداریم، احتمال کدام رنگ بیشتر است؟',
            options: [
                { text: 'قرمز', isCorrect: true },
                { text: 'آبی', isCorrect: false },
                { text: 'برابر', isCorrect: false }
            ],
            hint: 'تعداد مهره‌های قرمز ۳ تا و آبی ۲ تا است.',
            simType: 'bag',
            marbles: ['red', 'red', 'red', 'blue', 'blue']
        };
    }

    // Boss Battle Questions
    generateBossQuestions(count) {
        const qPool = [
            { text: 'احتمال شیر آمدن در پرتاب سکه چقدر است؟', options: [{t: '۱/۲', c:true}, {t: '۱/۳', c:false}, {t: '۱/۴', c:false}] },
            { text: 'احتمال آمدن عدد ۵ در پرتاب تاس چقدر است؟', options: [{t: '۱/۶', c:true}, {t: '۱/۲', c:false}, {t: '۵/۶', c:false}] },
            { text: 'احتمال آمدن عدد فرد در پرتاب تاس چقدر است؟', options: [{t: '۱/۲', c:true}, {t: '۱/۳', c:false}, {t: '۱/۶', c:false}] },
            { text: 'اگر در کیسه‌ای ۴ مهره سبز و ۱ مهره زرد باشد، احتمال سبز چقدر است؟', options: [{t: '۴/۵', c:true}, {t: '۱/۵', c:false}, {t: '۴/۴', c:false}] },
            { text: 'آیا با افزایش تعداد آزمایش، نتیجه به احتمال نظری نزدیک می‌شود؟', options: [{t: 'بله', c:true}, {t: 'خیر', c:false}, {t: 'تغییری نمی‌کند', c:false}] },
            { text: 'مجموع احتمال‌های همه پیشامدهای ممکن چقدر است؟', options: [{t: '۱', c:true}, {t: '۰', c:false}, {t: 'بستگی دارد', c:false}] },
            { text: 'احتمال پیشامدی که حتماً رخ می‌دهد چقدر است؟', options: [{t: '۱', c:true}, {t: '۰', c:false}, {t: '۱/۲', c:false}] },
            { text: 'احتمال پیشامد غیرممکن چقدر است؟', options: [{t: '۰', c:true}, {t: '۱', c:false}, {t: '۱/۲', c:false}] },
            { text: 'کدام اتفاق در پرتاب دو سکه ممکن نیست؟', options: [{t: 'سه شیر', c:true}, {t: 'دو شیر', c:false}, {t: 'شیر و خط', c:false}] },
            { text: 'احتمال اینکه تاس عددی کمتر از ۷ بیاورد چقدر است؟', options: [{t: '۱', c:true}, {t: '۰', c:false}, {t: '۶', c:false}] }
        ];

        // Shuffle and take 'count'
        return qPool.sort(() => 0.5 - Math.random()).slice(0, count);
    }
}