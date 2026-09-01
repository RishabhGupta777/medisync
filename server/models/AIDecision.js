const mongoose = require('mongoose');

const aiDecisionSchema = new mongoose.Schema({
  type: { type: String, enum: ['VEHICLE_SELECTION', 'HOSPITAL_SELECTION', 'REROUTE', 'BACKUP_SELECTION'], required: true },
  emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency' },
  entityId: { type: String }, // Can be Vehicle ID or Hospital ID or Route ID
  decision: { type: String, required: true },
  score: { type: Number },
  confidence: { type: Number },
  factors: mongoose.Schema.Types.Mixed, // Object containing sub-scores
  alternatives: mongoose.Schema.Types.Mixed, // Rejected options
  reason: { type: String },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('AIDecision', aiDecisionSchema);
