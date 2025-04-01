require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const { Server } = require('socket.io');

const app = express();

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());

const userRoutes = require('./routes/userRoutes');
const consultationRoutes = require('./routes/consultationRoutes');

app.use('/api/users', userRoutes);
app.use('/api/consultation', consultationRoutes);
// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/profile-pictures');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Serve static files with proper CORS headers
app.use('/uploads/profile-pictures', (req, res, next) => {
  // Use the same CORS settings as the main app for consistency
  const allowedOrigins = ['http://localhost:5173', 'http://localhost:5001'];
  const origin = req.headers.origin;
  if (allowedOrigins.includes(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
    res.header('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');
    res.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
  }
  
  // Handle preflight OPTIONS requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Set proper content type for images based on file extension
  const filePath = path.join(uploadDir, req.path);
  if (fs.existsSync(filePath)) {
    const ext = path.extname(filePath).toLowerCase();
    if (ext === '.jpg' || ext === '.jpeg') {
      res.type('image/jpeg');
    } else if (ext === '.png') {
      res.type('image/png');
    } else if (ext === '.gif') {
      res.type('image/gif');
    } else if (ext === '.webp') {
      res.type('image/webp');
    }
  }
  
  next();
});

app.use('/uploads/profile-pictures', express.static(uploadDir, {
  maxAge: '1d',
  etag: true,
  setHeaders: function(res, req) {
    // Firefox-specific CORS headers - these are critical for Firefox compatibility
    res.set('Cross-Origin-Resource-Policy', 'cross-origin');
    res.set('Cross-Origin-Embedder-Policy', 'credentialless');
    const origin = req.headers.origin;
    if (['http://localhost:5173', 'http://localhost:5001'].includes(origin)) {
      res.set('Access-Control-Allow-Origin', origin);
    }
    res.set('Access-Control-Allow-Credentials', 'true');
    res.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  }
}));

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal Server Error', error: err.message });
});

// MongoDB Connection with retry logic and event handling
const connectWithRetry = async (retries = 5, interval = 5000) => {
  for (let i = 0; i < retries; i++) {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000,
        heartbeatFrequencyMS: 1000,
        maxPoolSize: 10,
        minPoolSize: 2,
        socketTimeoutMS: 45000,
        family: 4
      });
      console.log('Connected to MongoDB');
      return;
    } catch (err) {
      console.error(`MongoDB connection attempt ${i + 1} failed:`, err);
      if (i === retries - 1) {
        console.error('Max retries reached. Exiting...');
        process.exit(1);
      }
      await new Promise(resolve => setTimeout(resolve, interval));
    }
  }
};

// MongoDB connection event handlers
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected from MongoDB');
  connectWithRetry(); // Attempt to reconnect
});

// Handle process termination
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    console.log('Mongoose connection closed through app termination');
    process.exit(0);
  } catch (err) {
    console.error('Error closing Mongoose connection:', err);
    process.exit(1);
  }
});

connectWithRetry();

// Import routes
const authRoutes = require('./routes/auth');
const apiRoutes = require('./routes/api');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api', apiRoutes);

// Basic route
app.get('/', (req, res) => {
  res.json({ message: 'Welcome to Agro-Connected API' });
});

// Handle preflight requests
app.options('*', cors());

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error details:', {
    message: err.message,
    stack: err.stack,
    timestamp: new Date().toISOString()
  });

  // Handle specific types of errors
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      message: 'Validation Error',
      details: err.message
    });
  }

  if (err.name === 'MongoError' || err.name === 'MongoServerError') {
    return res.status(503).json({
      message: 'Database Error',
      details: 'A database error occurred'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

const startServer = async (port) => {
  try {
    await new Promise((resolve, reject) => {
      const server = http.createServer(app);
      
      // Initialize Socket.io with improved configuration
      const io = new Server(server, {
        cors: {
          origin: 'http://localhost:5173',
          methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
          credentials: true,
          allowedHeaders: ['Content-Type', 'Authorization', 'Origin', 'X-Requested-With', 'Accept'],
          exposedHeaders: ['Content-Length', 'Content-Type']
        },
        allowEIO3: true,
        transports: ['polling', 'websocket'], // Prioritize polling first for better compatibility
        pingTimeout: 60000, // Increase ping timeout to 60 seconds
        pingInterval: 25000, // Set ping interval to 25 seconds
        upgradeTimeout: 30000, // Increase upgrade timeout
        maxHttpBufferSize: 1e8, // Increase buffer size for larger messages
        path: '/socket.io/' // Explicitly set the path
      });
      
      // Make io accessible to our routes
      app.set('io', io);
      
      // Socket.io connection handling with improved error handling and monitoring
      io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);
        
        // Monitor socket health
        const pingInterval = setInterval(() => {
          socket.emit('ping');
        }, 25000);
        
        socket.on('pong', () => {
          socket.isAlive = true;
        });
        
        // Error handling for socket events
        socket.on('error', (error) => {
          console.error('Socket error for', socket.id, ':', error);
          socket.emit('error_notification', { message: 'An error occurred' });
        });
        
        // Track rooms joined by this socket for cleanup on disconnect
        const joinedRooms = new Set();
        
        // Join a chat room or user's personal room
        socket.on('join_chat', (chatId) => {
          if (!chatId) return;
          
          socket.join(chatId);
          joinedRooms.add(chatId);
          console.log(`User ${socket.id} joined chat/room: ${chatId}`);
          
          // Acknowledge successful join
          socket.emit('join_chat_ack', { chatId, success: true });
        });
        
        // Leave a chat room
        socket.on('leave_chat', (chatId) => {
          if (!chatId) return;
          
          socket.leave(chatId);
          joinedRooms.delete(chatId);
          console.log(`User ${socket.id} left chat: ${chatId}`);
        });
        
        // Handle new message with acknowledgment
        socket.on('send_message', async (messageData, ack) => {
          if (!messageData || !messageData.chatId || !messageData.message) {
            if (typeof ack === 'function') ack({ success: false, error: 'Invalid message data' });
            return;
          }
          
          try {
            // Get the chat details to verify participants
            const Chat = require('./models/Chat');
            const chat = await Chat.findById(messageData.chatId);
            
            if (!chat) {
              if (typeof ack === 'function') ack({ success: false, error: 'Chat not found' });
              return;
            }
            
            // Verify sender is a participant in the chat
            const senderId = messageData.message.sender;
            if (!chat.participants.includes(senderId)) {
              if (typeof ack === 'function') ack({ success: false, error: 'Not authorized to send messages in this chat' });
              return;
            }
            
            console.log(`Broadcasting message to chat: ${messageData.chatId}`, messageData);
            // Ensure message has all required fields
            const message = {
              ...messageData.message,
              timestamp: messageData.message.timestamp || new Date(),
              _id: messageData.message._id || `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
            };
            
            // Broadcast to all participants in the chat room except sender
            chat.participants.forEach(participantId => {
              if (participantId.toString() !== senderId.toString()) {
                io.to(`user_${participantId}`).emit('receive_message', {
                  chatId: messageData.chatId,
                  message: message
                });
              }
            });
            
            // Send acknowledgment with the processed message
            if (typeof ack === 'function') ack({ success: true, message });

          } catch (error) {
            console.error('Error broadcasting message:', error);
            if (typeof ack === 'function') ack({ success: false, error: 'Failed to broadcast message' });
          }
        });
        
        // Handle friend request
        socket.on('send_friend_request', (requestData, ack) => {
          if (!requestData || !requestData.recipientId) {
            if (typeof ack === 'function') ack({ success: false, error: 'Invalid request data' });
            return;
          }
          
          try {
            console.log(`Sending friend request notification to: user_${requestData.recipientId}`);
            // Send to recipient's personal room
            socket.to(`user_${requestData.recipientId}`).emit('new_friend_request', requestData);
            
            // Send acknowledgment if callback provided
            if (typeof ack === 'function') ack({ success: true });
          } catch (error) {
            console.error('Error sending friend request notification:', error);
            if (typeof ack === 'function') ack({ success: false, error: 'Failed to send notification' });
          }
        });
        
        // Handle typing indicator
        socket.on('typing', (data) => {
          if (!data || !data.chatId) return;
          socket.to(data.chatId).emit('typing', data);
        });
        
        // Handle stop typing
        socket.on('stop_typing', (data) => {
          if (!data || !data.chatId) return;
          socket.to(data.chatId).emit('stop_typing', data);
        });
        
        // Handle errors
        socket.on('error', (error) => {
          console.error('Socket error:', error);
        });
        
        // Handle disconnection with cleanup
        socket.on('disconnect', (reason) => {
          console.log('A user disconnected:', socket.id, 'Reason:', reason);
          
          // Clean up intervals and socket state
          clearInterval(pingInterval);
          
          // Clean up any joined rooms
          joinedRooms.forEach(room => {
            socket.leave(room);
            // Notify other users in the room
            io.to(room).emit('user_left', { userId: socket.id });
          });
          joinedRooms.clear();
          
          // Remove socket from any custom maps or states
          socket.removeAllListeners();
        });
      });
      
      server.listen(port)
        .once('listening', () => {
          console.log(`Server is running on port ${port}`);
          resolve();
        })
        .once('error', (err) => {
          if (err.code === 'EADDRINUSE') {
            console.log(`Port ${port} is busy, trying next port...`);
            server.close();
            resolve(startServer(port + 1));
          } else {
            reject(err);
          }
        });

      // Graceful shutdown
      process.on('SIGTERM', () => {
        server.close(() => {
          console.log('Server closed gracefully');
          process.exit(0);
        });
      });
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

const PORT = process.env.PORT || 5000;
startServer(PORT);