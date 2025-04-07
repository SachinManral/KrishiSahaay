const socketIO = require('socket.io');

module.exports = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST']
    }
  });

  // Store active users
  const activeUsers = {};
  const rooms = {};

  io.on('connection', (socket) => {
    console.log('New client connected:', socket.id);

    // User joins with their info
    socket.on('user_connected', (userData) => {
      activeUsers[socket.id] = userData;
      io.emit('active_users', Object.values(activeUsers));
    });

    // Join a room for video/audio call
    socket.on('join_room', (roomId, userName) => {
      socket.join(roomId);
      
      if (!rooms[roomId]) {
        rooms[roomId] = { users: [] };
      }
      
      rooms[roomId].users.push({
        id: socket.id,
        name: userName
      });
      
      // Notify everyone in the room
      io.to(roomId).emit('user_joined', {
        roomId,
        users: rooms[roomId].users
      });
      
      // Send system message
      io.to(roomId).emit('chat_message', {
        system: true,
        message: `${userName} has joined the room`
      });
    });

    // Handle chat messages
    socket.on('send_message', (roomId, message, userName) => {
      io.to(roomId).emit('chat_message', {
        user: userName,
        message,
        time: new Date().toISOString()
      });
    });

    // Handle WebRTC signaling
    socket.on('signal', (roomId, signal, targetId) => {
      if (targetId) {
        io.to(targetId).emit('signal', {
          signal,
          from: socket.id
        });
      } else {
        socket.to(roomId).emit('signal', {
          signal,
          from: socket.id
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
      
      // Remove user from active users
      delete activeUsers[socket.id];
      io.emit('active_users', Object.values(activeUsers));
      
      // Remove user from all rooms
      for (const roomId in rooms) {
        const room = rooms[roomId];
        const userIndex = room.users.findIndex(user => user.id === socket.id);
        
        if (userIndex !== -1) {
          const userName = room.users[userIndex].name;
          room.users.splice(userIndex, 1);
          
          // Notify others in the room
          io.to(roomId).emit('user_left', {
            roomId,
            users: room.users
          });
          
          // Send system message
          io.to(roomId).emit('chat_message', {
            system: true,
            message: `${userName} has left the room`
          });
          
          // Clean up empty rooms
          if (room.users.length === 0) {
            delete rooms[roomId];
          }
        }
      }
    });
  });

  return io;
};