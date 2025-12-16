// English language pack for NodeCrypt
// NodeCrypt 英文语言包

export default {
  code: "en",
  name: "English",
  flag: "🇺🇸",
  translations: {
    // Meta tags for SEO
    "meta.description":
      "NodeCrypt - True end-to-end encrypted chat system, no database, all messages encrypted locally, server only relays encrypted data, supports Cloudflare Workers, Docker, self-hosting and local development.",
    "meta.keywords":
      "end-to-end encryption, security, chat, WebSocket, Cloudflare Workers, JavaScript, E2EE, anonymous communication, AES, ECDH, RSA, ChaCha20, security, open source, NodeCrypt, IIawaII",
    "meta.og_title": "NodeCrypt - End-to-End Encrypted Chat System",
    "meta.og_description":
      "NodeCrypt is a zero-knowledge, end-to-end encrypted open source chat system where all encryption and decryption is done locally on the client side, and servers cannot access plaintext. Supports multi-platform deployment, secure, anonymous, no message history.",
    "meta.twitter_title": "NodeCrypt - End-to-End Encrypted Chat System",
    "meta.twitter_description":
      "NodeCrypt is a zero-knowledge, end-to-end encrypted open source chat system where all encryption and decryption is done locally on the client side, and servers cannot access plaintext.",

    // Login and main UI
    "ui.enter_node": "Enter a Node",
    "ui.username": "Username",
    "ui.node_name": "Node Name",
    "ui.node_password": "Node Password",
    "ui.optional": "(optional)",
    "ui.enter": "ENTER",
    "ui.connecting": "Connecting...",
    "ui.node_exists": "Node already exists",
    "ui.my_name": "My Name",
    "ui.members": "Members",
    "ui.message": "Message",
    "ui.private_message_to": "Private Message to",
    "ui.me": " (me)",
    "ui.anonymous": "Anonymous",
    "ui.start_private_chat": "Select for private chat",

    // Settings panel
    "settings.title": "Settings",
    "settings.notification": "Notification Settings",
    "settings.theme": "Theme Settings",
    "settings.language": "Language Settings",
    "settings.desktop_notifications": "Desktop Notifications",
    "settings.sound_notifications": "Sound Notifications",
    "settings.language_switch": "Language",
    "settings.chinese": "Chinese",
    "settings.english": "English",

    // File upload and transfer
    "file.selected_files": "Selected Files",
    "file.clear_all": "Clear All",
    "file.cancel": "Cancel",
    "file.send_files": "Send Files",
    "file.sending": "Sending",
    "file.receiving": "Receiving",
    "file.files": "files",
    "file.total": "Total",
    "file.files_selected": "{count} files selected, {size} total",
    "file.upload_files": "Upload Files",
    "file.attach_file": "Attach file",
    "file.no_password_required": "No password required",
    "file.drag_drop": "Drag and drop files here",
    "file.or": "or",
    "file.browse_files": "browse files",

    // Notifications and messages
    "notification.enabled": "Notifications enabled",
    "notification.alert_here": "You will receive alerts here.",
    "notification.not_supported":
      "Notifications are not supported by your browser.",
    "notification.allow_browser":
      "Please allow notifications in your browser settings.",
    "notification.image": "[image]",
    "notification.private": "(Private)",

    // Actions and menu
    "action.share": "Share",
    "action.exit": "Exit",
    "action.emoji": "Emoji",
    "action.settings": "Settings",
    "action.back": "Back",
    "action.copied": "Copied to clipboard!",
    "action.share_copied": "Share link copied!",
    "action.copy_failed": "Copy failed, text:",
    "action.copy_url_failed": "Copy failed, url:",
    "action.nothing_to_copy": "Nothing to copy",
    "action.copy_not_supported": "Copy not supported in this environment",
    "action.action_failed": "Action failed. Please try again.",
    "action.cannot_share": "Cannot share:",

    // System messages
    "system.security_warning":
      "⚠️ This link uses an old format. Room data is not encrypted.",
    "system.file_send_failed": "Failed to send files:",
    "system.joined": "joined the conversation",
    "system.left": "left the conversation",
    "system.secured": "connection secured",
    "system.private_message_failed": "Cannot send private message to",
    "system.private_file_failed": "Cannot send private file to",
    "system.user_not_connected": "User might not be fully connected.",

    // Help page
    "help.title": "User Guide",
    "help.back_to_login": "Back to Login",
    "help.usage_guide": "User Guide",
    "help.what_is_nodecrypt": "🔐 What is NodeCrypt?",
    "help.what_is_nodecrypt_desc":
      "NodeCrypt is a true zero-knowledge end-to-end encrypted chat system. With a database-free architecture, all messages are encrypted locally on your device, and the server serves only as an encrypted data relay station, unable to access any of your plaintext content.",
    "help.how_to_start": "🚀 Quick Start",
    "help.step_username": "Enter Username",
    "help.step_username_desc":
      "Choose a display name for the room, can be any name you like",
    "help.step_node_name": "Set Node Name",
    "help.step_node_name_desc":
      "Unique identifier for the room, equivalent to room number",
    "help.step_password": "Set Node Password",
    "help.step_password_desc":
      "Used to distinguish different rooms while participating in encryption process to enhance security",
    "help.step_join": 'Click "Join Room"',
    "help.step_join_desc":
      "System will automatically generate encryption keys and start secure chatting",
    "help.security_features": "🔑 Security Features",
    "help.e2e_encryption": "🛡️ End-to-End Encryption",
    "help.e2e_encryption_desc":
      "Uses AES-256 + ECDH encryption algorithm, messages can only be decrypted by you and the recipient",
    "help.password_enhanced_encryption": "🔐 Password Enhanced Encryption",
    "help.password_enhanced_encryption_desc":
      "Node password directly participates in encryption key generation, providing additional security protection layer",
    "help.no_history": "🚫 Zero History Records",
    "help.no_history_desc":
      "All messages exist only in current session, offline users cannot get historical messages",
    "help.anonymous_communication": "🎭 Complete Anonymity",
    "help.anonymous_communication_desc":
      "No account registration required, no personal information collected",
    "help.decentralized": "🌐 Decentralized",
    "help.decentralized_desc":
      "Supports self-hosted deployment, server does not participate in encryption/decryption process",
    "help.usage_tips": "💡 Usage Tips",
    "help.important_note": "⚠️ Important Note",
    "help.room_isolation_note":
      "Same node name but different passwords are two completely independent rooms that cannot communicate with each other.",
    "help.tip_private_chat": "Private Chat",
    "help.tip_private_chat_desc":
      "Use complex node names and passwords, share only with specific people",
    "help.tip_group_chat": "Group Chat",
    "help.tip_group_chat_desc":
      "Use simple and memorable node names and passwords for easy multi-user joining",
    "help.tip_security_reminder": "Security Reminder",
    "help.tip_security_reminder_desc":
      "Both node name and password must be exactly the same to enter the same room",
    "help.tip_password_strategy": "Password Strategy",
    "help.tip_password_strategy_desc":
      "Recommend using strong passwords containing letters, numbers and symbols",
  },
};
