const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();
const server = http.createServer(app);

// Configure Socket.IO with more robust settings
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true
});

app.use(express.static('public'));

// Store user profiles with last seen timestamp
const userProfiles = new Map();
const connectedUsers = new Map();
const pinnedMessages = [];
const messageReadStatus = new Map();

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Cleanup function for disconnected users
function cleanupUser(socketId) {
  if (userProfiles.has(socketId)) {
    const profile = userProfiles.get(socketId);
    profile.lastSeen = new Date();
    userProfiles.set(socketId, profile);
  }
  connectedUsers.delete(socketId);
}

// Handle socket connections
io.on('connection', (socket) => {
  console.log('New connection from:', socket.handshake.address);
  
  // Send server info to new connection
  socket.emit('server_info', {
    ip: getLocalIP(),
    port: process.env.PORT || 3001,
    uptime: process.uptime()
  });

  // Handle user profile updates
  socket.on('update_profile', (profile) => {
    try {
      userProfiles.set(socket.id, {
        ...profile,
        lastSeen: new Date(),
        connectionId: socket.id
      });
      
      connectedUsers.set(socket.id, {
        id: socket.id,
        profile: profile,
        address: socket.handshake.address,
        connectedAt: new Date()
      });
      
      io.emit('profile_updated', {
        userId: socket.id,
        profile: profile
      });
      
      io.emit('user_list', Array.from(connectedUsers.values()));
    } catch (error) {
      console.error('Error updating profile:', error);
      socket.emit('error', 'Failed to update profile');
    }
  });

  // Handle typing indicator
  socket.on('typing', (isTyping) => {
    try {
      socket.broadcast.emit('typing', {
        userId: socket.id,
        isTyping: isTyping,
        user: userProfiles.get(socket.id)?.name || 'Anonymous'
      });
    } catch (error) {
      console.error('Error handling typing:', error);
    }
  });

  // Handle text messages
  socket.on('send_message', (data) => {
    try {
      io.emit('receive_message', {
        text: data.text,
        encrypted: data.encrypted,
        userId: socket.id,
        user: userProfiles.get(socket.id)?.name || 'Anonymous',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error sending message:', error);
      socket.emit('error', 'Failed to send message');
    }
  });

  // Handle voice messages
  socket.on('send_voice', (data) => {
    try {
      const fileName = `voice_${Date.now()}.wav`;
      const filePath = path.join(__dirname, 'public', 'voices', fileName);
      
      if (!fs.existsSync(path.join(__dirname, 'public', 'voices'))) {
        fs.mkdirSync(path.join(__dirname, 'public', 'voices'), { recursive: true });
      }
      
      fs.writeFile(filePath, data.audio, (err) => {
        if (err) {
          console.error('Error saving voice message:', err);
          socket.emit('error', 'Failed to save voice message');
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
    } catch (error) {
      console.error('Error handling voice message:', error);
      socket.emit('error', 'Failed to process voice message');
    }
  });

  // Handle file uploads
  socket.on('send_file', (data) => {
    try {
      io.emit('receive_file', {
        file: data.file,
        userId: socket.id,
        user: userProfiles.get(socket.id)?.name || 'Anonymous',
        timestamp: new Date()
      });
    } catch (error) {
      console.error('Error handling file upload:', error);
      socket.emit('error', 'Failed to process file upload');
    }
  });

  // Handle message pinning
  socket.on('pin_message', (messageId) => {
    try {
      const message = pinnedMessages.find(m => m.id === messageId);
      if (!message) {
        pinnedMessages.push({
          id: messageId,
          timestamp: new Date(),
          userId: socket.id
        });
        io.emit('message_pinned', {
          messageId: messageId,
          userId: socket.id,
          user: userProfiles.get(socket.id)?.name || 'Anonymous'
        });
      }
    } catch (error) {
      console.error('Error pinning message:', error);
      socket.emit('error', 'Failed to pin message');
    }
  });

  // Handle message read status
  socket.on('message_read', (messageId) => {
    try {
      if (!messageReadStatus.has(messageId)) {
        messageReadStatus.set(messageId, new Set());
      }
      messageReadStatus.get(messageId).add(socket.id);
      
      io.emit('message_read_status', {
        messageId: messageId,
        reader: userProfiles.get(socket.id)?.name || 'Anonymous'
      });
    } catch (error) {
      console.error('Error updating read status:', error);
    }
  });

  // Send initial user list to new connection
  socket.emit('user_list', Array.from(connectedUsers.values()));

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.handshake.address);
    cleanupUser(socket.id);
    io.emit('user_disconnected', socket.id);
    io.emit('user_list', Array.from(connectedUsers.values()));
  });

  // Handle errors
  socket.on('error', (error) => {
    console.error('Socket error:', error);
    socket.emit('error', 'An error occurred');
  });
});

// Error handling for the server
server.on('error', (error) => {
  console.error('Server error:', error);
});

// Start the server
const PORT = process.env.PORT || 3001;
const HOST = '0.0.0.0';

server.listen(PORT, HOST, () => {
  const localIP = getLocalIP();
  console.log(`Server running at:`);
  console.log(`- Local: http://localhost:${PORT}`);
  console.log(`- Network: http://${localIP}:${PORT}`);
  console.log('\nTo connect from other devices:');
  console.log('1. Make sure port 3001 is open in your firewall');
  console.log('2. Share the Network URL with your friends');
  console.log('3. They can connect using the Network URL');
});
