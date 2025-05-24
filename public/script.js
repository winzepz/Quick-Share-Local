const socket = io();

// Theme Toggle
const themeToggle = document.getElementById('themeToggle');
const body = document.body;
let isDarkTheme = true;

themeToggle.addEventListener('click', () => {
  isDarkTheme = !isDarkTheme;
  body.setAttribute('data-theme', isDarkTheme ? 'dark' : 'light');
  themeToggle.innerHTML = isDarkTheme ? '<i class="fas fa-moon"></i>' : '<i class="fas fa-sun"></i>';
});

// Character Counter
const inputText = document.getElementById('inputText');
const charCount = document.getElementById('charCount');

inputText.addEventListener('input', () => {
  const count = inputText.value.length;
  charCount.textContent = `${count}/1000`;
  if (count > 900) {
    charCount.style.color = '#ff4444';
  } else {
    charCount.style.color = '';
  }
});

// Typing Indicator
let typingTimeout;
inputText.addEventListener('input', () => {
  socket.emit('typing');
  clearTimeout(typingTimeout);
  typingTimeout = setTimeout(() => {
    socket.emit('stop_typing');
  }, 1000);
});

socket.on('user_typing', () => {
  const typingIndicator = document.getElementById('typingIndicator');
  typingIndicator.classList.add('show');
});

socket.on('user_stop_typing', () => {
  const typingIndicator = document.getElementById('typingIndicator');
  typingIndicator.classList.remove('show');
});

// Online Users
socket.on('user_count', (count) => {
  document.getElementById('userCount').textContent = count;
});

// File Upload
const fileInput = document.getElementById('fileInput');
let currentFile = null;

fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (file) {
    currentFile = file;
    showNotification(`File selected: ${file.name}`);
  }
});

// Message Search
const searchInput = document.getElementById('searchMessages');
const messageCategory = document.getElementById('messageCategory');

function highlightText(text, searchTerm) {
  if (!searchTerm) return text;
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<span class="highlight">$1</span>');
}

function filterMessages() {
  const searchTerm = searchInput.value.toLowerCase();
  const category = messageCategory.value;
  const messages = document.querySelectorAll('.message');

  messages.forEach(msg => {
    const text = msg.textContent.toLowerCase();
    const msgCategory = msg.dataset.category;
    const matchesSearch = !searchTerm || text.includes(searchTerm);
    const matchesCategory = category === 'all' || msgCategory === category;

    msg.style.display = matchesSearch && matchesCategory ? 'block' : 'none';

    if (matchesSearch && searchTerm) {
      const textSpan = msg.querySelector('span:not(.timestamp)');
      if (textSpan) {
        textSpan.innerHTML = highlightText(textSpan.textContent, searchTerm);
      }
    }
  });
}

searchInput.addEventListener('input', filterMessages);
messageCategory.addEventListener('change', filterMessages);

// Emoji Picker
const emojiButton = document.getElementById('emojiButton');
const emojiPicker = document.getElementById('emojiPicker');
const emojiContainer = document.querySelector('.emoji-container');

emojiButton.addEventListener('click', () => {
  emojiPicker.classList.toggle('show');
});

emojiContainer.addEventListener('click', (e) => {
  if (e.target.tagName === 'SPAN') {
    const emoji = e.target.textContent;
    const cursorPos = inputText.selectionStart;
    const text = inputText.value;
    inputText.value = text.slice(0, cursorPos) + emoji + text.slice(cursorPos);
    inputText.focus();
    inputText.setSelectionRange(cursorPos + emoji.length, cursorPos + emoji.length);
    emojiPicker.classList.remove('show');
    inputText.dispatchEvent(new Event('input'));
  }
});

// Close emoji picker when clicking outside
document.addEventListener('click', (e) => {
  if (!emojiButton.contains(e.target) && !emojiPicker.contains(e.target)) {
    emojiPicker.classList.remove('show');
  }
});

// Message Reactions
const reactions = ['👍', '❤️', '😂', '🎉', '👏'];

function addReactionButton(msg) {
  const reactionContainer = document.createElement('div');
  reactionContainer.className = 'message-reactions';
  
  reactions.forEach(reaction => {
    const btn = document.createElement('span');
    btn.className = 'reaction';
    btn.textContent = reaction;
    btn.onclick = () => toggleReaction(msg, reaction, btn);
    reactionContainer.appendChild(btn);
  });
  
  msg.appendChild(reactionContainer);
}

function toggleReaction(msg, reaction, btn) {
  btn.classList.toggle('active');
  socket.emit('reaction', {
    messageId: msg.dataset.id,
    reaction: reaction,
    action: btn.classList.contains('active') ? 'add' : 'remove'
  });
}

socket.on('reaction_update', (data) => {
  const msg = document.querySelector(`[data-id="${data.messageId}"]`);
  if (msg) {
    const reactionBtn = msg.querySelector(`.reaction[data-reaction="${data.reaction}"]`);
    if (reactionBtn) {
      reactionBtn.classList.toggle('active', data.action === 'add');
    }
  }
});

// Notification System
function showNotification(message) {
  const notification = document.getElementById('notification');
  const notificationText = notification.querySelector('.notification-text');
  notificationText.textContent = message;
  notification.classList.add('show');
  
  setTimeout(() => {
    notification.classList.remove('show');
  }, 3000);
}

// Clear Messages
const clearMessages = document.getElementById('clearMessages');
clearMessages.addEventListener('click', () => {
  if (confirm('Are you sure you want to clear all messages?')) {
    document.getElementById('messages').innerHTML = '';
  }
});

// Download Messages
const downloadMessages = document.getElementById('downloadMessages');
downloadMessages.addEventListener('click', () => {
  const messages = Array.from(document.querySelectorAll('.message')).map(msg => {
    const user = msg.querySelector('strong').textContent;
    const text = msg.querySelector('span:not(.timestamp)')?.textContent || '';
    const time = msg.querySelector('.timestamp').textContent;
    return `${user} ${time}\n${text}\n\n`;
  }).join('');

  const blob = new Blob([messages], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `quickdrop-messages-${new Date().toISOString().slice(0, 10)}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// Enter key handling
inputText.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendText();
  }
});

function sendText() {
  const text = inputText.value;
  if (text.trim() || currentFile) {
    const messageData = {
      text: text,
      file: currentFile ? {
        name: currentFile.name,
        type: currentFile.type,
        size: currentFile.size
      } : null
    };
    
    socket.emit('send_text', messageData);
    addMessage("You", messageData);
    inputText.value = '';
    charCount.textContent = '0/1000';
    currentFile = null;
    fileInput.value = '';
  }
}

socket.on('receive_text', (data) => {
  addMessage("Friend", data);
});

// User Profile
const profileModal = document.getElementById('profileModal');
const showProfileBtn = document.getElementById('showProfile');
const closeProfileBtn = document.querySelector('.close');
const saveProfileBtn = document.getElementById('saveProfile');
const userAvatar = document.getElementById('userAvatar');
const userName = document.getElementById('userName');
const userStatus = document.getElementById('userStatus');

let userProfile = {
  name: 'Anonymous',
  status: '',
  avatar: 'https://via.placeholder.com/100'
};

showProfileBtn.addEventListener('click', () => {
  profileModal.style.display = 'block';
  userName.value = userProfile.name;
  userStatus.value = userProfile.status;
  userAvatar.src = userProfile.avatar;
});

closeProfileBtn.addEventListener('click', () => {
  profileModal.style.display = 'none';
});

saveProfileBtn.addEventListener('click', () => {
  userProfile.name = userName.value || 'Anonymous';
  userProfile.status = userStatus.value;
  socket.emit('update_profile', userProfile);
  profileModal.style.display = 'none';
  showNotification('Profile updated successfully');
});

// Voice Recording
const voiceButton = document.getElementById('voiceButton');
const voiceRecorder = document.getElementById('voiceRecorder');
const stopRecordingBtn = document.getElementById('stopRecording');
const cancelRecordingBtn = document.getElementById('cancelRecording');

let mediaRecorder;
let audioChunks = [];

voiceButton.addEventListener('click', async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRecorder = new MediaRecorder(stream);
    audioChunks = [];
    
    mediaRecorder.ondataavailable = (event) => {
      audioChunks.push(event.data);
    };
    
    mediaRecorder.onstop = () => {
      const audioBlob = new Blob(audioChunks, { type: 'audio/wav' });
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      socket.emit('send_voice', {
        audio: audioBlob,
        duration: audio.duration
      });
      
      voiceRecorder.classList.remove('show');
      stream.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorder.start();
    voiceRecorder.classList.add('show');
  } catch (err) {
    console.error('Error accessing microphone:', err);
    showNotification('Could not access microphone');
  }
});

stopRecordingBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
  }
});

cancelRecordingBtn.addEventListener('click', () => {
  if (mediaRecorder && mediaRecorder.state === 'recording') {
    mediaRecorder.stop();
    audioChunks = [];
  }
  voiceRecorder.classList.remove('show');
});

// Message Encryption
const encryptButton = document.getElementById('encryptButton');
let isEncrypted = false;

encryptButton.addEventListener('click', () => {
  isEncrypted = !isEncrypted;
  encryptButton.style.backgroundColor = isEncrypted ? '#ff4444' : '';
  showNotification(isEncrypted ? 'Messages will be encrypted' : 'Messages will not be encrypted');
});

function encryptMessage(text) {
  if (!isEncrypted) return text;
  // Simple XOR encryption for demonstration
  const key = 'QuickDropSecret';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return btoa(result); // Base64 encode
}

function decryptMessage(text) {
  if (!isEncrypted) return text;
  // Decrypt the message
  const key = 'QuickDropSecret';
  const decoded = atob(text);
  let result = '';
  for (let i = 0; i < decoded.length; i++) {
    result += String.fromCharCode(decoded.charCodeAt(i) ^ key.charCodeAt(i % key.length));
  }
  return result;
}

// Message Pinning
function pinMessage(messageId) {
  const message = document.querySelector(`[data-id="${messageId}"]`);
  if (message) {
    const pinnedList = document.querySelector('.pinned-list');
    const pinnedMessage = document.createElement('div');
    pinnedMessage.className = 'pinned-message';
    pinnedMessage.innerHTML = `
      <i class="fas fa-thumbtack pin-icon"></i>
      <span>${message.querySelector('strong').textContent}</span>
      <span>${message.querySelector('span:not(.timestamp)').textContent}</span>
    `;
    pinnedList.appendChild(pinnedMessage);
    showNotification('Message pinned');
  }
}

// Message Threading
function replyToMessage(messageId) {
  const message = document.querySelector(`[data-id="${messageId}"]`);
  if (message) {
    const replyText = message.querySelector('span:not(.timestamp)').textContent;
    inputText.value = `> ${replyText}\n\n`;
    inputText.focus();
  }
}

// Read Status
function markAsRead(messageId) {
  socket.emit('message_read', messageId);
}

socket.on('message_read_status', (data) => {
  const message = document.querySelector(`[data-id="${data.messageId}"]`);
  if (message) {
    const readStatus = message.querySelector('.read-status');
    if (readStatus) {
      readStatus.innerHTML = `<i class="fas fa-check-double"></i> Read by ${data.reader}`;
    }
  }
});

function addMessage(user, data) {
  const messagesDiv = document.getElementById('messages');
  const msg = document.createElement('div');
  msg.classList.add('message');
  msg.dataset.id = Date.now().toString();
  
  const isCode = /function|const|let|class|=>|<\w+>|if\s*\(|for\s*\(|while\s*\(/.test(data.text);
  const safeText = escapeHTML(data.text);

  // User Label
  const userLabel = document.createElement('strong');
  userLabel.innerText = user + ': ';
  msg.appendChild(userLabel);

  // Timestamp
  const time = document.createElement('span');
  time.className = 'timestamp';
  const now = new Date();
  const hours = now.getHours() % 12 || 12;
  const minutes = now.getMinutes().toString().padStart(2, '0');
  const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
  time.innerText = ` (${hours}:${minutes} ${ampm})`;
  msg.appendChild(time);

  // Category Label
  const category = document.createElement('span');
  category.className = 'message-category';
  if (data.file) {
    category.classList.add('file');
    category.textContent = 'File';
    msg.dataset.category = 'file';
  } else if (data.voice) {
    category.classList.add('voice');
    category.textContent = 'Voice';
    msg.dataset.category = 'voice';
  } else if (isCode) {
    category.classList.add('code');
    category.textContent = 'Code';
    msg.dataset.category = 'code';
  } else {
    category.textContent = 'Text';
    msg.dataset.category = 'text';
  }
  msg.appendChild(category);

  // Message Content
  if (data.voice) {
    const voiceMessage = document.createElement('div');
    voiceMessage.className = 'voice-message';
    voiceMessage.innerHTML = `
      <audio controls src="${data.voice}"></audio>
      <span class="duration">${data.duration.toFixed(1)}s</span>
    `;
    msg.appendChild(voiceMessage);
  } else if (isCode) {
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.className = 'language-javascript';
    code.innerHTML = safeText;
    pre.appendChild(code);
    msg.appendChild(pre);
  } else {
    const textSpan = document.createElement('span');
    textSpan.innerText = ' ' + (data.encrypted ? decryptMessage(data.text) : data.text);
    msg.appendChild(textSpan);
  }

  // Message Actions
  const actions = document.createElement('div');
  actions.className = 'message-actions';
  
  // Pin Button
  const pinBtn = document.createElement('button');
  pinBtn.innerHTML = '<i class="fas fa-thumbtack"></i>';
  pinBtn.onclick = () => pinMessage(msg.dataset.id);
  actions.appendChild(pinBtn);
  
  // Reply Button
  const replyBtn = document.createElement('button');
  replyBtn.innerHTML = '<i class="fas fa-reply"></i>';
  replyBtn.onclick = () => replyToMessage(msg.dataset.id);
  actions.appendChild(replyBtn);
  
  // Copy Button
  const copyBtn = document.createElement('button');
  copyBtn.innerText = 'Copy';
  copyBtn.onclick = () => copyText(data.text, copyBtn);
  actions.appendChild(copyBtn);
  
  msg.appendChild(actions);

  // Read Status
  const readStatus = document.createElement('div');
  readStatus.className = 'read-status';
  msg.appendChild(readStatus);

  messagesDiv.appendChild(msg);
  hljs.highlightAll();
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
  
  if (user !== 'You') {
    markAsRead(msg.dataset.id);
  }
  
  showNotification(`New message from ${user}`);
}

function escapeHTML(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function copyText(text, btn) {
  navigator.clipboard.writeText(text).then(() => {
    btn.innerText = 'Copied!';
    btn.disabled = true;
    setTimeout(() => {
      btn.innerText = 'Copy';
      btn.disabled = false;
    }, 2000);
  }).catch(err => {
    console.error('Copy failed:', err);
  });
}
