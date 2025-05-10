const socket = io();

document.getElementById('inputText').addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    sendText();
  }
});

function sendText() {
  const text = document.getElementById('inputText').value;
  if (text.trim()) {
    socket.emit('send_text', text);
    addMessage("You", text);
    document.getElementById('inputText').value = '';
  }
}

socket.on('receive_text', (text) => {
  addMessage("Friend", text);
});

function addMessage(user, text) {
  const messagesDiv = document.getElementById('messages');
  const msg = document.createElement('div');
  msg.classList.add('message');

  const isCode = /function|const|let|class|=>|<\w+>|if\s*\(|for\s*\(|while\s*\(/.test(text);
  const safeText = escapeHTML(text);

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

  // Text or Code
  if (isCode) {
    const pre = document.createElement('pre');
    const code = document.createElement('code');
    code.className = 'language-javascript';
    code.innerHTML = safeText;
    pre.appendChild(code);
    msg.appendChild(pre);
  } else {
    const textSpan = document.createElement('span');
    textSpan.innerText = ' ' + text;
    msg.appendChild(textSpan);
  }

  // Copy Button
  const btn = document.createElement('button');
  btn.innerText = 'Copy';
  btn.onclick = () => copyText(text, btn);
  msg.appendChild(btn);

  messagesDiv.appendChild(msg);
  hljs.highlightAll();
  messagesDiv.scrollTop = messagesDiv.scrollHeight; 
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
