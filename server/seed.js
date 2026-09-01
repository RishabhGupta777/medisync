const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Vehicle = require('./models/Vehicle');
const Hospital = require('./models/Hospital');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

dotenv.config();

const hospitals = [
  { hospitalId: 'HOSP-001', name: 'AIIMS New Delhi', location: { lat: 28.5672, lng: 77.2100 }, erCapacity: 100, occupiedBeds: 72, availableBeds: 28 },
  { hospitalId: 'HOSP-002', name: 'Tata Memorial Hospital', location: { lat: 19.0040, lng: 72.8524 }, erCapacity: 50, occupiedBeds: 45, availableBeds: 5 },
  { hospitalId: 'HOSP-003', name: 'Fortis Bangalore', location: { lat: 12.8943, lng: 77.5975 }, erCapacity: 80, occupiedBeds: 30, availableBeds: 50 },
  { hospitalId: 'HOSP-004', name: 'Apollo Chennai', location: { lat: 13.0617, lng: 80.2520 }, erCapacity: 120, occupiedBeds: 110, availableBeds: 10 },
  { hospitalId: 'HOSP-005', name: 'KIMS Hyderabad', location: { lat: 17.4399, lng: 78.4983 }, erCapacity: 60, occupiedBeds: 20, availableBeds: 40 },
];

const vehicles = [
  { vehicleId: 'AMB-101', registrationNumber: 'DL-A101', location: { lat: 28.5700, lng: 77.2000 }, healthScore: 94, batteryHealth: 87, temperature: 71, brakeWear: 18, rul: 63, failureRisk: 'LOW', driver: 'Rahul Sharma' },
  { vehicleId: 'AMB-102', registrationNumber: 'MH-A102', location: { lat: 19.0100, lng: 72.8400 }, healthScore: 88, batteryHealth: 90, temperature: 75, brakeWear: 25, rul: 55, failureRisk: 'LOW', driver: 'Priya Patel' },
  { vehicleId: 'AMB-204', registrationNumber: 'KA-A204', location: { lat: 12.9000, lng: 77.5800 }, healthScore: 98, batteryHealth: 95, temperature: 68, brakeWear: 10, rul: 120, failureRisk: 'LOW', driver: 'Arjun Kumar' },
  { vehicleId: 'AMB-305', registrationNumber: 'TN-A305', location: { lat: 13.0500, lng: 80.2400 }, healthScore: 61, batteryHealth: 50, temperature: 95, brakeWear: 75, rul: 10, failureRisk: 'HIGH', driver: 'Ananya Singh' },
  { vehicleId: 'AMB-412', registrationNumber: 'TS-A412', location: { lat: 17.4500, lng: 78.5000 }, healthScore: 75, batteryHealth: 70, temperature: 80, brakeWear: 45, rul: 30, failureRisk: 'MODERATE', driver: 'Vikram Reddy', status: 'OFFLINE' },
  // Adding more realistic ambulances around Indian cities
  { vehicleId: 'AMB-501', registrationNumber: 'DL-A501', location: { lat: 28.5800, lng: 77.2200 }, healthScore: 92, batteryHealth: 85, temperature: 72, brakeWear: 20, rul: 60, failureRisk: 'LOW', driver: 'Sneha Gupta' },
  { vehicleId: 'AMB-502', registrationNumber: 'MH-A502', location: { lat: 19.0200, lng: 72.8600 }, healthScore: 85, batteryHealth: 80, temperature: 76, brakeWear: 30, rul: 45, failureRisk: 'LOW', driver: 'Rohan Joshi' },
  { vehicleId: 'AMB-601', registrationNumber: 'KA-A601', location: { lat: 12.9100, lng: 77.6000 }, healthScore: 68, batteryHealth: 60, temperature: 88, brakeWear: 60, rul: 20, failureRisk: 'MODERATE', driver: 'Kavya Rao' },
  { vehicleId: 'AMB-602', registrationNumber: 'TN-A602', location: { lat: 13.0700, lng: 80.2600 }, healthScore: 95, batteryHealth: 92, temperature: 69, brakeWear: 15, rul: 90, failureRisk: 'LOW', driver: 'Manoj Nair' },
  { vehicleId: 'AMB-701', registrationNumber: 'TS-A701', location: { lat: 17.4200, lng: 78.4800 }, healthScore: 90, batteryHealth: 88, temperature: 73, brakeWear: 22, rul: 70, failureRisk: 'LOW', driver: 'Neha Desai' },
];

const users = [
  { username: 'dispatcher', password: 'password123', role: 'Dispatcher' },
  { username: 'manager', password: 'password123', role: 'Fleet Manager' },
  { username: 'hospital', password: 'password123', role: 'Hospital Operator' },
  { username: 'admin', password: 'password123', role: 'Administrator' },
];

mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/medisync')
  .then(async () => {
    console.log('Connected to MongoDB');
    
    await Vehicle.deleteMany({});
    await Hospital.deleteMany({});
    await User.deleteMany({});
    
    // Seed Users
    for (let u of users) {
      const salt = await bcrypt.genSalt(10);
      u.password = await bcrypt.hash(u.password, salt);
    }
    await User.insertMany(users);
    
    await Hospital.insertMany(hospitals);
    await Vehicle.insertMany(vehicles);
    
    console.log('Database seeded!');
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
