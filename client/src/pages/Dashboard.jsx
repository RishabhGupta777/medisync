import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Activity, Truck, AlertTriangle, Route, Clock, Heart, Building, Server } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useSocket } from '../context/SocketContext';

const StatCard = ({ title, value, subtitle, icon: Icon, color }) => (
  <div className="bg-slate-800 border border-slate-700 rounded-xl p-5">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-slate-400 text-sm font-medium">{title}</p>
        <h3 className="text-3xl font-bold mt-1">{value}</h3>
      </div>
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
    {subtitle && <p className="text-sm text-slate-400 mt-4">{subtitle}</p>}
  </div>
);

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const { socket } = useSocket();

  const fetchStats = async () => {
    try {
      const res = await axios.get('http://localhost:5005/api/analytics/kpis');
      const vehiclesRes = await axios.get('http://localhost:5005/api/vehicles');
      setStats({ ...res.data, vehicles: vehiclesRes.data });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchStats();
    if (!socket) return;
    
    // Refresh stats when major events happen
    socket.on('emergency:updated', fetchStats);
    socket.on('emergency:created', fetchStats);
    socket.on('vehicle:updated', fetchStats);
    
    return () => {
      socket.off('emergency:updated', fetchStats);
      socket.off('emergency:created', fetchStats);
      socket.off('vehicle:updated', fetchStats);
    };
  }, [socket]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Command Center</h1>
      
      {stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard 
            title="Active Emergencies" 
            value={stats.activeEmergencies} 
            subtitle="Currently dispatching or en route"
            icon={Activity} 
            color="bg-blue-500" 
          />
          <StatCard 
            title="Available Ambulances" 
            value={stats.availableAmbulances} 
            subtitle="Ready for dispatch"
            icon={Truck} 
            color="bg-emerald-500" 
          />
          <StatCard 
            title="Vehicles at Risk" 
            value={stats.vehiclesAtRisk} 
            subtitle="Moderate or High failure risk"
            icon={AlertTriangle} 
            color="bg-yellow-500" 
          />
          <StatCard 
            title="Active Reroutes" 
            value={stats.activeReroutes} 
            subtitle="Routes modified dynamically"
            icon={Route} 
            color="bg-purple-500" 
          />
          <StatCard 
            title="Average ETA" 
            value={`${stats.averageETA} min`} 
            subtitle="Current active emergencies"
            icon={Clock} 
            color="bg-indigo-500" 
          />
          <StatCard 
            title="ER Capacity" 
            value={stats.erCapacity} 
            subtitle="Total occupied / capacity"
            icon={Building} 
            color="bg-rose-500" 
          />
          <StatCard 
            title="Fleet Health" 
            value={`${stats.avgHealth}%`} 
            subtitle="Overall fleet condition"
            icon={Heart} 
            color="bg-cyan-500" 
          />
          <StatCard 
            title="System Status" 
            value="Active" 
            subtitle="All systems operational"
            icon={Server} 
            color="bg-emerald-500" 
          />
        </div>
      ) : (
        <div className="text-center p-10 text-slate-400">Loading KPIs...</div>
      )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700 lg:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Fleet Health vs RUL</h2>
          <div className="h-64">
            {stats && stats.vehicles ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.vehicles.slice().sort((a, b) => a.healthScore - b.healthScore)}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="vehicleId" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', color: '#f8fafc' }} 
                    itemStyle={{ color: '#38bdf8' }}
                  />
                  <Line type="monotone" dataKey="healthScore" name="Health %" stroke="#38bdf8" strokeWidth={2} dot={{ r: 4 }} />
                  <Line type="monotone" dataKey="rul" name="RUL (days)" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full border-2 border-dashed border-slate-700 rounded-lg">
                <p className="text-slate-500">Loading chart data...</p>
              </div>
            )}
          </div>
        </div>
        <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
          <h2 className="text-lg font-semibold mb-4">System Components</h2>
          <ul className="space-y-4">
            <li className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
              <span className="text-slate-300 font-medium">Backend API</span>
              <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400">Online</span>
            </li>
            <li className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
              <span className="text-slate-300 font-medium">MongoDB</span>
              <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400">Connected</span>
            </li>
            <li className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
              <span className="text-slate-300 font-medium">Socket.IO</span>
              <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400">Active</span>
            </li>
            <li className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
              <span className="text-slate-300 font-medium">Simulation Engine</span>
              <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400">Running</span>
            </li>
            <li className="flex justify-between items-center p-3 bg-slate-700/30 rounded-lg">
              <span className="text-slate-300 font-medium">Routing Service</span>
              <span className="px-2 py-1 text-xs font-bold rounded-full bg-emerald-500/20 text-emerald-400">Operational</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
