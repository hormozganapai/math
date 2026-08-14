/**
 * Storage.js
 * ---------------------------------------------------------
 * مدیریت ذخیره‌سازی محلی (LocalStorage) برای بازی سرزمین جبر.
 * تمام پیشرفت بازیکن (بهترین امتیاز، آخرین مرحله، مدال‌ها،
 * زمان بازی، تعداد پاسخ صحیح/غلط) در این کلاس نگهداری می‌شود.
 * ---------------------------------------------------------
 */
class AlgebraStorage {
  constructor() {
    this.key = 'algebra_land_save';
    this.stageOrder = ['scale', 'factory', 'train', 'island', 'castle'];
  }

  /** مقدار پیش‌فرض ذخیره‌سازی وقتی چیزی قبلاً ذخیره نشده */
  getDefault() {
    const progress = {};
    this.stageOrder.forEach((id) => (progress[id] = false));
    return {
      bestScore: 0,
      lastStage: this.stageOrder[0],
      medals: [],
      totalPlayTimeSec: 0,
      totalCorrect: 0,
      totalWrong: 0,
      theme: 'light',
      soundOn: true,
      stageProgress: progress
    };
  }

  /** خواندن کامل داده ذخیره‌شده */
  load() {
    try {
      const raw = localStorage.getItem(this.key);
      if (!raw) return this.getDefault();
      const parsed = JSON.parse(raw);
      return { ...this.getDefault(), ...parsed };
    } catch (e) {
      console.warn('AlgebraStorage: خطا در خواندن داده', e);
      return this.getDefault();
    }
  }

  /** نوشتن کامل داده */
  save(data) {
    try {
      localStorage.setItem(this.key, JSON.stringify(data));
    } catch (e) {
      console.warn('AlgebraStorage: خطا در ذخیره داده', e);
    }
  }

  /** آیا منطقه‌ای باز (unlock) است؟ منطقه اول همیشه باز است */
  isStageUnlocked(stageId) {
    const data = this.load();
    const idx = this.stageOrder.indexOf(stageId);
    if (idx <= 0) return true;
    const prevStage = this.stageOrder[idx - 1];
    return !!data.stageProgress[prevStage];
  }

  /** ثبت اتمام یک منطقه و به‌روزرسانی آخرین مرحله */
  markStageComplete(stageId) {
    const data = this.load();
    data.stageProgress[stageId] = true;
    data.lastStage = stageId;
    this.save(data);
  }

  /** ثبت امتیاز جدید (در صورت بیشتر بودن از رکورد قبلی) */
  submitScore(score) {
    const data = this.load();
    if (score > data.bestScore) data.bestScore = score;
    this.save(data);
    return data.bestScore;
  }

  /** افزودن آمار صحیح/غلط تجمعی */
  addAnswerStats(correctDelta, wrongDelta) {
    const data = this.load();
    data.totalCorrect += correctDelta;
    data.totalWrong += wrongDelta;
    this.save(data);
  }

  /** افزودن زمان بازی (ثانیه) */
  addPlayTime(seconds) {
    const data = this.load();
    data.totalPlayTimeSec += seconds;
    this.save(data);
  }

  /** اعطای مدال جدید در صورتی که قبلاً کسب نشده باشد */
  awardMedal(medalId) {
    const data = this.load();
    if (!data.medals.includes(medalId)) {
      data.medals.push(medalId);
      this.save(data);
      return true;
    }
    return false;
  }

  /** ذخیره تنظیمات تم (روشن/تاریک) */
  setTheme(theme) {
    const data = this.load();
    data.theme = theme;
    this.save(data);
  }

  /** ذخیره وضعیت صدا (روشن/خاموش) */
  setSoundOn(soundOn) {
    const data = this.load();
    data.soundOn = soundOn;
    this.save(data);
  }

  /** بازنشانی کامل پیشرفت */
  resetAll() {
    localStorage.removeItem(this.key);
  }
}
