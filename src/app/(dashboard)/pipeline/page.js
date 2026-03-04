'use client';
import { useState, useEffect } from 'react';
import { GitBranch, Plus, DollarSign, User, Calendar, X } from 'lucide-react';
import './pipeline.css';

export default function PipelinePage() {
    const [stages, setStages] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ title: '', customer_id: '', stage_id: '', value: 0, probability: 50, expected_close: '', description: '' });

    useEffect(() => {
        fetchPipeline();
        fetch('/api/customers?limit=200').then(r => r.json()).then(d => setCustomers(d.customers || []));
    }, []);

    async function fetchPipeline() {
        setLoading(true);
        const res = await fetch('/api/pipeline');
        const data = await res.json();
        setStages(data.stages || []);
        setLoading(false);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        await fetch('/api/opportunities', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        setShowModal(false);
        fetchPipeline();
    }

    function openAdd(stageId) {
        setForm({ title: '', customer_id: '', stage_id: stageId || '', value: 0, probability: 50, expected_close: '', description: '' });
        setShowModal(true);
    }

    const totalValue = stages.reduce((sum, s) => sum + s.opportunities.reduce((s2, o) => s2 + parseFloat(o.value || 0), 0), 0);

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Sales Pipeline</h1>
                    <p className="page-subtitle">Total pipeline: Rp {totalValue.toLocaleString('id-ID')}</p>
                </div>
                <button className="btn btn-primary" onClick={() => openAdd('')}><Plus size={18} /> Tambah Deal</button>
            </div>

            <div className="pipeline-board">
                {stages.map(stage => (
                    <div key={stage.id} className="pipeline-column">
                        <div className="pipeline-column-header" style={{ borderTopColor: stage.color }}>
                            <h4>{stage.name}</h4>
                            <span className="badge badge-secondary">{stage.opportunities.length}</span>
                        </div>
                        <div className="pipeline-cards">
                            {stage.opportunities.map(opp => (
                                <div key={opp.id} className="pipeline-card">
                                    <h5>{opp.title}</h5>
                                    <p className="text-sm text-muted">{opp.customer_name || '-'}</p>
                                    <div className="pipeline-card-meta">
                                        <span><DollarSign size={12} /> Rp {parseFloat(opp.value).toLocaleString('id-ID')}</span>
                                        <span className="badge badge-info">{opp.probability}%</span>
                                    </div>
                                    {opp.assigned_name && <div className="pipeline-card-user"><User size={12} /> {opp.assigned_name}</div>}
                                </div>
                            ))}
                            <button className="pipeline-add-btn" onClick={() => openAdd(stage.id)}>
                                <Plus size={16} /> Tambah
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>Tambah Deal</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group"><label className="form-label">Judul Deal *</label><input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required /></div>
                                <div className="form-group"><label className="form-label">Pelanggan</label><select className="form-control" value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}><option value="">Pilih...</option>{customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                                <div className="form-group"><label className="form-label">Stage</label><select className="form-control" value={form.stage_id} onChange={e => setForm({ ...form, stage_id: e.target.value })}>{stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                                <div className="form-group"><label className="form-label">Nilai (Rp)</label><input className="form-control" type="number" value={form.value} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} /></div>
                                <div className="form-group"><label className="form-label">Probabilitas (%)</label><input className="form-control" type="number" min={0} max={100} value={form.probability} onChange={e => setForm({ ...form, probability: parseInt(e.target.value) || 0 })} /></div>
                                <div className="form-group"><label className="form-label">Target Close</label><input className="form-control" type="date" value={form.expected_close} onChange={e => setForm({ ...form, expected_close: e.target.value })} /></div>
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
