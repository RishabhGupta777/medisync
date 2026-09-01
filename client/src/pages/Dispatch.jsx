import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { CheckCircle, AlertTriangle } from 'lucide-react';

export default function Dispatch() {
  const [emergencies, setEmergencies] = useState([]);
  const { socket } = useSocket();

  const fetchEmergencies = async () => {
    try {
      const res = await axios.get('http://localhost:5005/api/emergencies');
      setEmergencies(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchEmergencies();
    if (!socket) return;
    
    socket.on('emergency:created', fetchEmergencies);
    socket.on('emergency:updated', fetchEmergencies);
    
    return () => {
      socket.off('emergency:created', fetchEmergencies);
      socket.off('emergency:updated', fetchEmergencies);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Live Dispatch & Emergencies</h1>
        <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
          + New Emergency
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {emergencies.map(e => (
          <div key={e._id} className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden flex flex-col md:flex-row">
            <div className="p-6 md:w-1/3 border-r border-slate-700">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-100">{e.emergencyId}</h3>
                  <p className="text-sm text-red-400 font-medium">{e.type}</p>
                </div>
                <span className={`px-2 py-1 text-xs font-bold rounded ${e.priority === 'HIGH' || e.priority === 'CRITICAL' ? 'bg-red-500/20 text-red-400' : 'bg-yellow-500/20 text-yellow-400'}`}>
                  {e.priority}
                </span>
              </div>
              <div className="space-y-2 text-sm text-slate-300">
                <p>Status: <strong className="text-blue-400">{e.status}</strong></p>
                <p>ETA: <strong>{e.eta || '--'} min</strong></p>
                {e.vehicleId && <p>Ambulance: <strong>{e.vehicleId.vehicleId}</strong></p>}
                {e.hospitalId && <p>Destination: <strong>{e.hospitalId.name}</strong></p>}
              </div>
            </div>
            
            <div className="p-6 md:w-2/3 bg-slate-800/50">
              <h4 className="text-sm font-semibold text-slate-400 mb-4 uppercase tracking-wider">Emergency Timeline</h4>
              <div className="space-y-4">
                {e.timeline.map((event, idx) => (
                  <div key={idx} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${idx === e.timeline.length - 1 ? 'bg-blue-500' : 'bg-slate-500'}`} />
                      {idx !== e.timeline.length - 1 && <div className="w-0.5 h-full bg-slate-700 my-1" />}
                    </div>
                    <div>
                      <p className={`text-sm ${idx === e.timeline.length - 1 ? 'text-slate-200' : 'text-slate-400'}`}>
                        {event.message}
                      </p>
                      <p className="text-xs text-slate-500">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
        {emergencies.length === 0 && (
          <div className="text-center p-12 text-slate-400 border border-dashed border-slate-700 rounded-xl">
            No active emergencies.
          </div>
        )}
      </div>
    </div>
  );
}
