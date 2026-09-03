import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Navigation, CarFront, AlertCircle, MapPin, Activity } from 'lucide-react';
import { API_URL } from '../config';

export default function DriverMode() {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [isTracking, setIsTracking] = useState(false);
  const [location, setLocation] = useState(null);
  const [error, setError] = useState('');
  const watchIdRef = useRef(null);

  useEffect(() => {
    fetchVehicles();
    return () => {
      if (watchIdRef.current) navigator.geolocation.clearWatch(watchIdRef.current);
    };
  }, []);

  const fetchVehicles = async () => {
    try {
      const res = await axios.get(`${API_URL}/api/vehicles`);
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleClaimAndStart = async () => {
    if (!selectedVehicle) {
      setError('Please select a vehicle to drive.');
      return;
    }
    
    setError('');
    try {
      await axios.post(`${API_URL}/api/vehicles/${selectedVehicle}/claim`);
      startTracking();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to claim vehicle.');
    }
  };

  const startTracking = () => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser');
      return;
    }

    setIsTracking(true);
    
    watchIdRef.current = navigator.geolocation.watchPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        setLocation({ lat: latitude, lng: longitude });
        
        try {
          await axios.post(`${API_URL}/api/vehicles/${selectedVehicle}/location`, {
            lat: latitude,
            lng: longitude
          });
        } catch (err) {
          console.error('Failed to report location', err);
        }
      },
      (err) => {
        setError(`Location tracking failed: ${err.message}`);
        setIsTracking(false);
      },
      { enableHighAccuracy: true, maximumAge: 0 }
    );
  };

  const stopTracking = () => {
    if (watchIdRef.current) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsTracking(false);
    setLocation(null);
  };

  const activeVehicleData = vehicles.find(v => v.vehicleId === selectedVehicle);

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold flex items-center">
        <CarFront className="w-6 h-6 mr-3 text-blue-400" />
        Driver Live Tracking
      </h1>
      <p className="text-slate-400">Claim a vehicle and broadcast your live device GPS to the Command Center.</p>
      
      {error && (
        <div className="bg-red-500/20 border border-red-500/50 text-red-400 p-4 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 mr-3 flex-shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {!isTracking ? (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Select Vehicle to Drive</label>
            <select 
              className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg p-3 outline-none focus:border-blue-500 transition-colors"
              value={selectedVehicle}
              onChange={(e) => setSelectedVehicle(e.target.value)}
            >
              <option value="">-- Choose an ambulance --</option>
              {vehicles.map(v => (
                <option key={v.vehicleId} value={v.vehicleId}>
                  {v.vehicleId} - {v.registrationNumber} ({v.status})
                </option>
              ))}
            </select>
          </div>
          
          <button 
            onClick={handleClaimAndStart}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-lg flex items-center justify-center transition-colors"
          >
            <Navigation className="w-5 h-5 mr-2" />
            Start Live Tracking
          </button>
        </div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-emerald-400 flex items-center">
                <span className="relative flex h-3 w-3 mr-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                Tracking Active
              </h2>
              <p className="text-slate-400 mt-1">Driving as <span className="text-white font-bold">{selectedVehicle}</span></p>
            </div>
            <button 
              onClick={stopTracking}
              className="bg-red-500/20 hover:bg-red-500/30 text-red-400 border border-red-500/50 px-4 py-2 rounded-lg font-bold transition-colors"
            >
              Stop Tracking
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg">
              <p className="text-sm text-slate-400 mb-1 flex items-center">
                <MapPin className="w-4 h-4 mr-1" /> Current GPS
              </p>
              {location ? (
                <p className="font-mono font-medium">
                  Lat: {location.lat.toFixed(6)}<br/>
                  Lng: {location.lng.toFixed(6)}
                </p>
              ) : (
                <p className="text-slate-500 italic">Acquiring signal...</p>
              )}
            </div>
            
            <div className="bg-slate-900 border border-slate-700 p-4 rounded-lg">
              <p className="text-sm text-slate-400 mb-1 flex items-center">
                <Activity className="w-4 h-4 mr-1" /> Active Mission
              </p>
              {activeVehicleData?.currentEmergency ? (
                <p className="font-medium text-emerald-400">En Route to Hospital</p>
              ) : (
                <p className="text-slate-500">No active mission</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
