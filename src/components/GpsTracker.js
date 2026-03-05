'use client';
import { useEffect, useRef, useState, useCallback } from 'react';

export default function GpsTracker({ userId }) {
    const [active, setActive] = useState(false);
    const [status, setStatus] = useState('idle'); // idle, tracking, error, denied
    const [errorMsg, setErrorMsg] = useState('');
    const watchRef = useRef(null);
    const intervalRef = useRef(null);
    const lastPos = useRef(null);

    const sendLocation = useCallback(async (pos) => {
        try {
            await fetch('/api/tracking', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    latitude: pos.coords.latitude,
                    longitude: pos.coords.longitude,
                    accuracy: pos.coords.accuracy,
                    speed: pos.coords.speed,
                    heading: pos.coords.heading,
                }),
            });
        } catch (e) {
            console.error('Failed to send location:', e);
        }
    }, []);

    const startTracking = useCallback(() => {
        if (!navigator.geolocation) {
            setStatus('error');
            setErrorMsg('GPS tidak tersedia di perangkat ini');
            return;
        }

        setActive(true);
        setStatus('tracking');
        setErrorMsg('');

        // Watch position continuously
        watchRef.current = navigator.geolocation.watchPosition(
            (pos) => {
                lastPos.current = pos;
            },
            (err) => {
                if (err.code === 1) {
                    setStatus('denied');
                    setErrorMsg('Izin lokasi ditolak');
                    stopTracking();
                } else {
                    setStatus('error');
                    setErrorMsg('Gagal mendapatkan lokasi');
                }
            },
            {
                enableHighAccuracy: true,
                maximumAge: 5000,
                timeout: 15000,
            }
        );

        // Send location every 10 seconds
        intervalRef.current = setInterval(() => {
            if (lastPos.current) {
                sendLocation(lastPos.current);
            }
        }, 10000);

        // Send immediately on first position
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                lastPos.current = pos;
                sendLocation(pos);
            },
            () => { },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }, [sendLocation]);

    const stopTracking = useCallback(() => {
        if (watchRef.current !== null) {
            navigator.geolocation.clearWatch(watchRef.current);
            watchRef.current = null;
        }
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }
        setActive(false);
        setStatus('idle');
        lastPos.current = null;
    }, []);

    // Auto-start on mount
    useEffect(() => {
        startTracking();
        return () => stopTracking();
    }, [startTracking, stopTracking]);

    return (
        <div className="gps-tracker-widget" data-status={status}>
            <button
                className="gps-tracker-btn"
                onClick={() => active ? stopTracking() : startTracking()}
                title={active ? 'Matikan GPS Tracking' : 'Aktifkan GPS Tracking'}
            >
                <span className={`gps-dot ${active ? 'active' : ''}`} />
                <span className="gps-label">
                    {status === 'tracking' && '📍 GPS Aktif'}
                    {status === 'idle' && '📍 GPS Mati'}
                    {status === 'denied' && '🚫 Izin Ditolak'}
                    {status === 'error' && '⚠️ Error GPS'}
                </span>
            </button>
            {errorMsg && <span className="gps-error">{errorMsg}</span>}
        </div>
    );
}
