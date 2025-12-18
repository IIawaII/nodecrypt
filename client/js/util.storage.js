// util.storage.js

// 生成缩略图 (利用 Canvas)
export async function createThumbnail(file, maxWidth = 300, quality = 0.7) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width;
        let h = img.height;
        
        // 计算缩放
        if (w > maxWidth || h > maxWidth) {
          const ratio = Math.min(maxWidth / w, maxWidth / h);
          w = Math.floor(w * ratio);
          h = Math.floor(h * ratio);
        }
        
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        
        // 转换为 Blob
        canvas.toBlob((blob) => {
          resolve(blob);
        }, 'image/jpeg', quality);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// 生成视频缩略图
export async function createVideoThumbnail(file, maxWidth = 300, quality = 0.7) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    video.src = URL.createObjectURL(file);
    video.muted = true;
    video.playsInline = true;
    video.crossOrigin = "anonymous";
    
    // 当视频元数据加载完成后，尝试跳转到第 1 秒截取
    video.onloadedmetadata = () => {
      video.currentTime = 1; 
    };

    video.onseeked = () => {
      const canvas = document.createElement("canvas");
      let w = video.videoWidth;
      let h = video.videoHeight;

      // 计算缩放
      if (w > maxWidth || h > maxWidth) {
        const ratio = Math.min(maxWidth / w, maxWidth / h);
        w = Math.floor(w * ratio);
        h = Math.floor(h * ratio);
      }

      canvas.width = w;
      canvas.height = h;
      
      const ctx = canvas.getContext("2d");
      ctx.drawImage(video, 0, 0, w, h);
      
      canvas.toBlob((blob) => {
        URL.revokeObjectURL(video.src); // 释放内存
        resolve(blob);
      }, "image/jpeg", quality);
    };

    video.onerror = (e) => {
      URL.revokeObjectURL(video.src);
      reject(e);
    };
  });
}

// 生成随机密钥
export async function generateKey() {
  return await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"]
  );
}

// 导出密钥为 JWK
export async function exportKey(key) {
  return await window.crypto.subtle.exportKey("jwk", key);
}

// 导入 JWK 密钥
export async function importKey(jwk) {
  return await window.crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "AES-GCM" },
    true,
    ["encrypt", "decrypt"]
  );
}

// 加密 Blob
export async function encryptBlob(blob, key) {
  const iv = window.crypto.getRandomValues(new Uint8Array(12));
  const buffer = await blob.arrayBuffer();
  
  const encryptedBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    key,
    buffer
  );

  // 将 IV 和 密文 拼接在一起
  const combined = new Uint8Array(iv.length + encryptedBuffer.byteLength);
  combined.set(iv);
  combined.set(new Uint8Array(encryptedBuffer), iv.length);
  
  return new Blob([combined]);
}

// 解密 Blob
export async function decryptBlob(encryptedBlob, key, mimeType = "application/octet-stream") {
  const buffer = await encryptedBlob.arrayBuffer();
  const arr = new Uint8Array(buffer);
  
  // 提取 IV
  const iv = arr.slice(0, 12);
  // 提取密文
  const data = arr.slice(12);
  
  const decryptedBuffer = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv },
    key,
    data
  );
  
  return new Blob([decryptedBuffer], { type: mimeType });
}

// 上传到 Worker/R2
export async function uploadToR2(blob) {
  const res = await fetch('/api/upload', {
    method: 'PUT',
    body: blob
  });
  if (!res.ok) throw new Error('Upload failed');
  const json = await res.json();
  return json.fileId;
}