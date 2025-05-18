const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Basic Auth Middleware
const basicAuth = (req, res, next) => {
  // Get auth header
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Basic ')) {
    return res.status(401).json({ error: 'Unauthorized: No credentials provided' });
  }
  
  // Decode credentials
  const base64Credentials = authHeader.split(' ')[1];
  const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
  const [username, password] = credentials.split(':');
  
  // Check credentials
  if (username === 'admin' && password === 'admin123') {
    return next();
  }
  
  return res.status(401).json({ error: 'Unauthorized: Invalid credentials' });
};

// Generate mock data
const generateMockData = () => {
  const users = [];
  const chats = [];
  const messages = [];
  const participants = {};
  
  // Generate users
  for (let i = 1; i <= 20; i++) {
    users.push({
      id: `user-${i}`,
      username: `user${i}`,
      email: `user${i}@example.com`,
      created_at: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
      last_login: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
      is_active: Math.random() > 0.2,
      is_verified: Math.random() > 0.3
    });
  }
  
  // Generate chats
  for (let i = 1; i <= 30; i++) {
    const created = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const lastActivity = new Date(Math.max(
      created.getTime(),
      Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
    ));
    const expires = new Date(created);
    expires.setDate(expires.getDate() + 30); // Expires in 30 days
    
    const creatorIndex = Math.floor(Math.random() * users.length);
    const creator = users[creatorIndex];
    
    const participantCount = 1 + Math.floor(Math.random() * 5); // 1-5 participants
    const maxParticipants = Math.max(participantCount, 5 + Math.floor(Math.random() * 6)); // 5-10 max
    
    const chat = {
      id: `chat-${i}`,
      name: `Chat Room ${i}`,
      room_code: `ROOM${1000 + i}`,
      description: Math.random() > 0.3 ? `This is a description for chat room ${i}` : '',
      is_public: Math.random() > 0.5,
      created_by: creator.username,
      owner_id: creator.id,
      participant_count: participantCount,
      max_participants: maxParticipants,
      created_at: created.toISOString(),
      last_activity: lastActivity.toISOString(),
      expires_at: expires.toISOString()
    };
    
    chats.push(chat);
    
    // Generate participants for this chat
    const chatParticipants = [
      {
        id: creator.id,
        chat_id: chat.id,
        username: creator.username,
        email: creator.email,
        joined_at: created.toISOString(),
        last_activity: new Date(Math.max(
          created.getTime(),
          Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000
        )).toISOString(),
        is_owner: true
      }
    ];
    
    // Add other participants
    const remainingParticipantCount = participantCount - 1;
    if (remainingParticipantCount > 0) {
      const availableUsers = users.filter(u => u.id !== creator.id);
      
      for (let j = 0; j < remainingParticipantCount; j++) {
        if (j < availableUsers.length) {
          const joinDate = new Date(Math.max(
            created.getTime(),
            Date.now() - Math.random() * 20 * 24 * 60 * 60 * 1000
          ));
          
          chatParticipants.push({
            id: availableUsers[j].id,
            chat_id: chat.id,
            username: availableUsers[j].username,
            email: availableUsers[j].email,
            joined_at: joinDate.toISOString(),
            last_activity: new Date(Math.max(
              joinDate.getTime(),
              Date.now() - Math.random() * 5 * 24 * 60 * 60 * 1000
            )).toISOString(),
            is_owner: false
          });
        }
      }
    }
    
    participants[chat.id] = chatParticipants;
    
    // Generate messages for this chat
    const messageCount = Math.floor(Math.random() * 50) + 5; // 5-55 messages
    const chatMessages = [];
    
    for (let j = 0; j < messageCount; j++) {
      const senderIndex = Math.floor(Math.random() * chatParticipants.length);
      const sender = chatParticipants[senderIndex];
      const messageTime = new Date(Math.max(
        new Date(sender.joined_at).getTime(),
        created.getTime() + Math.random() * (Date.now() - created.getTime())
      ));
      
      chatMessages.push({
        id: uuidv4(),
        chat_id: chat.id,
        sender_id: sender.id,
        sender_name: sender.username,
        content: `This is message #${j + 1} in chat room ${i}`,
        created_at: messageTime.toISOString()
      });
    }
    
    // Sort messages by time
    chatMessages.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    
    messages[chat.id] = chatMessages;
  }
  
  return { users, chats, messages, participants };
};

const mockData = generateMockData();

// API Routes

// Get all chats with pagination
app.get('/api/admin/chats', basicAuth, (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const status = req.query.status || 'all';
  const search = req.query.search || '';
  
  let filteredChats = [...mockData.chats];
  
  // Apply status filter
  if (status === 'active') {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 1); // 24 hours ago
    filteredChats = filteredChats.filter(chat => 
      new Date(chat.last_activity) > cutoffDate
    );
  } else if (status === 'inactive') {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 1); // 24 hours ago
    filteredChats = filteredChats.filter(chat => 
      new Date(chat.last_activity) <= cutoffDate
    );
  }
  
  // Apply search filter
  if (search) {
    const searchLower = search.toLowerCase();
    filteredChats = filteredChats.filter(chat => 
      chat.name.toLowerCase().includes(searchLower) ||
      chat.description.toLowerCase().includes(searchLower) ||
      chat.room_code.toLowerCase().includes(searchLower) ||
      chat.created_by.toLowerCase().includes(searchLower)
    );
  }
  
  // Sort by last activity (most recent first)
  filteredChats.sort((a, b) => new Date(b.last_activity).getTime() - new Date(a.last_activity).getTime());
  
  const total = filteredChats.length;
  const pages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedChats = filteredChats.slice(startIndex, endIndex);
  
  res.json({
    chats: paginatedChats,
    pagination: {
      page,
      limit,
      pages,
    },
    total
  });
});

// Get chat messages with pagination
app.get('/api/admin/chats/:chatId/messages', basicAuth, (req, res) => {
  const chatId = req.params.chatId;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  
  const chatMessages = mockData.messages[chatId] || [];
  
  // Sort messages by time (newest first for admin view)
  const sortedMessages = [...chatMessages].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  const total = sortedMessages.length;
  const pages = Math.ceil(total / limit);
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedMessages = sortedMessages.slice(startIndex, endIndex);
  
  res.json({
    messages: paginatedMessages,
    pagination: {
      page,
      limit,
      pages,
    },
    total
  });
});

// Get chat participants
app.get('/api/admin/chats/:chatId/participants', basicAuth, (req, res) => {
  const chatId = req.params.chatId;
  const chatParticipants = mockData.participants[chatId] || [];
  
  res.json({
    participants: chatParticipants,
    total: chatParticipants.length
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Mock API server running on port ${PORT}`);
  console.log(`Admin endpoints:`);
  console.log(`- GET /api/admin/chats`);
  console.log(`- GET /api/admin/chats/:chatId/messages`);
  console.log(`- GET /api/admin/chats/:chatId/participants`);
  console.log(`Use Basic Auth with username: admin, password: admin123`);
}); 