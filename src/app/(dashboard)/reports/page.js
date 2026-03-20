'use client';
import { useState, useEffect, useRef } from 'react';
import { BarChart3, Users, ShoppingCart, MapPin, TrendingUp, Printer, Download, FileText } from 'lucide-react';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const TAB_TITLES = {
    sales: 'Laporan Penjualan',
    visits: 'Laporan Kunjungan',
    orders: 'Laporan Pesanan',
    customers: 'Laporan Pelanggan',
};

export default function ReportsPage() {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('sales');
    const printRef = useRef(null);

    useEffect(() => { fetchReports(); }, []);

    async function fetchReports() {
        try {
            const res = await fetch('/api/reports');
            const data = await res.json();
            setReportData(data);
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    // ===== GET DATA FOR CURRENT TAB =====
    function getTabExportData() {
        if (!reportData) return { headers: [], rows: [], title: '' };

        switch (activeTab) {
            case 'sales':
                return {
                    title: 'Top Pelanggan berdasarkan Pesanan',
                    headers: ['Pelanggan', 'Jumlah Pesanan', 'Total Nilai'],
                    rows: (reportData.topCustomers || []).map(c => [
                        c.name,
                        c.order_count,
                        `Rp ${parseFloat(c.total_value || 0).toLocaleString('id-ID')}`
                    ]),
                    rawRows: (reportData.topCustomers || []).map(c => ({
                        'Pelanggan': c.name,
                        'Jumlah Pesanan': c.order_count,
                        'Total Nilai': parseFloat(c.total_value || 0),
                    })),
                };
            case 'visits':
                return {
                    title: 'Ringkasan Kunjungan per Sales',
                    headers: ['Sales', 'Jumlah Kunjungan'],
                    rows: (reportData.visitsBySales || []).map(v => [v.name, v.visit_count]),
                    rawRows: (reportData.visitsBySales || []).map(v => ({
                        'Sales': v.name,
                        'Jumlah Kunjungan': v.visit_count,
                    })),
                };
            case 'orders':
                return {
                    title: 'Pesanan per Status',
                    headers: ['Status', 'Jumlah', 'Total Nilai'],
                    rows: (reportData.ordersByStatus || []).map(o => [
                        o.status,
                        o.count,
                        `Rp ${parseFloat(o.total_value || 0).toLocaleString('id-ID')}`
                    ]),
                    rawRows: (reportData.ordersByStatus || []).map(o => ({
                        'Status': o.status,
                        'Jumlah': o.count,
                        'Total Nilai': parseFloat(o.total_value || 0),
                    })),
                };
            case 'customers':
                return {
                    title: 'Pelanggan per Kategori',
                    headers: ['Kategori', 'Jumlah'],
                    rows: (reportData.customersByCategory || []).map(c => [c.category, c.count]),
                    rawRows: (reportData.customersByCategory || []).map(c => ({
                        'Kategori': c.category,
                        'Jumlah': c.count,
                    })),
                };
            default:
                return { headers: [], rows: [], rawRows: [], title: '' };
        }
    }

    // ===== PRINT =====
    function handlePrint() {
        const data = getTabExportData();
        const printWindow = window.open('', '_blank');
        if (!printWindow) { alert('Popup diblokir. Izinkan popup untuk mencetak.'); return; }

        const summary = reportData?.summary || {};
        printWindow.document.write(`
            <html>
            <head>
                <title>${TAB_TITLES[activeTab]}</title>
                <style>
                    body { font-family: 'Segoe UI', Arial, sans-serif; padding: 30px; color: #1a1a2e; }
                    h1 { font-size: 20px; margin-bottom: 4px; }
                    .subtitle { color: #666; font-size: 12px; margin-bottom: 24px; }
                    .summary { display: flex; gap: 16px; margin-bottom: 24px; }
                    .summary-card { flex: 1; padding: 12px 16px; border: 1px solid #e2e8f0; border-radius: 8px; }
                    .summary-card .value { font-weight: bold; font-size: 18px; }
                    .summary-card .label { color: #64748b; font-size: 11px; }
                    h2 { font-size: 16px; margin-bottom: 12px; }
                    table { width: 100%; border-collapse: collapse; font-size: 13px; }
                    th { background: #f1f5f9; text-align: left; padding: 10px 12px; border-bottom: 2px solid #cbd5e1; font-weight: 600; }
                    td { padding: 8px 12px; border-bottom: 1px solid #e2e8f0; }
                    tr:nth-child(even) { background: #f8fafc; }
                    .footer { margin-top: 30px; font-size: 11px; color: #94a3b8; text-align: center; }
                    @media print { body { padding: 15px; } }
                </style>
            </head>
            <body>
                <h1>${TAB_TITLES[activeTab]}</h1>
                <div class="subtitle">Dicetak pada: ${new Date().toLocaleString('id-ID')}</div>
                <div class="summary">
                    <div class="summary-card"><div class="value">Rp ${parseFloat(summary.totalRevenue || 0).toLocaleString('id-ID')}</div><div class="label">Total Revenue</div></div>
                    <div class="summary-card"><div class="value">${summary.totalOrders || 0}</div><div class="label">Total Pesanan</div></div>
                    <div class="summary-card"><div class="value">${summary.totalVisits || 0}</div><div class="label">Total Kunjungan</div></div>
                    <div class="summary-card"><div class="value">${summary.totalCustomers || 0}</div><div class="label">Total Pelanggan</div></div>
                </div>
                <h2>${data.title}</h2>
                <table>
                    <thead><tr>${data.headers.map(h => `<th>${h}</th>`).join('')}</tr></thead>
                    <tbody>${data.rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join('')}</tr>`).join('')}</tbody>
                </table>
                <div class="footer">CRM Plus &mdash; Laporan & Analitik</div>
            </body>
            </html>
        `);
        printWindow.document.close();
        printWindow.focus();
        setTimeout(() => printWindow.print(), 500);
    }

    // ===== EXPORT PDF =====
    function exportPDF() {
        const data = getTabExportData();
        const summary = reportData?.summary || {};
        const doc = new jsPDF();

        doc.setFontSize(18);
        doc.text(TAB_TITLES[activeTab], 14, 18);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Tanggal: ${new Date().toLocaleDateString('id-ID')}`, 14, 25);

        // Summary line
        doc.setFontSize(9);
        doc.text(`Revenue: Rp ${parseFloat(summary.totalRevenue || 0).toLocaleString('id-ID')}  |  Pesanan: ${summary.totalOrders || 0}  |  Kunjungan: ${summary.totalVisits || 0}  |  Pelanggan: ${summary.totalCustomers || 0}`, 14, 32);

        doc.setFontSize(12);
        doc.setTextColor(0);
        doc.text(data.title, 14, 42);

        autoTable(doc, {
            head: [data.headers],
            body: data.rows,
            startY: 46,
            styles: { fontSize: 9 },
            headStyles: { fillColor: [59, 130, 246] },
        });

        doc.save(`${TAB_TITLES[activeTab].replace(/\s/g, '_')}.pdf`);
    }

    // ===== EXPORT EXCEL =====
    function exportExcel() {
        const data = getTabExportData();
        const ws = XLSX.utils.json_to_sheet(data.rawRows || []);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, activeTab);
        XLSX.writeFile(wb, `${TAB_TITLES[activeTab].replace(/\s/g, '_')}.xlsx`);
    }

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    const tabs = [
        { key: 'sales', label: 'Penjualan', icon: TrendingUp },
        { key: 'visits', label: 'Kunjungan', icon: MapPin },
        { key: 'orders', label: 'Pesanan', icon: ShoppingCart },
        { key: 'customers', label: 'Pelanggan', icon: Users },
    ];

    return (
        <div>
            <div className="page-header">
                <div><h1 className="page-title">Laporan & Analitik</h1><p className="page-subtitle">Ringkasan performa bisnis</p></div>
                <div style={{ display: 'flex', gap: 8 }}>
                    <button className="btn btn-outline" onClick={handlePrint} title="Cetak">
                        <Printer size={16} /> Cetak
                    </button>
                    <button className="btn btn-outline" onClick={exportPDF} title="Export PDF">
                        <Download size={16} /> PDF
                    </button>
                    <button className="btn btn-outline" onClick={exportExcel} title="Export Excel">
                        <FileText size={16} /> Excel
                    </button>
                </div>
            </div>

            <div className="flex gap-sm mb-lg" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: 0 }}>
                {tabs.map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button key={tab.key}
                            className={`btn btn-ghost ${activeTab === tab.key ? 'active-tab' : ''}`}
                            onClick={() => setActiveTab(tab.key)}
                            style={activeTab === tab.key ? { borderBottom: '2px solid var(--accent-primary)', borderRadius: 0, color: 'var(--accent-primary-light)' } : { borderRadius: 0 }}
                        >
                            <Icon size={16} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-4 mb-lg">
                <div className="stat-card purple">
                    <div className="stat-value">{reportData?.summary?.totalRevenue ? `Rp ${parseFloat(reportData.summary.totalRevenue).toLocaleString('id-ID')}` : 'Rp 0'}</div>
                    <div className="stat-label">Total Revenue</div>
                </div>
                <div className="stat-card green">
                    <div className="stat-value">{reportData?.summary?.totalOrders || 0}</div>
                    <div className="stat-label">Total Pesanan</div>
                </div>
                <div className="stat-card blue">
                    <div className="stat-value">{reportData?.summary?.totalVisits || 0}</div>
                    <div className="stat-label">Total Kunjungan</div>
                </div>
                <div className="stat-card orange">
                    <div className="stat-value">{reportData?.summary?.totalCustomers || 0}</div>
                    <div className="stat-label">Total Pelanggan</div>
                </div>
            </div>

            {/* Report Tables */}
            <div ref={printRef}>
                {activeTab === 'sales' && (
                    <div className="card">
                        <h3 className="card-title mb-md">Top Pelanggan berdasarkan Pesanan</h3>
                        {reportData?.topCustomers?.length > 0 ? (
                            <div className="table-container">
                                <table className="table">
                                    <thead><tr><th>Pelanggan</th><th>Jumlah Pesanan</th><th>Total Nilai</th></tr></thead>
                                    <tbody>{reportData.topCustomers.map((c, i) => (
                                        <tr key={i}><td>{c.name}</td><td>{c.order_count}</td><td>Rp {parseFloat(c.total_value || 0).toLocaleString('id-ID')}</td></tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        ) : <p className="text-muted text-sm">Belum ada data</p>}
                    </div>
                )}

                {activeTab === 'visits' && (
                    <div className="card">
                        <h3 className="card-title mb-md">Ringkasan Kunjungan per Sales</h3>
                        {reportData?.visitsBySales?.length > 0 ? (
                            <div className="table-container">
                                <table className="table">
                                    <thead><tr><th>Sales</th><th>Jumlah Kunjungan</th></tr></thead>
                                    <tbody>{reportData.visitsBySales.map((v, i) => (
                                        <tr key={i}><td>{v.name}</td><td>{v.visit_count}</td></tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        ) : <p className="text-muted text-sm">Belum ada data</p>}
                    </div>
                )}

                {activeTab === 'orders' && (
                    <div className="card">
                        <h3 className="card-title mb-md">Pesanan per Status</h3>
                        {reportData?.ordersByStatus?.length > 0 ? (
                            <div className="table-container">
                                <table className="table">
                                    <thead><tr><th>Status</th><th>Jumlah</th><th>Total Nilai</th></tr></thead>
                                    <tbody>{reportData.ordersByStatus.map((o, i) => (
                                        <tr key={i}><td className="text-capitalize">{o.status}</td><td>{o.count}</td><td>Rp {parseFloat(o.total_value || 0).toLocaleString('id-ID')}</td></tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        ) : <p className="text-muted text-sm">Belum ada data</p>}
                    </div>
                )}

                {activeTab === 'customers' && (
                    <div className="card">
                        <h3 className="card-title mb-md">Pelanggan per Kategori</h3>
                        {reportData?.customersByCategory?.length > 0 ? (
                            <div className="table-container">
                                <table className="table">
                                    <thead><tr><th>Kategori</th><th>Jumlah</th></tr></thead>
                                    <tbody>{reportData.customersByCategory.map((c, i) => (
                                        <tr key={i}><td className="text-capitalize">{c.category}</td><td>{c.count}</td></tr>
                                    ))}</tbody>
                                </table>
                            </div>
                        ) : <p className="text-muted text-sm">Belum ada data</p>}
                    </div>
                )}
            </div>
        </div>
    );
}
