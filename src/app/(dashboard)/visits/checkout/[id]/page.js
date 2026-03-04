'use client';
import { useState, useEffect, use } from 'react';
import { MapPin, LogOut, Loader, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import '../../visits.css';

export default function CheckoutPage({ params }) {
    const { id } = use(params);
    const router = useRouter();
    const [visit, setVisit] = useState(null);
    const [gpsStatus, setGpsStatus] = useState('detecting');
    const [coords, setCoords] = useState(null);
    const [address, setAddress] = useState('');
    const [summary, setSummary] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchVisit();
        detectLocation();
    }, []);

    async function fetchVisit() {
        try {
            const res = await fetch(`/api/visits/${id}`);
            const data = await res.json();
            setVisit(data.visit);
        } catch (e) { console.error(e); }
    }

    function detectLocation() {
        setGpsStatus('detecting');
        if (!navigator.geolocation) { setGpsStatus('error'); return; }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setCoords({ lat: position.coords.latitude, lng: position.coords.longitude });
                setAddress(`${position.coords.latitude.toFixed(6)}, ${position.coords.longitude.toFixed(6)}`);
                setGpsStatus('success');
            },
            () => setGpsStatus('error'),
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    function getDuration() {
        if (!visit?.checkin_time) return '-';
        const diff = Date.now() - new Date(visit.checkin_time).getTime();
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        return `${hours} jam ${mins} menit`;
    }

    async function handleCheckout(e) {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const res = await fetch(`/api/visits/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    checkout_lat: coords?.lat,
                    checkout_lng: coords?.lng,
                    checkout_address: address,
                    summary,
                }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            router.push('/visits');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    if (!visit) return <div className="loading-center"><div className="spinner" /></div>;

    return (
        <div className="checkin-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Check-out Kunjungan</h1>
                    <p className="page-subtitle">{visit.customer_name}</p>
                </div>
            </div>

            <div className="checkin-card">
                {/* Visit Info */}
                <div style={{ marginBottom: 24, padding: 16, background: 'var(--bg-glass)', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--border-color)' }}>
                    <div className="flex items-center gap-md mb-sm">
                        <MapPin size={18} style={{ color: 'var(--accent-success)' }} />
                        <div>
                            <div style={{ fontWeight: 600 }}>{visit.customer_name}</div>
                            <div style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)' }}>{visit.customer_company || ''}</div>
                        </div>
                    </div>
                    <div className="visit-meta">
                        <span><Clock size={13} /> Check-in: {new Date(visit.checkin_time).toLocaleString('id-ID')}</span>
                        <span className="visit-duration">Durasi: {getDuration()}</span>
                    </div>
                </div>

                {/* GPS */}
                <div className={`gps-status ${gpsStatus}`}>
                    {gpsStatus === 'detecting' && <><Loader size={20} /> Mendeteksi lokasi...</>}
                    {gpsStatus === 'success' && <><CheckCircle size={20} /> Lokasi check-out terdeteksi</>}
                    {gpsStatus === 'error' && <><AlertCircle size={20} /> Gagal deteksi. <button onClick={detectLocation} style={{ textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Coba lagi</button></>}
                </div>

                {error && <div className="login-error">{error}</div>}

                <form onSubmit={handleCheckout}>
                    <div className="form-group" style={{ marginTop: 16 }}>
                        <label className="form-label">Ringkasan Kunjungan</label>
                        <textarea className="form-control" rows={4} placeholder="Hasil kunjungan, keputusan, follow-up..." value={summary} onChange={e => setSummary(e.target.value)} />
                    </div>
                    <button type="submit" className="btn btn-warning btn-lg w-full" disabled={loading}>
                        {loading ? <Loader size={20} /> : <><LogOut size={20} /> Check-out Sekarang</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
