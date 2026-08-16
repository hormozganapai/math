/**
 * Levels Module
 * Defines configurations and logic for all 8 levels
 */

const Levels = {
    configs: [
        {
            id: 1,
            name: "دهکده قسمت‌ها",
            icon: "🌱",
            type: "identify_parts",
            tutorialText: "به دهکده قسمت‌ها خوش آمدی! یک کسر نشان می‌دهد که ما چند قسمت از یک کل را انتخاب کرده‌ایم. روی قسمت‌ها کلیک کن تا کسر مورد نظر ساخته شود.",
            questionsRequired: 3,
            difficulty: "easy"
        },
        {
            id: 2,
            name: "باغ تقسیم",
            icon: "🍕",
            type: "split",
            tutorialText: "در این باغ باید شکل‌ها را به قسمت‌های مساوی تقسیم کنی. مخرج کسر (عدد پایین) نشان‌دهنده تعداد کل قسمت‌های مساوی است.",
            questionsRequired: 3,
            difficulty: "easy"
        },
        {
            id: 3,
            name: "جنگل صورت و مخرج",
            icon: "🍎",
            type: "build_fraction",
            tutorialText: "حالا خودت کسر بساز! ابتدا شکل را به تعداد مخرج تقسیم کن، سپس به تعداد صورت، قسمت‌ها را انتخاب (رنگ) کن.",
            questionsRequired: 3,
            difficulty: "medium"
        },
        {
            id: 4,
            name: "پل مقایسه",
            icon: "⚖️",
            type: "compare",
            tutorialText: "پل خراب است! با مقایسه دو کسر و انتخاب علامت مناسب (بزرگتر، کوچکتر یا مساوی) پل را تعمیر کن.",
            questionsRequired: 4,
            difficulty: "medium"
        },
        {
            id: 5,
            name: "غار کسرهای مساوی",
            icon: "🧩",
            type: "equivalent",
            tutorialText: "بعضی کسرها ظاهر متفاوتی دارند اما مقدارشان یکی است! کسری بساز که با کسر داده شده مساوی باشد.",
            questionsRequired: 3,
            difficulty: "medium"
        },
        {
            id: 6,
            name: "رودخانه جمع",
            icon: "➕",
            type: "add",
            tutorialText: "وقتی مخرج‌ها (اندازه قسمت‌ها) مساوی باشد، می‌توانیم صورت‌ها (تعداد قسمت‌ها) را با هم جمع کنیم.",
            questionsRequired: 4,
            difficulty: "hard"
        },
        {
            id: 7,
            name: "دره تفریق",
            icon: "➖",
            type: "subtract",
            tutorialText: "در تفریق هم، اگر مخرج‌ها برابر باشند، فقط کافیست قسمت‌هایی که در صورت مشخص شده را از هم کم کنیم (برداریم).",
            questionsRequired: 4,
            difficulty: "hard"
        },
        {
            id: 8,
            name: "قلعه نهایی",
            icon: "🏰",
            type: "boss",
            tutorialText: "رسیدیم به قلعه! جادوگر کسرها منتظر است. برای شکست او باید به سوالات مختلف با سرعت و دقت پاسخ دهی.",
            questionsRequired: 10,
            difficulty: "mixed"
        }
    ],

    getLevel(id) {
        return this.configs.find(l => l.id === id);
    }
};
