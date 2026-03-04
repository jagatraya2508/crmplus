'use client';
import { Bell, Search, Menu, LogOut, User } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import './TopBar.css';

export default function TopBar({ user, onLogout, onToggleSidebar }) {
    const [showProfile, setShowProfile] = useState(false);
    const profileRef = useRef(null);

    useEffect(() => {
        function handleClick(e) {
            if (profileRef.current && !profileRef.current.contains(e.target)) {
                setShowProfile(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    return (
        <header className="topbar">
            <div className="topbar-left">
                <button className="topbar-menu-btn" onClick={onToggleSidebar}>
                    <Menu size={20} />
                </button>
                <div className="topbar-search">
                    <Search size={16} className="topbar-search-icon" />
                    <input type="text" placeholder="Cari customer, order, lead..." />
                </div>
            </div>

            <div className="topbar-right">
                <button className="topbar-icon-btn" title="Notifikasi">
                    <Bell size={20} />
                    <span className="notification-badge">3</span>
                </button>

                <div className="topbar-profile" ref={profileRef}>
                    <button className="profile-btn" onClick={() => setShowProfile(!showProfile)}>
                        <div className="profile-avatar">
                            {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="profile-info">
                            <span className="profile-name">{user?.name || 'User'}</span>
                            <span className="profile-role">{user?.role || 'sales'}</span>
                        </div>
                    </button>

                    {showProfile && (
                        <div className="profile-dropdown">
                            <div className="dropdown-header">
                                <div className="profile-avatar large">
                                    {user?.name?.charAt(0)?.toUpperCase() || 'U'}
                                </div>
                                <div>
                                    <div className="dropdown-name">{user?.name}</div>
                                    <div className="dropdown-email">{user?.email}</div>
                                </div>
                            </div>
                            <div className="dropdown-divider" />
                            <button className="dropdown-item" onClick={() => { setShowProfile(false); }}>
                                <User size={16} /> Profil Saya
                            </button>
                            <button className="dropdown-item danger" onClick={onLogout}>
                                <LogOut size={16} /> Keluar
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </header>
    );
}
