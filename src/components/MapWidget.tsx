import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

export interface MapMarkerItem {
  id: string;
  name: string;
  address?: string;
  latitude: number;
  longitude: number;
  status?: string;
  price?: number;
  isOutdated?: boolean;
}

interface MapWidgetProps {
  markers: MapMarkerItem[];
  userLocation?: { lat: number; lng: number } | null;
  onMarkerClick?: (id: string) => void;
  className?: string;
  center?: [number, number];
  zoom?: number;
}

export const MapWidget: React.FC<MapWidgetProps> = ({
  markers,
  userLocation,
  onMarkerClick,
  className = 'h-96 w-full rounded-xl border border-slate-200 overflow-hidden shadow-sm',
  center,
  zoom = 13,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    // Default center Dharwad/Hubballi (15.4589, 75.0078)
    const initialCenter: [number, number] = center || (userLocation ? [userLocation.lat, userLocation.lng] : [15.4589, 75.0078]);

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: initialCenter,
        zoom: zoom,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(map);

      markersLayerRef.current = L.layerGroup().addTo(map);
      mapInstanceRef.current = map;
    }

    const map = mapInstanceRef.current;
    const markersLayer = markersLayerRef.current;

    if (!markersLayer) return;
    markersLayer.clearLayers();

    // Custom Icon generator
    const createPharmacyIcon = (status?: string, isOutdated?: boolean) => {
      let color = '#10b981'; // emerald green
      if (isOutdated) color = '#f59e0b'; // amber
      else if (status === 'LOW_STOCK') color = '#f59e0b';
      else if (status === 'OUT_OF_STOCK') color = '#ef4444';

      return L.divIcon({
        className: 'custom-map-pin',
        html: `
          <div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 16px;">
            +
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16],
      });
    };

    // User Location Blue Marker
    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'custom-user-pin',
        html: `
          <div style="background-color: #2563eb; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 0 10px #2563eb; display: flex; align-items: center; justify-content: center;">
            <div style="background-color: white; width: 6px; height: 6px; border-radius: 50%;"></div>
          </div>
        `,
        iconSize: [20, 20],
        iconAnchor: [10, 10],
      });

      L.marker([userLocation.lat, userLocation.lng], { icon: userIcon })
        .bindPopup('<b>Your Current Location</b>')
        .addTo(markersLayer);
    }

    const bounds: [number, number][] = [];
    if (userLocation) {
      bounds.push([userLocation.lat, userLocation.lng]);
    }

    // Add Pharmacy Markers
    markers.forEach(m => {
      if (!m.latitude || !m.longitude) return;
      bounds.push([m.latitude, m.longitude]);

      const marker = L.marker([m.latitude, m.longitude], {
        icon: createPharmacyIcon(m.status, m.isOutdated),
      });

      const popupContent = `
        <div style="font-family: inherit; font-size: 13px; line-height: 1.4; padding: 4px;">
          <h4 style="margin: 0 0 4px 0; font-size: 14px; font-weight: 700; color: #0f172a;">${m.name}</h4>
          ${m.address ? `<p style="margin: 0 0 4px 0; color: #64748b;">${m.address}</p>` : ''}
          ${m.price !== undefined ? `<div style="font-weight: 600; color: #047857; margin-bottom: 6px;">₹${m.price}</div>` : ''}
          <div style="display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 11px; font-weight: 600; background: #ecfdf5; color: #065f46;">
            ${m.status === 'AVAILABLE' ? 'Reported Available' : m.status || 'Verified Pharmacy'}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        if (onMarkerClick) onMarkerClick(m.id);
      });

      marker.addTo(markersLayer);
    });

    // Auto-fit bounds if multiple markers exist
    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], zoom);
    }

    return () => {
      // Don't destroy map completely on quick re-renders, just layer
    };
  }, [markers, userLocation, center, zoom, onMarkerClick]);

  // Clean cleanup on component unmount
  useEffect(() => {
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  return (
    <div className={`relative ${className}`}>
      <div ref={mapContainerRef} className="w-full h-full min-h-[300px]" />
      
      {/* Map Legend */}
      <div className="absolute bottom-3 left-3 z-[1000] bg-white/95 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md border border-slate-200 text-xs flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
          <span className="text-slate-700 font-medium">Available</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
          <span className="text-slate-700 font-medium">Limited / Stale</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
          <span className="text-slate-700 font-medium">Out of stock</span>
        </div>
      </div>
    </div>
  );
};
