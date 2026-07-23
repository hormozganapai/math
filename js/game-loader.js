/**
 * game-loader.js
 * ---------------------------------------------------------
 * موتور بارگذاری بازی‌ها به‌صورت افزونه‌ای (Plugin-Based).
 *
 * نحوه کار:
 * 1. فایل games.json در ریشه پروژه خوانده می‌شود که فقط شامل
 *    فهرست نام پوشه‌های بازی‌هاست (مثلاً "probability", "equation").
 * 2. برای هر پوشه، فایل games/<id>/info.json خوانده می‌شود که
 *    اطلاعات نمایشی بازی (عنوان، توضیح، آیکون، دسته و ...) را دارد.
 * 3. نتیجه نهایی آرایه‌ای از آبجکت‌های بازی است که app.js از آن
 *    برای ساخت کارت‌ها استفاده می‌کند.
 *
 * برای افزودن بازی جدید در آینده، کافی است:
 *   - یک پوشه جدید داخل games/ بسازید (مثلاً games/geometry)
 *   - فایل‌های game.html, game.js, style.css, info.json را در آن قرار دهید
 *   - نام پوشه را به آرایه "games" در games.json اضافه کنید
 * نیازی به تغییر کد صفحه اصلی نیست.
 * ---------------------------------------------------------
 */
const GameLoader = (() => {
  async function fetchJSON(url) {
    const res = await fetch(url, { cache: 'no-cache' });
    if (!res.ok) {
      throw new Error(`عدم موفقیت در دریافت ${url} (وضعیت ${res.status})`);
    }
    return res.json();
  }

  /**
   * تمام بازی‌های موجود را بارگذاری می‌کند.
   * @returns {Promise<Array<Object>>} آرایه‌ای از بازی‌ها به همراه id هر پوشه
   */
  async function loadAllGames() {
    const manifest = await fetchJSON('games.json');
    const ids = Array.isArray(manifest.games) ? manifest.games : [];

    const results = await Promise.allSettled(
      ids.map(async (id) => {
        const info = await fetchJSON(`games/${id}/info.json`);
        return { id, ...info };
      })
    );

    const games = [];
    results.forEach((r, i) => {
      if (r.status === 'fulfilled') {
        games.push(r.value);
      } else {
        console.warn(`GameLoader: بارگذاری بازی "${ids[i]}" ناموفق بود.`, r.reason);
      }
    });

    return games;
  }

  return { loadAllGames };
})();
