/**
 * theme.js
 * ---------------------------------------------------------
 * مدیریت تم روشن/تاریک برای کل سایت MathPlay با یک کلید
 * مشترک در LocalStorage (mathplay_theme) تا انتخاب کاربر در
 * صفحه اصلی و همه بازی‌ها یکسان بماند.
 *
 * این فایل عمداً خیلی کوچک است و در ابتدای <head> (پیش از
 * لینک‌های CSS) بارگذاری می‌شود تا تم پیش از رنگ‌آمیزی اولیه
 * صفحه اعمال شود و از چشمک زدن (Flash) جلوگیری شود.
 * ---------------------------------------------------------
 */
(function () {
  var THEME_KEY = 'mathplay_theme';

  function getSavedTheme() {
    try { return localStorage.getItem(THEME_KEY) || 'light'; }
    catch (e) { return 'light'; }
  }

  function setSavedTheme(theme) {
    try { localStorage.setItem(THEME_KEY, theme); } catch (e) { /* ignore */ }
  }

  // اعمال فوری تم ذخیره‌شده (پیش از رندر صفحه)
  document.documentElement.setAttribute('data-theme', getSavedTheme());

  // پس از آماده شدن DOM، دکمه تغییر تم (در صورت وجود) را متصل می‌کند
  document.addEventListener('DOMContentLoaded', function () {
    var btn = document.getElementById('themeToggle');
    if (!btn) return;

    function refreshIcon() {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      btn.textContent = isDark ? '☀️' : '🌙';
    }
    refreshIcon();

    btn.addEventListener('click', function () {
      var isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      var next = isDark ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      setSavedTheme(next);
      refreshIcon();
    });
  });
})();
