/**
 * score.js
 * ---------------------------------------------------------
 * ماژول مدیریت امتیاز و آمار بازیکن با استفاده از LocalStorage.
 * این ماژول هم در صفحه اصلی و هم داخل هر بازی قابل استفاده است.
 *
 * ساختار ذخیره‌سازی در LocalStorage (کلید: "mathplay_stats"):
 * {
 *   totalGamesPlayed: number,
 *   games: {
 *     [gameId]: {
 *       highScore: number,
 *       timesPlayed: number,
 *       lastLevel: string
 *     }
 *   }
 * }
 * ---------------------------------------------------------
 */
const MathPlayScore = (() => {
  const STORAGE_KEY = 'mathplay_stats';

  function _load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { totalGamesPlayed: 0, games: {} };
      const parsed = JSON.parse(raw);
      if (!parsed.games) parsed.games = {};
      if (typeof parsed.totalGamesPlayed !== 'number') parsed.totalGamesPlayed = 0;
      return parsed;
    } catch (e) {
      console.warn('MathPlayScore: خطا در خواندن اطلاعات ذخیره‌شده', e);
      return { totalGamesPlayed: 0, games: {} };
    }
  }

  function _save(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('MathPlayScore: خطا در ذخیره اطلاعات', e);
    }
  }

  /** ثبت شروع یک بازی جدید (افزایش تعداد دفعات بازی) */
  function recordPlay(gameId) {
    const data = _load();
    data.totalGamesPlayed += 1;
    if (!data.games[gameId]) {
      data.games[gameId] = { highScore: 0, timesPlayed: 0, lastLevel: '' };
    }
    data.games[gameId].timesPlayed += 1;
    _save(data);
    return data.games[gameId];
  }

  /** ثبت امتیاز جدید؛ اگر از رکورد قبلی بیشتر بود جایگزین می‌شود */
  function submitScore(gameId, score) {
    const data = _load();
    if (!data.games[gameId]) {
      data.games[gameId] = { highScore: 0, timesPlayed: 0, lastLevel: '' };
    }
    if (score > data.games[gameId].highScore) {
      data.games[gameId].highScore = score;
    }
    _save(data);
    return data.games[gameId].highScore;
  }

  /** ثبت آخرین مرحله‌ای که بازیکن به آن رسیده */
  function setLastLevel(gameId, levelLabel) {
    const data = _load();
    if (!data.games[gameId]) {
      data.games[gameId] = { highScore: 0, timesPlayed: 0, lastLevel: '' };
    }
    data.games[gameId].lastLevel = levelLabel;
    _save(data);
  }

  /** دریافت آمار یک بازی خاص */
  function getGameStats(gameId) {
    const data = _load();
    return data.games[gameId] || { highScore: 0, timesPlayed: 0, lastLevel: '' };
  }

  /** دریافت آمار کلی سایت (برای نمایش در هدر صفحه اصلی) */
  function getGlobalStats() {
    const data = _load();
    const gameIds = Object.keys(data.games);
    const bestScore = gameIds.reduce(
      (max, id) => Math.max(max, data.games[id].highScore || 0),
      0
    );
    return {
      totalGamesPlayed: data.totalGamesPlayed,
      distinctGames: gameIds.length,
      bestScore
    };
  }

  /** پاک کردن کامل اطلاعات ذخیره‌شده (اختیاری، برای دیباگ/ریست) */
  function resetAll() {
    localStorage.removeItem(STORAGE_KEY);
  }

  return {
    recordPlay,
    submitScore,
    setLastLevel,
    getGameStats,
    getGlobalStats,
    resetAll
  };
})();
