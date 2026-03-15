'use client';
import { useState, useEffect } from 'react';
import { MapPin, Clock, LogIn, LogOut, Search, User, Calendar, Eye, ChevronLeft, ChevronRight, Trash2, Edit, X, Navigation, Download, FileText } from 'lucide-react';
import { useAuth } from '@/components/AppShell';
import Link from 'next/link';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './visits.css';

export default function VisitsPage() {
    const { user: currentUser } = useAuth();
    const [visits, setVisits] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [customerFilter, setCustomerFilter] = useState('');
    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState(null);
    const [customers, setCustomers] = useState([]);
    const [saving, setSaving] = useState(false);
    const [expandedMap, setExpandedMap] = useState(null);
    const [editForm, setEditForm] = useState({
        customer_id: '',
        notes: '',
        summary: '',
        checkin_time: '',
        checkout_time: '',
        status: '',
    });

    const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'manager');

    useEffect(() => { fetchVisits(); }, [page, dateFrom, dateTo, statusFilter, customerFilter]);
    useEffect(() => { fetchCustomers(); }, []);

    async function fetchCustomers() {
        try {
            const res = await fetch('/api/customers?limit=999');
            const data = await res.json();
            setCustomers(data.customers || []);
        } catch (e) { console.error(e); }
    }

    function openEdit(v) {
        setEditData(v);
        setEditForm({
            customer_id: v.customer_id || '',
            notes: v.notes || '',
            summary: v.summary || '',
            checkin_time: v.checkin_time ? toLocalDatetime(v.checkin_time) : '',
            checkout_time: v.checkout_time ? toLocalDatetime(v.checkout_time) : '',
            status: v.status || 'checked_in',
        });
        fetchCustomers();
        setShowEditModal(true);
    }

    function toLocalDatetime(isoStr) {
        const d = new Date(isoStr);
        const offset = d.getTimezoneOffset();
        const local = new Date(d.getTime() - offset * 60000);
        return local.toISOString().slice(0, 16);
    }

    async function handleEditSubmit(e) {
        e.preventDefault();
        if (!editData) return;
        setSaving(true);
        try {
            const payload = {
                customer_id: parseInt(editForm.customer_id),
                notes: editForm.notes,
                summary: editForm.summary,
                checkin_time: editForm.checkin_time ? new Date(editForm.checkin_time).toISOString() : null,
                checkout_time: editForm.checkout_time ? new Date(editForm.checkout_time).toISOString() : null,
                status: editForm.status,
            };
            const res = await fetch(`/api/visits/${editData.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setShowEditModal(false);
                fetchVisits();
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal menyimpan perubahan');
            }
        } catch (err) {
            console.error('Error editing visit:', err);
            alert('Terjadi kesalahan');
        }
        setSaving(false);
    }

    async function deleteVisit(id) {
        if (!confirm('Yakin ingin menghapus data kunjungan ini secara permanen?')) return;
        try {
            const res = await fetch(`/api/visits/${id}`, { method: 'DELETE' });
            if (res.ok) fetchVisits();
            else {
                const data = await res.json();
                alert(data.error || 'Gagal menghapus kunjungan');
            }
        } catch (e) {
            console.error('Error deleting visit:', e);
            alert('Terjadi kesalahan');
        }
    }

    async function fetchVisits() {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 20 });
            if (dateFrom) params.set('date_from', dateFrom);
            if (dateTo) params.set('date_to', dateTo);
            if (statusFilter) params.set('status', statusFilter);
            if (customerFilter) params.set('customer_id', customerFilter);
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

    async function getFullData() {
        const params = new URLSearchParams({ limit: 9999 });
        if (dateFrom) params.set('date_from', dateFrom);
        if (dateTo) params.set('date_to', dateTo);
        if (statusFilter) params.set('status', statusFilter);
        if (customerFilter) params.set('customer_id', customerFilter);
        const res = await fetch(`/api/visits?${params}`);
        const data = await res.json();
        return data.visits || [];
    }

    async function exportToExcel() {
        const fullData = await getFullData();
        const exportData = fullData.map(v => ({
            'Nama Pelanggan': v.customer_name || '-',
            'Perusahaan/Alamat': v.customer_company || v.customer_address || '-',
            'Sales': v.user_name || '-',
            'Status': v.status === 'checked_in' ? 'Check-in' : 'Selesai',
            'Waktu Check-in': v.checkin_time ? new Date(v.checkin_time).toLocaleString('id-ID') : '-',
            'Waktu Check-out': v.checkout_time ? new Date(v.checkout_time).toLocaleString('id-ID') : '-',
            'Durasi': formatDuration(v.checkin_time, v.checkout_time),
            'Catatan': v.notes || '-',
            'Ringkasan': v.summary || '-',
        }));

        const ws = XLSX.utils.json_to_sheet(exportData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Kunjungan");
        XLSX.writeFile(wb, "Laporan_Kunjungan.xlsx");
    }

    async function exportToPDF() {
        const fullData = await getFullData();
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text("Laporan Kunjungan Sales", 14, 15);
        doc.setFontSize(10);
        doc.text(`Tanggal: ${dateFilter || 'Semua Waktu'}`, 14, 22);

        const tableColumn = ["Pelanggan", "Sales", "Status", "Check-in", "Check-out", "Durasi"];
        const tableRows = [];

        fullData.forEach(v => {
            const rowData = [
                v.customer_name || '-',
                v.user_name || '-',
                v.status === 'checked_in' ? 'Check-in' : 'Selesai',
                v.checkin_time ? new Date(v.checkin_time).toLocaleString('id-ID') : '-',
                v.checkout_time ? new Date(v.checkout_time).toLocaleString('id-ID') : '-',
                formatDuration(v.checkin_time, v.checkout_time)
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185] }
        });

        doc.save("Laporan_Kunjungan.pdf");
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

            <div className="toolbar" style={{ flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <label style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>Dari:</label>
                    <div className="search-box" style={{ maxWidth: 170 }}>
                        <Calendar size={16} className="search-icon" />
                        <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
                    </div>
                    <label style={{ fontSize: '13px', color: '#64748b', whiteSpace: 'nowrap' }}>s/d:</label>
                    <div className="search-box" style={{ maxWidth: 170 }}>
                        <Calendar size={16} className="search-icon" />
                        <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
                    </div>
                </div>
                <select className="form-control" style={{ width: 'auto', minWidth: 180 }} value={customerFilter} onChange={e => { setCustomerFilter(e.target.value); setPage(1); }}>
                    <option value="">Semua Pelanggan</option>
                    {customers.map(c => (
                        <option key={c.id} value={c.id}>{c.name}{c.company ? ` - ${c.company}` : ''}</option>
                    ))}
                </select>
                <select className="form-control" style={{ width: 'auto', minWidth: 160 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">Semua Status</option>
                    <option value="checked_in">Check-in</option>
                    <option value="checked_out">Check-out</option>
                </select>
                <div style={{ marginLeft: 'auto', display: 'flex', gap: '8px' }}>
                    <button className="btn btn-outline" onClick={exportToExcel} title="Export ke Excel">
                        <FileText size={16} /> Excel
                    </button>
                    <button className="btn btn-outline" onClick={exportToPDF} title="Export ke PDF">
                        <Download size={16} /> PDF
                    </button>
                    <Link href="/visits/map" className="btn btn-secondary">
                        <MapPin size={16} /> Lihat Peta
                    </Link>
                </div>
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

                                    {/* Koordinat Check-in & Check-out */}
                                    {(v.checkin_lat || v.checkout_lat) && (
                                        <div className="visit-coords">
                                            {v.checkin_lat && v.checkin_lng && (
                                                <div className="coord-tag checkin">
                                                    <Navigation size={12} />
                                                    <span>Check-in: {parseFloat(v.checkin_lat).toFixed(6)}, {parseFloat(v.checkin_lng).toFixed(6)}</span>
                                                </div>
                                            )}
                                            {v.checkout_lat && v.checkout_lng && (
                                                <div className="coord-tag checkout">
                                                    <Navigation size={12} />
                                                    <span>Check-out: {parseFloat(v.checkout_lat).toFixed(6)}, {parseFloat(v.checkout_lng).toFixed(6)}</span>
                                                </div>
                                            )}
                                            <button
                                                className="btn btn-ghost btn-sm coord-map-btn"
                                                onClick={() => setExpandedMap(expandedMap === v.id ? null : v.id)}
                                                title="Lihat Peta"
                                            >
                                                <MapPin size={13} /> {expandedMap === v.id ? 'Tutup Peta' : 'Lihat Peta'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Inline Map */}
                                    {expandedMap === v.id && v.checkin_lat && v.checkin_lng && (
                                        <div className="visit-map-preview">
                                            <iframe
                                                width="100%"
                                                height="220"
                                                style={{ border: 0, display: 'block' }}
                                                loading="lazy"
                                                src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(v.checkin_lng) - 0.008}%2C${parseFloat(v.checkin_lat) - 0.005}%2C${parseFloat(v.checkout_lng || v.checkin_lng) + 0.008}%2C${parseFloat(v.checkout_lat || v.checkin_lat) + 0.005}&layer=mapnik&marker=${v.checkin_lat}%2C${v.checkin_lng}`}
                                            />
                                            <div className="visit-map-links">
                                                <a
                                                    href={`https://www.openstreetmap.org/?mlat=${v.checkin_lat}&mlon=${v.checkin_lng}#map=16/${v.checkin_lat}/${v.checkin_lng}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                >
                                                    📍 Check-in di OpenStreetMap
                                                </a>
                                                {v.checkout_lat && v.checkout_lng && (
                                                    <a
                                                        href={`https://www.openstreetmap.org/?mlat=${v.checkout_lat}&mlon=${v.checkout_lng}#map=16/${v.checkout_lat}/${v.checkout_lng}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        🏁 Check-out di OpenStreetMap
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {v.notes && <p className="visit-notes">{v.notes}</p>}
                                    {v.summary && <p className="visit-notes" style={{ borderLeftColor: 'var(--accent-success)' }}>{v.summary}</p>}
                                </div>
                                <div className="visit-actions">
                                    {v.status === 'checked_in' && (
                                        <Link href={`/visits/checkout/${v.id}`} className="btn btn-warning btn-sm">
                                            <LogOut size={14} /> Check-out
                                        </Link>
                                    )}
                                    {isAdmin && (
                                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(v)} title="Edit Kunjungan">
                                            <Edit size={14} />
                                        </button>
                                    )}
                                    {isAdmin && (
                                        <button className="btn btn-danger btn-sm" onClick={() => deleteVisit(v.id)} title="Hapus Kunjungan">
                                            <Trash2 size={14} />
                                        </button>
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

            {/* Edit Modal */}
            {showEditModal && editData && (
                <div className="modal-overlay">
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
                        <div className="modal-header">
                            <h3>Edit Kunjungan</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowEditModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleEditSubmit}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Pelanggan *</label>
                                        <select
                                            className="form-control"
                                            value={editForm.customer_id}
                                            onChange={e => setEditForm({ ...editForm, customer_id: e.target.value })}
                                            required
                                        >
                                            <option value="">Pilih Pelanggan</option>
                                            {customers.map(c => (
                                                <option key={c.id} value={c.id}>{c.name}{c.company ? ` - ${c.company}` : ''}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Waktu Check-in</label>
                                        <input
                                            className="form-control"
                                            type="datetime-local"
                                            value={editForm.checkin_time}
                                            onChange={e => setEditForm({ ...editForm, checkin_time: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Waktu Check-out</label>
                                        <input
                                            className="form-control"
                                            type="datetime-local"
                                            value={editForm.checkout_time}
                                            onChange={e => setEditForm({ ...editForm, checkout_time: e.target.value })}
                                        />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Status</label>
                                        <select
                                            className="form-control"
                                            value={editForm.status}
                                            onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                                        >
                                            <option value="checked_in">Check-in</option>
                                            <option value="checked_out">Selesai (Check-out)</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Catatan</label>
                                        <textarea
                                            className="form-control"
                                            rows={2}
                                            value={editForm.notes}
                                            onChange={e => setEditForm({ ...editForm, notes: e.target.value })}
                                            placeholder="Catatan kunjungan..."
                                        />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Ringkasan</label>
                                        <textarea
                                            className="form-control"
                                            rows={2}
                                            value={editForm.summary}
                                            onChange={e => setEditForm({ ...editForm, summary: e.target.value })}
                                            placeholder="Ringkasan hasil kunjungan..."
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowEditModal(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
