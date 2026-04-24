import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

L.Marker.prototype.options.icon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow
});

export default function NeedsMap({ refreshTrigger }) {
  const [needs, setNeeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchNeeds = async () => {
      try {
        const response = await fetch('http://localhost:3000/api/needs');
        if (!response.ok) {
          throw new Error('Failed to fetch needs');
        }
        const data = await response.json();
        setNeeds(data);
      } catch (error) {
        console.error('Error fetching needs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchNeeds();
  }, [refreshTrigger]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[500px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (needs.length === 0) {
    return (
      <div className="flex justify-center items-center h-full min-h-[500px] text-gray-500">
        <p>No reports yet</p>
      </div>
    );
  }

  return (
    <MapContainer center={[28.6139, 77.2090]} zoom={11} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {needs.map((need, index) => {
        if (!need.lat || !need.lng) return null;

        return (
          <Marker key={need.id || index} position={[need.lat, need.lng]}>
            <Popup>
              <div className="p-1">
                <h3 className="font-bold text-sm mb-1">{need.category || 'Unknown Category'}</h3>
                <p className="text-xs text-gray-600 mb-1"><span className="font-semibold">Location:</span> {need.location || 'Unknown'}</p>
                <p className="text-xs text-gray-600 mb-1"><span className="font-semibold">Urgency:</span> {need.urgency_score !== undefined ? need.urgency_score : need.urgency}</p>
                <p className="text-xs mt-2">
                  {need.description ? (need.description.length > 100 ? need.description.substring(0, 100) + '...' : need.description) : 'No description'}
                </p>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </MapContainer>
  );
}
