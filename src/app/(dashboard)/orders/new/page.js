'use client';
import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Trash2, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import '../orders.css';

export default function NewOrderPage() {
    const router = useRouter();
    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCustomer, setSelectedCustomer] = useState('');
    const [notes, setNotes] = useState('');
    const [items, setItems] = useState([{ product_id: '', product_name: '', quantity: 1, price: 0, discount: 0 }]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch('/api/customers?limit=200').then(r => r.json()).then(d => setCustomers(d.customers || []));
        fetch('/api/products').then(r => r.json()).then(d => setProducts(d.products || []));
    }, []);

    function addItem() {
        setItems([...items, { product_id: '', product_name: '', quantity: 1, price: 0, discount: 0 }]);
    }

    function removeItem(idx) {
        setItems(items.filter((_, i) => i !== idx));
    }

    function updateItem(idx, field, value) {
        const newItems = [...items];
        newItems[idx][field] = value;
        if (field === 'product_id') {
            const prod = products.find(p => p.id == value);
            if (prod) {
                newItems[idx].product_name = prod.name;
                newItems[idx].price = parseFloat(prod.price);
            }
        }
        setItems(newItems);
    }

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.price) - (item.discount || 0), 0);
    const tax = subtotal * 0.11;
    const total = subtotal + tax;

    async function handleSubmit(e) {
        e.preventDefault();
        if (!selectedCustomer) { setError('Pilih pelanggan'); return; }
        if (items.filter(i => i.product_id).length === 0) { setError('Tambahkan minimal 1 produk'); return; }

        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ customer_id: parseInt(selectedCustomer), notes, items: items.filter(i => i.product_id) }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error);
            router.push('/orders');
        } catch (err) { setError(err.message); }
        setLoading(false);
    }

    return (
        <div className="new-order-form">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Buat Pesanan Baru</h1>
                    <p className="page-subtitle">Request order dari pelanggan</p>
                </div>
                <Link href="/orders" className="btn btn-secondary"><ArrowLeft size={16} /> Kembali</Link>
            </div>

            {error && <div className="login-error" style={{ marginBottom: 20 }}>{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="card mb-lg">
                    <h3 className="card-title mb-md">Informasi Pesanan</h3>
                    <div className="form-group">
                        <label className="form-label">Pelanggan *</label>
                        <select className="form-control" value={selectedCustomer} onChange={e => setSelectedCustomer(e.target.value)} required>
                            <option value="">Pilih Pelanggan...</option>
                            {customers.map(c => <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>)}
                        </select>
                    </div>
                </div>

                <div className="card mb-lg">
                    <div className="card-header">
                        <h3 className="card-title">Produk</h3>
                        <button type="button" className="btn btn-secondary btn-sm" onClick={addItem}><Plus size={14} /> Tambah</button>
                    </div>
                    {items.map((item, idx) => (
                        <div key={idx} className="product-line">
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Produk</label>
                                <select className="form-control" value={item.product_id} onChange={e => updateItem(idx, 'product_id', e.target.value)}>
                                    <option value="">Pilih...</option>
                                    {products.map(p => <option key={p.id} value={p.id}>{p.name} - Rp {parseFloat(p.price).toLocaleString('id-ID')}</option>)}
                                </select>
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Qty</label>
                                <input className="form-control" type="number" min={1} value={item.quantity} onChange={e => updateItem(idx, 'quantity', parseInt(e.target.value) || 1)} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Harga</label>
                                <input className="form-control" type="number" value={item.price} onChange={e => updateItem(idx, 'price', parseFloat(e.target.value) || 0)} />
                            </div>
                            <div className="form-group" style={{ marginBottom: 0 }}>
                                <label className="form-label">Diskon</label>
                                <input className="form-control" type="number" value={item.discount} onChange={e => updateItem(idx, 'discount', parseFloat(e.target.value) || 0)} />
                            </div>
                            <button type="button" className="btn btn-ghost btn-icon" onClick={() => removeItem(idx)} style={{ marginBottom: 0 }}><Trash2 size={16} /></button>
                        </div>
                    ))}

                    <div style={{ marginTop: 20, borderTop: '1px solid var(--border-color)', paddingTop: 16 }}>
                        <div className="order-total-row"><span>Subtotal</span><span>Rp {subtotal.toLocaleString('id-ID')}</span></div>
                        <div className="order-total-row"><span>PPN (11%)</span><span>Rp {tax.toLocaleString('id-ID')}</span></div>
                        <div className="order-total-row grand"><span>Total</span><span>Rp {total.toLocaleString('id-ID')}</span></div>
                    </div>
                </div>

                <div className="card mb-lg">
                    <div className="form-group" style={{ marginBottom: 0 }}>
                        <label className="form-label">Catatan</label>
                        <textarea className="form-control" rows={3} value={notes} onChange={e => setNotes(e.target.value)} placeholder="Catatan tambahan untuk pesanan..." />
                    </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg w-full" disabled={loading}>
                    {loading ? 'Menyimpan...' : <><ShoppingCart size={20} /> Kirim Pesanan</>}
                </button>
            </form>
        </div>
    );
}
