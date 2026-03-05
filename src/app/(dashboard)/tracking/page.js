'use client';
import { useState, useEffect, useCallback } from 'react';
import { Radio, Users, Calendar, Clock, MapPin, Route, RefreshCw } from 'lucide-react';
import { useAuth } from '@/components/AppShell';
import dynamic from 'next/dynamic';
import './tracking.css';

const LiveTrackingMap = dynamic(() => import('@/components/LiveTrackingMap'), {
    ssr: false,
    loading: () => <div className="loading-center"><div className="spinner" /></div>,
});

export default function TrackingPage() {
    const { user } = useAuth();
    const [locations, setLocations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedUser, setSelectedUser] = useState('');
    const [historyData, setHistoryData] = useState(null);
    const [historyDate, setHistoryDate] = useState(new Date().toISOString().split('T')[0]);
    const [showHistory, setShowHistory] = useState(false);
    const [historyUserId, setHistoryUserId] = useState('');
    const [autoRefresh, setAutoRefresh] = useState(true);
    const [lastUpdate, setLastUpdate] = useState(null);

    const isAdmin = user && (user.role === 'admin' || user.role === 'manager');

    const fetchLocations = useCallback(async () => {
        try {
            const params = new URLSearchParams();
            if (selectedUser) params.set('user_id', selectedUser);
            const res = await fetch(`/api/tracking?${params}`);
            if (res.ok) {
                const data = await res.json();
                setLocations(data.locations || []);
                setLastUpdate(new Date());
            }
        } catch (e) {
            console.error('Failed to fetch locations:', e);
        }
        setLoading(false);
    }, [selectedUser]);

    // Auto-refresh every 5 seconds
    useEffect(() => {
        fetchLocations();
        if (!autoRefresh) return;
        const interval = setInterval(fetchLocations, 5000);
        return () => clearInterval(interval);
    }, [fetchLocations, autoRefresh]);

    async function fetchHistory() {
        if (!historyUserId) return;
        try {
            const res = await fetch(`/api/tracking/history?user_id=${historyUserId}&date=${historyDate}`);
            if (res.ok) {
                const data = await res.json();
                setHistoryData(data.history || []);
            }
        } catch (e) {
            console.error('Failed to fetch history:', e);
        }
    }

    if (!isAdmin) {
        return (
            <div className="empty-state">
                <div className="empty-icon"><Radio size={36} /></div>
                <h3>Akses Ditolak</h3>
                <p>Hanya admin dan manager yang dapat mengakses live tracking.</p>
            </div>
        );
    }

    const onlineCount = locations.filter(l => l.status === 'online').length;
    const idleCount = locations.filter(l => l.status === 'idle').length;
    const offlineCount = locations.filter(l => l.status === 'offline').length;

    return (
        <div className="tracking-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">🛰️ Live Tracking</h1>
                    <p className="page-subtitle">
                        Pantau lokasi sales secara real-time
                        {lastUpdate && (
                            <span className="tracking-last-update">
                                &nbsp;• Update: {lastUpdate.toLocaleTimeString('id-ID')}
                            </span>
                        )}
                    </p>
                </div>
                <div className="tracking-header-actions">
                    <button
                        className={`btn btn-sm ${autoRefresh ? 'btn-success' : 'btn-secondary'}`}
                        onClick={() => setAutoRefresh(!autoRefresh)}
                        title={autoRefresh ? 'Auto-refresh aktif' : 'Auto-refresh mati'}
                    >
                        <RefreshCw size={14} className={autoRefresh ? 'spin-slow' : ''} />
                        {autoRefresh ? 'Live' : 'Paused'}
                    </button>
                    <button
                        className={`btn btn-sm ${showHistory ? 'btn-primary' : 'btn-secondary'}`}
                        onClick={() => { setShowHistory(!showHistory); setHistoryData(null); }}
                    >
                        <Route size={14} /> Riwayat
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="tracking-stats">
                <div className="tracking-stat-card online">
                    <div className="stat-dot online" />
                    <div>
                        <div className="stat-value">{onlineCount}</div>
                        <div className="stat-label">Online</div>
                    </div>
                </div>
                <div className="tracking-stat-card idle">
                    <div className="stat-dot idle" />
                    <div>
                        <div className="stat-value">{idleCount}</div>
                        <div className="stat-label">Idle</div>
                    </div>
                </div>
                <div className="tracking-stat-card offline">
                    <div className="stat-dot offline" />
                    <div>
                        <div className="stat-value">{offlineCount}</div>
                        <div className="stat-label">Offline</div>
                    </div>
                </div>
                <div className="tracking-stat-card total">
                    <Users size={20} />
                    <div>
                        <div className="stat-value">{locations.length}</div>
                        <div className="stat-label">Total Sales</div>
                    </div>
                </div>
            </div>

            {/* History Panel */}
            {showHistory && (
                <div className="tracking-history-panel">
                    <div className="history-controls">
                        <select
                            className="form-control"
                            value={historyUserId}
                            onChange={e => { setHistoryUserId(e.target.value); setHistoryData(null); }}
                        >
                            <option value="">Pilih Sales</option>
                            {locations.map(loc => (
                                <option key={loc.user_id} value={loc.user_id}>{loc.user_name}</option>
                            ))}
                        </select>
                        <input
                            type="date"
                            className="form-control"
                            value={historyDate}
                            onChange={e => setHistoryDate(e.target.value)}
                        />
                        <button className="btn btn-primary btn-sm" onClick={fetchHistory} disabled={!historyUserId}>
                            <Route size={14} /> Tampilkan Rute
                        </button>
                    </div>
                    {historyData && (
                        <p className="history-info">
                            <MapPin size={13} /> {historyData.length} titik lokasi ditemukan
                        </p>
                    )}
                </div>
            )}

            {/* Map */}
            <div className="tracking-map-container">
                {loading ? (
                    <div className="loading-center"><div className="spinner" /></div>
                ) : (
                    <LiveTrackingMap
                        locations={locations}
                        historyData={historyData}
                        selectedUserId={selectedUser}
                    />
                )}
            </div>

            {/* Sales List */}
            {locations.length > 0 && (
                <div className="tracking-sales-list">
                    <h3><Users size={16} /> Sales Terdeteksi</h3>
                    <div className="sales-cards">
                        {locations.map(loc => (
                            <div key={loc.user_id} className={`sales-card ${loc.status}`}>
                                <div className="sales-card-header">
                                    <div className={`status-indicator ${loc.status}`} />
                                    <strong>{loc.user_name}</strong>
                                </div>
                                <div className="sales-card-body">
                                    <span><Clock size={12} /> {loc.seconds_ago < 60 ? `${loc.seconds_ago}d lalu` : loc.seconds_ago < 3600 ? `${Math.floor(loc.seconds_ago / 60)}m lalu` : `${Math.floor(loc.seconds_ago / 3600)}j lalu`}</span>
                                    {loc.speed > 0 && <span>🚗 {(loc.speed * 3.6).toFixed(1)} km/h</span>}
                                    {loc.accuracy && <span>📡 ±{Math.round(loc.accuracy)}m</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
