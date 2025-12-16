// Theme utility functions
// 主题工具函数

// 同步加载主题数据
import { THEMES } from "../themes/index.js";

// Get current theme from settings
// 从设置中获取当前主题
export function getCurrentTheme() {
  try {
    const settings = JSON.parse(localStorage.getItem("settings") || "{}");

    // If no theme is set (first-time visitor), use theme1 as default
    // 如果没有设置主题（首次访问），使用 theme1 作为默认
    if (!settings.theme) {
      // Save theme1 as default theme to settings
      // 将 theme1 作为默认主题保存到设置中
      settings.theme = "theme1";
      localStorage.setItem("settings", JSON.stringify(settings));

      return THEMES[0]; // 返回第一个主题
    }

    const themeId = settings.theme;
    return THEMES.find((theme) => theme.id === themeId) || THEMES[0];
  } catch {
    // If there's an error, use theme1 as fallback
    // 如果出现错误，使用 theme1 作为备选
    return THEMES[0];
  }
}

// Apply theme to the document
// 应用主题到文档
export function applyTheme(themeId) {
  const theme = THEMES.find((t) => t.id === themeId);
  if (!theme) {
    console.warn(`Theme with id "${themeId}" not found`);
    return false;
  }

  const mainElement = document.querySelector(".main");
  if (mainElement) {
    // Clear any existing background
    mainElement.style.backgroundImage = "";
    mainElement.style.background = "";

    // Apply new background
    if (theme.background.startsWith("url(")) {
      mainElement.style.backgroundImage = theme.background;
      mainElement.style.backgroundSize = "100% 100%";
      mainElement.style.backgroundRepeat = "no-repeat";
      mainElement.style.backgroundPosition = "center";
    } else {
      mainElement.style.background = theme.background;
    }

    // Add transition effect for smooth theme switching
    // 添加过渡效果，实现平滑的主题切换
    mainElement.style.transition =
      "background 0.5s ease-in-out, background-image 0.5s ease-in-out";

    return true;
  } else {
    console.warn("Main element not found");
    return false;
  }
}

// Initialize theme on page load
// 页面加载时初始化主题
export function initTheme() {
  const currentTheme = getCurrentTheme();
  applyTheme(currentTheme.id);
}

// Get theme by ID
// 根据ID获取主题
export function getThemeById(themeId) {
  return THEMES.find((theme) => theme.id === themeId);
}

// Get all available themes
// 获取所有可用主题
export function getAllThemes() {
  return THEMES;
}
