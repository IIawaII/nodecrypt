// util.notification.js
// 通知工具

// 引入音频文件
import notificationSoundUrl from "../sounds/notification.mp3";

// 读取设置
function getSettings() {
  try {
    return JSON.parse(localStorage.getItem("settings")) || {};
  } catch (e) {
    return {};
  }
}

// 音频文件路径配置
const SOUND_PATHS = {
  default: notificationSoundUrl,
};

// 音频缓存对象
const audioCache = {};

// 预加载音频文件
function preloadSound(name, path) {
  try {
    const audio = new Audio(path);
    audio.preload = "auto";
    audioCache[name] = audio;
    return audio;
  } catch (e) {
    console.warn("音频预加载失败:", name, e);
    return null;
  }
}

// 初始化音频
function initAudio() {
  if (Object.keys(audioCache).length === 0) {
    preloadSound("default", SOUND_PATHS.default);
  }
}

// 播放声音
function playSound() {
  try {
    // 确保音频已加载
    initAudio();

    const audio =
      audioCache["default"] || preloadSound("default", SOUND_PATHS.default);
    if (!audio) {
      console.error("音频加载失败");
      return;
    }

    // 重置音频位置并播放
    audio.currentTime = 0;

    // 同步播放
    const playResult = audio.play();

    // 处理浏览器自动播放策略
    if (playResult && typeof playResult.catch === "function") {
      playResult.catch((err) => {
        if (err.name === "NotAllowedError") {
          console.warn("音频播放被浏览器阻止，需要用户交互");
        } else {
          console.error("音频播放失败:", err);
        }
      });
    }

    console.log("🔊 播放通知音");
  } catch (e) {
    console.error("Sound notification failed", e);
  }
}

// 标题闪烁逻辑
let originalTitle = document.title;
let blinkInterval = null;
let isPageVisible = true;

document.addEventListener("visibilitychange", () => {
  isPageVisible = document.visibilityState === "visible";
  if (isPageVisible) stopTitleBlink();
});

function startTitleBlink(senderName) {
  if (isPageVisible || blinkInterval) return;
  let isNewMsg = true;
  blinkInterval = setInterval(() => {
    document.title = isNewMsg ? `【新消息】${senderName}` : originalTitle;
    isNewMsg = !isNewMsg;
  }, 1000);
}

function stopTitleBlink() {
  if (blinkInterval) {
    clearInterval(blinkInterval);
    blinkInterval = null;
    document.title = originalTitle;
  }
}

// 发送桌面通知
function sendDesktopNotification(roomName, sender, content, type) {
  if (isPageVisible) return;
  if (!("Notification" in window) || Notification.permission !== "granted")
    return;

  let bodyText = content;
  if (type && type.includes("image")) bodyText = "[图片]";
  else if (type && type.includes("file"))
    bodyText = `[文件] ${content.fileName || ""}`;

  if (typeof bodyText === "string" && bodyText.length > 50) {
    bodyText = bodyText.substring(0, 50) + "...";
  }

  try {
    const notification = new Notification(`来自 ${sender} (#${roomName})`, {
      body: bodyText,
      icon: "/favicon.ico",
      silent: true,
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
      stopTitleBlink();
    };
  } catch (e) {
    console.error("Notification error:", e);
  }
}

// 处理新消息主入口
export function handleNewMessage(roomName, msgType, content, sender) {
  const settings = getSettings();
  const myUserName =
    window.roomsData && window.activeRoomIndex >= 0
      ? window.roomsData[window.activeRoomIndex].myUserName
      : null;

  // 忽略自己和系统消息
  if (!sender || sender === myUserName || msgType === "system") return;

  // 1. 优先播放声音
  if (settings.sound) {
    playSound();
  }

  // 2. 处理桌面通知
  if (settings.notify) {
    startTitleBlink(sender);
    sendDesktopNotification(roomName, sender, content, msgType);
  } else if (settings.sound) {
    // 如果只开了声音没开通知，也让标题闪烁
    startTitleBlink(sender);
  }
}

// 初始化系统
export function initNotificationSystem() {
  // 请求通知权限
  if ("Notification" in window && Notification.permission !== "granted") {
    const ask = () => {
      Notification.requestPermission();
      document.body.removeEventListener("click", ask);
    };
    document.body.addEventListener("click", ask);
  }

  // 预加载音频
  const preloadAudio = () => {
    initAudio();
    document.body.removeEventListener("click", preloadAudio);
    document.body.removeEventListener("keydown", preloadAudio);
  };
  document.body.addEventListener("click", preloadAudio);
  document.body.addEventListener("keydown", preloadAudio);
}
