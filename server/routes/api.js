const express = require('express');
const router = express.Router();

const Vehicle = require('../models/Vehicle');
const Hospital = require('../models/Hospital');
const Emergency = require('../models/Emergency');
const Route = require('../models/Route');
const AIDecision = require('../models/AIDecision');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');

// Dashboard KPIs
router.get('/analytics/kpis', async (req, res) => {
  try {
    const activeEmergencies = await Emergency.countDocuments({ status: { $in: ['DISPATCHING', 'EN ROUTE', 'REROUTED'] } });
    const availableAmbulances = await Vehicle.countDocuments({ status: 'AVAILABLE' });
    const vehiclesAtRisk = await Vehicle.countDocuments({ failureRisk: { $in: ['MODERATE', 'HIGH'] } });
    const activeReroutes = await Route.countDocuments({ status: 'REROUTED' });
    
    // Average Fleet Health
    const vehicles = await Vehicle.find({});
    const avgHealth = vehicles.length > 0 ? (vehicles.reduce((acc, v) => acc + v.healthScore, 0) / vehicles.length).toFixed(1) : 0;
    
    // ER Capacity
    const hospitals = await Hospital.find({});
    const totalErCapacity = hospitals.reduce((acc, h) => acc + h.erCapacity, 0);
    const totalOccupied = hospitals.reduce((acc, h) => acc + h.occupiedBeds, 0);
    const erCapacityStr = totalErCapacity > 0 ? `${totalOccupied} / ${totalErCapacity} (${Math.round((totalOccupied / totalErCapacity) * 100)}%)` : '0 / 0';
    
    // Average ETA
    const emergencies = await Emergency.find({ status: { $in: ['DISPATCHING', 'EN ROUTE', 'REROUTED'] } });
    const avgETA = emergencies.length > 0 ? (emergencies.reduce((acc, e) => acc + (e.eta || 0), 0) / emergencies.length).toFixed(1) : 0;
    
    res.json({
      activeEmergencies,
      availableAmbulances,
      vehiclesAtRisk,
      activeReroutes,
      avgHealth,
      erCapacity: erCapacityStr,
      averageETA: avgETA
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Vehicles
router.get('/vehicles', async (req, res) => {
  try {
    const vehicles = await Vehicle.find({}).populate('currentEmergency');
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/vehicles/:id', async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ vehicleId: req.params.id });
    if (!vehicle) return res.status(404).json({ error: 'Not found' });
    res.json(vehicle);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Claim vehicle for live tracking
router.post('/vehicles/:id/claim', async (req, res) => {
  try {
    const vehicle = await Vehicle.findOne({ vehicleId: req.params.id });
    if (!vehicle) return res.status(404).json({ error: 'Not found' });
    
    vehicle.isLiveTracked = true;
    await vehicle.save();
    
    const io = req.app.get('io');
    if (io) io.emit('vehicle:updated', vehicle);
    
    res.json({ message: 'Vehicle claimed for live tracking', vehicle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update live location and recalculate routing
router.post('/vehicles/:id/location', async (req, res) => {
  try {
    const { lat, lng } = req.body;
    if (!lat || !lng) return res.status(400).json({ error: 'Missing coordinates' });

    const vehicle = await Vehicle.findOne({ vehicleId: req.params.id }).populate('currentEmergency');
    if (!vehicle) return res.status(404).json({ error: 'Not found' });
    
    vehicle.location = { lat, lng };
    await vehicle.save();
    
    const io = req.app.get('io');
    
    if (vehicle.currentEmergency && io) {
      // Very simple ETA recalculation based on straight-line distance (haversine) 
      // In a real app this would use a routing engine like OSRM or Google Maps
      const emergency = vehicle.currentEmergency;
      const hospital = await Hospital.findById(emergency.hospitalId);
      
      if (hospital) {
        // Mock simple recalculation: distance * arbitrary factor
        const dLat = Math.abs(hospital.location.lat - lat);
        const dLng = Math.abs(hospital.location.lng - lng);
        const approxDist = Math.sqrt(dLat * dLat + dLng * dLng) * 111; // roughly km
        const newEta = Math.ceil((approxDist / (vehicle.speed || 50)) * 60) || 1; // minutes
        
        emergency.eta = newEta;
        await emergency.save();
        io.emit('emergency:updated', emergency);
      }
    }
    
    if (io) {
      io.emit('vehicle:telemetry', {
        vehicleId: vehicle.vehicleId,
        rpm: vehicle.rpm,
        temperature: vehicle.temperature,
        speed: vehicle.speed,
        location: vehicle.location,
        healthScore: vehicle.healthScore,
        batteryHealth: vehicle.batteryHealth
      });
    }
    
    res.json({ message: 'Location updated', vehicle });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Hospitals
router.get('/hospitals', async (req, res) => {
  try {
    const hospitals = await Hospital.find({});
    res.json(hospitals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// AI Decisions
router.get('/ai-decisions', async (req, res) => {
  try {
    const decisions = await AIDecision.find({}).sort({ timestamp: -1 }).limit(50);
    res.json(decisions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Alerts
router.get('/alerts', async (req, res) => {
  try {
    const alerts = await Alert.find({}).sort({ timestamp: -1 }).limit(50);
    res.json(alerts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Emergencies
router.get('/emergencies', async (req, res) => {
  try {
    const emergencies = await Emergency.find({}).populate('vehicleId hospitalId').sort({ createdAt: -1 });
    res.json(emergencies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
