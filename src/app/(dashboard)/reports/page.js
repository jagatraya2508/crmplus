'use client';
import { useState, useEffect } from 'react';
import { BarChart3, Users, ShoppingCart, MapPin, TrendingUp, Calendar } from 'lucide-react';

export default function ReportsPage() {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('sales');

    useEffect(() => { fetchReports(); }, []);

    async function fetchReports() {
        try {
            const res = await fetch('/api/reports');
            const data = await res.json();
            setReportData(data);
        } catch (e) { console.error(e); }
        setLoading(false);
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
    );
}
