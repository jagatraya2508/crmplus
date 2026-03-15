'use client';
import { useState, useEffect } from 'react';
import { Package, Plus, Edit, Trash2, Search, X, Printer, FileText, FileSpreadsheet, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

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

    const [isExporting, setIsExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    async function handleExportExcel() {
        setIsExporting(true);
        try {
            const exportData = products.map((p, i) => ({
                'No': i + 1,
                'Product ID': p.product_code || '-',
                'Nama': p.name,
                'SKU': p.sku || '-',
                'Category': p.category || '-',
                'Brand': p.brand || '-',
                'Model': p.model || '-',
                'Harga': parseFloat(p.price || 0),
                'Stok': p.stock || 0,
                'Satuan': p.unit || 'pcs',
            }));
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Produk');
            XLSX.writeFile(wb, 'Data_Produk.xlsx');
        } catch (e) { console.error(e); alert('Gagal export Excel'); }
        setIsExporting(false); setShowExportMenu(false);
    }

    async function handleExportPDF() {
        setIsExporting(true);
        try {
            const doc = new jsPDF('landscape');
            doc.setFontSize(16); doc.text('Katalog Produk', 14, 15);
            doc.setFontSize(10); doc.text('Tanggal cetak: ' + new Date().toLocaleDateString('id-ID'), 14, 22);
            const tableData = products.map((p, i) => [
                i + 1, p.product_code || '-', p.name, p.sku || '-',
                p.category || '-', p.brand || '-',
                'Rp ' + parseFloat(p.price || 0).toLocaleString('id-ID'),
                p.stock || 0, p.unit || 'pcs',
            ]);
            autoTable(doc, {
                head: [['No', 'Product ID', 'Nama', 'SKU', 'Category', 'Brand', 'Harga', 'Stok', 'Satuan']],
                body: tableData, startY: 27,
                styles: { fontSize: 9 }, headStyles: { fillColor: [59, 130, 246] },
            });
            doc.save('Data_Produk.pdf');
        } catch (e) { console.error(e); alert('Gagal export PDF'); }
        setIsExporting(false); setShowExportMenu(false);
    }

    function handlePrint() {
        setIsExporting(true);
        try {
            let rows = '';
            products.forEach((p, i) => {
                rows += '<tr>';
                rows += '<td>' + (i + 1) + '</td>';
                rows += '<td>' + (p.product_code || '-') + '</td>';
                rows += '<td><strong>' + p.name + '</strong></td>';
                rows += '<td>' + (p.sku || '-') + '</td>';
                rows += '<td>' + (p.category || '-') + '</td>';
                rows += '<td>' + (p.brand || '-') + '</td>';
                rows += '<td style="text-align:right">Rp ' + parseFloat(p.price || 0).toLocaleString('id-ID') + '</td>';
                rows += '<td style="text-align:center">' + (p.stock || 0) + '</td>';
                rows += '<td>' + (p.unit || 'pcs') + '</td>';
                rows += '</tr>';
            });
            const pw = window.open('', '_blank');
            pw.document.write(
                '<!DOCTYPE html><html><head><title>Cetak Produk</title>' +
                '<style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse;margin-top:16px}' +
                'th,td{border:1px solid #ddd;padding:8px;font-size:12px}th{background:#3b82f6;color:white;text-align:left}' +
                'tr:nth-child(even){background:#f8fafc}h1{font-size:18px;color:#1a1a2e}</style></head>' +
                '<body><h1>Katalog Produk</h1>' +
                '<p>Tanggal cetak: ' + new Date().toLocaleDateString('id-ID') + ' &bull; Total: ' + products.length + ' produk</p>' +
                '<table><thead><tr><th>No</th><th>Product ID</th><th>Nama</th><th>SKU</th><th>Category</th><th>Brand</th><th>Harga</th><th>Stok</th><th>Satuan</th></tr></thead>' +
                '<tbody>' + rows + '</tbody></table></body></html>'
            );
            pw.document.close(); pw.focus();
            setTimeout(() => { pw.print(); }, 500);
        } catch (e) { console.error(e); alert('Gagal mencetak'); }
        setIsExporting(false); setShowExportMenu(false);
    }

    return (
        <div>
            <div className="page-header">
                <div><h1 className="page-title">Produk</h1><p className="page-subtitle">{products.length} produk aktif</p></div>
                <button className="btn btn-primary" onClick={openAdd}><Plus size={18} /> Tambah Produk</button>
            </div>

            <div className="toolbar">
                <div className="search-box"><Search size={16} className="search-icon" /><input placeholder="Cari produk..." onChange={e => onSearch(e.target.value)} /></div>
                <div style={{ marginLeft: 'auto', position: 'relative' }}>
                    <button className="btn btn-outline" onClick={() => setShowExportMenu(!showExportMenu)} disabled={isExporting}>
                        {isExporting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Download size={16} />} Export
                    </button>
                    {showExportMenu && (
                        <div style={{ position: 'absolute', right: 0, top: '100%', marginTop: 4, background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, minWidth: 160, overflow: 'hidden' }}>
                            <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'white', cursor: 'pointer', fontSize: 13 }}><Printer size={15} /> Cetak (Print)</button>
                            <button onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'white', cursor: 'pointer', fontSize: 13 }}><FileText size={15} /> Download PDF</button>
                            <button onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'white', cursor: 'pointer', fontSize: 13 }}><FileSpreadsheet size={15} /> Download Excel</button>
                        </div>
                    )}
                </div>
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
