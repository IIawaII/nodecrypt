// 中文语言包 for NodeCrypt
// Chinese language pack for NodeCrypt

export default {
  code: "zh",
  name: "中文",
  flag: "🇨🇳",
  translations: {
    // Meta tags for SEO
    "meta.description":
      "NodeCrypt - 真正的端到端加密聊天系统，无数据库，所有消息本地加密，服务器仅做加密数据中转，支持 Cloudflare Workers、Docker、自托管和本地开发。",
    "meta.keywords":
      "端到端加密, 安全, 聊天, WebSocket, Cloudflare Workers, JavaScript, E2EE, 匿名通信, AES, ECDH, RSA, ChaCha20, 安全, 开源, NodeCrypt, IIawaII",
    "meta.og_title": "NodeCrypt - 端到端加密聊天系统",
    "meta.og_description":
      "NodeCrypt 是一个端到端加密的开源聊天系统，所有加密解密均在客户端本地完成，服务器无法获取明文。支持多平台部署，安全、匿名、无历史消息。",
    "meta.twitter_title": "NodeCrypt - 端到端加密聊天系统",
    "meta.twitter_description":
      "NodeCrypt 是一个端到端加密的开源聊天系统，所有加密解密均在客户端本地完成，服务器无法获取明文。",

    // Login and main UI
    "ui.enter_node": "进入新的节点",
    "ui.username": "用户名",
    "ui.node_name": "节点名称",
    "ui.node_password": "节点密码",
    "ui.optional": "（可选）",
    "ui.enter": "确定",
    "ui.connecting": "连接中...",
    "ui.node_exists": "此节点已存在",
    "ui.my_name": "我的名字",
    "ui.members": "在线成员",
    "ui.message": "消息",
    "ui.private_message_to": "私信给",
    "ui.me": "（我）",
    "ui.anonymous": "匿名用户",
    "ui.start_private_chat": "选择用户开始私信",

    // Settings panel
    "settings.title": "设置",
    "settings.notification": "通知设置",
    "settings.theme": "主题设置",
    "settings.language": "语言设置",
    "settings.desktop_notifications": "桌面通知",
    "settings.sound_notifications": "声音通知",
    "settings.language_switch": "语言",
    "settings.chinese": "中文",
    "settings.english": "English",

    // File upload and transfer
    "file.selected_files": "已选择的文件",
    "file.clear_all": "清空所有",
    "file.cancel": "取消",
    "file.send_files": "发送文件",
    "file.sending": "发送中",
    "file.receiving": "接收中",
    "file.files": "个文件",
    "file.total": "总计",
    "file.files_selected": "选中 {count} 个文件，总计 {size}",
    "file.upload_files": "上传文件",
    "file.attach_file": "附加文件",
    "file.no_password_required": "无需密码",
    "file.drag_drop": "拖拽文件到此处",
    "file.or": "或",
    "file.browse_files": "浏览文件",

    // Notifications and messages
    "notification.enabled": "通知已启用",
    "notification.alert_here": "您将在此处收到通知。",
    "notification.not_supported": "您的浏览器不支持通知功能。",
    "notification.allow_browser": "请在浏览器设置中允许通知。",
    "notification.image": "[图片]",
    "notification.private": "（私信）",

    // Actions and menu
    "action.share": "分享",
    "action.exit": "退出",
    "action.emoji": "表情",
    "action.settings": "设置",
    "action.back": "返回",
    "action.copied": "已复制到剪贴板！",
    "action.share_copied": "分享链接已复制！",
    "action.copy_failed": "复制失败，文本：",
    "action.copy_url_failed": "复制失败，链接：",
    "action.nothing_to_copy": "没有内容可复制",
    "action.copy_not_supported": "此环境不支持复制功能",
    "action.action_failed": "操作失败，请重试。",
    "action.cannot_share": "无法分享：",

    // System messages
    "system.security_warning": "⚠️ 此链接使用旧格式，房间数据未加密。",
    "system.file_send_failed": "文件发送失败：",
    "system.joined": "加入了对话",
    "system.left": "离开了对话",
    "system.secured": "已建立端到端安全连接",
    "system.private_message_failed": "无法发送私信给",
    "system.private_file_failed": "无法发送私密文件给",
    "system.user_not_connected": "用户可能未完全连接。",

    // Help page
    "help.title": "使用说明",
    "help.back_to_login": "返回登录",
    "help.usage_guide": "使用说明",
    "help.what_is_nodecrypt": "🔐 什么是 NodeCrypt？",
    "help.what_is_nodecrypt_desc":
      "NodeCrypt 是一个真正的端到端加密聊天系统。采用无数据库架构，所有消息在您的设备上本地加密，服务器仅作为加密数据的中转站，无法获取您的任何明文内容。",
    "help.how_to_start": "🚀 快速开始",
    "help.step_username": "输入用户名",
    "help.step_username_desc":
      "选择一个在房间中显示的昵称，可以是任何您喜欢的名称",
    "help.step_node_name": "设置节点名",
    "help.step_node_name_desc": "房间的唯一标识符，相当于房间号",
    "help.step_password": "设置节点密码",
    "help.step_password_desc": "用于区分不同房间，同时参与加密过程，提升安全性",
    "help.step_join": '点击"加入房间"',
    "help.step_join_desc": "系统将自动生成加密密钥，开始安全聊天",
    "help.security_features": "🔑 安全特性",
    "help.e2e_encryption": "🛡️ 端到端加密",
    "help.e2e_encryption_desc":
      "使用 AES-256 + ECDH 加密算法，消息仅您和接收者可解密",
    "help.password_enhanced_encryption": "🔐 密码增强加密",
    "help.password_enhanced_encryption_desc":
      "节点密码直接参与加密密钥生成，提供额外的安全保护层",
    "help.no_history": "🚫 零历史记录",
    "help.no_history_desc":
      "所有消息仅存在于当前会话，离线用户无法获取历史消息",
    "help.anonymous_communication": "🎭 完全匿名",
    "help.anonymous_communication_desc": "无需注册账户，不收集任何个人信息",
    "help.decentralized": "🌐 去中心化",
    "help.decentralized_desc": "支持自托管部署，服务器不参与加密解密过程",
    "help.usage_tips": "💡 使用技巧",
    "help.important_note": "⚠️ 重要提示",
    "help.room_isolation_note":
      "相同节点名但不同密码的是两个完全独立的房间，无法相互通信。",
    "help.tip_private_chat": "私人对话",
    "help.tip_private_chat_desc": "使用复杂的节点名和密码，只分享给特定人员",
    "help.tip_group_chat": "群聊",
    "help.tip_group_chat_desc": "使用简单易记的节点名和密码，方便多人加入",
    "help.tip_security_reminder": "安全提醒",
    "help.tip_security_reminder_desc":
      "节点名和密码都需要完全一致才能进入同一个房间",
    "help.tip_password_strategy": "密码策略",
    "help.tip_password_strategy_desc": "建议使用包含字母、数字和符号的强密码",
  },
};
