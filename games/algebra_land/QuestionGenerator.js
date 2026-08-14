/**
 * QuestionGenerator.js
 * ---------------------------------------------------------
 * تولید تصادفی سؤال برای هر منطقه از سرزمین جبر. توابع کمکی
 * مشترک (اعداد تصادفی، فرمت فارسی و ...) به‌صورت متدهای
 * استاتیک همین کلاس ارائه می‌شوند تا در کل پروژه بدون تکرار
 * کد در دسترس باشند.
 *
 * بازی یک سطح سختی ثابت و متعادل دارد (بدون انتخاب آسان/متوسط/
 * سخت)؛ چالش با پیشروی طبیعی در نقشه (ترازو → کارخانه → قطار →
 * جزیره → قلعه) بالا می‌رود. در قلعه جادوگر جبر، هر سه فرم معادله
 * به‌صورت تصادفی با هم ترکیب می‌شوند.
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

  /* ============== شهر ترازو (x + a = b) ============== */
  static scaleQuestion() {
    const a = this.randInt(2, 9);
    const x = this.randInt(1, 12);
    const b = a + x;
    return { a, b, answer: x };
  }

  /* ============== کارخانه عبارت‌های جبری ============== */
  static factoryQuestion() {
    const stepCount = 3;
    const opsPool = ['+', '−', '×'];
    const input = this.randInt(1, 12);

    const steps = [];
    let value = input;
    for (let i = 0; i < stepCount; i++) {
      const op = this.pick(opsPool);
      let val;
      if (op === '×') val = this.randInt(2, 4);
      else val = this.randInt(1, 10);

      steps.push({ op, val });
      if (op === '+') value += val;
      else if (op === '−') value -= val;
      else value *= val;
    }

    const mode = Math.random() < 0.5 ? 'forward' : 'backward';
    return { mode, steps, input, output: value, answer: mode === 'forward' ? value : input };
  }

  /* ============== ایستگاه معادله (قطار) ============== */
  static trainQuestion() {
    const range = 18;
    const forms = ['a+_=b', '_+a=b', 'a-_=b', '_-a=b'];

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

  /* ============== جزیره مجهول (ax + b = c) ============== */
  static islandQuestion() {
    let a = this.randInt(2, 7);
    if (Math.random() < 0.3) a = -a;
    const x = this.randInt(-10, 10);
    const b = this.randInt(-10, 10);
    const c = a * x + b;

    return {
      text: `${this.fmtSigned(a).replace('+', '')}x ${b >= 0 ? '+' : '−'} ${this.toFa(Math.abs(b))} = ${this.fmtSigned(c)}`,
      a, b, c, answer: x
    };
  }

  /* ============== قلعه جادوگر جبر (مبارزه نهایی، سه فرم مخلوط) ============== */
  static wizardQuestion() {
    const form = this.pick(['simple', 'linear', 'twoSided']);

    if (form === 'simple') {
      const a = this.randInt(-12, 12);
      const x = this.randInt(-15, 15);
      const b = x + a;
      return { text: `x ${a >= 0 ? '+' : '−'} ${this.toFa(Math.abs(a))} = ${this.fmtSigned(b)}`, answer: x };
    }
    if (form === 'linear') {
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
