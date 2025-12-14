//notification utility for NodeCrypt

// 读取设置
function getSettings() {
    try {
        return JSON.parse(localStorage.getItem('settings')) || {};
    } catch (e) {
        return {};
    }
}

// 播放声音
function playSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.frequency.value = 1000;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5);
        setTimeout(() => {
            osc.stop();
            ctx.close();
        }, 600);
    } catch (e) {
        console.error('Sound notification failed', e);
    }
}

// 标题闪烁
let originalTitle = document.title;
let blinkInterval = null;
let isPageVisible = true;

document.addEventListener('visibilitychange', () => {
    isPageVisible = document.visibilityState === 'visible';
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
    if (!("Notification" in window) || Notification.permission !== "granted") return;

    // 格式化消息内容
    let bodyText = content;
    if (type && type.includes('image')) bodyText = '[图片]';
    else if (type && type.includes('file')) bodyText = `[文件] ${content.fileName || ''}`;
    
    // 截断过长文本
    if (typeof bodyText === 'string' && bodyText.length > 50) {
        bodyText = bodyText.substring(0, 50) + '...';
    }

    try {
        const notification = new Notification(`来自 ${sender} (#${roomName})`, {
            body: bodyText,
            icon: '/favicon.ico',
            silent: true
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

// 处理新消息
export function handleNewMessage(roomName, msgType, content, sender) {
    const settings = getSettings();
    const myUserName = window.roomsData && window.activeRoomIndex >= 0 
        ? window.roomsData[window.activeRoomIndex].myUserName 
        : null;

    // 如果是自己发的消息或系统消息，忽略
    if (!sender || sender === myUserName || msgType === 'system') return;

    // 处理声音
    if (settings.sound) {
        playSound();
    }

    // 处理视觉提示
    if (settings.notify) {
        // 请求权限（防御性编程，防止之前没授权）
        if ("Notification" in window && Notification.permission !== "granted") {
            Notification.requestPermission();
        }
        
        startTitleBlink(sender);
        sendDesktopNotification(roomName, sender, content, msgType);
    } 
    else if (settings.sound) {
        startTitleBlink(sender);
    }
}

// 初始化函数
export function initNotificationSystem() {
    // 首次点击页面时请求权限
    if ("Notification" in window && Notification.permission !== "granted") {
        const ask = () => {
            Notification.requestPermission();
            document.body.removeEventListener('click', ask);
        };
        document.body.addEventListener('click', ask);
    }
}