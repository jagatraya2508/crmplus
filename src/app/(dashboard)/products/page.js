'use client';
import { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Search, X } from 'lucide-react';

export default function ProductsPage() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [masterCategories, setMasterCategories] = useState([]);
    const [form, setForm] = useState({ name: '', sku: '', description: '', price: 0, unit: 'pcs', category: '', category_2: '', category_3: '', sub_category: '', brand: '', model: '', stock: 0 });

    useEffect(() => { 
        fetchProducts(); 
        fetchMasterCategories();
    }, [search]);

    async function fetchMasterCategories() {
        const res = await fetch('/api/product-categories');
        const data = await res.json();
        setMasterCategories(data.categories || []);
    }

    async function fetchProducts() {
        setLoading(true);
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        const res = await fetch(`/api/products?${params}`);
        const data = await res.json();
        setProducts(data.products || []);
        setLoading(false);
    }

    function openAdd() { setEditing(null); setForm({ name: '', sku: '', description: '', price: 0, unit: 'pcs', category: '', category_2: '', category_3: '', sub_category: '', brand: '', model: '', stock: 0 }); setShowModal(true); }
    function openEdit(p) { setEditing(p); setForm({ name: p.name, sku: p.sku || '', description: p.description || '', price: parseFloat(p.price), unit: p.unit, category: p.category || '', category_2: p.category_2 || '', category_3: p.category_3 || '', sub_category: p.sub_category || '', brand: p.brand || '', model: p.model || '', stock: p.stock }); setShowModal(true); }

    async function handleSubmit(e) {
        e.preventDefault();
        const method = editing ? 'PUT' : 'POST';
        const url = editing ? `/api/products/${editing.id}` : '/api/products';
        await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
        setShowModal(false);
        fetchProducts();
    }

    async function handleDelete(id) {
        if (!confirm('Hapus produk ini?')) return;
        await fetch(`/api/products/${id}`, { method: 'DELETE' });
        fetchProducts();
    }

    let timeout;
    function onSearch(v) { clearTimeout(timeout); timeout = setTimeout(() => setSearch(v), 300); }

    return (
        <div>
            <div className="page-header">
                <div><h1 className="page-title">Produk</h1><p className="page-subtitle">{products.length} produk aktif</p></div>
                <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Tambah Produk</button>
            </div>

            <div className="toolbar">
                <div className="search-box"><Search size={16} className="search-icon" /><input placeholder="Cari produk..." onChange={e => onSearch(e.target.value)} /></div>
            </div>

            {loading ? <div className="loading-center"><div className="spinner" /></div> : products.length === 0 ? (
                <div className="empty-state"><div className="empty-icon"><Package size={36} /></div><h3>Belum ada produk</h3><p>Tambahkan katalog produk Anda</p><button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Tambah</button></div>
            ) : (
                <div className="table-container">
                    <table className="table">
                        <thead><tr><th>Product ID</th><th>Nama</th><th>SKU</th><th>Harga</th><th>Stok</th><th>Satuan</th><th>Aksi</th></tr></thead>
                        <tbody>
                            {products.map(p => (
                                <tr key={p.id}>
                                    <td>{p.product_code || '-'}</td>
                                    <td>
                                        <strong>{p.name}</strong>
                                    </td>
                                    <td>{p.sku || '-'}</td>
                                    <td>Rp {parseFloat(p.price).toLocaleString('id-ID')}</td>
                                    <td>{p.stock}</td>
                                    <td>{p.unit}</td>
                                    <td><div className="flex gap-sm"><button className="btn btn-ghost btn-sm" onClick={() => openEdit(p)}><Edit size={15} /></button><button className="btn btn-ghost btn-sm" onClick={() => handleDelete(p.id)}><Trash2 size={15} /></button></div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay">
                    <div className="modal" onClick={e => e.stopPropagation()}>
                        <div className="modal-header"><h3>{editing ? 'Edit Produk' : 'Tambah Produk'}</h3><button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}><X size={18} /></button></div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group"><label className="form-label">Nama *</label><input className="form-control" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required /></div>
                                <div className="form-group"><label className="form-label">SKU</label><input className="form-control" value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} /></div>
                                <div className="form-group"><label className="form-label">Harga</label><input className="form-control" type="number" value={form.price} onChange={e => setForm({ ...form, price: parseFloat(e.target.value) || 0 })} /></div>
                                <div className="form-group"><label className="form-label">Stok</label><input className="form-control" type="number" value={form.stock} onChange={e => setForm({ ...form, stock: parseInt(e.target.value) || 0 })} /></div>
                                <div className="form-group"><label className="form-label">Satuan</label><input className="form-control" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} /></div>
                                <div className="grid grid-2" style={{ gap: 16 }}>
                                    <div className="form-group">
                                        <label className="form-label">Category</label>
                                        <select className="form-control" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                                            <option value="">Pilih Category...</option>
                                            {masterCategories.filter(c => c.type === 'Category').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Type</label>
                                        <select className="form-control" value={form.category_2} onChange={e => setForm({ ...form, category_2: e.target.value })}>
                                            <option value="">Pilih Type...</option>
                                            {masterCategories.filter(c => c.type === 'Type').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Brand</label>
                                        <select className="form-control" value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })}>
                                            <option value="">Pilih Brand...</option>
                                            {masterCategories.filter(c => c.type === 'Brand').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label className="form-label">Model</label>
                                        <select className="form-control" value={form.model} onChange={e => setForm({ ...form, model: e.target.value })}>
                                            <option value="">Pilih Model...</option>
                                            {masterCategories.filter(c => c.type === 'Model').map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Kategori Tambahan (Lainnya)</label>
                                    <input className="form-control" value={form.sub_category} onChange={e => setForm({ ...form, sub_category: e.target.value })} />
                                </div>
                                <div className="form-group"><label className="form-label">Deskripsi</label><textarea className="form-control" rows={2} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
                            </div>
                            <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Batal</button><button type="submit" className="btn btn-primary">{editing ? 'Simpan' : 'Tambah'}</button></div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
