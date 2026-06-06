/* ══════════════════════════════════════
   THEME — Light default, optional dark mode
══════════════════════════════════════ */
const THEME_STORAGE_KEY = 'theme';
const THEME_LIGHT = 'light';
const THEME_DARK = 'dark';

function getThemePreference() {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY);
    return saved === THEME_DARK ? THEME_DARK : THEME_LIGHT;
  } catch {
    return THEME_LIGHT;
  }
}

function applyTheme(theme, saveToStorage = true) {
  const isDark = theme === THEME_DARK;
  document.documentElement.classList.toggle('dark', isDark);
  document.documentElement.setAttribute('data-theme', isDark ? THEME_DARK : THEME_LIGHT);
  if (saveToStorage) {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, isDark ? THEME_DARK : THEME_LIGHT);
    } catch {
      /* storage unavailable */
    }
  }
  return isDark;
}

function initThemeFromStorage() {
  return applyTheme(getThemePreference(), true);
}

function toggleDarkMode() {
  const isDark = !document.documentElement.classList.contains('dark');
  applyTheme(isDark ? THEME_DARK : THEME_LIGHT);
  updateDarkModeIcon();

  if (typeof refreshThemeDependentUI === 'function') {
    refreshThemeDependentUI();
  }
}

function updateDarkModeIcon() {
  const isDark = document.documentElement.classList.contains('dark');
  const iconName = isDark ? 'sun' : 'moon';
  document.querySelectorAll('[data-theme-toggle] i, #dark-mode-toggle i, #auth-theme-toggle i, #authority-theme-toggle i').forEach((icon) => {
    icon.setAttribute('data-lucide', iconName);
  });
  if (window.lucide) window.lucide.createIcons();
}

/* Apply before first paint when loaded from <head> — always light on login page */
applyTheme(THEME_LIGHT, false);

document.addEventListener('DOMContentLoaded', () => {
  applyTheme(THEME_LIGHT, false);
  updateDarkModeIcon();
});
