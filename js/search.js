/**
 * search.js
 * ---------------------------------------------------------
 * منطق جستجوی متنی و فیلتر دسته‌بندی روی لیست بازی‌ها.
 * این ماژول state ندارد؛ فقط توابع خالص فیلترکننده ارائه می‌دهد
 * تا app.js آن‌ها را با state خودش ترکیب کند.
 * ---------------------------------------------------------
 */
const MathPlaySearch = (() => {
  /** نرمال‌سازی ساده متن فارسی برای جستجوی بی‌حساسیت به فاصله/اعراب رایج */
  function normalize(text) {
    return (text || '')
      .toString()
      .trim()
      .toLowerCase()
      .replace(/[يى]/g, 'ی')
      .replace(/ك/g, 'ک')
      .replace(/\s+/g, ' ');
  }

  /**
   * فیلتر کردن بازی‌ها بر اساس عبارت جستجو و دسته‌بندی انتخاب‌شده
   * @param {Array<Object>} games لیست کامل بازی‌ها
   * @param {string} query عبارت جستجو
   * @param {string} category دسته‌بندی فعال ("all" برای همه)
   */
  function filterGames(games, query, category) {
    const q = normalize(query);
    return games.filter((game) => {
      const matchesCategory =
        !category || category === 'all' || game.category === category || game.grade === category;

      if (!matchesCategory) return false;
      if (!q) return true;

      const haystack = normalize(
        `${game.title} ${game.description} ${game.category} ${game.grade}`
      );
      return haystack.includes(q);
    });
  }

  return { filterGames, normalize };
})();
