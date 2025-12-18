// util.video.js
import { $, on, createElement, removeClass } from "./util.dom.js";
import {
  createVideoThumbnail, 
  generateKey,
  exportKey,
  encryptBlob,
  uploadToR2
} from "./util.storage.js";

// === 新增：本地视频播放模态框 ===
function playLocalVideo(file) {
  const url = URL.createObjectURL(file);
  
  const modal = createElement(
    "div",
    { class: "img-modal-bg" },
    `<div class="img-modal-blur"></div>
     <div class="img-modal-content" style="width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; background: transparent;">
        <video controls autoplay class="img-modal-vid" style="max-width: 90%; max-height: 90vh; box-shadow: 0 4px 20px rgba(0,0,0,0.5); border-radius: 8px; background: black;">
          <source src="${url}" type="${file.type}">
          Your browser does not support the video tag.
        </video>
        <span class="img-modal-close" style="position: absolute; top: 20px; right: 20px; color: white; font-size: 40px; cursor: pointer;">&times;</span>
     </div>`
  );
  
  document.body.appendChild(modal);

  const video = modal.querySelector('video');
  const closeBtn = modal.querySelector('.img-modal-close');
  const blur = modal.querySelector('.img-modal-blur');

  const cleanup = () => {
    URL.revokeObjectURL(url); // 释放内存
    modal.remove();
  };

  on(closeBtn, "click", cleanup);
  on(blur, "click", cleanup);
  // 点击视频区域外也关闭
  on(modal, "click", (e) => {
    if (e.target === modal) cleanup();
  });
}

// 创建视频发送时的预览（显示封面图 + 播放按钮）
function createVideoPreview(file, blobUrl) {
  const preview = createElement("div", {
    class: "input-image-preview processing",
    style: "cursor: pointer; position: relative;"
  });

  // 使用 video 标签显示第一帧作为封面
  const video = createElement("video", {
    src: blobUrl,
    class: "input-image-preview-img", 
    muted: true,
    preload: "metadata",
    style: "object-fit: cover;" // 保持填充
  });

  // 添加一个播放图标遮罩，提示用户可以点击
  const playOverlay = createElement("div", {
    style: "position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 24px; text-shadow: 0 1px 3px rgba(0,0,0,0.8); pointer-events: none;"
  }, "▶");

  const loader = createElement("div", { class: "preview-loader" }, "↻");
  
  const removeBtn = createElement(
    "button",
    {
      class: "input-image-remove-btn",
      type: "button",
    },
    "×"
  );

  preview.appendChild(video);
  preview.appendChild(playOverlay); // 添加播放图标
  preview.appendChild(loader);
  preview.appendChild(removeBtn);

  // === 关键：点击预览图播放完整视频 ===
  on(preview, "click", (e) => {
    // 如果点击的是删除按钮，不播放
    if (e.target === removeBtn) return;
    playLocalVideo(file);
  });

  return { preview, removeBtn, loader };
}

/**
 * 核心处理：生成封面 -> 加密视频 -> 加密封面 -> 上传
 */
export async function processAndUploadVideo(file) {
  try {
    // 1. 生成缩略图
    const thumbBlob = await createVideoThumbnail(file, 300, 0.7);

    // 2. 生成密钥
    const cryptoKey = await generateKey();
    const exportedKey = await exportKey(cryptoKey);

    // 3. 加密 (视频本身 + 缩略图)
    const encryptedVideo = await encryptBlob(file, cryptoKey);
    const encryptedThumb = await encryptBlob(thumbBlob, cryptoKey);

    // 4. 上传
    const [originalId, thumbId] = await Promise.all([
      uploadToR2(encryptedVideo),
      uploadToR2(encryptedThumb),
    ]);

    return {
      type: "video_r2",
      originalId,
      thumbId,
      key: exportedKey,
      mime: file.type,
      fileName: file.name
    };
  } catch (error) {
    console.error("Video processing error:", error);
    throw error;
  }
}

// 供外部调用，处理文件选择后的逻辑
export async function handleVideoSelection(file, container) {
   // 1. 创建本地预览
   const localUrl = URL.createObjectURL(file);
   const { preview, removeBtn, loader } = createVideoPreview(file, localUrl);
   
   if (container) {
       container.appendChild(preview);
   }

   // 2. 开始上传处理
   try {
       const meta = await processAndUploadVideo(file);
       // 上传完成，移除 loader
       if (loader) loader.remove();
       removeClass(preview, "processing");
       
       // 返回元数据用于发送
       return { meta, previewElement: preview, localUrl };
   } catch (e) {
       if (loader) loader.innerText = "!";
       alert("Video upload failed");
       throw e;
   }
}