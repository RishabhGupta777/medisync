const mongoose = require('mongoose');

const emergencySchema = new mongoose.Schema({
  emergencyId: { type: String, required: true, unique: true }, // e.g., EMR-001
  priority: { type: String, enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], default: 'HIGH' },
  type: { type: String, required: true }, // e.g., 'Cardiac Arrest'
  pickupLocation: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    address: { type: String }
  },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  routeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Route' },
  eta: { type: Number }, // in minutes
  status: { type: String, enum: ['CREATED', 'DISPATCHING', 'EN ROUTE', 'REROUTED', 'ARRIVED', 'COMPLETED', 'CRITICAL', 'BACKUP REQUIRED'], default: 'CREATED' },
  timeline: [{
    timestamp: { type: Date, default: Date.now },
    message: String,
    status: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Emergency', emergencySchema);
