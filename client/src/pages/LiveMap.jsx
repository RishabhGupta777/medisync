import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import L from 'leaflet';
import axios from 'axios';
import { useSocket } from '../context/SocketContext';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issues in React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const getAmbulanceIcon = (status) => {
  let color = 'blue';
  if (status === 'EN ROUTE' || status === 'REROUTED') color = 'green';
  if (status === 'WARNING') color = 'orange';
  if (status === 'CRITICAL') color = 'red';
  if (status === 'OFFLINE') color = 'grey';

  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const getHospitalIcon = () => {
  return new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-violet.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

export default function LiveMap() {
  const [vehicles, setVehicles] = useState([]);
  const [hospitals, setHospitals] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const { socket } = useSocket();

  const fetchData = async () => {
    try {
      const [vRes, hRes, eRes] = await Promise.all([
        axios.get('http://localhost:5005/api/vehicles'),
        axios.get('http://localhost:5005/api/hospitals'),
        axios.get('http://localhost:5005/api/emergencies')
      ]);
      setVehicles(vRes.data);
      setHospitals(hRes.data);
      setEmergencies(eRes.data.filter(e => e.status !== 'COMPLETED'));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();
    if (!socket) return;

    socket.on('vehicle:telemetry', (telemetry) => {
      setVehicles(prev => prev.map(v => 
        v.vehicleId === telemetry.vehicleId ? { ...v, location: telemetry.location, rpm: telemetry.rpm, speed: telemetry.speed, healthScore: telemetry.healthScore } : v
      ));
    });

    socket.on('vehicle:updated', fetchData);
    socket.on('emergency:created', fetchData);
    socket.on('emergency:updated', fetchData);
    
    return () => {
      socket.off('vehicle:telemetry');
      socket.off('vehicle:updated');
      socket.off('emergency:created');
      socket.off('emergency:updated');
    };
  }, [socket]);

  // Center around India
  const center = [20.5937, 78.9629];

  return (
    <div className="h-[calc(100vh-8rem)] bg-slate-800 rounded-xl overflow-hidden border border-slate-700 relative z-0">
      <MapContainer center={center} zoom={5} style={{ height: '100%', width: '100%' }}>
        {/* Dark mode friendly map tiles */}
           <TileLayer
     url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
     attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
   />
        
        {hospitals.map(h => (
          <Marker key={h.hospitalId} position={[h.location.lat, h.location.lng]} icon={getHospitalIcon()}>
            <Popup>
              <div className="text-slate-900 font-sans">
                <h3 className="font-bold">{h.name}</h3>
                <p>Status: {h.status}</p>
                <p>Available Beds: {h.availableBeds}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {vehicles.map(v => (
          <Marker key={v.vehicleId} position={[v.location.lat, v.location.lng]} icon={getAmbulanceIcon(v.status)}>
            <Popup>
              <div className="text-slate-900 font-sans">
                <h3 className="font-bold">{v.vehicleId}</h3>
                <p>Status: <span className="font-semibold">{v.status}</span></p>
                <p>Health: {v.healthScore}%</p>
                <p>Speed: {Math.round(v.speed)} km/h</p>
                <hr className="my-1"/>
                <p className="text-xs">Risk: {v.failureRisk}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        
        {/* Draw rough lines for active emergencies between vehicle and hospital */}
        {emergencies.map(e => {
          if (!e.vehicleId || !e.hospitalId) return null;
          // In a real app, we'd draw polyline from routing API
          const v = vehicles.find(veh => veh._id === (e.vehicleId._id || e.vehicleId));
          const h = hospitals.find(hosp => hosp._id === (e.hospitalId._id || e.hospitalId));
          
          if (v && h && v.status !== 'AVAILABLE') {
             return (
               <Polyline 
                 key={e.emergencyId} 
                 positions={[[v.location.lat, v.location.lng], [h.location.lat, h.location.lng]]} 
                 color={e.status === 'REROUTED' ? '#f59e0b' : '#3b82f6'} 
                 dashArray={e.status === 'REROUTED' ? "10, 10" : ""}
                 weight={4}
               />
             )
          }
          return null;
        })}

      </MapContainer>
    </div>
  );
}
