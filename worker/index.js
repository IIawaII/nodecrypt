import {
  generateClientId,
  encryptMessage,
  decryptMessage,
  logEvent,
  isString,
  isObject,
  getTime,
} from "./utils.js";

// 登录页面 HTML
function getLoginPage(errorMsg = "") {
  return `
  <!DOCTYPE html>
  <html lang="zh-CN">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>系统访问保护</title>
    <style>
      :root { --primary: #2563eb; --bg: #f8fafc; --card: #ffffff; --text: #1e293b; }
      body {
        margin: 0; padding: 0;
        display: flex; justify-content: center; align-items: center;
        min-height: 100vh; background-color: var(--bg);
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      }
      .login-card {
        background: var(--card);
        padding: 2.5rem;
        border-radius: 16px;
        box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1);
        width: 100%; max-width: 360px;
        text-align: center;
      }
      h2 { margin-bottom: 1.5rem; color: var(--text); font-weight: 700; }
      .input-group { margin-bottom: 1rem; text-align: left; }
      label { display: block; font-size: 0.875rem; font-weight: 500; color: #64748b; margin-bottom: 0.5rem; }
      input {
        width: 100%; padding: 0.75rem; border: 1px solid #e2e8f0; border-radius: 8px;
        font-size: 1rem; outline: none; transition: all 0.2s; box-sizing: border-box;
      }
      input:focus { border-color: var(--primary); box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1); }
      button {
        width: 100%; padding: 0.875rem;
        background-color: var(--primary); color: white;
        border: none; border-radius: 8px; font-weight: 600; font-size: 1rem;
        cursor: pointer; transition: background 0.2s; margin-top: 1rem;
      }
      button:hover { background-color: #1d4ed8; }
      .error { color: #ef4444; font-size: 0.875rem; margin-bottom: 1rem; min-height: 1.25em; }
    </style>
  </head>
  <body>
    <div class="login-card">
      <h2>🔒 访问验证</h2>
      <div id="error-msg" class="error">${errorMsg}</div>
      <form id="loginForm">
        <div class="input-group">
          <label>用户名</label>
          <input type="text" id="username" required autocomplete="username">
        </div>
        <div class="input-group">
          <label>密码</label>
          <input type="password" id="password" required autocomplete="current-password">
        </div>
        <button type="submit">进入系统</button>
      </form>
    </div>
    <script>
      document.getElementById('loginForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const u = document.getElementById('username').value;
        const p = document.getElementById('password').value;
        const btn = e.target.querySelector('button');
        
        // 简单的输入检查
        if(!u || !p) return;

        btn.disabled = true;
        btn.innerText = "验证中...";

        // 构造 Basic Auth 字符串
        const credentials = btoa(u + ":" + p);
        
        // 设置 Cookie，有效期 7 天
        const d = new Date();
        d.setTime(d.getTime() + (7*24*60*60*1000));
        document.cookie = "auth_token=" + credentials + ";expires="+ d.toUTCString() + ";path=/;SameSite=Strict";

        // 刷新页面，让服务器读取 Cookie
        location.reload();
      });
    </script>
  </body>
  </html>
  `;
}

async function sha256Hex(str) {
  const encoder = new TextEncoder();
  const data = encoder.encode(str);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// 验证函数
async function checkAuth(request, env) {
  const expectedUsername = env.AUTH_USERNAME;
  const storedHash = env.AUTH_PASSWORD_HASH;

  // 尝试获取 Header 中的认证信息
  let auth = request.headers.get("Authorization");
  let isFromCookie = false;

  // 如果 Header 没有，尝试从 Cookie 获取
  if (!auth) {
    const cookieHeader = request.headers.get("Cookie");
    if (cookieHeader) {
      const cookies = cookieHeader.split(";").reduce((acc, cookie) => {
        const [name, value] = cookie.trim().split("=");
        acc[name] = value;
        return acc;
      }, {});

      if (cookies["auth_token"]) {
        auth = "Basic " + cookies["auth_token"];
        isFromCookie = true;
      }
    }
  }

  // 如果完全没有凭证，返回 HTML 登录页
  if (!auth || !auth.startsWith("Basic ")) {
    return new Response(getLoginPage(), {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }

  try {
    const decoded = atob(auth.slice(6));
    const parts = decoded.split(":");

    if (parts.length < 2) {
      return new Response(getLoginPage("无效的凭证格式"), {
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    }

    const username = parts[0] || "";
    const password = parts.slice(1).join(":");

    // 验证逻辑
    let isValid = true;
    let errorMsg = "";

    if (username !== expectedUsername) {
      isValid = false;
      errorMsg = "用户名错误";
      console.log(`Auth failed: user mismatch (${username})`);
    } else {
      const passwordHash = await sha256Hex(password);
      if (passwordHash !== storedHash) {
        isValid = false;
        errorMsg = "密码错误";
        console.log(`Auth failed: hash mismatch`);
      }
    }

    // 验证失败处理
    if (!isValid) {
      return new Response(getLoginPage(errorMsg), {
        status: 401,
        headers: {
          "Content-Type": "text/html; charset=utf-8",
          "Set-Cookie":
            "auth_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;",
        },
      });
    }

    console.log(`Authentication successful for user: ${username}`);
    return null; // 通过验证
  } catch (error) {
    console.error("Authentication error:", error);
    return new Response(getLoginPage("服务器内部验证错误"), {
      status: 500,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
}

export default {
  async fetch(request, env, ctx) {
    // === 插入用户名和密码保护：所有路径都必须验证 ===
    const authFail = await checkAuth(request, env);
    if (authFail) return authFail;
    // ==========================================

    const url = new URL(request.url);

    // 处理WebSocket请求
    const upgradeHeader = request.headers.get("Upgrade");
    if (upgradeHeader && upgradeHeader === "websocket") {
      const id = env.CHAT_ROOM.idFromName("chat-room");
      const stub = env.CHAT_ROOM.get(id);
      return stub.fetch(request);
    }

    // 处理API请求
    if (url.pathname.startsWith("/api/")) {
      //================================================================================================================
      // 1. 上传接口 (PUT)
      // 客户端上传加密后的二进制数据
      if (url.pathname === "/api/upload" && request.method === "PUT") {
        try {
          const fileId = crypto.randomUUID();
          // 获取请求体（加密后的二进制流）
          const body = request.body;
          // 存入 R2
          await env.IMAGE_BUCKET.put(fileId, body);
          
          return new Response(JSON.stringify({ ok: true, fileId: fileId }), {
            headers: { "Content-Type": "application/json" }
          });
        } catch (e) {
          return new Response(JSON.stringify({ ok: false, error: e.message }), { status: 500 });
        }
      }

      // 2. 下载接口 (GET)
      // 获取加密的文件数据
      if (url.pathname.startsWith("/api/image/")) {
        const fileId = url.pathname.replace("/api/image/", "");
        const object = await env.IMAGE_BUCKET.get(fileId);

        if (object === null) {
          return new Response("Not Found", { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set("etag", object.httpEtag);
        // 强缓存，因为文件ID是唯一的且内容不可变
        headers.set("Cache-Control", "public, max-age=31536000"); 

        return new Response(object.body, { headers });
      }
      //================================================================================================================
      // ...API 逻辑...
      return new Response(JSON.stringify({ ok: true }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    // 其余全部交给 ASSETS 处理（自动支持 hash 文件名和 SPA fallback）
    return env.ASSETS.fetch(request);
  },
};

// ChatRoom 类保持不变...
export class ChatRoom {
  constructor(state, env) {
    this.state = state;

    // Use objects like original server.js instead of Maps
    this.clients = {};
    this.channels = {};

    this.config = {
      seenTimeout: 60000,
      debug: false,
    };

    // Initialize RSA key pair
    this.initRSAKeyPair();
  }

  async initRSAKeyPair() {
    try {
      let stored = await this.state.storage.get("rsaKeyPair");
      if (!stored) {
        console.log("Generating new RSA keypair...");
        const keyPair = await crypto.subtle.generateKey(
          {
            name: "RSASSA-PKCS1-v1_5",
            modulusLength: 2048,
            publicExponent: new Uint8Array([1, 0, 1]),
            hash: "SHA-256",
          },
          true,
          ["sign", "verify"]
        );

        // 并行导出公钥和私钥以提高性能
        const [publicKeyBuffer, privateKeyBuffer] = await Promise.all([
          crypto.subtle.exportKey("spki", keyPair.publicKey),
          crypto.subtle.exportKey("pkcs8", keyPair.privateKey),
        ]);

        stored = {
          rsaPublic: btoa(
            String.fromCharCode(...new Uint8Array(publicKeyBuffer))
          ),
          rsaPrivateData: Array.from(new Uint8Array(privateKeyBuffer)),
          createdAt: Date.now(), // 记录密钥创建时间，用于后续判断是否需要轮换
        };

        await this.state.storage.put("rsaKeyPair", stored);
        console.log("RSA key pair generated and stored");
      }

      // Reconstruct the private key
      if (stored.rsaPrivateData) {
        const privateKeyBuffer = new Uint8Array(stored.rsaPrivateData);

        stored.rsaPrivate = await crypto.subtle.importKey(
          "pkcs8",
          privateKeyBuffer,
          {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
          },
          false,
          ["sign"]
        );
      }
      this.keyPair = stored;

      // 检查密钥是否需要轮换（如果已创建超过24小时）
      if (
        stored.createdAt &&
        Date.now() - stored.createdAt > 24 * 60 * 60 * 1000
      ) {
        // 如果没有任何客户端，则执行密钥轮换
        if (Object.keys(this.clients).length === 0) {
          console.log("密钥已使用24小时，进行轮换...");
          await this.state.storage.delete("rsaKeyPair");
          this.keyPair = null;
          await this.initRSAKeyPair();
        } else {
          // 否则标记需要在客户端全部断开后进行轮换
          await this.state.storage.put("pendingKeyRotation", true);
        }
      }
    } catch (error) {
      console.error("Error initializing RSA key pair:", error);
      throw error;
    }
  }

  async fetch(request) {
    // Check for WebSocket upgrade
    const upgradeHeader = request.headers.get("Upgrade");
    if (!upgradeHeader || upgradeHeader !== "websocket") {
      return new Response("Expected WebSocket Upgrade", { status: 426 });
    }

    // Ensure RSA keys are initialized
    if (!this.keyPair) {
      await this.initRSAKeyPair();
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Accept the WebSocket connection
    this.handleSession(server);

    return new Response(null, {
      status: 101,
      webSocket: client,
    });
  } // WebSocket connection event handler
  async handleSession(connection) {
    connection.accept();

    // 清理旧连接
    await this.cleanupOldConnections();

    const clientId = generateClientId();

    if (!clientId || this.clients[clientId]) {
      this.closeConnection(connection);
      return;
    }

    logEvent("connection", clientId, "debug"); // Store client information
    this.clients[clientId] = {
      connection: connection,
      seen: getTime(),
      key: null,
      shared: null,
      channel: null,
    };

    // Send RSA public key
    try {
      logEvent("sending-public-key", clientId, "debug");
      this.sendMessage(
        connection,
        JSON.stringify({
          type: "server-key",
          key: this.keyPair.rsaPublic,
        })
      );
    } catch (error) {
      logEvent("sending-public-key", error, "error");
    } // Handle messages
    connection.addEventListener("message", async (event) => {
      const message = event.data;

      if (!isString(message) || !this.clients[clientId]) {
        return;
      }

      this.clients[clientId].seen = getTime();

      if (message === "ping") {
        this.sendMessage(connection, "pong");
        return;
      }

      logEvent("message", [clientId, message], "debug"); // Handle key exchange
      if (!this.clients[clientId].shared && message.length < 2048) {
        try {
          // Generate ECDH key pair using P-384 curve (equivalent to secp384r1)
          const keys = await crypto.subtle.generateKey(
            {
              name: "ECDH",
              namedCurve: "P-384",
            },
            true,
            ["deriveBits", "deriveKey"]
          );

          const publicKeyBuffer = await crypto.subtle.exportKey(
            "raw",
            keys.publicKey
          );

          // Sign the public key using PKCS1 padding (compatible with original)
          const signature = await crypto.subtle.sign(
            {
              name: "RSASSA-PKCS1-v1_5",
            },
            this.keyPair.rsaPrivate,
            publicKeyBuffer
          );

          // Convert hex string to Uint8Array for client public key
          const clientPublicKeyHex = message;
          const clientPublicKeyBytes = new Uint8Array(
            clientPublicKeyHex
              .match(/.{1,2}/g)
              .map((byte) => parseInt(byte, 16))
          );

          // Import client's public key
          const clientPublicKey = await crypto.subtle.importKey(
            "raw",
            clientPublicKeyBytes,
            { name: "ECDH", namedCurve: "P-384" },
            false,
            []
          );

          // Derive shared secret bits (equivalent to computeSecret in Node.js)
          const sharedSecretBits = await crypto.subtle.deriveBits(
            {
              name: "ECDH",
              public: clientPublicKey,
            },
            keys.privateKey,
            384 // P-384 produces 48 bytes (384 bits)
          ); // Take bytes 8-40 (32 bytes) for AES-256 key
          this.clients[clientId].shared = new Uint8Array(
            sharedSecretBits
          ).slice(8, 40);

          const response =
            Array.from(new Uint8Array(publicKeyBuffer))
              .map((b) => b.toString(16).padStart(2, "0"))
              .join("") +
            "|" +
            btoa(String.fromCharCode(...new Uint8Array(signature)));

          this.sendMessage(connection, response);
        } catch (error) {
          logEvent("message-key", [clientId, error], "error");
          this.closeConnection(connection);
        }

        return;
      }

      // Handle encrypted messages
      if (this.clients[clientId].shared && message.length <= 8 * 1024 * 1024) {
        this.processEncryptedMessage(clientId, message);
      }
    }); // Handle connection close
    connection.addEventListener("close", async (event) => {
      logEvent("close", [clientId, event], "debug");

      const channel = this.clients[clientId].channel;

      if (channel && this.channels[channel]) {
        this.channels[channel].splice(
          this.channels[channel].indexOf(clientId),
          1
        );

        if (this.channels[channel].length === 0) {
          delete this.channels[channel];
        } else {
          try {
            const members = this.channels[channel];

            for (const member of members) {
              const client = this.clients[member];
              if (this.isClientInChannel(client, channel)) {
                this.sendMessage(
                  client.connection,
                  encryptMessage(
                    {
                      a: "l",
                      p: members.filter((value) => {
                        return value !== member ? true : false;
                      }),
                    },
                    client.shared
                  )
                );
              }
            }
          } catch (error) {
            logEvent("close-list", [clientId, error], "error");
          }
        }
      }

      if (this.clients[clientId]) {
        delete this.clients[clientId];
      }
    });
  }
  // Process encrypted messages
  processEncryptedMessage(clientId, message) {
    let decrypted = null;

    try {
      decrypted = decryptMessage(message, this.clients[clientId].shared);

      logEvent("message-decrypted", [clientId, decrypted], "debug");

      if (!isObject(decrypted) || !isString(decrypted.a)) {
        return;
      }

      const action = decrypted.a;

      if (action === "j") {
        this.handleJoinChannel(clientId, decrypted);
      } else if (action === "c") {
        this.handleClientMessage(clientId, decrypted);
      } else if (action === "w") {
        this.handleChannelMessage(clientId, decrypted);
      }
    } catch (error) {
      logEvent("process-encrypted-message", [clientId, error], "error");
    } finally {
      decrypted = null;
    }
  }
  // Handle channel join requests
  handleJoinChannel(clientId, decrypted) {
    if (!isString(decrypted.p) || this.clients[clientId].channel) {
      return;
    }

    try {
      const channel = decrypted.p;

      this.clients[clientId].channel = channel;

      if (!this.channels[channel]) {
        this.channels[channel] = [clientId];
      } else {
        this.channels[channel].push(clientId);
      }

      this.broadcastMemberList(channel);
    } catch (error) {
      logEvent("message-join", [clientId, error], "error");
    }
  }
  // Handle client messages
  handleClientMessage(clientId, decrypted) {
    if (
      !isString(decrypted.p) ||
      !isString(decrypted.c) ||
      !this.clients[clientId].channel
    ) {
      return;
    }

    try {
      const channel = this.clients[clientId].channel;
      const targetClient = this.clients[decrypted.c];

      if (this.isClientInChannel(targetClient, channel)) {
        const messageObj = {
          a: "c",
          p: decrypted.p,
          c: clientId,
        };

        const encrypted = encryptMessage(messageObj, targetClient.shared);
        this.sendMessage(targetClient.connection, encrypted);

        messageObj.p = null;
      }
    } catch (error) {
      logEvent("message-client", [clientId, error], "error");
    }
  } // Handle channel messages
  handleChannelMessage(clientId, decrypted) {
    if (!isObject(decrypted.p) || !this.clients[clientId].channel) {
      return;
    }

    try {
      const channel = this.clients[clientId].channel;
      // 过滤有效的目标成员
      const validMembers = Object.keys(decrypted.p).filter((member) => {
        const targetClient = this.clients[member];
        return (
          isString(decrypted.p[member]) &&
          this.isClientInChannel(targetClient, channel)
        );
      });

      // 处理所有有效的目标成员
      for (const member of validMembers) {
        const targetClient = this.clients[member];
        const messageObj = {
          a: "c",
          p: decrypted.p[member],
          c: clientId,
        };
        const encrypted = encryptMessage(messageObj, targetClient.shared);
        this.sendMessage(targetClient.connection, encrypted);

        messageObj.p = null;
      }
    } catch (error) {
      logEvent("message-channel", [clientId, error], "error");
    }
  }
  // Broadcast member list to channel
  broadcastMemberList(channel) {
    try {
      const members = this.channels[channel];

      for (const member of members) {
        const client = this.clients[member];

        if (this.isClientInChannel(client, channel)) {
          const messageObj = {
            a: "l",
            p: members.filter((value) => {
              return value !== member ? true : false;
            }),
          };

          const encrypted = encryptMessage(messageObj, client.shared);
          this.sendMessage(client.connection, encrypted);

          messageObj.p = null;
        }
      }
    } catch (error) {
      logEvent("broadcast-member-list", error, "error");
    }
  } // Check if client is in channel
  isClientInChannel(client, channel) {
    return client &&
      client.connection &&
      client.shared &&
      client.channel &&
      client.channel === channel
      ? true
      : false;
  }
  // Send message helper
  sendMessage(connection, message) {
    try {
      // In Cloudflare Workers, WebSocket.READY_STATE_OPEN is 1
      if (connection.readyState === 1) {
        connection.send(message);
      }
    } catch (error) {
      logEvent("sendMessage", error, "error");
    }
  } // Close connection helper
  closeConnection(connection) {
    try {
      connection.close();
    } catch (error) {
      logEvent("closeConnection", error, "error");
    }
  }

  // 连接清理方法
  async cleanupOldConnections() {
    const seenThreshold = getTime() - this.config.seenTimeout;
    const clientsToRemove = [];

    // 先收集需要移除的客户端，避免在迭代时修改对象
    for (const clientId in this.clients) {
      if (this.clients[clientId].seen < seenThreshold) {
        clientsToRemove.push(clientId);
      }
    }

    // 然后一次性移除所有过期客户端
    for (const clientId of clientsToRemove) {
      try {
        logEvent("connection-seen", clientId, "debug");
        this.clients[clientId].connection.close();
        delete this.clients[clientId];
      } catch (error) {
        logEvent("connection-seen", error, "error");
      }
    }

    // 如果没有任何客户端和房间，检查是否需要轮换密钥
    if (
      Object.keys(this.clients).length === 0 &&
      Object.keys(this.channels).length === 0
    ) {
      const pendingRotation = await this.state.storage.get(
        "pendingKeyRotation"
      );
      if (pendingRotation) {
        console.log("没有活跃客户端或房间，执行密钥轮换...");
        await this.state.storage.delete("rsaKeyPair");
        await this.state.storage.delete("pendingKeyRotation");
        this.keyPair = null;
        await this.initRSAKeyPair();
      }
    }

    return clientsToRemove.length; // 返回清理的连接数量
  }
}
