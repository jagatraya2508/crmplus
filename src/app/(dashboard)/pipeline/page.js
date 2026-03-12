'use client';
import { useState, useEffect } from 'react';
import { GitBranch, Plus, DollarSign, User, Calendar, X, Edit2, Trash2, ArrowRight } from 'lucide-react';
import './pipeline.css';

export default function PipelinePage() {
    const [stages, setStages] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [mode, setMode] = useState('new'); // 'new' or 'pull'
    const [selectedPullId, setSelectedPullId] = useState('');
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

    // Find the previous stage for the current target stage
    const currentStage = stages.find(s => String(s.id) === String(form.stage_id));
    const prevStage = currentStage ? stages.find(s => s.sort_order === currentStage.sort_order - 1) : null;
    const prevStageDeals = prevStage?.opportunities || [];

    // Show pull option when there's a previous stage with deals
    const canPull = prevStage && prevStageDeals.length > 0;

    async function handleSubmit(e) {
        e.preventDefault();

        if (mode === 'pull' && selectedPullId) {
            // Move existing deal to new stage
            await fetch(`/api/opportunities/${selectedPullId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ stage_id: form.stage_id })
            });
        } else if (editingId) {
            await fetch(`/api/opportunities/${editingId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
        } else {
            await fetch('/api/opportunities', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
            });
        }
        setShowModal(false);
        setEditingId(null);
        setMode('new');
        setSelectedPullId('');
        fetchPipeline();
    }

    function openAdd(stageId) {
        setEditingId(null);
        setMode('new');
        setSelectedPullId('');
        setForm({ title: '', customer_id: '', stage_id: stageId || '', value: 0, probability: 50, expected_close: '', description: '' });
        setShowModal(true);
    }

    function openEdit(opp) {
        setEditingId(opp.id);
        setMode('new');
        setSelectedPullId('');
        setForm({
            title: opp.title || '',
            customer_id: opp.customer_id || '',
            stage_id: opp.stage_id || '',
            value: parseFloat(opp.value) || 0,
            probability: opp.probability || 50,
            expected_close: opp.expected_close ? opp.expected_close.split('T')[0] : '',
            description: opp.description || ''
        });
        setShowModal(true);
    }

    function handleSelectPull(dealId) {
        setSelectedPullId(dealId);
        if (dealId) {
            const deal = prevStageDeals.find(d => String(d.id) === String(dealId));
            if (deal) {
                setForm(prev => ({
                    ...prev,
                    title: deal.title,
                    customer_id: deal.customer_id || '',
                    value: parseFloat(deal.value) || 0,
                    probability: deal.probability || 50,
                    expected_close: deal.expected_close ? deal.expected_close.split('T')[0] : '',
                    description: deal.description || ''
                }));
            }
        }
    }

    async function handleDelete(id) {
        if (!confirm('Apakah Anda yakin ingin menghapus deal ini?')) return;
        await fetch(`/api/opportunities/${id}`, { method: 'DELETE' });
        fetchPipeline();
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
                                    <div className="pipeline-card-top">
                                        <h5>{opp.title}</h5>
                                        <div className="pipeline-card-actions">
                                            <button className="pipeline-action-btn" onClick={(e) => { e.stopPropagation(); openEdit(opp); }} title="Edit">
                                                <Edit2 size={13} />
                                            </button>
                                            <button className="pipeline-action-btn pipeline-action-btn-danger" onClick={(e) => { e.stopPropagation(); handleDelete(opp.id); }} title="Hapus">
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
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
                <div className="modal-overlay">
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editingId ? 'Edit Deal' : 'Tambah Deal'}</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => { setShowModal(false); setEditingId(null); setMode('new'); setSelectedPullId(''); }}>
                                <X size={18} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                {/* Mode toggle: only show when adding (not editing) and previous stage has deals */}
                                {!editingId && canPull && (
                                    <div className="form-group">
                                        <label className="form-label">Sumber Deal</label>
                                        <div className="mode-toggle">
                                            <button type="button" className={`mode-toggle-btn ${mode === 'pull' ? 'active' : ''}`} onClick={() => { setMode('pull'); setSelectedPullId(''); }}>
                                                <ArrowRight size={14} /> Tarik dari {prevStage?.name}
                                            </button>
                                            <button type="button" className={`mode-toggle-btn ${mode === 'new' ? 'active' : ''}`} onClick={() => { setMode('new'); setSelectedPullId(''); setForm(prev => ({ ...prev, title: '', customer_id: '', value: 0, probability: 50, expected_close: '', description: '' })); }}>
                                                <Plus size={14} /> Buat Baru
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Pull from previous stage mode */}
                                {mode === 'pull' && !editingId && canPull ? (
                                    <>
                                        <div className="form-group">
                                            <label className="form-label">Pilih Deal dari {prevStage?.name} *</label>
                                            <select className="form-control" value={selectedPullId} onChange={e => handleSelectPull(e.target.value)} required>
                                                <option value="">-- Pilih Deal --</option>
                                                {prevStageDeals.map(d => (
                                                    <option key={d.id} value={d.id}>
                                                        {d.title} {d.customer_name ? `- ${d.customer_name}` : ''} (Rp {parseFloat(d.value).toLocaleString('id-ID')})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                        {selectedPullId && (
                                            <div className="prospek-preview">
                                                <div className="prospek-preview-label">Deal yang akan dipindahkan:</div>
                                                <div className="prospek-preview-card">
                                                    <strong>{form.title}</strong>
                                                    <span className="text-sm text-muted">Rp {form.value.toLocaleString('id-ID')}</span>
                                                    <span className="prospek-preview-arrow">
                                                        {prevStage?.name} <ArrowRight size={14} /> {currentStage?.name || ''}
                                                    </span>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {/* Normal form fields for new or edit */}
                                        <div className="form-group">
                                            <label className="form-label">Judul Deal *</label>
                                            <input className="form-control" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} required />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Pelanggan</label>
                                            <select className="form-control" value={form.customer_id} onChange={e => setForm({ ...form, customer_id: e.target.value })}>
                                                <option value="">Pilih...</option>
                                                {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Stage</label>
                                            <select className="form-control" value={form.stage_id} onChange={e => setForm({ ...form, stage_id: e.target.value })}>
                                                {stages.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Nilai (Rp)</label>
                                            <input className="form-control" type="number" value={form.value} onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Probabilitas (%)</label>
                                            <input className="form-control" type="number" min={0} max={100} value={form.probability} onChange={e => setForm({ ...form, probability: parseInt(e.target.value) || 0 })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Target Close</label>
                                            <input className="form-control" type="date" value={form.expected_close} onChange={e => setForm({ ...form, expected_close: e.target.value })} />
                                        </div>
                                        <div className="form-group">
                                            <label className="form-label">Deskripsi</label>
                                            <textarea className="form-control" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setEditingId(null); setMode('new'); setSelectedPullId(''); }}>Batal</button>
                                <button type="submit" className="btn btn-primary" disabled={mode === 'pull' && !selectedPullId}>
                                    {editingId ? 'Update' : mode === 'pull' ? 'Pindahkan Deal' : 'Simpan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
