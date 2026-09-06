const { Server } = require('socket.io');
const Message = require('../models/Message');

let io;

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

    // Join Workspace Room
    socket.on('join_workspace', (workspaceId) => {
      socket.join(`workspace:${workspaceId}`);
      console.log(`Socket ${socket.id} joined workspace:${workspaceId}`);
    });

    // Join private User Room
    socket.on('join_user', (userId) => {
      socket.join(`user:${userId}`);
      console.log(`Socket ${socket.id} joined user:${userId}`);
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
        
        // Create message in DB
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
      // Broadcast to project room
      socket.to(`project:${data.projectId}`).emit('task_updated', data.task);
    });

    // Handle user disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
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
