'use client';
import { useState, useEffect } from 'react';
import { Plus, Search, Filter, Users, Building, Mail, Phone, MapPin, Edit, Trash2, X, ChevronLeft, ChevronRight, Crosshair, Loader } from 'lucide-react';
import './customers.css';

const categories = [
    { value: '', label: 'Semua' },
    { value: 'prospect', label: 'Prospek' },
    { value: 'active', label: 'Aktif' },
    { value: 'inactive', label: 'Tidak Aktif' },
    { value: 'vip', label: 'VIP' },
];

const categoryBadge = {
    prospect: 'badge-info',
    active: 'badge-success',
    inactive: 'badge-secondary',
    vip: 'badge-warning',
};

const categoryLabel = {
    prospect: 'Prospek',
    active: 'Aktif',
    inactive: 'Tidak Aktif',
    vip: 'VIP',
};

export default function CustomersPage() {
    const [customers, setCustomers] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [form, setForm] = useState({
        name: '', company: '', email: '', phone: '', address: '', city: '', province: '', postal_code: '', category: 'prospect', notes: '', latitude: '', longitude: '',
    });

    function generateLocation() {
        if (!navigator.geolocation) {
            alert('Browser tidak mendukung Geolocation');
            return;
        }
        setGettingLocation(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setForm(prev => ({
                    ...prev,
                    latitude: position.coords.latitude.toFixed(6),
                    longitude: position.coords.longitude.toFixed(6),
                }));
                setGettingLocation(false);
            },
            (error) => {
                setGettingLocation(false);
                if (error.code === 1) alert('Akses lokasi ditolak. Izinkan akses lokasi di browser.');
                else if (error.code === 2) alert('Lokasi tidak tersedia. Pastikan GPS aktif.');
                else alert('Gagal mendapatkan lokasi. Coba lagi.');
            },
            { enableHighAccuracy: true, timeout: 15000 }
        );
    }

    useEffect(() => {
        fetchCustomers();
    }, [page, search, category]);

    async function fetchCustomers() {
        setLoading(true);
        try {
            const params = new URLSearchParams({ page, limit: 20 });
            if (search) params.set('search', search);
            if (category) params.set('category', category);
            const res = await fetch(`/api/customers?${params}`);
            const data = await res.json();
            setCustomers(data.customers || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 0);
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    function openAdd() {
        setEditing(null);
        setForm({ name: '', company: '', email: '', phone: '', address: '', city: '', province: '', postal_code: '', category: 'prospect', notes: '', latitude: '', longitude: '' });
        setShowModal(true);
    }

    function openEdit(c) {
        setEditing(c);
        setForm({
            name: c.name || '', company: c.company || '', email: c.email || '', phone: c.phone || '',
            address: c.address || '', city: c.city || '', province: c.province || '', postal_code: c.postal_code || '',
            category: c.category || 'prospect', notes: c.notes || '', latitude: c.latitude || '', longitude: c.longitude || '',
        });
        setShowModal(true);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        try {
            const method = editing ? 'PUT' : 'POST';
            const url = editing ? `/api/customers/${editing.id}` : '/api/customers';
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...form, latitude: form.latitude ? parseFloat(form.latitude) : null, longitude: form.longitude ? parseFloat(form.longitude) : null }),
            });
            if (res.ok) {
                setShowModal(false);
                fetchCustomers();
            }
        } catch (e) { console.error(e); }
    }

    async function handleDelete(id) {
        if (!confirm('Yakin ingin menghapus pelanggan ini?')) return;
        try {
            await fetch(`/api/customers/${id}`, { method: 'DELETE' });
            fetchCustomers();
        } catch (e) { console.error(e); }
    }

    let searchTimeout;
    function onSearch(val) {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => { setSearch(val); setPage(1); }, 300);
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Pelanggan</h1>
                    <p className="page-subtitle">{total} pelanggan terdaftar</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>
                    <Plus size={18} /> Tambah Pelanggan
                </button>
            </div>

            <div className="toolbar">
                <div className="search-box">
                    <Search size={16} className="search-icon" />
                    <input placeholder="Cari nama, perusahaan, email..." onChange={e => onSearch(e.target.value)} />
                </div>
                <select className="form-control" style={{ width: 'auto', minWidth: 140 }} value={category} onChange={e => { setCategory(e.target.value); setPage(1); }}>
                    {categories.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : customers.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon"><Users size={36} /></div>
                    <h3>Belum ada pelanggan</h3>
                    <p>Tambahkan pelanggan pertama Anda</p>
                    <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Tambah Pelanggan</button>
                </div>
            ) : (
                <>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Nama</th>
                                    <th>Perusahaan</th>
                                    <th>Kontak</th>
                                    <th>Kota</th>
                                    <th>Kategori</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {customers.map(c => (
                                    <tr key={c.id}>
                                        <td>
                                            <div className="customer-name">
                                                <div className="customer-avatar">{c.name?.charAt(0)?.toUpperCase()}</div>
                                                <span>{c.name}</span>
                                            </div>
                                        </td>
                                        <td>{c.company || '-'}</td>
                                        <td>
                                            <div className="customer-contact">
                                                {c.email && <span><Mail size={12} /> {c.email}</span>}
                                                {c.phone && <span><Phone size={12} /> {c.phone}</span>}
                                            </div>
                                        </td>
                                        <td>{c.city || '-'}</td>
                                        <td><span className={`badge ${categoryBadge[c.category] || 'badge-secondary'}`}>{categoryLabel[c.category] || c.category}</span></td>
                                        <td>
                                            <div className="flex gap-sm">
                                                <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)} title="Edit"><Edit size={15} /></button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(c.id)} title="Hapus"><Trash2 size={15} /></button>
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
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                                const p = i + 1;
                                return <button key={p} className={page === p ? 'active' : ''} onClick={() => setPage(p)}>{p}</button>;
                            })}
                            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
                        </div>
                    )}
                </>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 700 }}>
                        <div className="modal-header">
                            <h3>{editing ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label className="form-label">Nama *</label>
                                        <input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Perusahaan</label>
                                        <input className="form-control" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Email</label>
                                        <input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Telepon</label>
                                        <input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Alamat</label>
                                        <textarea className="form-control" rows={2} value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Kota</label>
                                        <input className="form-control" value={form.city} onChange={e => setForm({ ...form, city: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Provinsi</label>
                                        <input className="form-control" value={form.province} onChange={e => setForm({ ...form, province: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Kode Pos</label>
                                        <input className="form-control" value={form.postal_code} onChange={e => setForm({ ...form, postal_code: e.target.value })} />
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Kategori</label>
                                        <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                            <option value="prospect">Prospek</option>
                                            <option value="active">Aktif</option>
                                            <option value="inactive">Tidak Aktif</option>
                                            <option value="vip">VIP</option>
                                        </select>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                                            <label className="form-label" style={{ margin: 0 }}>Koordinat Lokasi</label>
                                            <button
                                                type="button"
                                                className="btn btn-primary btn-sm"
                                                onClick={generateLocation}
                                                disabled={gettingLocation}
                                                style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: '0.8rem', padding: '6px 12px' }}
                                            >
                                                {gettingLocation ? <Loader size={14} className="spin" /> : <Crosshair size={14} />}
                                                {gettingLocation ? 'Mendapatkan lokasi...' : 'Generate Lokasi'}
                                            </button>
                                        </div>
                                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                                            <div>
                                                <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Latitude</label>
                                                <input className="form-control" type="number" step="any" value={form.latitude} onChange={e => setForm({ ...form, latitude: e.target.value })} placeholder="-6.xxxx" />
                                            </div>
                                            <div>
                                                <label className="form-label" style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Longitude</label>
                                                <input className="form-control" type="number" step="any" value={form.longitude} onChange={e => setForm({ ...form, longitude: e.target.value })} placeholder="106.xxxx" />
                                            </div>
                                        </div>
                                    </div>
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">Catatan</label>
                                        <textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button>
                                <button type="submit" className="btn btn-primary">{editing ? 'Simpan' : 'Tambah'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
