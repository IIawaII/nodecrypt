// chat.js
// 聊天区域渲染与交互逻辑

import { createAvatarSVG } from "./util.avatar.js";
import { roomsData, activeRoomIndex } from "./room.js";
import { escapeHTML, textToHTML } from "./util.string.js";
import {
  $,
  $id,
  createElement,
  on,
  off,
  addClass,
  removeClass,
} from "./util.dom.js";
import { formatFileSize } from "./util.file.js";
import { t } from "./util.i18n.js";
// === 新增：导入解密工具 ===
import { importKey, decryptBlob } from "./util.storage.js";

// === 辅助函数：加载并解密 R2 图片 ===
// 用于将加密的远程图片加载到 img 元素中
async function loadEncryptedImage(fileId, keyJwk, imgElement) {
  try {
    // 1. 获取加密的二进制数据
    const res = await fetch(`/api/image/${fileId}`);
    if (!res.ok) throw new Error("Image load failed");
    const encryptedBlob = await res.blob();

    // 2. 导入解密密钥
    const key = await importKey(keyJwk);

    // 3. 解密
    const decryptedBlob = await decryptBlob(encryptedBlob, key);

    // 4. 生成 Blob URL 并显示
    const url = URL.createObjectURL(decryptedBlob);
    imgElement.src = url;
    
    // 加载完成后移除 loading 样式（如果需要）
    imgElement.classList.remove("loading");
    
    // 返回 blob 以便后续使用（例如查看大图时复用，虽然通常会重新下载原图）
    return decryptedBlob;
  } catch (error) {
    console.error("Failed to load encrypted image:", error);
    imgElement.alt = "Image Load Failed";
    imgElement.src = ""; // 或者显示一个破损图片的图标
    imgElement.classList.add("load-error");
  }
}

// 渲染聊天区域
export function renderChatArea() {
  const chatArea = $id("chat-area");
  if (!chatArea) return;
  if (activeRoomIndex < 0 || !roomsData[activeRoomIndex]) {
    chatArea.innerHTML = "";
    return;
  }
  chatArea.innerHTML = "";
  roomsData[activeRoomIndex].messages.forEach((m) => {
    if (m.type === "me") addMsg(m.text, true, m.msgType || "text", m.timestamp);
    else if (m.type === "system") addSystemMsg(m.text, true, m.timestamp);
    else
      addOtherMsg(
        m.text,
        m.userName,
        m.avatar,
        true,
        m.msgType || "text",
        m.timestamp
      );
  });
}

// 添加消息到聊天区域 (自己发送的消息)
export function addMsg(
  text,
  isHistory = false,
  msgType = "text",
  timestamp = null
) {
  let ts = isHistory ? timestamp : timestamp || Date.now();
  if (!ts) return;
  if (!isHistory && activeRoomIndex >= 0) {
    roomsData[activeRoomIndex].messages.push({
      type: "me",
      text,
      msgType,
      timestamp: ts,
    });
  }
  const chatArea = $id("chat-area");
  if (!chatArea) return;
  let className =
    "bubble me" + (msgType.includes("_private") ? " private-message" : "");
  const date = new Date(ts);
  const time =
    date.getHours().toString().padStart(2, "0") +
    ":" +
    date.getMinutes().toString().padStart(2, "0");
  
  let contentHtml = "";

  // === 处理新版 R2 加密图片消息 ===
  if (msgType === "image_r2" || msgType === "image_r2_private") {
    // text 是一个对象: { originalId, thumbId, key, text, mime, ... }
    const data = text; 
    const messageText = data.text ? `<div class="message-text">${textToHTML(data.text)}</div>` : "";
    
    // 生成唯一 ID 用于异步查找元素
    const imgId = `r2-img-${Math.random().toString(36).substr(2, 9)}`;
    
    contentHtml = `
      <div class="r2-image-container">
        ${messageText}
        <div class="bubble-img-wrapper" style="min-height: 100px; min-width: 100px; position: relative;">
           <img id="${imgId}" class="bubble-img loading" alt="Loading..." style="opacity: 0.5; transition: opacity 0.3s;" />
           <div class="img-loader"></div>
        </div>
      </div>
    `;

    // 异步加载图片
    setTimeout(() => {
      const imgEl = document.getElementById(imgId);
      if (imgEl) {
        // 1. 加载并解密缩略图
        loadEncryptedImage(data.thumbId, data.key, imgEl).then(() => {
             imgEl.style.opacity = "1";
             // 移除 loader (需要 CSS 支持，或者直接通过 JS 移除 sibling)
             const loader = imgEl.parentNode.querySelector('.img-loader');
             if(loader) loader.remove();
        });

        // 2. 绑定点击事件：查看原图
        imgEl.style.cursor = "pointer";
        imgEl.onclick = () => {
          showR2ImageModal(data.originalId, data.key);
        };
      }
    }, 0);

  } 
  // === 处理旧版 Base64 图片消息 (保持兼容) ===
  else if (msgType === "image" || msgType === "image_private") {
    if (typeof text === "object" && text.images && Array.isArray(text.images)) {
      // 多图格式
      const messageText = text.text ? textToHTML(text.text) : "";
      const imageElements = text.images
        .map((imgData) => {
          const safeImgSrc = escapeHTML(imgData).replace(/javascript:/gi, "");
          return `<img src="${safeImgSrc}" alt="image" class="bubble-img">`;
        })
        .join("");
      if (messageText && imageElements) {
        contentHtml = `<div class="mixed-content"><div class="message-text">${messageText}</div>${imageElements}</div>`;
      } else {
        contentHtml = imageElements || messageText;
      }
    } else if (typeof text === "object" && text.image) {
      // 单图对象格式
      const safeImgSrc = escapeHTML(text.image).replace(/javascript:/gi, "");
      const messageText = text.text ? textToHTML(text.text) : "";
      if (messageText) {
        contentHtml = `<div class="mixed-content"><div class="message-text">${messageText}</div><img src="${safeImgSrc}" alt="image" class="bubble-img"></div>`;
      } else {
        contentHtml = `<img src="${safeImgSrc}" alt="image" class="bubble-img">`;
      }
    } else {
      // 纯 Base64 字符串格式
      const safeImgSrc = escapeHTML(text).replace(/javascript:/gi, "");
      contentHtml = `<img src="${safeImgSrc}" alt="image" class="bubble-img">`;
    }
  } 
  // === 处理文件消息 ===
  else if (msgType === "file" || msgType === "file_private") {
    contentHtml = renderFileMessage(text, true);
    className += " file-bubble";
  } 
  // === 普通文本消息 ===
  else {
    contentHtml = textToHTML(text);
  }

  const div = createElement(
    "div",
    {
      class: className,
    },
    `<span class="bubble-content">${contentHtml}</span><span class="bubble-meta">${time}</span>`
  );
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// 添加来自其他用户的消息
export function addOtherMsg(
  msg,
  userName = "",
  avatar = "",
  isHistory = false,
  msgType = "text",
  timestamp = null
) {
  if (!userName && activeRoomIndex >= 0) {
    const rd = roomsData[activeRoomIndex];
    if (msg && msg.userName) {
      userName = msg.userName;
    } else if (rd && msg && msg.clientId && rd.userMap[msg.clientId]) {
      userName =
        rd.userMap[msg.clientId].userName ||
        rd.userMap[msg.clientId].username ||
        rd.userMap[msg.clientId].name ||
        t("ui.anonymous", "Anonymous");
    }
  }
  userName = userName || t("ui.anonymous", "Anonymous");
  let ts = isHistory ? timestamp : timestamp || Date.now();
  if (!ts) return;
  const chatArea = $id("chat-area");
  if (!chatArea) return;
  
  const bubbleWrap = createElement("div", {
    class: "bubble-other-wrap",
  });
  
  let contentHtml = "";

  // === 处理新版 R2 加密图片消息 (他人) ===
  if (msgType === "image_r2" || msgType === "image_r2_private") {
    const data = msg;
    const messageText = data.text ? `<div class="message-text">${textToHTML(data.text)}</div>` : "";
    
    const imgId = `r2-img-other-${Math.random().toString(36).substr(2, 9)}`;
    
    contentHtml = `
      <div class="r2-image-container">
        ${messageText}
        <div class="bubble-img-wrapper" style="min-height: 100px; min-width: 100px; position: relative;">
           <img id="${imgId}" class="bubble-img loading" alt="Loading..." style="opacity: 0.5; transition: opacity 0.3s;" />
           <div class="img-loader"></div>
        </div>
      </div>
    `;

    // 异步加载
    setTimeout(() => {
      const imgEl = document.getElementById(imgId);
      if (imgEl) {
        // 加载缩略图
        loadEncryptedImage(data.thumbId, data.key, imgEl).then(() => {
             imgEl.style.opacity = "1";
             const loader = imgEl.parentNode.querySelector('.img-loader');
             if(loader) loader.remove();
        });
        
        // 点击查看原图
        imgEl.style.cursor = "pointer";
        imgEl.onclick = () => {
          showR2ImageModal(data.originalId, data.key);
        };
      }
    }, 0);
  }
  // === 处理旧版 Base64 图片 (兼容) ===
  else if (msgType === "image" || msgType === "image_private") {
    if (typeof msg === "object" && msg.images && Array.isArray(msg.images)) {
      const messageText = msg.text ? textToHTML(msg.text) : "";
      const imageElements = msg.images
        .map((imgData) => {
          const safeImgSrc = escapeHTML(imgData).replace(/javascript:/gi, "");
          return `<img src="${safeImgSrc}" alt="image" class="bubble-img">`;
        })
        .join("");
      if (messageText && imageElements) {
        contentHtml = `<div class="mixed-content"><div class="message-text">${messageText}</div>${imageElements}</div>`;
      } else {
        contentHtml = imageElements || messageText;
      }
    } else if (typeof msg === "object" && msg.image) {
      const safeImgSrc = escapeHTML(msg.image).replace(/javascript:/gi, "");
      const messageText = msg.text ? textToHTML(msg.text) : "";

      if (messageText) {
        contentHtml = `<div class="mixed-content"><div class="message-text">${messageText}</div><img src="${safeImgSrc}" alt="image" class="bubble-img"></div>`;
      } else {
        contentHtml = `<img src="${safeImgSrc}" alt="image" class="bubble-img">`;
      }
    } else {
      const safeImgSrc = escapeHTML(msg).replace(/javascript:/gi, "");
      contentHtml = `<img src="${safeImgSrc}" alt="image" class="bubble-img">`;
    }
  } 
  // === 处理文件消息 ===
  else if (msgType === "file" || msgType === "file_private") {
    contentHtml = renderFileMessage(msg, false);
  } 
  // === 普通文本 ===
  else {
    contentHtml = textToHTML(msg);
  }

  const safeUserName = escapeHTML(userName);
  const date = new Date(ts);
  const time =
    date.getHours().toString().padStart(2, "0") +
    ":" +
    date.getMinutes().toString().padStart(2, "0");
  let bubbleClasses = "bubble other";
  if (msgType && msgType.includes("_private")) {
    bubbleClasses += " private-message";
  }
  if (msgType === "file" || msgType === "file_private") {
    bubbleClasses += " file-bubble";
  }
  bubbleWrap.innerHTML = `<span class="avatar"></span><div class="bubble-other-main"><div class="${bubbleClasses}"><div class="bubble-other-name">${safeUserName}</div><span class="bubble-content">${contentHtml}</span><span class="bubble-meta">${time}</span></div></div>`;
  const svg = createAvatarSVG(userName);
  const avatarEl = $(".avatar", bubbleWrap);
  if (avatarEl) {
    const cleanSvg = svg.replace(
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      ""
    );
    avatarEl.innerHTML = cleanSvg;
  }
  chatArea.appendChild(bubbleWrap);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// 添加系统消息
export function addSystemMsg(text, isHistory = false, timestamp = null) {
  if (!isHistory && activeRoomIndex >= 0) {
    const ts = timestamp || Date.now();
    roomsData[activeRoomIndex].messages.push({
      type: "system",
      text,
      timestamp: ts,
    });
  }
  const chatArea = $id("chat-area");
  if (!chatArea) return;
  const safeText = textToHTML(text);
  const div = createElement(
    "div",
    {
      class: "bubble system",
    },
    `<span class="bubble-content">${safeText}</span>`
  );
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// 更新输入框样式 (私聊/群聊)
export function updateChatInputStyle() {
  const rd = roomsData[activeRoomIndex];
  const chatInputArea = $(".chat-input-area");
  const placeholder = $(".input-field-placeholder");
  const inputMessageInput = $(".input-message-input");
  if (!chatInputArea || !placeholder || !inputMessageInput) return;
  if (rd && rd.privateChatTargetId) {
    addClass(chatInputArea, "private-mode");
    addClass(inputMessageInput, "private-mode");
    placeholder.textContent = `${t(
      "ui.private_message_to",
      "Private Message to"
    )} ${escapeHTML(rd.privateChatTargetName)}`;
  } else {
    removeClass(chatInputArea, "private-mode");
    removeClass(inputMessageInput, "private-mode");
    placeholder.textContent = t("ui.message", "Message");
  }
  const html = inputMessageInput.innerHTML
    .replace(/<br\s*\/?>(\s*)?/gi, "")
    .replace(/&nbsp;/g, "")
    .replace(/\u200B/g, "")
    .trim();
  placeholder.style.opacity = html === "" ? "1" : "0";
}

// 设置图片预览功能 (用于旧版 Base64 图片)
export function setupImagePreview() {
  on($id("chat-area"), "click", function (e) {
    const target = e.target;
    if (target.tagName === "IMG" && target.closest(".bubble-content")) {
      // 只有非 R2 图片才通过这里处理
      // R2 图片已经绑定了自己的 onclick 事件
      if (!target.id || !target.id.startsWith('r2-img')) {
          showImageModal(target.src);
      }
    }
  });
}

// === 新增：显示 R2 加密原图的模态框 ===
export function showR2ImageModal(fileId, keyJwk) {
  // 创建模态框结构
  const modal = createElement(
    "div",
    { class: "img-modal-bg" },
    `<div class="img-modal-blur"></div>
     <div class="img-modal-content img-modal-content-overflow">
        <div class="modal-loading-indicator" style="color:white; font-size: 20px;">Loading Original...</div>
        <img class="img-modal-img" style="display:none;" />
        <span class="img-modal-close">&times;</span>
     </div>`
  );
  document.body.appendChild(modal);
  
  const img = $("img", modal);
  const loading = $(".modal-loading-indicator", modal);
  
  // 绑定关闭事件
  const cleanup = () => { 
      // 释放 URL 对象（如果已创建）
      if (img.src && img.src.startsWith('blob:')) {
          URL.revokeObjectURL(img.src);
      }
      modal.remove(); 
  };
  on($(".img-modal-close", modal), "click", cleanup);
  on(modal, "click", (e) => {
    if (e.target === modal) cleanup();
  });

  // 开始下载并解密原图
  loadEncryptedImage(fileId, keyJwk, img).then(() => {
     if (loading) loading.style.display = 'none';
     img.style.display = 'block';
  });

  // 添加缩放逻辑 (复用 showImageModal 的逻辑)
  setupImageZoom(img, modal);
}

// 显示图片模态框 (旧版，用于 Base64 图片)
export function showImageModal(src) {
  const modal = createElement(
    "div",
    {
      class: "img-modal-bg",
    },
    `<div class="img-modal-blur"></div><div class="img-modal-content img-modal-content-overflow"><img src="${src}"class="img-modal-img"/><span class="img-modal-close">&times;</span></div>`
  );
  document.body.appendChild(modal);
  on($(".img-modal-close", modal), "click", () => modal.remove());
  on(modal, "click", (e) => {
    if (e.target === modal) modal.remove();
  });
  const img = $("img", modal);
  setupImageZoom(img, modal);
}

// 抽离出的图片缩放逻辑
function setupImageZoom(img, modal) {
  let scale = 1;
  let isDragging = false;
  let lastX = 0, lastY = 0;
  let offsetX = 0, offsetY = 0;
  
  img.ondragstart = function (e) { e.preventDefault(); };
  
  on(img, "wheel", function (ev) {
    ev.preventDefault();
    scale += ev.deltaY < 0 ? 0.1 : -0.1;
    scale = Math.max(0.2, Math.min(5, scale));
    if (scale === 1) { offsetX = 0; offsetY = 0; }
    updateTransform();
  });

  function updateTransform() {
    img.style.transform = `translate(${offsetX}px,${offsetY}px)scale(${scale})`;
    img.style.cursor = scale > 1 ? (isDragging ? "grabbing" : "grab") : "zoom-in";
  }
  
  on(img, "mousedown", function (ev) {
    if (scale <= 1) return;
    isDragging = true;
    lastX = ev.clientX;
    lastY = ev.clientY;
    img.style.cursor = "grabbing";
    document.body.style.userSelect = "none";
  });

  function onMouseMove(ev) {
    if (!isDragging) return;
    offsetX += ev.clientX - lastX;
    offsetY += ev.clientY - lastY;
    lastX = ev.clientX;
    lastY = ev.clientY;
    updateTransform();
  }

  function onMouseUp() {
    if (isDragging) {
      isDragging = false;
      img.style.cursor = "grab";
      document.body.style.userSelect = "";
    }
  }
  
  on(window, "mousemove", onMouseMove);
  on(window, "mouseup", onMouseUp);
  on(img, "dblclick", function () {
    scale = 1; offsetX = 0; offsetY = 0; updateTransform();
  });
  
  const cleanup = () => {
    off(window, "mousemove", onMouseMove);
    off(window, "mouseup", onMouseUp);
    document.body.style.userSelect = "";
  };
  on(modal, "remove", cleanup);
  updateTransform();
}

// 渲染文件消息内容
function renderFileMessage(fileData, isSender) {
  const { fileId, fileName, originalSize, totalVolumes, fileCount, isArchive } =
    fileData;

  let displayName, displayMeta;
  if (isArchive && fileCount) {
    displayName = `${fileCount}${t("file.files", " files")}`;
    displayMeta = `${t("file.total", "Total")}: ${formatFileSize(originalSize)}`;
  } else {
    displayName = fileName;
    displayMeta = formatFileSize(originalSize);
  }

  const safeDisplayName = escapeHTML(displayName);

  const transfer = window.fileTransfers ? window.fileTransfers.get(fileId) : null;
  let statusText = "";
  let progressWidth = "0%";
  let downloadBtnStyle = "display: none;";
  let showProgress = false;

  if (transfer) {
    if (transfer.status === "sending") {
      const progress = (transfer.sentVolumes / transfer.totalVolumes) * 100;
      progressWidth = `${progress}%`;
      statusText = `Sending ${transfer.sentVolumes}/${transfer.totalVolumes}`;
      showProgress = true;
    } else if (transfer.status === "receiving") {
      const progress = (transfer.receivedVolumes.size / transfer.totalVolumes) * 100;
      progressWidth = `${progress}%`;
      statusText = `Receiving ${transfer.receivedVolumes.size}/${transfer.totalVolumes}`;
      showProgress = true;
    } else if (transfer.status === "completed") {
      downloadBtnStyle = isSender ? "display: none;" : "display: flex;";
    }
  } else if (isSender) {
    downloadBtnStyle = "display: none;";
  } else {
    downloadBtnStyle = "display: flex;";
  }
  const fileIcon = isArchive ? "📦" : "📄";

  return `
		<div class="file-message" data-file-id="${fileId}">
			<div class="file-main-content">
				<div class="file-info">
					<div class="file-icon">${fileIcon}</div>
					<div class="file-details">
						<div class="file-name" title="${safeDisplayName}">${safeDisplayName}</div>
						<div class="file-meta">${displayMeta}</div>
					</div>
				</div>
				<button class="file-download-btn show" style="${downloadBtnStyle}" onclick="window.downloadFile('${fileId}')">
					<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path fill-rule="evenodd" clip-rule="evenodd" d="M8 10C8 7.79086 9.79086 6 12 6C14.2091 6 16 7.79086 16 10V11H17C18.933 11 20.5 12.567 20.5 14.5C20.5 16.433 18.933 18 17 18H16.9C16.3477 18 15.9 18.4477 15.9 19C15.9 19.5523 16.3477 20 16.9 20H17C20.0376 20 22.5 17.5376 22.5 14.5C22.5 11.7793 20.5245 9.51997 17.9296 9.07824C17.4862 6.20213 15.0003 4 12 4C8.99974 4 6.51381 6.20213 6.07036 9.07824C3.47551 9.51997 1.5 11.7793 1.5 14.5C1.5 17.5376 3.96243 20 7 20H7.1C7.65228 20 8.1 19.5523 8.1 19C8.1 18.4477 7.65228 18 7.1 18H7C5.067 18 3.5 16.433 3.5 14.5C3.5 12.567 5.067 11 7 11H8V10ZM13 11C13 10.4477 12.5523 10 12 10C11.4477 10 11 10.4477 11 11V16.5858L9.70711 15.2929C9.31658 14.9024 8.68342 14.9024 8.29289 15.2929C7.90237 15.6834 7.90237 16.3166 8.29289 16.7071L11.2929 19.7071C11.6834 20.0976 12.3166 20.0976 12.7071 19.7071L15.7071 16.7071C16.0976 16.3166 16.0976 15.6834 15.7071 15.2929C15.3166 14.9024 14.6834 14.9024 14.2929 15.2929L13 16.5858V11Z" fill="currentColor"></path></g></svg>
				</button>
			</div>
			${
        showProgress
          ? `<div class="file-progress-container">
				<div class="file-progress-bar">
					<div class="file-progress" style="width: ${progressWidth}"></div>
				</div>
				<div class="file-status">${statusText}</div>
			</div>`
          : ""
      }
		</div>
	`;
}

export function autoGrowInput() {
  const input = $(".input-message-input");
  if (!input) return;
  input.style.height = "auto";
  input.style.height = input.scrollHeight + "px";
}

function handlePasteAsPlainText(element) {
  if (!element) return;
  on(element, "paste", function (e) {
    e.preventDefault();
    let text = "";
    if (e.clipboardData || window.clipboardData) {
      text = (e.clipboardData || window.clipboardData).getData("text/plain");
    }
    if (document.queryCommandSupported("insertText")) {
      document.execCommand("insertText", false, text);
    } else {
      const selection = window.getSelection();
      if (selection.rangeCount) {
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const textNode = document.createTextNode(text);
        range.insertNode(textNode);
        range.setStartAfter(textNode);
        range.setEndAfter(textNode);
        selection.removeAllRanges();
        selection.addRange(range);
      }
    }
  });
}

export function setupInputPlaceholder() {
  const input = $(".input-message-input");
  const placeholder = $(".input-field-placeholder");
  if (!input || !placeholder) return;

  function checkEmpty() {
    const html = input.innerHTML
      .replace(/<br\s*\/?>(\s*)?/gi, "")
      .replace(/&nbsp;/g, "")
      .replace(/\u200B/g, "")
      .trim();
    if (html === "") {
      placeholder.style.opacity = "1";
    } else {
      placeholder.style.opacity = "0";
    }
    autoGrowInput();
  }
  on(input, "input", checkEmpty);
  on(input, "blur", checkEmpty);
  on(input, "focus", checkEmpty);
  handlePasteAsPlainText(input);
  checkEmpty();
  autoGrowInput();
  updateChatInputStyle();
}