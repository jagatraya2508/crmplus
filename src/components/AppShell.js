'use client';
import { useState, useEffect, createContext, useContext } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from '@/components/Sidebar';
import TopBar from '@/components/TopBar';
import ThemeProvider from '@/components/ThemeProvider';
import GpsTracker from '@/components/GpsTracker';

const AuthContext = createContext(null);

export function useAuth() {
    return useContext(AuthContext);
}

export default function AppShell({ children }) {
    const [user, setUser] = useState(null);
    const [settings, setSettings] = useState({});
    const [loading, setLoading] = useState(true);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        Promise.all([fetchUser(), fetchSettings()]).finally(() => {
            setLoading(false);
        });
        // Auto-collapse sidebar on mobile
        function handleResize() {
            if (window.innerWidth <= 768) {
                setSidebarCollapsed(true);
                setMobileOpen(false);
            }
        }
        handleResize();
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    // Close mobile sidebar on route change
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    async function fetchUser() {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            }
        } catch (e) {
            console.error('Auth check failed:', e);
        }
    }

    async function fetchSettings() {
        try {
            const res = await fetch('/api/settings');
            if (res.ok) {
                const data = await res.json();
                setSettings(data);
            }
        } catch (e) {
            console.error('Settings fetch failed:', e);
        }
    }

    async function logout() {
        await fetch('/api/auth/logout', { method: 'POST' });
        setUser(null);
        window.location.href = '/login';
    }

    function toggleSidebar() {
        if (window.innerWidth <= 768) {
            setMobileOpen(!mobileOpen);
        } else {
            setSidebarCollapsed(!sidebarCollapsed);
        }
    }

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh' }}>
                <div className="spinner" />
            </div>
        );
    }

    if (!user) {
        return (
            <ThemeProvider>
                <AuthContext.Provider value={{ user: null, setUser, logout, settings, refreshSettings: fetchSettings }}>
                    {children}
                </AuthContext.Provider>
            </ThemeProvider>
        );
    }

    return (
        <ThemeProvider>
            <AuthContext.Provider value={{ user, setUser, logout, settings, refreshSettings: fetchSettings }}>
                <div className="app-layout">
                    {/* Mobile overlay */}
                    {mobileOpen && <div className="sidebar-overlay" onClick={() => setMobileOpen(false)} />}
                    <Sidebar collapsed={sidebarCollapsed} mobileOpen={mobileOpen} onToggle={toggleSidebar} />
                    <div className={`app-main ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
                        <TopBar user={user} onLogout={logout} onToggleSidebar={toggleSidebar} />
                        <main className="app-content">
                            {children}
                        </main>
                    </div>
                    {user.role === 'sales' && <GpsTracker userId={user.id} />}
                </div>
            </AuthContext.Provider>
        </ThemeProvider>
    );
}
