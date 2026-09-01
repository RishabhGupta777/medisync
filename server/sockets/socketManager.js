module.exports.setupSocket = (io) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join specific rooms if needed
    socket.on('join_demo', () => {
      socket.join('demo_room');
      console.log(`Socket ${socket.id} joined demo_room`);
    });

    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};
