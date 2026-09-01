const express = require('express');
const http = require('http');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const { Server } = require('socket.io');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

// Set socket.io on app object for access in routes
app.set('io', io);

const PORT = process.env.PORT || 5000;

// Load API Routes
const apiRoutes = require('./routes/api');
const demoRoutes = require('./routes/demo');
app.use('/api', apiRoutes);
app.use('/api/demo', demoRoutes);


// Load Sockets
const { setupSocket } = require('./sockets/socketManager');
setupSocket(io);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI).then(() => {
  console.log('MongoDB Connected');
  // Start simulation engine
  const { startSimulation } = require('./simulation/simulator');
  startSimulation(io);
}).catch(err => console.log('MongoDB Connection Error: ', err));

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
