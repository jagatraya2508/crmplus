'use client';
import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Search, Eye, Check, X as XIcon, ChevronLeft, ChevronRight, Clock, Truck, Package } from 'lucide-react';
import Link from 'next/link';
import './orders.css';

const statusLabels = {
    draft: 'Draft', pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak',
    processing: 'Diproses', shipped: 'Dikirim', completed: 'Selesai', cancelled: 'Dibatalkan',
};

const statusBadge = {
    draft: 'badge-secondary', pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger',
    processing: 'badge-info', shipped: 'badge-primary', completed: 'badge-success', cancelled: 'badge-danger',
};

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');

    useEffect(() => { fetchOrders(); }, [page, statusFilter]);

    async function fetchOrders() {
        setLoading(true);
        const params = new URLSearchParams({ page, limit: 20 });
        if (statusFilter) params.set('status', statusFilter);
        try {
            const res = await fetch(`/api/orders?${params}`);
            const data = await res.json();
            setOrders(data.orders || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 0);
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    async function updateStatus(id, status) {
        try {
            await fetch(`/api/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            fetchOrders();
        } catch (e) { console.error(e); }
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Pesanan</h1>
                    <p className="page-subtitle">{total} pesanan</p>
                </div>
                <Link href="/orders/new" className="btn btn-primary"><Plus size={18} /> Buat Pesanan</Link>
            </div>

            <div className="toolbar">
                <select className="form-control" style={{ width: 'auto', minWidth: 160 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">Semua Status</option>
                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : orders.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon"><ShoppingCart size={36} /></div>
                    <h3>Belum ada pesanan</h3>
                    <p>Buat pesanan pertama dari pelanggan Anda</p>
                    <Link href="/orders/new" className="btn btn-primary"><Plus size={18} /> Buat Pesanan</Link>
                </div>
            ) : (
                <>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>No. Order</th>
                                    <th>Pelanggan</th>
                                    <th>Sales</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Tanggal</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(o => (
                                    <tr key={o.id}>
                                        <td><strong>{o.order_number}</strong></td>
                                        <td>{o.customer_name || '-'}</td>
                                        <td>{o.user_name || '-'}</td>
                                        <td className="text-right"><strong>Rp {parseFloat(o.total || 0).toLocaleString('id-ID')}</strong></td>
                                        <td><span className={`badge ${statusBadge[o.status] || 'badge-secondary'}`}>{statusLabels[o.status] || o.status}</span></td>
                                        <td>{new Date(o.created_at).toLocaleDateString('id-ID')}</td>
                                        <td>
                                            <div className="flex gap-sm">
                                                {o.status === 'pending' && (
                                                    <>
                                                        <button className="btn btn-success btn-sm" onClick={() => updateStatus(o.id, 'approved')} title="Approve"><Check size={14} /></button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => updateStatus(o.id, 'rejected')} title="Reject"><XIcon size={14} /></button>
                                                    </>
                                                )}
                                                {o.status === 'approved' && (
                                                    <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(o.id, 'completed')} title="Selesai"><Package size={14} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => <button key={i + 1} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>)}
                            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
