'use client';
import { useState, useEffect } from 'react';
import { Megaphone, Plus, Edit, Trash2, X, Calendar } from 'lucide-react';

const typeLabels = { email: 'Email', social: 'Sosial Media', event: 'Event', promotion: 'Promosi', other: 'Lainnya' };
const statusLabels = { draft: 'Draft', active: 'Aktif', paused: 'Dijeda', completed: 'Selesai' };
const statusBadge = { draft: 'badge-secondary', active: 'badge-success', paused: 'badge-warning', completed: 'badge-info' };

export default function CampaignsPage() {
    const [campaigns, setCampaigns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', type: 'promotion', status: 'draft', budget: 0, start_date: '', end_date: '', description: '', target_audience: '' });

    useEffect(() => { fetchCampaigns(); }, []);
    async function fetchCampaigns() { setLoading(true); const res = await fetch('/api/campaigns'); const data = await res.json(); setCampaigns(data.campaigns || []); setLoading(false); }

    function openAdd() { setEditing(null); setForm({ name: '', type: 'promotion', status: 'draft', budget: 0, start_date: '', end_date: '', description: '', target_audience: '' }); setShowModal(true); }
    function openEdit(c) { setEditing(c); setForm({ name: c.name, type: c.type, status: c.status, budget: parseFloat(c.budget), start_date: c.start_date?.split('T')[0] || '', end_date: c.end_date?.split('T')[0] || '', description: c.description || '', target_audience: c.target_audience || '' }); setShowModal(true); }

    async function handleSubmit(e) {
        e.preventDefault();
        const method = editing ? 'PUT' : 'POST';
        const url = editing ? `/api/campaigns/${editing.id}` : '/api/campaigns';
        await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        setShowModal(false); fetchCampaigns();
    }

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div><h1 className="page-title">Kampanye Marketing</h1><p className="page-subtitle">{campaigns.length} kampanye</p></div>
                <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Buat Kampanye</button>
            </div>

            {campaigns.length === 0 ? (
                <div className="empty-state"><div className="empty-icon"><Megaphone size={36} /></div><h3>Belum ada kampanye</h3><p>Buat kampanye marketing pertama</p><button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Buat</button></div>
            ) : (
                <div className="grid grid-3">
                    {campaigns.map(c => (
                        <div key={c.id} className="card" style={{ cursor: 'pointer' }} onClick={() => openEdit(c)}>
                            <div className="flex items-center justify-between mb-sm">
                                <span className={`badge ${statusBadge[c.status]}`}>{statusLabels[c.status]}</span>
                                <span className="badge badge-secondary">{typeLabels[c.type]}</span>
                            </div>
                            <h4 style={{ marginBottom: 4 }}>{c.name}</h4>
                            <p className="text-sm text-muted" style={{ marginBottom: 12 }}>{c.description || 'Tidak ada deskripsi'}</p>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-muted"><Calendar size={12} /> {c.start_date ? new Date(c.start_date).toLocaleDateString('id-ID') : '-'}</span>
                                <strong>Rp {parseFloat(c.budget || 0).toLocaleString('id-ID')}</strong>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>{editing ? 'Edit' : 'Buat'} Kampanye</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group"><label className="form-label">Nama *</label><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                                <div className="form-group"><label className="form-label">Tipe</label><select className="form-control" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}>{Object.entries(typeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                                <div className="form-group"><label className="form-label">Status</label><select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                                <div className="form-group"><label className="form-label">Budget (Rp)</label><input className="form-control" type="number" value={form.budget} onChange={e => setForm({ ...form, budget: parseFloat(e.target.value) || 0 })} /></div>
                                <div className="form-group"><label className="form-label">Tanggal Mulai</label><input className="form-control" type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Tanggal Selesai</label><input className="form-control" type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Target Audience</label><input className="form-control" value={form.target_audience} onChange={e => setForm({ ...form, target_audience: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Deskripsi</label><textarea className="form-control" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                            </div>
                            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button><button type="submit" className="btn btn-primary">Simpan</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
