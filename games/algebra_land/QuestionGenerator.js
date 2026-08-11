/**
 * QuestionGenerator.js
 * ---------------------------------------------------------
 * تولید تصادفی سؤال برای هر منطقه از سرزمین جبر. توابع کمکی
 * مشترک (اعداد تصادفی، فرمت فارسی و ...) به‌صورت متدهای
 * استاتیک همین کلاس ارائه می‌شوند تا در کل پروژه بدون تکرار
 * کد در دسترس باشند.
 * ---------------------------------------------------------
 */
class QuestionGenerator {
  static randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  static pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  static shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  static toFa(val) {
    const digits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(val).replace(/[0-9]/g, (d) => digits[d]);
  }

  static fmtSigned(n) {
    if (n > 0) return `+${this.toFa(n)}`;
    if (n < 0) return `−${this.toFa(Math.abs(n))}`;
    return this.toFa(0);
  }

  /* ============== مرحله ۱: دهکده متغیرها ============== */
  static villageQuestion() {
    const bank = [
      {
        prompt: 'در عبارت جبری، x یعنی چیست؟',
        options: ['یک عدد نامعلوم', 'علامت جمع', 'عدد صفر', 'عدد منفی'],
        correct: 'یک عدد نامعلوم'
      },
      {
        prompt: 'آیا مقدار متغیر x در هر مسئله ثابت است؟',
        options: [
          'نه، در مسئله‌های مختلف می‌تواند مقدار متفاوتی داشته باشد',
          'بله، همیشه برابر ۵ است',
          'بله، همیشه برابر صفر است',
          'x اصلاً عدد نیست'
        ],
        correct: 'نه، در مسئله‌های مختلف می‌تواند مقدار متفاوتی داشته باشد'
      },
      {
        prompt: 'کدام گزینه یک «عبارت جبری» است؟',
        options: ['۲x + ۳', '۲ + ۳', '۵', 'جمع'],
        correct: '۲x + ۳'
      },
      {
        prompt: 'در عبارت 3y، عدد ۳ چه نقشی دارد؟',
        options: ['ضریب متغیر y', 'جواب معادله', 'یک متغیر دیگر', 'هیچ نقشی ندارد'],
        correct: 'ضریب متغیر y'
      },
      {
        prompt: 'چرا در جبر از حروفی مثل x و y استفاده می‌کنیم؟',
        options: [
          'برای نشان دادن عددی که هنوز نمی‌دانیم چیست',
          'چون اعداد کافی نیستند',
          'فقط برای زیبایی نوشتار',
          'چون جمع کردن حروف راحت‌تر است'
        ],
        correct: 'برای نشان دادن عددی که هنوز نمی‌دانیم چیست'
      }
    ];
    const q = this.pick(bank);
    return { prompt: q.prompt, options: this.shuffle(q.options), correctOption: q.correct };
  }

  /* ============== مرحله ۲: شهر ترازو (x + a = b) ============== */
  static scaleQuestion(level) {
    const cfg = {
      easy: { aMax: 5, extra: 5 },
      medium: { aMax: 8, extra: 10 },
      hard: { aMax: 12, extra: 18 }
    }[level];

    const a = this.randInt(1, cfg.aMax);
    const x = this.randInt(1, cfg.extra);
    const b = a + x;
    return { a, b, answer: x };
  }

  /* ============== مرحله ۳: کارخانه عبارت‌های جبری ============== */
  static factoryQuestion(level) {
    const stepCount = level === 'easy' ? 2 : 3;
    const opsPool = ['+', '−', '×'];
    const input = this.randInt(1, level === 'easy' ? 8 : level === 'medium' ? 12 : 15);

    const steps = [];
    let value = input;
    for (let i = 0; i < stepCount; i++) {
      const op = this.pick(opsPool);
      let val;
      if (op === '×') val = this.randInt(2, level === 'easy' ? 3 : 4);
      else val = this.randInt(1, level === 'easy' ? 6 : 10);

      steps.push({ op, val });
      if (op === '+') value += val;
      else if (op === '−') value -= val;
      else value *= val;
    }

    const mode = Math.random() < 0.5 ? 'forward' : 'backward';
    return { mode, steps, input, output: value, answer: mode === 'forward' ? value : input };
  }

  /* ============== مرحله ۴: ایستگاه معادله (قطار) ============== */
  static trainQuestion(level) {
    const range = { easy: 10, medium: 16, hard: 25 }[level];
    const forms = level === 'easy'
      ? ['a+_=b', '_+a=b']
      : level === 'medium'
      ? ['a+_=b', '_+a=b', 'a-_=b']
      : ['a+_=b', '_+a=b', 'a-_=b', '_-a=b'];

    const form = this.pick(forms);
    const a = this.randInt(1, range);
    const blank = this.randInt(1, range);
    let b, text, answer;

    if (form === 'a+_=b') {
      b = a + blank;
      text = `${this.toFa(a)} + ⬜ = ${this.toFa(b)}`;
      answer = blank;
    } else if (form === '_+a=b') {
      b = a + blank;
      text = `⬜ + ${this.toFa(a)} = ${this.toFa(b)}`;
      answer = blank;
    } else if (form === 'a-_=b') {
      b = a - blank;
      text = `${this.toFa(a)} − ⬜ = ${this.fmtSigned(b)}`;
      answer = blank;
    } else {
      b = blank - a;
      text = `⬜ − ${this.toFa(a)} = ${this.fmtSigned(b)}`;
      answer = blank;
    }
    return { text, answer };
  }

  /* ============== مرحله ۵: جزیره مجهول (ax + b = c) ============== */
  static islandQuestion(level) {
    const cfg = {
      easy: { aRange: [1, 2], xRange: [1, 10], bRange: [1, 10] },
      medium: { aRange: [2, 6], xRange: [-8, 10], bRange: [-10, 10] },
      hard: { aRange: [2, 9], xRange: [-12, 12], bRange: [-15, 15] }
    }[level];

    let a = this.randInt(cfg.aRange[0], cfg.aRange[1]);
    if (level !== 'easy' && Math.random() < 0.3) a = -a;
    const x = this.randInt(cfg.xRange[0], cfg.xRange[1]);
    const b = this.randInt(cfg.bRange[0], cfg.bRange[1]);
    const c = a * x + b;

    return {
      text: `${this.fmtSigned(a).replace('+', '')}x ${b >= 0 ? '+' : '−'} ${this.toFa(Math.abs(b))} = ${this.fmtSigned(c)}`,
      a, b, c, answer: x
    };
  }

  /* ============== مرحله ۶: قلعه جادوگر جبر ============== */
  static wizardQuestion(level) {
    if (level === 'easy') {
      const a = this.randInt(-12, 12);
      const x = this.randInt(-15, 15);
      const b = x + a;
      return { text: `x ${a >= 0 ? '+' : '−'} ${this.toFa(Math.abs(a))} = ${this.fmtSigned(b)}`, answer: x };
    }
    if (level === 'medium') {
      let a = this.randInt(2, 9);
      if (Math.random() < 0.5) a = -a;
      const x = this.randInt(-10, 10);
      const b = this.randInt(-15, 15);
      const c = a * x + b;
      return {
        text: `${this.fmtSigned(a).replace('+', '')}x ${b >= 0 ? '+' : '−'} ${this.toFa(Math.abs(b))} = ${this.fmtSigned(c)}`,
        answer: x
      };
    }
    let a, c;
    do {
      a = this.randInt(-8, 8);
      c = this.randInt(-8, 8);
    } while (a === c || a === 0 || c === 0);
    const x = this.randInt(-10, 10);
    const b = this.randInt(-12, 12);
    const d = (a - c) * x + b;
    return {
      text: `${this.fmtSigned(a).replace('+', '')}x ${b >= 0 ? '+' : '−'} ${this.toFa(Math.abs(b))} = ${this.fmtSigned(c).replace('+', '')}x ${d >= 0 ? '+' : '−'} ${this.toFa(Math.abs(d))}`,
      answer: x
    };
  }
}
