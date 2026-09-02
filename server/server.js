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

const PORT = process.env.PORT || 5005;

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    message: 'API running',
    database: mongoose.connection.readyState === 1 ? 'connected' : 'not connected'
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'MediSync API running' });
});

// Load API Routes
const apiRoutes = require('./routes/api');
const demoRoutes = require('./routes/demo');
app.use('/api', apiRoutes);
app.use('/api/demo', demoRoutes);

// Load Sockets
const { setupSocket } = require('./sockets/socketManager');
setupSocket(io);

const startServer = () => {
  server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
};

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI || '').then(() => {
  console.log('MongoDB Connected');
  const { startSimulation } = require('./simulation/simulator');
  startSimulation(io);
}).catch(err => {
  console.log('MongoDB Connection Error: ', err.message || err);
});

startServer();
