'use client';
import { useState, useEffect } from 'react';
import { UserPlus, Plus, Search, X } from 'lucide-react';

const sourceLabels = { website: 'Website', referral: 'Referral', social_media: 'Sosmed', campaign: 'Kampanye', cold_call: 'Cold Call', event: 'Event', other: 'Lainnya' };
const statusLabels = { new: 'Baru', contacted: 'Dihubungi', qualified: 'Qualified', converted: 'Converted', lost: 'Lost' };
const statusBadge = { new: 'badge-info', contacted: 'badge-warning', qualified: 'badge-primary', converted: 'badge-success', lost: 'badge-danger' };

export default function LeadsPage() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', email: '', phone: '', company: '', source: 'website', score: 0, status: 'new', notes: '' });

    useEffect(() => { fetchLeads(); }, []);
    async function fetchLeads() { setLoading(true); const res = await fetch('/api/leads'); const data = await res.json(); setLeads(data.leads || []); setLoading(false); }

    function openAdd() { setEditing(null); setForm({ name: '', email: '', phone: '', company: '', source: 'website', score: 0, status: 'new', notes: '' }); setShowModal(true); }
    function openEdit(l) { setEditing(l); setForm({ name: l.name, email: l.email || '', phone: l.phone || '', company: l.company || '', source: l.source || 'other', score: l.score || 0, status: l.status, notes: l.notes || '' }); setShowModal(true); }

    async function handleSubmit(e) {
        e.preventDefault();
        const method = editing ? 'PUT' : 'POST';
        const url = editing ? `/api/leads/${editing.id}` : '/api/leads';
        await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        setShowModal(false); fetchLeads();
    }

    function getScoreColor(score) {
        if (score >= 80) return 'var(--accent-success)';
        if (score >= 50) return 'var(--accent-warning)';
        return 'var(--accent-danger)';
    }

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div><h1 className="page-title">Leads</h1><p className="page-subtitle">{leads.length} leads</p></div>
                <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Tambah Lead</button>
            </div>

            {leads.length === 0 ? (
                <div className="empty-state"><div className="empty-icon"><UserPlus size={36} /></div><h3>Belum ada leads</h3><p>Tambahkan leads dari marketing</p><button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Tambah</button></div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>Nama</th><th>Perusahaan</th><th>Sumber</th><th>Score</th><th>Status</th><th>Aksi</th></tr></thead>
                        <tbody>{leads.map(l => (
                            <tr key={l.id}>
                                <td><strong>{l.name}</strong><br /><span className="text-sm text-muted">{l.email || l.phone || '-'}</span></td>
                                <td>{l.company || '-'}</td>
                                <td>{sourceLabels[l.source] || l.source}</td>
                                <td><div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: getScoreColor(l.score) }} /><strong>{l.score}</strong></div></td>
                                <td><span className={`badge ${statusBadge[l.status]}`}>{statusLabels[l.status]}</span></td>
                                <td><button className="btn btn-ghost btn-sm" onClick={() => openEdit(l)}>Edit</button></td>
                            </tr>
                        ))}</tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>{editing ? 'Edit' : 'Tambah'} Lead</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group"><label className="form-label">Nama *</label><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                                <div className="form-group"><label className="form-label">Email</label><input className="form-control" type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Telepon</label><input className="form-control" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Perusahaan</label><input className="form-control" value={form.company} onChange={e => setForm({ ...form, company: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Sumber</label><select className="form-control" value={form.source} onChange={e => setForm({ ...form, source: e.target.value })}>{Object.entries(sourceLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                                <div className="form-group"><label className="form-label">Score (0-100)</label><input className="form-control" type="number" min={0} max={100} value={form.score} onChange={e => setForm({ ...form, score: parseInt(e.target.value) || 0 })} /></div>
                                <div className="form-group"><label className="form-label">Status</label><select className="form-control" value={form.status} onChange={e => setForm({ ...form, status: e.target.value })}>{Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}</select></div>
                                <div className="form-group"><label className="form-label">Catatan</label><textarea className="form-control" rows={2} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} /></div>
                            </div>
                            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button><button type="submit" className="btn btn-primary">Simpan</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
