// Simple i18n utility for NodeCrypt
// NodeCrypt 简单国际化工具

// 同步导入语言包
import en from "../languages/en.js";
import zh from "../languages/zh.js";

// Language registry
const LANGUAGES = {
  en,
  zh,
};

// Current language
let currentLanguage = "en";
let isInitialized = false;

// Get translation for a key
export function t(key, fallback = key) {
  const lang = LANGUAGES[currentLanguage];
  if (lang && lang.translations && lang.translations[key]) {
    return lang.translations[key];
  }
  return fallback;
}

// Set current language
export function setLanguage(langCode) {
  if (!LANGUAGES[langCode]) {
    console.warn(`Language "${langCode}" is not supported.`);
    return false;
  }

  currentLanguage = langCode;

  // Update document language attribute
  document.documentElement.lang = langCode;

  // Update static HTML texts
  updateStaticTexts();

  // Dispatch language change event
  window.dispatchEvent(
    new CustomEvent("languageChange", {
      detail: { language: langCode },
    })
  );

  return true;
}

// Get current language
export function getCurrentLanguage() {
  return currentLanguage;
}

// Get all available languages
export function getAvailableLanguages() {
  return Object.keys(LANGUAGES).map((code) => ({
    code,
    name: LANGUAGES[code].name,
    flag: LANGUAGES[code].flag,
  }));
}

// Initialize i18n with settings
export function initI18n(settings) {
  // Default to English if no settings
  const targetLang = settings?.language || detectBrowserLanguage();

  // Set the language
  const success = setLanguage(targetLang);

  // Fallback to English if target language fails
  if (!success && targetLang !== "en") {
    setLanguage("en");
  }

  isInitialized = true;
}

// Detect browser language and return supported language code
function detectBrowserLanguage() {
  const navigatorLang = navigator.language || navigator.userLanguage || "en";

  // Extract language code (e.g., 'zh-CN' -> 'zh', 'en-US' -> 'en')
  const langCode = navigatorLang.split("-")[0].toLowerCase();

  // ✅ 优化：支持所有中文变体
  if (navigatorLang.toLowerCase().startsWith("zh")) {
    return "zh";
  }

  // Check if we support this language
  if (LANGUAGES[langCode]) {
    return langCode;
  }

  // Default fallback to English
  return "en";
}

// Update static HTML text elements
export function updateStaticTexts() {
  // Wait for initialization
  if (!isInitialized) return;

  // 如果DOM还没准备好，等待DOM准备好再更新
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => updateStaticTexts());
    return;
  }

  // Update login title
  const loginTitle = document.getElementById("login-title");
  if (loginTitle) {
    loginTitle.textContent = t("ui.enter_node", "Enter a Node");
  }

  // Update login form content
  const loginFormContainer = document.getElementById("login-form");
  if (loginFormContainer) {
    window.dispatchEvent(new CustomEvent("regenerateLoginForm"));
  }

  // Update sidebar username label
  const sidebarUsername = document.getElementById("sidebar-username");
  if (sidebarUsername) {
    window.dispatchEvent(new CustomEvent("updateSidebarUsername"));
  }

  // Update "Enter a Node" text in sidebar
  const joinRoomText = document.getElementById("join-room-text");
  if (joinRoomText) {
    joinRoomText.textContent = t("ui.enter_node", "Enter a Node");
  }

  // Update Members title in rightbar
  const membersTitle = document.getElementById("members-title");
  if (membersTitle) {
    membersTitle.textContent = t("ui.members", "Members");
  }

  // Update settings title
  const settingsTitle = document.getElementById("settings-title");
  if (settingsTitle) {
    settingsTitle.textContent = t("settings.title", "Settings");
  }

  // Update message placeholder
  const messagePlaceholder = document.querySelector(".input-field-placeholder");
  if (messagePlaceholder) {
    messagePlaceholder.textContent = t("ui.message", "Message");
  }

  // Update attach button title
  const attachBtn = document.querySelector(".chat-attach-btn");
  if (attachBtn) {
    attachBtn.title = t("file.attach_file", "Attach file");
  }

  // Update emoji button title
  const emojiBtn = document.querySelector(".chat-emoji-btn");
  if (emojiBtn) {
    emojiBtn.title = t("action.emoji", "Emoji");
  }

  // Update settings button title
  const settingsBtn = document.getElementById("settings-btn");
  if (settingsBtn) {
    settingsBtn.title = t("action.settings", "Settings");
    settingsBtn.setAttribute("aria-label", t("action.settings", "Settings"));
  }

  // Update back button title
  const backBtn = document.getElementById("settings-back-btn");
  if (backBtn) {
    backBtn.title = t("action.back", "Back");
    backBtn.setAttribute("aria-label", t("action.back", "Back"));
  }

  // Update all elements with data-i18n attribute
  const i18nElements = document.querySelectorAll("[data-i18n]");
  i18nElements.forEach((element) => {
    const key = element.getAttribute("data-i18n");
    if (key) {
      element.textContent = t(key, element.textContent || key);
    }
  });

  // Update all elements with data-i18n-title attribute
  const i18nTitleElements = document.querySelectorAll("[data-i18n-title]");
  i18nTitleElements.forEach((element) => {
    const key = element.getAttribute("data-i18n-title");
    if (key) {
      element.title = t(key, element.title || key);
    }
  });

  // Update meta tags
  updateMetaTags();
}

// Update meta tags with current language
function updateMetaTags() {
  // Update description meta tag
  const metaDescription = document.querySelector('meta[name="description"]');
  if (metaDescription) {
    metaDescription.content = t("meta.description", metaDescription.content);
  }

  // Update keywords meta tag
  const metaKeywords = document.querySelector('meta[name="keywords"]');
  if (metaKeywords) {
    metaKeywords.content = t("meta.keywords", metaKeywords.content);
  }

  // Update og:title meta tag
  const metaOgTitle = document.querySelector('meta[property="og:title"]');
  if (metaOgTitle) {
    metaOgTitle.content = t("meta.og_title", metaOgTitle.content);
  }

  // Update og:description meta tag
  const metaOgDescription = document.querySelector(
    'meta[property="og:description"]'
  );
  if (metaOgDescription) {
    metaOgDescription.content = t(
      "meta.og_description",
      metaOgDescription.content
    );
  }

  // Update twitter:title meta tag
  const metaTwitterTitle = document.querySelector('meta[name="twitter:title"]');
  if (metaTwitterTitle) {
    metaTwitterTitle.content = t(
      "meta.twitter_title",
      metaTwitterTitle.content
    );
  }

  // Update twitter:description meta tag
  const metaTwitterDescription = document.querySelector(
    'meta[name="twitter:description"]'
  );
  if (metaTwitterDescription) {
    metaTwitterDescription.content = t(
      "meta.twitter_description",
      metaTwitterDescription.content
    );
  }
}
