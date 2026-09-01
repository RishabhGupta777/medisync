const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
  emergencyId: { type: mongoose.Schema.Types.ObjectId, ref: 'Emergency' },
  vehicleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: 'Hospital' },
  pathCoordinates: [{
    lat: Number,
    lng: Number
  }],
  distance: { type: Number }, // km
  eta: { type: Number }, // minutes
  trafficCondition: { type: String, enum: ['LOW', 'MODERATE', 'HEAVY', 'STANDSTILL'], default: 'LOW' },
  status: { type: String, enum: ['OPTIMAL', 'SUBOPTIMAL', 'REROUTED'], default: 'OPTIMAL' },
  alternativeRoutes: [{
    pathCoordinates: [{ lat: Number, lng: Number }],
    distance: Number,
    eta: Number,
    trafficCondition: String
  }]
}, { timestamps: true });

module.exports = mongoose.model('Route', routeSchema);
