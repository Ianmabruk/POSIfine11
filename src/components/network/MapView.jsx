import { useEffect, useRef, useState } from 'react';
import { Map, Marker, Popup, NavigationControl, GeolocateControl } from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { MapPin, AlertCircle } from 'lucide-react';

const OPENFREE_MAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';
const NAIBAR = { lat: -1.2921, lng: 36.8219 };

export default function MapView({
  center,
  zoom = 13,
  markers = [],
  onMount,
  style = OPENFREE_MAP_STYLE,
  showUserLocation = false,
  className = 'h-full w-full rounded-xl',
  onMapLoad,
}) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    let map;
    try {
      map = new Map({
        container: containerRef.current,
        style,
        center: center ? [center.lng, center.lat] : [NAIBAR.lng, NAIBAR.lat],
        zoom,
        attributionControl: false,
        failIfMajorPerfCaveat: false,
      });
      map.addControl(new NavigationControl(), 'top-right');
      map.addControl(new GeolocateControl({
        positionOptions: { enableHighAccuracy: true },
        activeButton: 'first',
      }), 'top-right');
      map.on('load', () => {
        mapRef.current = map;
        renderMarkers(map, markers);
        onMount?.(map);
        onMapLoad?.(map);
      });
      map.on('error', (e) => setError(e?.message || 'Map failed to load'));
    } catch (e) {
      setError(e.message);
      return;
    }
    return () => {
      if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; map = null; }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // sync position
  useEffect(() => {
    if (!mapRef.current || !center) return;
    const wasMoving = mapRef.current.isMoving();
    if (!wasMoving) mapRef.current.jumpTo({ center: [center.lng, center.lat], zoom });
  }, [center && center.lat, center && center.lng, zoom]);

  // sync markers
  useEffect(() => {
    if (!mapRef.current) return;
    renderMarkers(mapRef.current, markers);
  }, [JSON.stringify(markers)]);

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center gap-2 text-center rounded-xl bg-gray-100 ${className}`}>
        <AlertCircle className="w-6 h-6 text-gray-500" />
        <p className="text-sm text-gray-600">Map unavailable</p>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {markers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <MapPin className="w-6 h-6 text-gray-300" />
        </div>
      )}
    </div>
  );
}

function renderMarkers(map, markers) {
  if (map.getCanvasContainer()._posifyMarkers) {
    map.getCanvasContainer()._posifyMarkers.forEach((m) => m.remove());
  }
  map.getCanvasContainer()._posifyMarkers = [];

  markers.forEach((m) => {
    const el = document.createElement('div');
    el.className = 'posify-marker';
    el.innerHTML = markerSvg(m.color || '#3b82f6');
    const mk = new Marker(el).setLngLat([m.lng, m.lat]);
    if (m.popup) {
      const popup = new Popup({ offset: 10 }).setLngLat([m.lng, m.lat]).setHTML(safePopup(m.popup));
      mk.setPopup(popup);
    }
    mk.addTo(map);
    map.getCanvasContainer()._posifyMarkers.push(mk);
  });
}

function safePopup(html) {
  const div = document.createElement('div');
  div.textContent = typeof html === 'string' ? html : '';
  return div.outerHTML;
}

function markerSvg(color) {
  return `<svg width="28" height="28" viewBox="0 0 24 24" fill="${color}" stroke="white" stroke-width="1"><circle cx="12" cy="12" r="8"/></svg>`;
}
