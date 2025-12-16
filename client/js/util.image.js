// util.image.js
// 处理图片的粘贴、预览、加密上传逻辑

import { $, on, createElement, addClass, removeClass } from "./util.dom.js";
// 引入新的存储工具（请确保 util.storage.js 已创建）
import {
  createThumbnail,
  generateKey,
  exportKey,
  encryptBlob,
  uploadToR2
} from "./util.storage.js";

// 简单的翻译辅助
function t(key) {
  const messages = {
    tooLarge: "Image is too large (over 10MB)",
    uploadFailed: "Image upload failed",
    processing: "Processing...",
  };
  return messages[key] || key;
}

// 创建图片预览元素
function createImagePreview(blobUrl) {
  const preview = createElement("div", {
    class: "input-image-preview processing", // 默认添加 processing 类
  });

  const img = createElement("img", {
    src: blobUrl,
    class: "input-image-preview-img",
  });

  // 添加一个加载指示器
  const loader = createElement("div", { class: "preview-loader" }, "↻");
  
  const removeBtn = createElement(
    "button",
    {
      class: "input-image-remove-btn",
      type: "button",
    },
    "×"
  );

  preview.appendChild(img);
  preview.appendChild(loader);
  preview.appendChild(removeBtn);

  return { preview, removeBtn, loader };
}

/**
 * 核心处理函数：压缩 -> 加密 -> 上传
 * @param {File} file 原始图片文件
 * @returns {Promise<Object>} 返回包含 ID 和 Key 的元数据对象
 */
export async function processAndUploadImage(file) {
  try {
    // 1. 生成缩略图 (200px 宽)
    const thumbBlob = await createThumbnail(file, 200, 0.7);

    // 2. 生成加密密钥 (AES-GCM)
    const cryptoKey = await generateKey();
    const exportedKey = await exportKey(cryptoKey); // 导出 JWK 格式以便发送给对方

    // 3. 加密 (原图 和 缩略图)
    const encryptedOriginal = await encryptBlob(file, cryptoKey);
    const encryptedThumb = await encryptBlob(thumbBlob, cryptoKey);

    // 4. 并行上传到 R2
    // 注意：这里需要你的 worker.js 支持 /api/upload 接口返回 { fileId: "..." }
    const [originalId, thumbId] = await Promise.all([
      uploadToR2(encryptedOriginal),
      uploadToR2(encryptedThumb),
    ]);

    // 5. 返回元数据
    return {
      type: "image_r2", // 标记为新版 R2 图片消息
      originalId,
      thumbId,
      key: exportedKey, // 解密密钥
      mime: file.type,
      fileName: file.name
    };
  } catch (error) {
    console.error("Image processing error:", error);
    throw error;
  }
}

/**
 * 设置图片粘贴功能
 * @param {string} inputSelector 输入框选择器
 */
export function setupImagePaste(inputSelector) {
  const input = $(inputSelector);
  if (!input) return;

  // 存储待发送的图片数据对象 (不再是 base64 字符串)
  let pendingUploads = []; 
  // 追踪正在进行的上传任务数量，用于阻止未完成时发送
  let activeUploadsCount = 0; 

  const imagePreviewContainer = createElement("div", {
    class: "image-preview-container",
  });
  input.parentNode.insertBefore(imagePreviewContainer, input);

  // 更新占位符显示状态
  function updatePlaceholderVisibility() {
    const placeholder = input.parentNode.querySelector(
      ".input-field-placeholder"
    );
    if (!placeholder) return;

    const hasText = input.innerText.trim().length > 0;
    const hasImages = pendingUploads.length > 0 || activeUploadsCount > 0;

    if (hasText || hasImages) {
      placeholder.style.opacity = "0";
      input.classList.remove("is-empty");
    } else {
      placeholder.style.opacity = "1";
      input.classList.add("is-empty");
    }
  }

  // 初始化检查
  updatePlaceholderVisibility();

  // 监听输入框事件
  on(input, "input", updatePlaceholderVisibility);
  on(input, "focus", updatePlaceholderVisibility);
  on(input, "blur", () => setTimeout(updatePlaceholderVisibility, 100));

  // 处理粘贴事件
  on(input, "paste", async function (e) {
    if (!e.clipboardData) return;

    let hasImage = false;
    for (const item of e.clipboardData.items) {
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (!file) continue;
        
        hasImage = true;
        e.preventDefault();

        if (file.size > 10 * 1024 * 1024) {
          alert(t("tooLarge"));
          continue;
        }

        // 1. 立即显示本地预览
        const localPreviewUrl = URL.createObjectURL(file);
        const { preview, removeBtn, loader } = createImagePreview(localPreviewUrl);
        imagePreviewContainer.appendChild(preview);
        
        // 增加计数，标记为“处理中”
        activeUploadsCount++;
        updatePlaceholderVisibility();

        // 绑定移除按钮事件
        const cleanup = () => {
           preview.remove();
           URL.revokeObjectURL(localPreviewUrl); // 释放内存
           updatePlaceholderVisibility();
        };

        // 如果用户在上传还没完成时就点击取消
        on(removeBtn, "click", () => {
          // 注意：这里无法中断 Promise，但我们可以从结果列表中剔除
          // 这里的逻辑稍微复杂，为了简单起见，我们只从 UI 移除
          // 并在 pendingUploads 中通过 dataUrl 匹配移除（如果已完成）
          cleanup();
          // 如果还在上传中，计数器减一
          if (preview.classList.contains("processing")) {
            activeUploadsCount--;
          } else {
            // 如果已完成，从 pendingUploads 移除
            pendingUploads = pendingUploads.filter(p => p.localUrl !== localPreviewUrl);
          }
        });

        // 2. 后台处理上传
        try {
          const metaData = await processAndUploadImage(file);
          
          // 附加本地 URL 以便后续匹配移除（如果需要）
          metaData.localUrl = localPreviewUrl;
          
          pendingUploads.push(metaData);
          
          // 移除加载状态
          removeClass(preview, "processing");
          if(loader) loader.remove();
          
        } catch (err) {
          alert(t("uploadFailed"));
          cleanup(); // 失败则移除预览
        } finally {
          activeUploadsCount--;
          updatePlaceholderVisibility();
        }
      }
    }
  });

  return {
    // 获取当前准备好发送的图片数据
    getCurrentImages: () => {
      if (activeUploadsCount > 0) {
        // 如果还有图片在上传，可以选择返回空，或者抛出提示
        // 这里返回空数组，意味着用户必须等上传完才能发送
        return []; 
      }
      return pendingUploads;
    },
    // 是否有正在上传的任务
    isUploading: () => activeUploadsCount > 0,
    // 清空图片（发送后调用）
    clearImages: () => {
      imagePreviewContainer.innerHTML = "";
      pendingUploads = [];
      activeUploadsCount = 0;
      updatePlaceholderVisibility();
    },
    refreshPlaceholder: updatePlaceholderVisibility,
  };
}

/**
 * 设置图片发送（附件按钮 / 兼容旧版调用）
 * 这里的逻辑也改为异步上传后回调
 */
export function setupImageSend({
  inputSelector,
  attachBtnSelector,
  fileInputSelector,
  onSend, // 这个回调现在接收的是 metaData 对象，而不是 base64
}) {
  const attachBtn = $(attachBtnSelector);
  const fileInput = $(fileInputSelector);

  if (fileInput) fileInput.setAttribute("accept", "image/*");

  if (attachBtn && fileInput) {
    on(attachBtn, "click", () => fileInput.click());

    on(fileInput, "change", async function () {
      if (!fileInput.files || !fileInput.files.length) return;
      const file = fileInput.files[0];

      if (!file.type.startsWith("image/")) return;

      if (file.size > 10 * 1024 * 1024) {
        alert(t("tooLarge"));
        return;
      }

      // 可选：在这里显示一个全局 loading 提示
      // window.showLoading("Encrypting & Uploading...");

      try {
        const metaData = await processAndUploadImage(file);
        
        if (typeof onSend === "function") {
          // 直接调用发送回调
          onSend(metaData);
        }
      } catch (e) {
        alert(t("uploadFailed") + ": " + e.message);
      } finally {
        // window.hideLoading();
        fileInput.value = "";
      }
    });
  }

  // 这里的 input paste 逻辑实际上被 setupImagePaste 接管了
  // 如果你需要兼容旧的单独调用，可以保留，但建议使用上面的 setupImagePaste
}