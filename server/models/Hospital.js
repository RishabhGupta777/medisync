const mongoose = require('mongoose');

const hospitalSchema = new mongoose.Schema({
  hospitalId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  location: {
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },
  erCapacity: { type: Number, required: true },
  occupiedBeds: { type: Number, default: 0 },
  availableBeds: { type: Number, required: true },
  incomingPatients: { type: Number, default: 0 },
  handoffTime: { type: Number, default: 5 }, // minutes
  status: { type: String, enum: ['NORMAL', 'MODERATE', 'OVERLOADED'], default: 'NORMAL' }
}, { timestamps: true });

hospitalSchema.pre('save', function(next) {
  this.availableBeds = this.erCapacity - this.occupiedBeds;
  if (this.availableBeds < 0) this.availableBeds = 0;
  
  const loadPercentage = this.occupiedBeds / this.erCapacity;
  if (loadPercentage > 0.9) {
    this.status = 'OVERLOADED';
  } else if (loadPercentage > 0.7) {
    this.status = 'MODERATE';
  } else {
    this.status = 'NORMAL';
  }
  next();
});

module.exports = mongoose.model('Hospital', hospitalSchema);
