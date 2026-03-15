'use client';
import { useState, useEffect, useMemo } from 'react';
import { Plus, Search, Filter, Users, Building, Mail, Phone, MapPin, Edit, Trash2, X, ChevronLeft, ChevronRight, Crosshair, Loader, User, ChevronUp, ChevronDown, Printer, FileText, FileSpreadsheet } from 'lucide-react';
import { useAuth } from '@/components/AppShell';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
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
    const { user: currentUser } = useAuth();
    const [customers, setCustomers] = useState([]);
    const [salesUsers, setSalesUsers] = useState([]);
    const [leads, setLeads] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [search, setSearch] = useState('');
    const [category, setCategory] = useState('');
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [gettingLocation, setGettingLocation] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [form, setForm] = useState({
        name: '', company: '', email: '', phone: '', address: '', city: '', province: '', postal_code: '', category: 'prospect', notes: '', latitude: '', longitude: '', assigned_to: '', lead_id: '', customer_code: ''
    });
    const [sourceType, setSourceType] = useState('new'); // 'new' or 'lead'
    const [isExporting, setIsExporting] = useState(false);

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
        if (currentUser?.role === 'admin' || currentUser?.role === 'manager') {
            fetchSalesUsers();
        }
    }, [page, search, category, currentUser]);

    async function fetchSalesUsers() {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setSalesUsers(data.users || []);
            }
        } catch (e) { console.error('Failed to fetch users', e); }
    }

    async function fetchLeads() {
        try {
            const res = await fetch('/api/leads');
            if (res.ok) {
                const data = await res.json();
                // Hanya ambil leads yang belum jadi customer atau belum lost, misalnya 'qualified' atau 'new'
                // Karena data struktur leads kita tidak punya field 'is_customer', kita akan memfilter di UI untuk saat ini
                setLeads((data.leads || []).filter(l => l.status !== 'converted' && l.status !== 'lost'));
            }
        } catch (e) { console.error('Failed to fetch leads', e); }
    }

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
        setSourceType('new');
        fetchLeads(); // Fetch leads when opening add modal
        setForm({ 
            name: '', company: '', email: '', phone: '', address: '', city: '', province: '', postal_code: '', category: 'prospect', notes: '', latitude: '', longitude: '', 
            assigned_to: currentUser?.id || '', lead_id: '', customer_code: ''
        });
        setShowModal(true);
    }

    function openEdit(c) {
        setEditing(c);
        setSourceType('new'); // On edit, we don't show the lead pull UI
        setForm({
            name: c.name || '', company: c.company || '', email: c.email || '', phone: c.phone || '',
            address: c.address || '', city: c.city || '', province: c.province || '', postal_code: c.postal_code || '',
            category: c.category || 'prospect', notes: c.notes || '', latitude: c.latitude || '', longitude: c.longitude || '',
            assigned_to: c.assigned_to || currentUser?.id || '',
            lead_id: c.lead_id || '', customer_code: c.customer_code || ''
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

    const sortedCustomers = useMemo(() => {
        let sortableItems = [...customers];
        if (sortConfig !== null && sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                
                if (sortConfig.key === 'kontak') {
                    // Sort by email, if no email, fall back to phone or empty string
                    aValue = (a.email || a.phone || '').toLowerCase();
                    bValue = (b.email || b.phone || '').toLowerCase();
                } else if (sortConfig.key === 'category') {
                    aValue = (categoryLabel[a.category] || a.category || '').toLowerCase();
                    bValue = (categoryLabel[b.category] || b.category || '').toLowerCase();
                } else {
                    aValue = (aValue || '').toLowerCase();
                    bValue = (bValue || '').toLowerCase();
                }

                if (aValue === null || aValue === undefined) aValue = '';
                if (bValue === null || bValue === undefined) bValue = '';
                
                if (aValue < bValue) {
                    return sortConfig.direction === 'ascending' ? -1 : 1;
                }
                if (aValue > bValue) {
                    return sortConfig.direction === 'ascending' ? 1 : -1;
                }
                return 0;
            });
        }
        return sortableItems;
    }, [customers, sortConfig]);

    const requestSort = (key) => {
        let direction = 'ascending';
        if (
            sortConfig &&
            sortConfig.key === key &&
            sortConfig.direction === 'ascending'
        ) {
            direction = 'descending';
        }
        setSortConfig({ key, direction });
    };

    const renderSortIcon = (columnKey) => {
        if (!sortConfig || sortConfig.key !== columnKey) {
            return <span style={{ width: 14, display: 'inline-block', marginLeft: '4px' }}></span>;
        }
        return sortConfig.direction === 'ascending' 
            ? <ChevronUp size={14} style={{ marginLeft: '4px', verticalAlign: 'middle', display: 'inline-block' }} /> 
            : <ChevronDown size={14} style={{ marginLeft: '4px', verticalAlign: 'middle', display: 'inline-block' }} />;
    };

    async function fetchExportData() {
        try {
            const params = new URLSearchParams({ page: 1, limit: 100000 });
            if (search) params.set('search', search);
            if (category) params.set('category', category);
            const res = await fetch(`/api/customers?${params}`);
            const data = await res.json();
            return data.customers || [];
        } catch (e) {
            console.error('Failed to fetch data for export', e);
            return [];
        }
    }

    async function handleExportExcel() {
        setIsExporting(true);
        try {
            const data = await fetchExportData();
            if (data.length === 0) {
                alert('Tidak ada data untuk diekspor');
                return;
            }
            
            const exportData = data.map((c, index) => ({
                'No': index + 1,
                'ID Pelanggan': c.customer_code || '-',
                'Nama': c.name || '-',
                'Perusahaan': c.company || '-',
                'Email': c.email || '-',
                'Telepon': c.phone || '-',
                'Alamat': c.address || '-',
                'Kota': c.city || '-',
                'Provinsi': c.province || '-',
                'Kode Pos': c.postal_code || '-',
                'Kategori': categoryLabel[c.category] || c.category || '-',
                'Catatan': c.notes || '-'
            }));

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, 'Pelanggan');
            XLSX.writeFile(workbook, 'Data_Pelanggan.xlsx');
        } catch (e) {
            console.error(e);
            alert('Gagal mengekspor Excel');
        } finally {
            setIsExporting(false);
        }
    }

    async function handleExportPDF() {
        setIsExporting(true);
        try {
            const data = await fetchExportData();
            if (data.length === 0) {
                alert('Tidak ada data untuk diekspor');
                return;
            }
            
            const doc = new jsPDF('landscape');
            doc.text('Data Pelanggan', 14, 15);
            doc.setFontSize(10);
            const date = new Date().toLocaleDateString('id-ID');
            doc.text(`Tanggal: ${date} | Filter: ${search || 'Semua'} | Kategori: ${categoryLabel[category] || 'Semua'}`, 14, 22);

            const tableData = data.map((c, index) => [
                index + 1,
                c.customer_code || '-',
                c.name || '-',
                c.company || '-',
                `${c.email || ''}\n${c.phone || ''}`.trim(),
                c.city || '-',
                categoryLabel[c.category] || c.category || '-'
            ]);

            autoTable(doc, {
                head: [['No', 'ID Pelanggan', 'Nama', 'Perusahaan', 'Kontak', 'Kota', 'Kategori']],
                body: tableData,
                startY: 25,
                styles: { fontSize: 8, cellPadding: 2 },
                headStyles: { fillColor: [65, 84, 241] },
            });

            doc.save('Data_Pelanggan.pdf');
        } catch (e) {
            console.error(e);
            alert('Gagal mengekspor PDF');
        } finally {
            setIsExporting(false);
        }
    }

    async function handlePrint() {
        setIsExporting(true);
        try {
            const data = await fetchExportData();
            if (data.length === 0) {
                alert('Tidak ada data untuk dicetak');
                return;
            }
            
            const printWindow = window.open('', '_blank');
            if (!printWindow) {
                alert('Pop-up terblokir. Izinkan pop-up untuk mencetak.');
                return;
            }

            printWindow.document.write(`
                <html>
                <head>
                    <title>Cetak Data Pelanggan</title>
                    <style>
                        body { font-family: Arial, sans-serif; padding: 20px; font-size: 12px; }
                        h2 { text-align: center; margin-bottom: 5px; }
                        p { text-align: center; margin-top: 0; color: #555; margin-bottom: 20px; }
                        table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                        th { background-color: #f4f6f8; font-weight: bold; }
                        @media print {
                            body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                        }
                    </style>
                </head>
                <body>
                    <h2>Data Pelanggan</h2>
                    <p>Tanggal: ${new Date().toLocaleDateString('id-ID')} | Filter: ${search || 'Semua'} | Kategori: ${categoryLabel[category] || 'Semua'}</p>
                    <table>
                        <thead>
                            <tr>
                                <th>No</th>
                                <th>ID Pelanggan</th>
                                <th>Nama</th>
                                <th>Perusahaan</th>
                                <th>Kontak</th>
                                <th>Kota</th>
                                <th>Kategori</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${data.map((c, index) => {
                                const emailHtml = c.email ? '<div>' + c.email + '</div>' : '';
                                const phoneHtml = c.phone ? '<div>' + c.phone + '</div>' : '';
                                const categoryText = categoryLabel[c.category] || c.category || '-';
                                return '<tr>' +
                                    '<td>' + (index + 1) + '</td>' +
                                    '<td>' + (c.customer_code || '-') + '</td>' +
                                    '<td>' + (c.name || '-') + '</td>' +
                                    '<td>' + (c.company || '-') + '</td>' +
                                    '<td>' + emailHtml + phoneHtml + '</td>' +
                                    '<td>' + (c.city || '-') + '</td>' +
                                    '<td>' + categoryText + '</td>' +
                                    '</tr>';
                            }).join('')}
                        </tbody>
                    </table>
                </body>
                </html>
            `);
            printWindow.document.close();
            printWindow.onload = () => {
                printWindow.focus();
                setTimeout(() => {
                    printWindow.print();
                }, 500);
            };
        } catch (e) {
            console.error(e);
            alert('Gagal menyiapkan data cetak');
        } finally {
            setIsExporting(false);
        }
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Pelanggan</h1>
                    <p className="page-subtitle">{total} pelanggan terdaftar</p>
                </div>
                <div className="header-actions">
                    <div className="export-dropdown">
                        <button className="btn btn-secondary" title="Export" disabled={isExporting}>
                            {isExporting ? <Loader size={16} className="spin" /> : <Printer size={16} />} 
                            <span className="hide-mobile">Export</span> <ChevronDown size={14} />
                        </button>
                        <div className="dropdown-menu">
                            <button className="dropdown-item" onClick={handlePrint}><Printer size={16} /> Cetak (Print)</button>
                            <button className="dropdown-item" onClick={handleExportPDF}><FileText size={16} /> Download PDF</button>
                            <button className="dropdown-item" onClick={handleExportExcel}><FileSpreadsheet size={16} /> Download Excel</button>
                        </div>
                    </div>
                    <button className="btn btn-primary" onClick={openAdd}>
                        <Plus size={18} /> Tambah Pelanggan
                    </button>
                </div>
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
                                    <th onClick={() => requestSort('customer_code')} style={{cursor: 'pointer'}}>
                                        <div style={{display: 'flex', alignItems: 'center'}}>CUST ID {renderSortIcon('customer_code')}</div>
                                    </th>
                                    <th onClick={() => requestSort('name')} style={{cursor: 'pointer'}}>
                                        <div style={{display: 'flex', alignItems: 'center'}}>Nama {renderSortIcon('name')}</div>
                                    </th>
                                    <th onClick={() => requestSort('company')} style={{cursor: 'pointer'}}>
                                        <div style={{display: 'flex', alignItems: 'center'}}>Perusahaan {renderSortIcon('company')}</div>
                                    </th>
                                    <th onClick={() => requestSort('kontak')} style={{cursor: 'pointer'}}>
                                        <div style={{display: 'flex', alignItems: 'center'}}>Kontak {renderSortIcon('kontak')}</div>
                                    </th>
                                    <th onClick={() => requestSort('city')} style={{cursor: 'pointer'}}>
                                        <div style={{display: 'flex', alignItems: 'center'}}>Kota {renderSortIcon('city')}</div>
                                    </th>
                                    <th onClick={() => requestSort('category')} style={{cursor: 'pointer'}}>
                                        <div style={{display: 'flex', alignItems: 'center'}}>Kategori {renderSortIcon('category')}</div>
                                    </th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedCustomers.map(c => (
                                    <tr key={c.id}>
                                        <td>
                                            <span className="badge badge-secondary">{c.customer_code || '-'}</span>
                                        </td>
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
                                {!editing && (
                                    <div className="form-group" style={{ marginBottom: 20 }}>
                                        <label className="form-label" style={{ display: 'block', marginBottom: 8, fontWeight: 600 }}>Sumber Data Pelanggan</label>
                                        <div style={{ display: 'flex', gap: 16 }}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                                <input
                                                    type="radio"
                                                    name="sourceType"
                                                    checked={sourceType === 'new'}
                                                    onChange={() => {
                                                        setSourceType('new');
                                                        setForm(prev => ({ ...prev, lead_id: '', customer_code: '', name: '', company: '', email: '', phone: '' }));
                                                    }}
                                                />
                                                Pelanggan Baru
                                            </label>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                                                <input
                                                    type="radio"
                                                    name="sourceType"
                                                    checked={sourceType === 'lead'}
                                                    onChange={() => setSourceType('lead')}
                                                />
                                                Tarik dari Leads
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {sourceType === 'lead' && !editing && (
                                    <div className="form-group" style={{ marginBottom: 20, padding: 16, backgroundColor: 'var(--bg-secondary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                        <label className="form-label">Pilih Lead</label>
                                        <select 
                                            className="form-control" 
                                            value={form.lead_id} 
                                            onChange={e => {
                                                const selectedLead = leads.find(l => l.id.toString() === e.target.value);
                                                if (selectedLead) {
                                                    setForm(prev => ({
                                                        ...prev,
                                                        lead_id: selectedLead.id,
                                                        customer_code: selectedLead.lead_code,
                                                        name: selectedLead.name,
                                                        company: selectedLead.company || '',
                                                        email: selectedLead.email || '',
                                                        phone: selectedLead.phone || ''
                                                    }));
                                                } else {
                                                    setForm(prev => ({ ...prev, lead_id: '', customer_code: '', name: '', company: '', email: '', phone: '' }));
                                                }
                                            }}
                                        >
                                            <option value="">- Cari / Pilih Lead -</option>
                                            {leads.map(l => (
                                                <option key={l.id} value={l.id}>{l.lead_code} - {l.name} {l.company ? `(${l.company})` : ''}</option>
                                            ))}
                                        </select>
                                        <p className="text-sm text-muted" style={{ marginTop: 8 }}>
                                            Memilih lead akan otomatis mengisi ID Pelanggan, Nama, Perusahaan, Email, dan Telepon.
                                        </p>
                                    </div>
                                )}

                                <div className="form-grid">
                                    <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                                        <label className="form-label">ID Pelanggan</label>
                                        <input 
                                            className="form-control" 
                                            value={form.customer_code || 'Otomatis (Sistem)'} 
                                            readOnly 
                                            disabled 
                                            style={{ backgroundColor: 'var(--bg-tertiary)', fontWeight: 'bold' }} 
                                        />
                                    </div>
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
                                    <div className="form-group">
                                        <label className="form-label">Sales Person</label>
                                        {(currentUser?.role === 'admin' || currentUser?.role === 'manager') ? (
                                            <select 
                                                className="form-control" 
                                                value={form.assigned_to} 
                                                onChange={e => setForm({ ...form, assigned_to: e.target.value })}
                                            >
                                                <option value="">- Pilih Sales -</option>
                                                {salesUsers.map(u => (
                                                    <option key={u.id} value={u.id}>{u.name}</option>
                                                ))}
                                            </select>
                                        ) : (
                                            <input 
                                                className="form-control" 
                                                value={currentUser?.name || ''} 
                                                readOnly 
                                                disabled
                                                style={{ backgroundColor: 'var(--bg-tertiary)', cursor: 'not-allowed' }}
                                            />
                                        )}
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
                                        {form.latitude && form.longitude && (
                                            <div style={{ marginTop: 12, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                                                <iframe
                                                    key={`${form.latitude}-${form.longitude}`}
                                                    width="100%"
                                                    height="200"
                                                    style={{ border: 0, display: 'block' }}
                                                    loading="lazy"
                                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(form.longitude) - 0.005}%2C${parseFloat(form.latitude) - 0.003}%2C${parseFloat(form.longitude) + 0.005}%2C${parseFloat(form.latitude) + 0.003}&layer=mapnik&marker=${form.latitude}%2C${form.longitude}`}
                                                />
                                                <a
                                                    href={`https://www.openstreetmap.org/?mlat=${form.latitude}&mlon=${form.longitude}#map=16/${form.latitude}/${form.longitude}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    style={{ display: 'block', padding: '6px 12px', fontSize: '0.75rem', color: 'var(--accent-primary-light)', textAlign: 'center', background: 'var(--bg-glass)' }}
                                                >
                                                    🗺️ Buka di OpenStreetMap
                                                </a>
                                            </div>
                                        )}
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
