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

function getMarkerColor(urgency) {
  if (urgency >= 8) return '#EF4444';
  if (urgency >= 4) return '#F59E0B';
  return '#22C55E';
}

function createColoredIcon(urgency) {
  const color = getMarkerColor(urgency);
  return L.divIcon({
    className: '',
    html: `<div style="
      width:16px; height:16px;
      border-radius:50%;
      background:${color};
      border:2px solid white;
      box-shadow:0 1px 4px rgba(0,0,0,0.4);
    "></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
  });
}

export default function NeedsMap({ needs = [], onSelectNeed }) {
  const isEmpty = !needs || needs.length === 0;

  return (
    <div className="relative h-full w-full">
      {isEmpty && (
        <div className="absolute inset-0 z-[1000] flex items-center justify-center pointer-events-none">
          <div className="bg-white/90 backdrop-blur-sm px-4 py-2 rounded-lg shadow-md border border-gray-100 text-sm font-semibold text-gray-600">
            No reports yet
          </div>
        </div>
      )}
      <MapContainer center={[28.6139, 77.2090]} zoom={11} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {needs.map((need, index) => {
        if (!need.lat || !need.lng) return null;

        const urgencyVal = need.urgency_score !== undefined ? need.urgency_score : need.urgency;
        
        return (
          <Marker 
            key={need.id || index} 
            position={[need.lat, need.lng]}
            icon={createColoredIcon(urgencyVal)}
            eventHandlers={{ click: () => onSelectNeed && onSelectNeed(need) }}
          >
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
    </div>
  );
}
