const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');
const Emergency = require('../models/Emergency');
const AIDecision = require('../models/AIDecision');
const Alert = require('../models/Alert');
const Notification = require('../models/Notification');
const Hospital = require('../models/Hospital');

// POST /api/demo/start-live
router.post('/start-live', async (req, res) => {
  try {
    const io = req.app.get('io');
    
    // 1. Create emergency
    const pickupLocation = { lat: 40.7500, lng: -73.9900 };
    
    // Select an available vehicle
    const vehicle = await Vehicle.findOne({ status: 'AVAILABLE' }).sort({ healthScore: -1 });
    if (!vehicle) return res.status(400).json({ error: 'No available vehicles' });
    
    // Select hospital
    const hospital = await Hospital.findOne({ status: 'NORMAL' });
    
    const emergency = new Emergency({
      emergencyId: `EMR-${Math.floor(1000 + Math.random() * 9000)}`,
      priority: 'HIGH',
      type: 'Cardiac Arrest',
      pickupLocation,
      vehicleId: vehicle._id,
      hospitalId: hospital._id,
      eta: 12,
      status: 'EN ROUTE',
      timeline: [{ message: 'Emergency Created', status: 'CREATED' }]
    });
    
    await emergency.save();
    
    vehicle.status = 'EN ROUTE';
    vehicle.currentEmergency = emergency._id;
    await vehicle.save();
    
    // Log AI Decision
    const decision = new AIDecision({
      type: 'VEHICLE_SELECTION',
      emergencyId: emergency._id,
      entityId: vehicle.vehicleId,
      decision: `${vehicle.vehicleId} Selected`,
      score: 94,
      confidence: 92,
      reason: 'Excellent health, low failure risk, fast ETA.'
    });
    await decision.save();
    
    const notification = new Notification({
      message: `Emergency started. ${vehicle.vehicleId} en route.`,
      type: 'INFO'
    });
    await notification.save();
    
    io.emit('emergency:created', emergency);
    io.emit('vehicle:updated', vehicle);
    io.emit('notification:new', notification);
    io.emit('ai:decision', decision);
    
    res.json({ message: 'Live demo started', emergency });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/demo/traffic-spike
router.post('/traffic-spike', async (req, res) => {
  try {
    const io = req.app.get('io');
    
    const emergency = await Emergency.findOne({ status: 'EN ROUTE' }).populate('vehicleId');
    if (!emergency) return res.status(400).json({ error: 'No active emergency en route' });
    
    // Increase ETA
    emergency.eta += 9;
    emergency.timeline.push({ message: 'Traffic Spike Detected. Re-routing.', status: 'REROUTED' });
    emergency.status = 'REROUTED';
    await emergency.save();
    
    const alert = new Alert({
      type: 'TRAFFIC',
      severity: 'WARNING',
      message: `Traffic detected on route for ${emergency.emergencyId}. ETA increased by 9 mins.`,
    });
    await alert.save();
    
    const decision = new AIDecision({
      type: 'REROUTE',
      emergencyId: emergency._id,
      entityId: emergency.vehicleId.vehicleId,
      decision: 'Route Changed',
      score: 97,
      confidence: 96,
      reason: 'Traffic increased ETA. Selected alternative route.'
    });
    await decision.save();
    
    const notification = new Notification({
      message: `Rerouting ${emergency.vehicleId.vehicleId} due to traffic.`,
      type: 'WARNING'
    });
    await notification.save();
    
    io.emit('emergency:updated', emergency);
    io.emit('alert:new', alert);
    io.emit('ai:decision', decision);
    io.emit('notification:new', notification);
    
    res.json({ message: 'Traffic spike simulated', emergency });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/demo/vehicle-failure
router.post('/vehicle-failure', async (req, res) => {
  try {
    const io = req.app.get('io');
    
    const vehicle = await Vehicle.findOne({ status: 'EN ROUTE' });
    if (!vehicle) return res.status(400).json({ error: 'No active vehicle en route' });
    
    vehicle.status = 'CRITICAL';
    vehicle.healthScore = 15;
    vehicle.failureRisk = 'HIGH';
    await vehicle.save();
    
    const alert = new Alert({
      type: 'VEHICLE_FAILURE',
      severity: 'CRITICAL',
      message: `${vehicle.vehicleId} has experienced a critical failure.`,
      entityId: vehicle.vehicleId
    });
    await alert.save();
    
    io.emit('vehicle:failure', vehicle);
    io.emit('alert:new', alert);
    
    // Fail-safe backup
    const backupVehicle = await Vehicle.findOne({ status: 'AVAILABLE' }).sort({ healthScore: -1 });
    if (backupVehicle) {
      backupVehicle.status = 'EN ROUTE';
      backupVehicle.currentEmergency = vehicle.currentEmergency;
      await backupVehicle.save();
      
      const emergency = await Emergency.findById(vehicle.currentEmergency);
      if (emergency) {
        emergency.vehicleId = backupVehicle._id;
        emergency.timeline.push({ message: `Backup vehicle ${backupVehicle.vehicleId} assigned`, status: 'BACKUP REQUIRED' });
        await emergency.save();
        io.emit('emergency:updated', emergency);
      }
      
      const decision = new AIDecision({
        type: 'BACKUP_SELECTION',
        emergencyId: emergency._id,
        entityId: backupVehicle.vehicleId,
        decision: `${backupVehicle.vehicleId} assigned as backup`,
        reason: 'Primary vehicle failed. Backup has optimal health and proximity.'
      });
      await decision.save();
      
      io.emit('ai:decision', decision);
      io.emit('vehicle:updated', backupVehicle);
    }
    
    res.json({ message: 'Vehicle failure simulated', vehicle, backup: backupVehicle });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
