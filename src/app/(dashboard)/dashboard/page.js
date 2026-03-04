'use client';
import { useState, useEffect } from 'react';
import { Users, TrendingUp, ShoppingCart, MapPin, ArrowUpRight, ArrowDownRight, Clock, Activity } from 'lucide-react';
import { useAuth } from '@/components/AppShell';
import './dashboard.css';

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [recentActivities, setRecentActivities] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboard();
    }, []);

    async function fetchDashboard() {
        try {
            const res = await fetch('/api/dashboard');
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setRecentActivities(data.recentActivities || []);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="loading-center"><div className="spinner" /></div>;
    }

    const kpiCards = [
        {
            label: 'Total Pelanggan',
            value: stats?.totalCustomers || 0,
            icon: Users,
            color: 'purple',
            change: '+12%',
            up: true,
        },
        {
            label: 'Pipeline Aktif',
            value: stats?.activeDeals || 0,
            icon: TrendingUp,
            color: 'blue',
            change: '+8%',
            up: true,
        },
        {
            label: 'Pesanan Bulan Ini',
            value: stats?.monthOrders || 0,
            icon: ShoppingCart,
            color: 'green',
            change: '+24%',
            up: true,
        },
        {
            label: 'Kunjungan Hari Ini',
            value: stats?.todayVisits || 0,
            icon: MapPin,
            color: 'orange',
            change: stats?.todayVisits > 0 ? 'Aktif' : '-',
            up: true,
        },
    ];

    return (
        <div className="dashboard">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Dashboard</h1>
                    <p className="page-subtitle">Selamat datang kembali, {user?.name || 'User'} 👋</p>
                </div>
                <div className="header-date">
                    {new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-4 mb-lg">
                {kpiCards.map((kpi, i) => {
                    const Icon = kpi.icon;
                    return (
                        <div key={i} className={`stat-card ${kpi.color}`}>
                            <div className="stat-icon"><Icon size={24} /></div>
                            <div className="stat-value">{typeof kpi.value === 'number' ? kpi.value.toLocaleString('id-ID') : kpi.value}</div>
                            <div className="stat-label">{kpi.label}</div>
                            <div className={`stat-change ${kpi.up ? 'up' : 'down'}`}>
                                {kpi.up ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                {kpi.change}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="dashboard-grid">
                {/* Recent Activities */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Aktivitas Terbaru</h3>
                        <Activity size={18} className="text-muted" />
                    </div>
                    {recentActivities.length === 0 ? (
                        <div className="empty-mini">
                            <p className="text-muted text-sm">Belum ada aktivitas</p>
                        </div>
                    ) : (
                        <div className="activity-list">
                            {recentActivities.map((act, i) => (
                                <div key={i} className="activity-item">
                                    <div className={`activity-dot ${act.type}`} />
                                    <div className="activity-content">
                                        <span className="activity-title">{act.title}</span>
                                        <span className="activity-meta">{act.customer_name} · {new Date(act.created_at).toLocaleDateString('id-ID')}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="card">
                    <div className="card-header">
                        <h3 className="card-title">Aksi Cepat</h3>
                    </div>
                    <div className="quick-actions">
                        <a href="/customers" className="quick-action purple">
                            <Users size={20} />
                            <span>Tambah Pelanggan</span>
                        </a>
                        <a href="/visits/checkin" className="quick-action green">
                            <MapPin size={20} />
                            <span>Check-in Kunjungan</span>
                        </a>
                        <a href="/orders/new" className="quick-action blue">
                            <ShoppingCart size={20} />
                            <span>Buat Pesanan</span>
                        </a>
                        <a href="/pipeline" className="quick-action orange">
                            <TrendingUp size={20} />
                            <span>Lihat Pipeline</span>
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
