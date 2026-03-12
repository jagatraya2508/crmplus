'use client';
import { useState, useEffect } from 'react';
import { MapPin, Navigation, Search, LogIn, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import '../visits.css';

export default function CheckinPage() {
    const router = useRouter();
    const [gpsStatus, setGpsStatus] = useState('detecting'); // detecting, success, error
    const [coords, setCoords] = useState(null);
    const [address, setAddress] = useState('');
    const [customers, setCustomers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState(null);
    const [notes, setNotes] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        detectLocation();
        fetchCustomers();
    }, []);

    function detectLocation() {
        setGpsStatus('detecting');
        if (!navigator.geolocation) {
            setGpsStatus('error');
            return;
        }

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setCoords({ lat: latitude, lng: longitude });
                setGpsStatus('success');
                // Try to get address via reverse geocoding
                setAddress(`${latitude.toFixed(6)}, ${longitude.toFixed(6)}`);
            },
            (err) => {
                console.warn('GPS peringatan:', err.message);
                setGpsStatus('error');
                if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost') {
                    setError('Akses GPS diblokir karena tidak menggunakan HTTPS. Silakan gunakan link LocalTunnel.');
                }
            },
            { enableHighAccuracy: true, timeout: 10000 }
        );
    }

    async function fetchCustomers() {
        try {
            const res = await fetch('/api/customers?limit=100');
            const data = await res.json();
            setCustomers(data.customers || []);
        } catch (e) { console.error(e); }
    }

    const filteredCustomers = customers.filter(c =>
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.company && c.company.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    async function handleCheckin(e) {
        e.preventDefault();
        if (!selectedCustomer) {
            setError('Pilih pelanggan terlebih dahulu');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/visits', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer_id: selectedCustomer.id,
                    checkin_lat: coords?.lat,
                    checkin_lng: coords?.lng,
                    checkin_address: address,
                    notes,
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

    return (
        <div className="checkin-container">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Check-in Kunjungan</h1>
                    <p className="page-subtitle">Catat kunjungan ke lokasi pelanggan</p>
                </div>
            </div>

            <div className="checkin-card">
                {/* GPS Status */}
                <div className={`gps-status ${gpsStatus}`}>
                    {gpsStatus === 'detecting' && <><Loader size={20} className="spin" /> Mendeteksi lokasi GPS...</>}
                    {gpsStatus === 'success' && <><CheckCircle size={20} /> Lokasi terdeteksi</>}
                    {gpsStatus === 'error' && <><AlertCircle size={20} /> Gagal mendeteksi lokasi. <button onClick={detectLocation} style={{ textDecoration: 'underline', background: 'none', border: 'none', color: 'inherit', cursor: 'pointer' }}>Coba lagi</button></>}
                </div>

                {coords && (
                    <div className="gps-coords">
                        <MapPin size={12} /> {coords.lat.toFixed(6)}, {coords.lng.toFixed(6)}
                    </div>
                )}

                {error && (
                    <div className="login-error" style={{ marginTop: 16 }}>{error}</div>
                )}

                <form onSubmit={handleCheckin}>
                    {/* Customer Selection */}
                    <div className="form-group" style={{ marginTop: 24 }}>
                        <label className="form-label">Pilih Pelanggan *</label>
                        <div className="search-box">
                            <Search size={16} className="search-icon" />
                            <input
                                placeholder="Cari pelanggan..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>

                        <div className="customer-select-list">
                            {filteredCustomers.length === 0 ? (
                                <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                                    Tidak ada pelanggan ditemukan
                                </div>
                            ) : (
                                filteredCustomers.map(c => (
                                    <div
                                        key={c.id}
                                        className={`customer-select-item ${selectedCustomer?.id === c.id ? 'selected' : ''}`}
                                        onClick={() => setSelectedCustomer(c)}
                                    >
                                        <div className="customer-avatar" style={{ width: 28, height: 28, fontSize: '0.75rem' }}>
                                            {c.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.name}</div>
                                            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{c.company || c.address || '-'}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                    {/* Notes */}
                    <div className="form-group">
                        <label className="form-label">Catatan Kunjungan</label>
                        <textarea
                            className="form-control"
                            rows={3}
                            placeholder="Tujuan kunjungan, agenda meeting, dll..."
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    {/* Submit */}
                    <button type="submit" className="btn btn-success btn-lg w-full" disabled={loading || !selectedCustomer} style={{ marginTop: 8 }}>
                        {loading ? <Loader size={20} className="spin" /> : <><LogIn size={20} /> Check-in Sekarang</>}
                    </button>
                </form>
            </div>
        </div>
    );
}
