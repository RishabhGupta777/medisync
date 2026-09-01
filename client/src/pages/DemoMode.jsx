import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import { PlayCircle, AlertTriangle, CarFront, Activity } from 'lucide-react';

export default function DemoMode() {
  const [loading, setLoading] = useState(false);
  const [decisions, setDecisions] = useState([]);
  const { socket } = useSocket();

  useEffect(() => {
    fetchDecisions();
    if (!socket) return;
    
    socket.on('ai:decision', (decision) => {
      setDecisions(prev => [decision, ...prev].slice(0, 10));
    });
    
    return () => socket.off('ai:decision');
  }, [socket]);

  const fetchDecisions = async () => {
    try {
      const res = await axios.get('http://localhost:5005/api/ai-decisions');
      setDecisions(res.data.slice(0, 10));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAction = async (action) => {
    setLoading(true);
    try {
      await axios.post(`http://localhost:5005/api/demo/${action}`);
    } catch (err) {
      alert(err.response?.data?.error || 'Action failed');
    }
    setLoading(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Demo Mode / Simulations</h1>
      <p className="text-slate-400">Trigger system events to observe MediSync-DT's automated responses and Explainable AI.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold flex items-center"><PlayCircle className="w-5 h-5 mr-2 text-blue-400"/> Actions</h2>
          
          <button 
            disabled={loading}
            onClick={() => handleAction('start-live')}
            className="w-full text-left p-4 rounded-lg bg-blue-600/20 border border-blue-500/30 hover:bg-blue-600/30 transition-colors"
          >
            <h3 className="font-bold text-blue-400 mb-1">1. Start Live Demo</h3>
            <p className="text-sm text-slate-300">Creates an emergency, runs AI vehicle/hospital selection, and begins journey.</p>
          </button>

          <button 
            disabled={loading}
            onClick={() => handleAction('traffic-spike')}
            className="w-full text-left p-4 rounded-lg bg-orange-600/20 border border-orange-500/30 hover:bg-orange-600/30 transition-colors"
          >
            <h3 className="font-bold text-orange-400 mb-1">2. Simulate Traffic Spike</h3>
            <p className="text-sm text-slate-300">Injects traffic data, triggers AI ETA recalculation and dynamic rerouting.</p>
          </button>

          <button 
            disabled={loading}
            onClick={() => handleAction('vehicle-failure')}
            className="w-full text-left p-4 rounded-lg bg-red-600/20 border border-red-500/30 hover:bg-red-600/30 transition-colors"
          >
            <h3 className="font-bold text-red-400 mb-1">3. Simulate Vehicle Failure</h3>
            <p className="text-sm text-slate-300">Causes active ambulance to fail, triggering Fail-Safe Backup protocol.</p>
          </button>
        </div>
        
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <h2 className="text-lg font-semibold mb-4">Explainable AI Decisions</h2>
          <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
            {decisions.length === 0 ? (
              <p className="text-slate-400 text-sm">No AI decisions logged yet.</p>
            ) : (
              decisions.map(d => (
                <div key={d._id} className="bg-slate-900 border border-slate-700 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs font-bold text-slate-400">{new Date(d.timestamp).toLocaleTimeString()}</span>
                    <span className="px-2 py-0.5 rounded text-xs bg-indigo-500/20 text-indigo-400">{d.type}</span>
                  </div>
                  <h4 className="font-bold text-slate-200">{d.decision}</h4>
                  <div className="mt-2 text-sm text-slate-300">
                    <p className="text-emerald-400 mb-1">✓ Confidence: {d.confidence || d.score}%</p>
                    <p className="text-slate-400">Reason: {d.reason}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
