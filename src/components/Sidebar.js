'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard, Users, GitBranch, ShoppingCart, MapPin,
    Megaphone, UserPlus, BarChart3, Settings, ChevronLeft,
    ChevronRight, Zap, Package
} from 'lucide-react';
import { useAuth } from '@/components/AppShell';
import './Sidebar.css';

const menuItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/customers', icon: Users, label: 'Pelanggan' },
    { href: '/pipeline', icon: GitBranch, label: 'Pipeline' },
    { href: '/orders', icon: ShoppingCart, label: 'Pesanan' },
    { href: '/products', icon: Package, label: 'Produk' },
    { href: '/visits', icon: MapPin, label: 'Kunjungan' },
    { href: '/campaigns', icon: Megaphone, label: 'Kampanye' },
    { href: '/leads', icon: UserPlus, label: 'Leads' },
    { href: '/reports', icon: BarChart3, label: 'Laporan' },
    { href: '/settings', icon: Settings, label: 'Pengaturan' },
];

export default function Sidebar({ collapsed, onToggle }) {
    const pathname = usePathname();
    const { settings } = useAuth();

    return (
        <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <div className="sidebar-logo">
                    {settings?.app_logo ? (
                        <img
                            src={settings.app_logo}
                            alt="App Logo"
                            style={{
                                height: 32,
                                width: collapsed ? 32 : 'auto',
                                maxWidth: 180,
                                objectFit: 'contain',
                                transition: 'all 0.3s ease'
                            }}
                        />
                    ) : (
                        <>
                            <div className="logo-icon">
                                <Zap size={24} />
                            </div>
                            {!collapsed && <span className="logo-text">CRM<span className="logo-plus">Plus</span></span>}
                        </>
                    )}
                </div>
                <button className="sidebar-toggle" onClick={onToggle} aria-label="Toggle sidebar">
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                </button>
            </div>

            <nav className="sidebar-nav">
                {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href || pathname?.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`nav-item ${isActive ? 'active' : ''}`}
                            title={collapsed ? item.label : undefined}
                        >
                            <Icon size={20} />
                            {!collapsed && <span className="nav-label">{item.label}</span>}
                            {isActive && <div className="nav-indicator" />}
                        </Link>
                    );
                })}
            </nav>

            <div className="sidebar-footer">
                {!collapsed && (
                    <div className="sidebar-version">
                        <span>CRM Plus v1.0</span>
                    </div>
                )}
            </div>
        </aside>
    );
}
