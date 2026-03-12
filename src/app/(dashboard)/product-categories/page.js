'use client';
import { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, X, ListTree } from 'lucide-react';

export default function ProductCategoriesPage() {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState({ name: '', type: 'Category' });

    useEffect(() => { fetchCategories(); }, []);

    async function fetchCategories() {
        setLoading(true);
        const res = await fetch('/api/product-categories');
        const data = await res.json();
        setCategories(data.categories || []);
        setLoading(false);
    }

    function openAdd() { 
        setEditing(null); 
        setForm({ name: '', type: 'Category' }); 
        setShowModal(true); 
    }
    
    function openEdit(c) { 
        setEditing(c); 
        setForm({ name: c.name, type: c.type }); 
        setShowModal(true); 
    }

    async function handleSubmit(e) {
        e.preventDefault();
        const method = editing ? 'PUT' : 'POST';
        const url = editing ? `/api/product-categories/${editing.id}` : '/api/product-categories';
        await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        setShowModal(false);
        fetchCategories();
    }

    async function handleDelete(id) {
        if (!confirm('Hapus kategori ini?')) return;
        await fetch(`/api/product-categories/${id}`, { method: 'DELETE' });
        fetchCategories();
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Master Data Kategori</h1>
                    <p className="page-subtitle">{categories.length} data master kategori</p>
                </div>
                <button className="btn btn-primary" onClick={openAdd}>
                    <Plus size={18} /> Tambah Data
                </button>
            </div>

            {loading ? <div className="loading-center"><div className="spinner" /></div> : categories.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon"><ListTree size={36} /></div>
                    <h3>Belum ada data kategori</h3>
                    <p>Tambahkan master data kategory untuk produk Anda</p>
                    <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Tambah Data</button>
                </div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead>
                            <tr>
                                <th>Nama Kategori</th>
                                <th>Tipe</th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {categories.map(c => (
                                <tr key={c.id}>
                                    <td><strong>{c.name}</strong></td>
                                    <td>
                                        <span className="badge badge-info">{c.type}</span>
                                    </td>
                                    <td>
                                        <div className="flex gap-sm">
                                            <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>
                                                <Edit size={15} />
                                            </button>
                                            <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(c.id)}>
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editing ? 'Edit Kategori' : 'Tambah Kategori'}</h3>
                            <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Tipe Kategori *</label>
                                    <select 
                                        className="form-control" 
                                        value={form.type} 
                                        onChange={e => setForm({ ...form, type: e.target.value })} 
                                        required
                                    >
                                        <option value="Category">Category</option>
                                        <option value="Type">Type</option>
                                        <option value="Brand">Brand</option>
                                        <option value="Model">Model</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Nama Kategori *</label>
                                    <input 
                                        className="form-control" 
                                        value={form.name} 
                                        onChange={e => setForm({ ...form, name: e.target.value })} 
                                        required 
                                    />
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
