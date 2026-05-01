import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, ZoomControl, useMap, FeatureGroup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import { LocateFixed, Flame, Layers, PenTool } from 'lucide-react';
import MapDrawControl from './MapDrawControl';
import MapHeatLayer from './MapHeatLayer';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const categoryIcons = {
    Nature: L.divIcon({ 
      className: 'custom-pin', 
      html: `
        <div class="pin animate-bounce" style="background: #10b981;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-white">
            <path d="M12 2L19 12H5L12 2Z" />
            <path d="M12 9L19 19H5L12 9Z" />
            <path d="M12 16L19 23H5L12 16Z" />
          </svg>
          <div class="pulse"></div>
        </div>`, 
      iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] 
    }),
    Urban: L.divIcon({ 
      className: 'custom-pin', 
      html: `
        <div class="pin animate-pulse" style="background: #3b82f6;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-white">
            <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
            <line x1="9" y1="22" x2="9" y2="2" />
            <line x1="15" y1="22" x2="15" y2="2" />
            <line x1="4" y1="6" x2="20" y2="6" />
          </svg>
          <div class="pulse" style="border-color: #3b82f6;"></div>
        </div>`, 
      iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] 
    }),
    Food: L.divIcon({ 
      className: 'custom-pin', 
      html: `
        <div class="pin animate-bounce" style="background: #f59e0b;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-white">
            <path d="M6 13.87A4 4 0 0 1 7.41 6.13 4 4 0 0 1 14 6.13a4 4 0 0 1 1.41 7.74M12 14v7" />
            <path d="M7 21h10" />
          </svg>
          <div class="pulse" style="border-color: #f59e0b;"></div>
        </div>`, 
      iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] 
    }),
    Historical: L.divIcon({ 
      className: 'custom-pin', 
      html: `
        <div class="pin" style="background: #8b5cf6;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="w-4 h-4 text-white">
            <path d="M12 2L2 7V17L12 22L22 17V7L12 2Z" />
            <circle cx="12" cy="12" r="3" />
          </svg>
          <div class="pulse" style="border-color: #8b5cf6;"></div>
        </div>`, 
      iconSize: [32, 32], iconAnchor: [16, 32], popupAnchor: [0, -32] 
    })
};

const userIcon = L.divIcon({
    className: 'bg-transparent border-none',
    html: '<div class="relative flex h-5 w-5"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span><span class="relative inline-flex rounded-full h-5 w-5 bg-blue-500 border-2 border-white shadow-lg"></span></div>',
    iconSize: [20, 20], iconAnchor: [10, 10], popupAnchor: [0, -10]
});

// --- Helper Component to Handle Map Flight ---
function ChangeView({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    map.setView(center, zoom, { animate: true, duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

function LocationMarker({ onMapClick }) {
  useMapEvents({
    click(e) { onMapClick(e.latlng); },
  });
  return null;
}

const Map = ({ routes = [], onMapClick, center, zoom, onMarkerClick }) => {
  const [userLoc, setUserLoc] = useState(null);
  const [viewMode, setViewMode] = useState('markers'); // 'markers', 'heatmap'
  const [drawMode, setDrawMode] = useState(false);

  const locateUser = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition((pos) => {
        setUserLoc([pos.coords.latitude, pos.coords.longitude]);
      }, (err) => {
        console.warn("Location error:", err);
      });
    }
  };

  // Fly user to their exact location when userLoc state is updated
  useEffect(() => {
    if (userLoc && typeof window !== 'undefined') {
       // A quick hack is to dispatch a custom event that our ChangeView catches, 
       // or we simply re-render <ChangeView center={userLoc} /> down below.
    }
  }, [userLoc]);

  return (
    <div className="h-full w-full relative">
      {/* Floating Locate Me Button */}
      {/* Floating Controls */}
      <div className="absolute top-8 right-20 z-[1000] flex flex-col gap-3">
        <button 
          onClick={() => setViewMode(viewMode === 'markers' ? 'heatmap' : 'markers')}
          className={`p-3 rounded-full border shadow-2xl transition-all flex items-center justify-center group ${viewMode === 'heatmap' ? 'bg-orange-500 border-orange-400 text-[#050505]' : 'bg-[#0a0a0f]/80 backdrop-blur-md border-white/5 text-slate-400 hover:border-emerald-500/30'}`}
          title="Toggle Heatmap"
        >
          <Flame size={20} className={viewMode === 'heatmap' ? 'animate-pulse' : ''} />
        </button>
        <button 
          onClick={() => setDrawMode(!drawMode)}
          className={`p-3 rounded-full border shadow-2xl transition-all flex items-center justify-center group ${drawMode ? 'bg-emerald-500 border-emerald-400 text-[#050505]' : 'bg-[#0a0a0f]/80 backdrop-blur-md border-white/5 text-slate-400 hover:border-emerald-500/30'}`}
          title="Toggle Draw Tools"
        >
          <PenTool size={20} />
        </button>
      </div>

      <button 
        onClick={locateUser} 
        className={`absolute bottom-8 left-8 z-[1000] border p-3 rounded-full transition-all shadow-2xl flex items-center justify-center group ${userLoc ? 'bg-emerald-500 border-emerald-400 text-[#050505]' : 'bg-[#0a0a0f]/80 backdrop-blur-md border-white/5 text-white hover:border-emerald-500/30'}`}
        title="Recenter to My Location"
      >
        <LocateFixed className={`group-hover:scale-110 transition-transform ${userLoc ? '' : 'text-emerald-500'}`} />
      </button>

      <MapContainer center={userLoc || center} zoom={zoom} scrollWheelZoom={true} zoomControl={false} className="h-full w-full z-0">
        <ChangeView center={userLoc || center} zoom={zoom} />
        <ZoomControl position="bottomright" />
        <TileLayer url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png" attribution='&copy; CARTO' />
        <LocationMarker onMapClick={onMapClick} />

        {userLoc && (
           <Marker position={userLoc} icon={userIcon}>
             <Popup className="font-sans font-bold text-xs text-slate-900">You are here!</Popup>
           </Marker>
        )}

        {viewMode === 'heatmap' ? (
          <MapHeatLayer points={routes} />
        ) : (
          <MarkerClusterGroup chunkedLoading maxClusterRadius={40}>
            {routes.map((route) => (
              <Marker 
                  key={route._id} 
                  position={[route.lat, route.lng]} 
                  icon={categoryIcons[route.category] || categoryIcons.Urban}
                  eventHandlers={{ click: () => { if (onMarkerClick) onMarkerClick(route._id); } }}
              />
            ))}
          </MarkerClusterGroup>
        )}

        {drawMode && (
          <MapDrawControl 
            onCreated={(e) => console.log('Drawing created:', e)} 
          />
        )}
      </MapContainer>
    </div>
  );
};

export default Map;