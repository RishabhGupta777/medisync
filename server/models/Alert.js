const mongoose = require('mongoose');

const alertSchema = new mongoose.Schema({
  type: { type: String, enum: ['VEHICLE_HEALTH', 'TRAFFIC', 'ROUTE_CHANGE', 'HOSPITAL_OVERLOAD', 'VEHICLE_FAILURE', 'BACKUP_TRIGGERED', 'TELEMETRY_OFFLINE', 'ETA_UPDATE'], required: true },
  severity: { type: String, enum: ['INFO', 'WARNING', 'CRITICAL', 'RESOLVED'], required: true },
  message: { type: String, required: true },
  entityId: { type: String }, // e.g., AMB-204
  resolved: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Alert', alertSchema);
