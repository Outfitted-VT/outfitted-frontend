// Light / dark theme. The preference ("light", "dark", or "system") is stored per device.
// index.html applies it with an inline script before first paint, so there's no flash; this
// module keeps it in sync afterwards.
//
// Theming works through data-theme="dark" on <html>: index.html redefines the Tailwind token
// variables for it, and styles.css redefines its own variables.

const KEY = "outfitted.theme";
const systemDark = window.matchMedia("(prefers-color-scheme: dark)");
const listeners = new Set();

export function getThemePreference() {
  try {
    const value = localStorage.getItem(KEY);
    return value === "light" || value === "dark" ? value : "system";
  } catch {
    return "system";
  }
}

export function isDarkTheme() {
  const preference = getThemePreference();
  return preference === "dark" || (preference === "system" && systemDark.matches);
}

export function applyTheme() {
  const dark = isDarkTheme();
  const root = document.documentElement;
  root.dataset.theme = dark ? "dark" : "light";
  root.classList.toggle("dark", dark); // Tailwind's dark: variant
  document.querySelector('meta[name="theme-color"]')?.setAttribute("content", dark ? "#121413" : "#fcfbf7");
  listeners.forEach((listener) => listener(dark));
}

export function setThemePreference(preference) {
  try {
    if (preference === "system") localStorage.removeItem(KEY);
    else localStorage.setItem(KEY, preference);
  } catch {
    // Storage unavailable: the theme still changes for this visit.
  }
  applyTheme();
}

/** Call `listener(isDark)` whenever the theme changes. Returns an unsubscribe function. */
export function onThemeChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

// Follow the OS when the preference is "system".
systemDark.addEventListener("change", () => {
  if (getThemePreference() === "system") applyTheme();
});
