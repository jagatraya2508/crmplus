'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function MapView({ customers = [], visits = [] }) {
    const mapRef = useRef(null);
    const mapInstance = useRef(null);

    useEffect(() => {
        if (mapInstance.current) return;

        // Default center: Jakarta
        const map = L.map(mapRef.current).setView([-6.2088, 106.8456], 11);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
        }).addTo(map);

        mapInstance.current = map;

        // Customer markers (blue)
        const customerIcon = L.divIcon({
            html: '<div style="background:#3b82f6;width:12px;height:12px;border-radius:50%;border:2px solid white;box-shadow:0 0 6px rgba(59,130,246,0.5)"></div>',
            iconSize: [12, 12],
            className: '',
        });

        // Visit markers (green for active, gray for completed)
        const visitActiveIcon = L.divIcon({
            html: '<div style="background:#10b981;width:16px;height:16px;border-radius:50%;border:2px solid white;box-shadow:0 0 10px rgba(16,185,129,0.5);animation:pulse 2s infinite"></div>',
            iconSize: [16, 16],
            className: '',
        });

        const visitDoneIcon = L.divIcon({
            html: '<div style="background:#64748b;width:10px;height:10px;border-radius:50%;border:2px solid white"></div>',
            iconSize: [10, 10],
            className: '',
        });

        const bounds = [];

        // Add customer markers
        customers.forEach(c => {
            if (c.latitude && c.longitude) {
                const marker = L.marker([c.latitude, c.longitude], { icon: customerIcon }).addTo(map);
                marker.bindPopup(`<strong>${c.name}</strong><br/>${c.company || ''}<br/>${c.address || ''}`);
                bounds.push([c.latitude, c.longitude]);
            }
        });

        // Add visit markers
        visits.forEach(v => {
            if (v.checkin_lat && v.checkin_lng) {
                const icon = v.status === 'checked_in' ? visitActiveIcon : visitDoneIcon;
                const marker = L.marker([v.checkin_lat, v.checkin_lng], { icon }).addTo(map);
                marker.bindPopup(`
          <strong>${v.customer_name || 'Kunjungan'}</strong><br/>
          ${v.user_name || ''}<br/>
          Check-in: ${new Date(v.checkin_time).toLocaleString('id-ID')}<br/>
          ${v.checkout_time ? `Check-out: ${new Date(v.checkout_time).toLocaleString('id-ID')}` : '<span style="color:#10b981">● Aktif</span>'}
        `);
                bounds.push([v.checkin_lat, v.checkin_lng]);
            }
        });

        // Fit map to bounds
        if (bounds.length > 0) {
            map.fitBounds(bounds, { padding: [50, 50] });
        }

        return () => {
            if (mapInstance.current) {
                mapInstance.current.remove();
                mapInstance.current = null;
            }
        };
    }, [customers, visits]);

    return <div ref={mapRef} style={{ width: '100%', height: '100%' }} />;
}
