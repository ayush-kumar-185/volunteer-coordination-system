import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { formatDistanceToNow } from 'date-fns';

// Create simple colored marker icons using Leaflet's L.divIcon
const createIcon = (colorClass) => L.divIcon({
  className: 'custom-icon',
  html: `<div class="w-4 h-4 rounded-full border-2 border-white shadow-md ${colorClass}"></div>`,
  iconSize: [20, 20],
  iconAnchor: [10, 10]
});

const redIcon = createIcon('bg-red-500');
const orangeIcon = createIcon('bg-orange-500');
const greenIcon = createIcon('bg-green-500');

const NeedsMap = ({ needs, onSelectNeed }) => {
  const mapCenter = [20.5937, 78.9629]; // India center
  
  return (
    <div className="w-full h-full relative bg-gray-100 z-0">
      <MapContainer 
        center={mapCenter} 
        zoom={5} 
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
        />
        
        {needs.filter(n => n.latitude && n.longitude).map(need => {
          let icon = greenIcon;
          if (need.urgency_score >= 8) icon = redIcon;
          else if (need.urgency_score >= 5) icon = orangeIcon;

          return (
            <Marker 
              key={need.id} 
              position={[need.latitude, need.longitude]} 
              icon={icon}
              eventHandlers={{
                click: () => onSelectNeed(need.id)
              }}
            >
              <Popup>
                <div className="text-sm">
                  <p className="font-bold capitalize">{need.category}</p>
                  <p className="text-xs text-gray-500">{need.location_text}</p>
                  <p className="text-xs text-gray-500">{formatDistanceToNow(new Date(need.created_at))} ago</p>
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>
    </div>
  );
};

export default NeedsMap;
