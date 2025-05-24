const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",  // Allow connections from any origin
    methods: ["GET", "POST"]
  }
});

app.use(express.static('public'));

// Store user profiles
const userProfiles = new Map();

// Store pinned messages
const pinnedMessages = [];

// Store read status
const messageReadStatus = new Map();

// Store connected users
const connectedUsers = new Map();

io.on('connection', (socket) => {
  console.log('A user connected from:', socket.handshake.address);
  
  // Handle user profile updates
  socket.on('update_profile', (profile) => {
    userProfiles.set(socket.id, profile);
    connectedUsers.set(socket.id, {
      id: socket.id,
      profile: profile,
      address: socket.handshake.address
    });
    
    io.emit('profile_updated', {
      userId: socket.id,
      profile: profile
    });
    
    // Broadcast updated user list
    io.emit('user_list', Array.from(connectedUsers.values()));
  });

  // Handle typing indicator
  socket.on('typing', (isTyping) => {
    socket.broadcast.emit('typing', {
      userId: socket.id,
      isTyping: isTyping,
      user: userProfiles.get(socket.id)?.name || 'Anonymous'
    });
  });

  // Handle text messages
  socket.on('send_message', (data) => {
    io.emit('receive_message', {
      text: data.text,
      encrypted: data.encrypted,
      userId: socket.id,
      user: userProfiles.get(socket.id)?.name || 'Anonymous',
      timestamp: new Date()
    });
  });

  // Handle voice messages
  socket.on('send_voice', (data) => {
    // Save voice message to a temporary file
    const fileName = `voice_${Date.now()}.wav`;
    const filePath = path.join(__dirname, 'public', 'voices', fileName);
    
    // Ensure voices directory exists
    if (!fs.existsSync(path.join(__dirname, 'public', 'voices'))) {
      fs.mkdirSync(path.join(__dirname, 'public', 'voices'));
    }
    
    fs.writeFile(filePath, data.audio, (err) => {
      if (err) {
        console.error('Error saving voice message:', err);
        return;
      }
      
      io.emit('receive_voice', {
        voice: `/voices/${fileName}`,
        duration: data.duration,
        userId: socket.id,
        user: userProfiles.get(socket.id)?.name || 'Anonymous',
        timestamp: new Date()
      });
    });
  });

  // Handle file uploads
  socket.on('send_file', (data) => {
    io.emit('receive_file', {
      file: data.file,
      userId: socket.id,
      user: userProfiles.get(socket.id)?.name || 'Anonymous',
      timestamp: new Date()
    });
  });

  // Handle message pinning
  socket.on('pin_message', (messageId) => {
    const message = pinnedMessages.find(m => m.id === messageId);
    if (!message) {
      pinnedMessages.push({
        id: messageId,
        timestamp: new Date()
      });
      io.emit('message_pinned', {
        messageId: messageId,
        userId: socket.id,
        user: userProfiles.get(socket.id)?.name || 'Anonymous'
      });
    }
  });

  // Handle message read status
  socket.on('message_read', (messageId) => {
    if (!messageReadStatus.has(messageId)) {
      messageReadStatus.set(messageId, new Set());
    }
    messageReadStatus.get(messageId).add(socket.id);
    
    io.emit('message_read_status', {
      messageId: messageId,
      reader: userProfiles.get(socket.id)?.name || 'Anonymous'
    });
  });

  // Send initial user list to new connection
  socket.emit('user_list', Array.from(connectedUsers.values()));

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.handshake.address);
    userProfiles.delete(socket.id);
    connectedUsers.delete(socket.id);
    io.emit('user_disconnected', socket.id);
    io.emit('user_list', Array.from(connectedUsers.values()));
  });
});

const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';  // Listen on all network interfaces

server.listen(PORT, HOST, () => {
  console.log(`Server running at http://${HOST}:${PORT}`);
  console.log('To connect from other devices:');
  console.log('1. Find your computer\'s IP address');
  console.log('2. Share the IP address with your friends');
  console.log('3. They can connect using: http://YOUR_IP:3001');
});
