import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.heat';

const MapHeatLayer = ({ points = [], intensity = 0.5 }) => {
  const map = useMap();

  useEffect(() => {
    if (!map || !points.length) return;

    // Format: [[lat, lng, intensity], ...]
    const heatData = points.map(p => [p.lat, p.lng, intensity]);

    const heatLayer = L.heatLayer(heatData, {
      radius: 25,
      blur: 15,
      maxZoom: 17,
      gradient: {
        0.4: '#3b82f6', // Blue
        0.6: '#10b981', // Emerald
        0.8: '#f59e0b', // Amber
        1.0: '#ef4444'  // Red
      }
    }).addTo(map);

    return () => {
      map.removeLayer(heatLayer);
    };
  }, [map, points, intensity]);

  return null;
};

export default MapHeatLayer;
