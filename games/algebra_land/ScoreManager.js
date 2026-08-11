/**
 * ScoreManager.js
 * ---------------------------------------------------------
 * مدیریت امتیاز جلسه بازی فعلی: پاسخ صحیح/غلط، پاداش سرعت،
 * محاسبه ستاره هر منطقه و مدال‌های کلی سفر قهرمان.
 * ---------------------------------------------------------
 */
class ScoreManager {
  /** @param {AlgebraStorage} storage نمونه‌ای از کلاس ذخیره‌سازی */
  constructor(storage) {
    this.storage = storage;
    this.reset();
  }

  reset() {
    this.sessionScore = 0;
    this.sessionCorrect = 0;
    this.sessionWrong = 0;
    this.stageCorrect = 0;
    this.stageWrong = 0;
    this.perfectRun = true;
  }

  startStage() {
    this.stageCorrect = 0;
    this.stageWrong = 0;
  }

  /**
   * ثبت پاسخ صحیح
   * @param {number} timeTakenSec زمان صرف‌شده برای پاسخ
   * @param {number} fastThreshold آستانه سرعت برای پاداش
   */
  addCorrect(timeTakenSec = 99, fastThreshold = 8) {
    let points = 10;
    let fast = false;
    if (timeTakenSec <= fastThreshold) {
      points += 5;
      fast = true;
    }
    this.sessionScore += points;
    this.sessionCorrect++;
    this.stageCorrect++;
    return { points, fast };
  }

  addWrong() {
    this.sessionWrong++;
    this.stageWrong++;
    this.perfectRun = false;
  }

  getStagePercent() {
    const total = this.stageCorrect + this.stageWrong;
    return total > 0 ? (this.stageCorrect / total) * 100 : 0;
  }

  getStageStars() {
    const percent = this.getStagePercent();
    if (percent > 90) return 3;
    if (percent >= 70) return 2;
    return 1;
  }

  getSessionPercent() {
    const total = this.sessionCorrect + this.sessionWrong;
    return total > 0 ? (this.sessionCorrect / total) * 100 : 0;
  }

  /**
   * بررسی و اعطای مدال بر اساس مرحله‌ای که تازه تمام شده.
   * @param {string} stageId شناسه منطقه‌ای که تمام شد
   * @param {boolean} isLastStage آیا این آخرین منطقه (قلعه) بود؟
   */
  evaluateMedals(stageId, isLastStage) {
    const MEDALS = {
      apprentice: { id: 'apprentice', label: 'شاگرد جبر', icon: '🥉' },
      master: { id: 'master', label: 'استاد معادله', icon: '🥈' },
      champion: { id: 'champion', label: 'قهرمان سرزمین جبر', icon: '🥇' },
      savior: { id: 'savior', label: 'ناجی سرزمین', icon: '👑' }
    };

    const newlyAwarded = [];

    if (stageId === 'village' && this.storage.awardMedal(MEDALS.apprentice.id)) {
      newlyAwarded.push(MEDALS.apprentice);
    }
    if (stageId === 'train' && this.storage.awardMedal(MEDALS.master.id)) {
      newlyAwarded.push(MEDALS.master);
    }
    if (isLastStage) {
      if (this.perfectRun && this.storage.awardMedal(MEDALS.savior.id)) {
        newlyAwarded.push(MEDALS.savior);
      }
      if (this.getSessionPercent() >= 80 && this.storage.awardMedal(MEDALS.champion.id)) {
        newlyAwarded.push(MEDALS.champion);
      }
    }
    return newlyAwarded;
  }
}
