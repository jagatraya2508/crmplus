'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const STATUS_COLORS = {
    online: '#10b981',
    idle: '#f59e0b',
    offline: '#64748b',
};

function createMarkerIcon(status) {
    const color = STATUS_COLORS[status] || STATUS_COLORS.offline;
    const pulse = status === 'online' ? 'animation:pulse 2s infinite;' : '';
    return L.divIcon({
        html: `<div style="
            background:${color};
            width:18px;height:18px;
            border-radius:50%;
            border:3px solid white;
            box-shadow:0 0 12px ${color}80;
            ${pulse}
            position:relative;
        "></div>`,
        iconSize: [18, 18],
        className: '',
    });
}

export default function LiveTrackingMap({ locations = [], historyData = null, selectedUserId = null }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);
    const markersRef = useRef({});
    const polylineRef = useRef(null);

    // Initialize map once
    useEffect(() => {
        if (mapInstance.current) return;
        const map = L.map(mapRef.current).setView([-6.2088, 106.8456], 11);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);
        mapInstance.current = map;

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, []);

    // Update markers when locations change
    useEffect(() => {
        const map = mapInstance.current;
        if (!map) return;

        const currentIds = new Set();

        locations.forEach(loc => {
            currentIds.add(String(loc.user_id));
            const key = String(loc.user_id);
            const latlng = [loc.latitude, loc.longitude];

            const popupContent = `
                <div style="min-width:180px">
                    <strong>${loc.user_name}</strong><br/>
                    <span style="color:${STATUS_COLORS[loc.status] || '#999'}">● ${loc.status === 'online' ? 'Online' : loc.status === 'idle' ? 'Idle' : 'Offline'}</span><br/>
                    <small>📞 ${loc.user_phone || '-'}</small><br/>
                    <small>🕐 ${new Date(loc.recorded_at).toLocaleString('id-ID')}</small><br/>
                    ${loc.speed ? `<small>🚗 ${(loc.speed * 3.6).toFixed(1)} km/h</small><br/>` : ''}
                    ${loc.accuracy ? `<small>📡 Akurasi ±${Math.round(loc.accuracy)}m</small>` : ''}
                </div>
            `;

            if (markersRef.current[key]) {
                // Update existing marker position
                markersRef.current[key].setLatLng(latlng);
                markersRef.current[key].setIcon(createMarkerIcon(loc.status));
                markersRef.current[key].setPopupContent(popupContent);
            } else {
                // Create new marker
                const marker = L.marker(latlng, { icon: createMarkerIcon(loc.status) }).addTo(map);
                marker.bindPopup(popupContent);
                markersRef.current[key] = marker;
            }
        });

        // Remove markers that are no longer in the list
        Object.keys(markersRef.current).forEach(key => {
            if (!currentIds.has(key)) {
                map.removeLayer(markersRef.current[key]);
                delete markersRef.current[key];
            }
        });

        // Fit bounds on first load or when there are locations
        if (locations.length > 0 && !selectedUserId) {
            const bounds = locations.map(l => [l.latitude, l.longitude]);
            map.fitBounds(bounds, { padding: [60, 60], maxZoom: 15 });
        }
    }, [locations, selectedUserId]);

    // Draw history polyline
    useEffect(() => {
        const map = mapInstance.current;
        if (!map) return;

        // Remove old polyline
        if (polylineRef.current) {
            map.removeLayer(polylineRef.current);
            polylineRef.current = null;
        }

        if (historyData && historyData.length > 1) {
            const coords = historyData.map(h => [h.latitude, h.longitude]);
            polylineRef.current = L.polyline(coords, {
                color: '#6366f1',
                weight: 4,
                opacity: 0.8,
                dashArray: '10, 6',
                lineJoin: 'round',
            }).addTo(map);

            // Add start and end markers
            const startIcon = L.divIcon({
                html: '<div style="background:#10b981;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 8px #10b98180"></div>',
                iconSize: [14, 14],
                className: '',
            });
            const endIcon = L.divIcon({
                html: '<div style="background:#ef4444;width:14px;height:14px;border-radius:50%;border:3px solid white;box-shadow:0 0 8px #ef444480"></div>',
                iconSize: [14, 14],
                className: '',
            });

            L.marker(coords[0], { icon: startIcon })
                .addTo(map)
                .bindPopup(`<strong>Mulai</strong><br/>${new Date(historyData[0].recorded_at).toLocaleString('id-ID')}`);
            L.marker(coords[coords.length - 1], { icon: endIcon })
                .addTo(map)
                .bindPopup(`<strong>Selesai</strong><br/>${new Date(historyData[historyData.length - 1].recorded_at).toLocaleString('id-ID')}`);

            map.fitBounds(coords, { padding: [60, 60] });
        }
    }, [historyData]);

    return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}
