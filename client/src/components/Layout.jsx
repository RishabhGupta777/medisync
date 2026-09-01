import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, Map, Truck, Navigation, HeartPulse, Settings, Bell, Menu, X, PlayCircle, CarFront } from 'lucide-react';
import { useSocket } from '../context/SocketContext';
import axios from 'axios';

const navItems = [
  { name: 'Dashboard', path: '/', icon: Activity },
  { name: 'Live Map', path: '/map', icon: Map },
  { name: 'Fleet', path: '/fleet', icon: Truck },
  { name: 'Dispatch', path: '/dispatch', icon: Navigation },
  { name: 'Demo Mode', path: '/demo', icon: PlayCircle },
  { name: 'Driver Mode', path: '/driver', icon: CarFront },
];

export default function Layout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const location = useLocation();
  const { socket, connected } = useSocket();

  useEffect(() => {
    if (!socket) return;
    
    socket.on('notification:new', (notif) => {
      setNotifications(prev => [notif, ...prev].slice(0, 5));
    });
    
    socket.on('alert:new', (alert) => {
      setNotifications(prev => [{
        message: alert.message,
        type: alert.severity === 'CRITICAL' ? 'ERROR' : alert.severity
      }, ...prev].slice(0, 5));
    });

    return () => {
      socket.off('notification:new');
      socket.off('alert:new');
    };
  }, [socket]);

  return (
    <div className="flex h-screen bg-slate-900 text-slate-100 overflow-hidden">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-slate-800 border-r border-slate-700 transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:relative md:translate-x-0 transition-transform duration-200 ease-in-out`}>
        <div className="flex items-center justify-between h-16 px-6 bg-slate-900">
          <div className="flex items-center space-x-2">
            <HeartPulse className="w-8 h-8 text-blue-500" />
            <span className="text-xl font-bold tracking-wider">MediSync-DT</span>
          </div>
          <button className="md:hidden" onClick={() => setSidebarOpen(false)}>
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${isActive ? 'bg-blue-600 text-white' : 'hover:bg-slate-700 text-slate-300'}`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6 shadow-sm z-10">
          <div className="flex items-center">
            <button className="md:hidden mr-4" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-2 text-sm text-slate-400">
              <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span>{connected ? 'System Live' : 'Disconnected'}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <div className="relative group">
              <button className="p-2 rounded-full hover:bg-slate-700 relative">
                <Bell className="w-5 h-5" />
                {notifications.length > 0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-slate-800"></span>
                )}
              </button>
              
              <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
                <div className="p-3 border-b border-slate-700">
                  <h3 className="font-semibold">Recent Alerts</h3>
                </div>
                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-sm">No new alerts</div>
                  ) : (
                    notifications.map((n, i) => (
                      <div key={i} className={`p-3 border-b border-slate-700/50 text-sm ${n.type === 'ERROR' ? 'text-red-400' : n.type === 'WARNING' ? 'text-yellow-400' : 'text-slate-300'}`}>
                        {n.message}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-sm font-bold">
                OP
              </div>
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-slate-900 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
