const { Server } = require('socket.io');
const Message = require('../models/Message');

let io;
// In-memory online user tracking (userId -> Set of active socket.id's)
const onlineUsersMap = new Map();

const initSocket = (server) => {
  const rawClientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
  const clientUrlNoSlash = rawClientUrl.replace(/\/$/, '');
  const clientUrlWithSlash = `${clientUrlNoSlash}/`;

  io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (
          !origin ||
          origin === clientUrlNoSlash ||
          origin === clientUrlWithSlash ||
          origin.endsWith('.vercel.app') ||
          origin === 'http://localhost:5173'
        ) {
          callback(null, true);
        } else {
          callback(null, true);
        }
      },
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Request current online users list
    socket.on('get_online_users', () => {
      socket.emit('online_users_list', Array.from(onlineUsersMap.keys()));
    });

    // Join Workspace Room
    socket.on('join_workspace', (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(`Socket ${socket.id} joined workspace:${workspaceId}`);
    });

    // Join private User Room & Track Presence
    socket.on('join_user', (userId) => {
      if (!userId) return;
      socket.join(`user:${userId}`);
      socket.userId = userId.toString();

      if (!onlineUsersMap.has(socket.userId)) {
        onlineUsersMap.set(socket.userId, new Set());
      }
      onlineUsersMap.get(socket.userId).add(socket.id);

      console.log(`Socket ${socket.id} joined user:${userId} (User is ONLINE)`);

      // Broadcast online status to all connected clients
      io.emit('user_presence_change', {
        userId: socket.userId,
        isOnline: true,
        onlineUserIds: Array.from(onlineUsersMap.keys())
      });

      // Send initial list back to connecting client
      socket.emit('online_users_list', Array.from(onlineUsersMap.keys()));
    });

    // Leave Workspace Room
    socket.on('leave_workspace', (workspaceId) => {
      socket.leave(`workspace:${workspaceId}`);
      console.log(`Socket ${socket.id} left workspace:${workspaceId}`);
    });

    // Join Project Room (for Kanban & Project Chat)
    socket.on('join_project', (projectId) => {
      socket.join(`project:${projectId}`);
      console.log(`Socket ${socket.id} joined project:${projectId}`);
    });

    // Leave Project Room
    socket.on('leave_project', (projectId) => {
      socket.leave(`project:${projectId}`);
      console.log(`Socket ${socket.id} left project:${projectId}`);
    });

    // Send Chat Message Event
    socket.on('send_message', async (data) => {
      try {
        const { text, workspaceId, projectId, senderId, attachments } = data;
        
        const message = await Message.create({
          sender: senderId,
          text,
          workspaceId,
          projectId: projectId || null,
          attachments: attachments || []
        });

        const populatedMsg = await Message.findById(message._id).populate('sender', 'name email avatar');

        const room = projectId ? `project:${projectId}` : `workspace:${workspaceId}`;
        io.to(room).emit('receive_message', populatedMsg);
      } catch (err) {
        console.error('Socket message save error:', err);
      }
    });

    // Task drag/update notification event
    socket.on('task_moved', (data) => {
      socket.to(`project:${data.projectId}`).emit('task_updated', data.task);
    });

    // Handle user disconnect & presence update
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      if (socket.userId && onlineUsersMap.has(socket.userId)) {
        const userSockets = onlineUsersMap.get(socket.userId);
        userSockets.delete(socket.id);

        if (userSockets.size === 0) {
          onlineUsersMap.delete(socket.userId);
          console.log(`User ${socket.userId} is now OFFLINE`);

          // Broadcast offline status to all connected clients
          io.emit('user_presence_change', {
            userId: socket.userId,
            isOnline: false,
            onlineUserIds: Array.from(onlineUsersMap.keys())
          });
        }
      }
    });
  });

  return io;
};

const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
};

module.exports = { initSocket, getIO };
