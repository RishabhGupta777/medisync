import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { Settings, Battery, Thermometer, ShieldAlert, Zap, MapPin, User, Activity } from 'lucide-react';

export default function Fleet() {
  const [vehicles, setVehicles] = useState([]);
  const [filter, setFilter] = useState('ALL');
  const { socket } = useSocket();

  const fetchVehicles = async () => {
    try {
      const res = await axios.get('http://localhost:5005/api/vehicles');
      setVehicles(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchVehicles();
    if (!socket) return;

    socket.on('vehicle:telemetry', (telemetry) => {
      setVehicles(prev => prev.map(v => 
        v.vehicleId === telemetry.vehicleId ? { ...v, ...telemetry } : v
      ));
    });

    socket.on('vehicle:updated', fetchVehicles);
    
    return () => {
      socket.off('vehicle:telemetry');
      socket.off('vehicle:updated');
    };
  }, [socket]);

  const filtered = filter === 'ALL' ? vehicles : vehicles.filter(v => v.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Fleet Management & Digital Twin</h1>
        <div className="flex space-x-2">
          {['ALL', 'AVAILABLE', 'EN ROUTE', 'WARNING', 'CRITICAL', 'OFFLINE'].map(f => (
            <button 
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${filter === f ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filtered.map(v => (
          <div key={v.vehicleId} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-bold">{v.vehicleId}</h3>
                <p className="text-sm text-slate-400">{v.registrationNumber}</p>
              </div>
              <span className={`px-3 py-1 text-xs font-bold rounded-full ${
                v.status === 'AVAILABLE' ? 'bg-emerald-500/20 text-emerald-400' :
                v.status === 'EN ROUTE' || v.status === 'REROUTED' ? 'bg-blue-500/20 text-blue-400' :
                v.status === 'WARNING' ? 'bg-yellow-500/20 text-yellow-400' :
                v.status === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-slate-500/20 text-slate-400'
              }`}>
                {v.status}
              </span>
            </div>
            
            <div className="p-4 space-y-4">
              <div className="flex justify-between items-end">
                <div className="space-y-1">
                  <p className="text-sm text-slate-400">Health Score</p>
                  <div className="flex items-baseline space-x-2">
                    <span className={`text-3xl font-bold ${v.healthScore < 50 ? 'text-red-400' : v.healthScore < 80 ? 'text-yellow-400' : 'text-emerald-400'}`}>
                      {Math.round(v.healthScore)}%
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-slate-400">RUL</p>
                  <p className="font-semibold text-lg">{v.rul} days</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-slate-700/50">
                <div className="flex items-center space-x-2 text-sm">
                  <Battery className="w-4 h-4 text-blue-400" />
                  <span className="text-slate-300">{Math.round(v.batteryHealth)}% Battery</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Thermometer className="w-4 h-4 text-red-400" />
                  <span className="text-slate-300">{Math.round(v.temperature)}°C Temp</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <Settings className="w-4 h-4 text-slate-400" />
                  <span className="text-slate-300">{v.rpm || 0} RPM</span>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <ShieldAlert className="w-4 h-4 text-yellow-400" />
                  <span className="text-slate-300">{v.brakeWear}% Brakes</span>
                </div>
              </div>
              
              <div className="pt-4 border-t border-slate-700/50 space-y-2">
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <User className="w-4 h-4" />
                  <span>{v.driver || 'Unassigned'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <MapPin className="w-4 h-4" />
                  <span>{v.location ? `Lat: ${v.location.lat.toFixed(4)}, Lng: ${v.location.lng.toFixed(4)}` : 'Location unavailable'}</span>
                </div>
                <div className="flex items-center space-x-2 text-sm text-slate-400">
                  <Activity className="w-4 h-4" />
                  <span className="truncate">{v.currentEmergency ? `Mission: ${v.currentEmergency.emergencyId} (${v.currentEmergency.type})` : 'No active mission'}</span>
                </div>
              </div>
              
              <div className="pt-2 flex justify-between items-center">
                <p className="text-xs text-slate-500 flex items-center">
                  <Zap className="w-3 h-3 mr-1" />
                  Live Digital Twin Telemetry
                </p>
                <p className={`text-xs font-bold ${v.failureRisk === 'HIGH' ? 'text-red-400' : v.failureRisk === 'MODERATE' ? 'text-yellow-400' : 'text-emerald-400'}`}>
                  Risk: {v.failureRisk}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
