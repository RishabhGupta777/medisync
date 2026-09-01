const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleId: { type: String, required: true, unique: true }, // e.g., AMB-204
  registrationNumber: { type: String, required: true },
  type: { type: String, default: 'Ambulance' },
  status: { type: String, enum: ['AVAILABLE', 'EN ROUTE', 'WARNING', 'CRITICAL', 'OFFLINE'], default: 'AVAILABLE' },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  healthScore: { type: Number, default: 100 }, // 0 to 100
  batteryHealth: { type: Number, default: 100 }, // percentage
  temperature: { type: Number, default: 70 }, // Celsius
  rpm: { type: Number, default: 0 },
  brakeWear: { type: Number, default: 0 }, // percentage
  biohazardStatus: { type: String, enum: ['SAFE', 'WARNING', 'DANGER'], default: 'SAFE' },
  speed: { type: Number, default: 0 }, // km/h
  rul: { type: Number, default: 100 }, // Remaining Useful Life in days
  failureRisk: { type: String, enum: ['LOW', 'MODERATE', 'HIGH'], default: 'LOW' },
  driver: { type: String },
  currentEmergency: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency', default: null },
  isLiveTracked: { type: Boolean, default: false },
  lastMaintenance: { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
