const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['Dispatcher', 'Fleet Manager', 'Hospital Operator', 'Administrator'], default: 'Dispatcher' }
});

module.exports = mongoose.model('User', userSchema);
