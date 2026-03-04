'use client';
import { useState, useEffect } from 'react';
import { MapPin, Clock, LogIn, LogOut, Search, User, Calendar, Eye, ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import './visits.css';

export default function VisitsPage() {
    const [visits, setVisits] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [dateFilter, setDateFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => { fetchVisits(); }, [page, dateFilter, statusFilter]);

    async function fetchVisits() {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 20 });
            if (dateFilter) params.set('date', dateFilter);
            if (statusFilter) params.set('status', statusFilter);
            const res = await fetch(`/api/visits?${params}`);
            const data = await res.json();
            setVisits(data.visits || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 0);
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    function formatDuration(checkin, checkout) {
        if (!checkout) return 'Masih aktif';
        const diff = new Date(checkout) - new Date(checkin);
        const hours = Math.floor(diff / 3600000);
        const mins = Math.floor((diff % 3600000) / 60000);
        return `${hours}j ${mins}m`;
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Kunjungan</h1>
                    <p className="page-subtitle">{total} kunjungan tercatat</p>
                </div>
                <Link href="/visits/checkin" className="btn btn-success">
                    <LogIn size={18} /> Check-in Sekarang
                </Link>
            </div>

            <div className="toolbar">
                <div className="search-box" style={{ maxWidth: 200 }}>
                    <Calendar size={16} className="search-icon" />
                    <input type="date" value={dateFilter} onChange={e => { setDateFilter(e.target.value); setPage(1); }} />
                </div>
                <select className="form-control" style={{ width: 'auto', minWidth: 160 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">Semua Status</option>
                    <option value="checked_in">Check-in</option>
                    <option value="checked_out">Check-out</option>
                </select>
                <Link href="/visits/map" className="btn btn-secondary">
                    <MapPin size={16} /> Lihat Peta
                </Link>
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : visits.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon"><MapPin size={36} /></div>
                    <h3>Belum ada kunjungan</h3>
                    <p>Mulai check-in di lokasi pelanggan</p>
                    <Link href="/visits/checkin" className="btn btn-success"><LogIn size={18} /> Check-in</Link>
                </div>
            ) : (
                <>
                    <div className="visits-list">
                        {visits.map(v => (
                            <div key={v.id} className={`visit-card ${v.status}`}>
                                <div className="visit-status-indicator" />
                                <div className="visit-info">
                                    <div className="visit-header">
                                        <h4>{v.customer_name || 'Unknown'}</h4>
                                        <span className={`badge ${v.status === 'checked_in' ? 'badge-success' : 'badge-secondary'}`}>
                                            {v.status === 'checked_in' ? '📍 Check-in' : '✅ Selesai'}
                                        </span>
                                    </div>
                                    <p className="visit-company">{v.customer_company || v.customer_address || ''}</p>
                                    <div className="visit-meta">
                                        <span><User size={13} /> {v.user_name}</span>
                                        <span><Clock size={13} /> {new Date(v.checkin_time).toLocaleString('id-ID')}</span>
                                        {v.checkout_time && <span><LogOut size={13} /> {new Date(v.checkout_time).toLocaleString('id-ID')}</span>}
                                        <span className="visit-duration">{formatDuration(v.checkin_time, v.checkout_time)}</span>
                                    </div>
                                    {v.notes && <p className="visit-notes">{v.notes}</p>}
                                </div>
                                <div className="visit-actions">
                                    {v.status === 'checked_in' && (
                                        <Link href={`/visits/checkout/${v.id}`} className="btn btn-warning btn-sm">
                                            <LogOut size={14} /> Check-out
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>

                    {totalPages > 1 && (
                        <div className="pagination">
                            <button disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                const p = i + 1;
                                return <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>;
                            })}
                            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
