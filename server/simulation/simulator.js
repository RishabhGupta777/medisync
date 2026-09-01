let simulationInterval;
const Vehicle = require('../models/Vehicle');
const Hospital = require('../models/Hospital');
const Emergency = require('../models/Emergency');
const AIDecision = require('../models/AIDecision');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');

let systemIo;

module.exports.startSimulation = (io) => {
  console.log('Simulation engine started');
  systemIo = io;
  
  // Every 5 seconds update telemetry for EN ROUTE vehicles
  simulationInterval = setInterval(async () => {
    try {
      const activeVehicles = await Vehicle.find({ status: { $in: ['EN ROUTE', 'REROUTED'] }, isLiveTracked: { $ne: true } });
      
      for (let v of activeVehicles) {
        // slightly fluctuate values
        v.rpm = Math.floor(Math.random() * (2500 - 1500) + 1500);
        v.temperature = 70 + Math.random() * 5;
        v.speed = Math.floor(Math.random() * (80 - 40) + 40);
        v.batteryHealth -= 0.01;
        
        // Move towards destination (simplified: slightly change location)
        // For a real demo, we'd interpolate along a route polyline
        v.location.lat += (Math.random() - 0.5) * 0.001;
        v.location.lng += (Math.random() - 0.5) * 0.001;
        
        await v.save();
        
        io.emit('vehicle:telemetry', {
          vehicleId: v.vehicleId,
          rpm: v.rpm,
          temperature: v.temperature,
          speed: v.speed,
          location: v.location,
          healthScore: v.healthScore,
          batteryHealth: v.batteryHealth
        });
      }
      
    } catch (err) {
      console.error('Simulation Error:', err);
    }
  }, 5000);
};

module.exports.stopSimulation = () => {
  if (simulationInterval) clearInterval(simulationInterval);
};

// Expose io for external route access
module.exports.getIo = () => systemIo;
