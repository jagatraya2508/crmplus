'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Zap, Mail, Lock, User, Phone, Eye, EyeOff } from 'lucide-react';
import './login.css';

export default function LoginPage() {
    const router = useRouter();
    const [isRegister, setIsRegister] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [form, setForm] = useState({ name: '', email: '', password: '', phone: '' });
    const [appLogo, setAppLogo] = useState(null);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    const data = await res.json();
                    if (data.app_logo) {
                        setAppLogo(data.app_logo);
                    }
                }
            } catch (err) {
                console.error('Failed to fetch settings:', err);
            }
        };
        fetchSettings();
    }, []);

    async function handleSubmit(e) {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // Init database on first register
            if (isRegister) {
                await fetch('/api/init', { method: 'POST' });
            }

            const endpoint = isRegister ? '/api/auth/register' : '/api/auth/login';
            const res = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error);

            router.push('/dashboard');
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="login-page">
            <div className="login-bg">
                <div className="login-orb orb-1" />
                <div className="login-orb orb-2" />
                <div className="login-orb orb-3" />
            </div>

            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <div className="login-logo">
                            {appLogo ? (
                                <img
                                    src={appLogo}
                                    alt="App Logo"
                                    style={{
                                        width: 48,
                                        height: 48,
                                        objectFit: 'contain',
                                        transition: 'all 0.3s ease'
                                    }}
                                />
                            ) : (
                                <Zap size={28} />
                            )}
                        </div>
                        <h1>CRM<span>Plus</span></h1>
                        <p>{isRegister ? 'Buat akun baru' : 'Masuk ke akun Anda'}</p>
                    </div>

                    {error && (
                        <div className="login-error">
                            {error}
                        </div>
                    )}

                    <form onSubmit={handleSubmit}>
                        {isRegister && (
                            <>
                                <div className="input-group">
                                    <User size={18} className="input-icon" />
                                    <input
                                        type="text"
                                        placeholder="Nama Lengkap"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="input-group">
                                    <Phone size={18} className="input-icon" />
                                    <input
                                        type="tel"
                                        placeholder="Nomor Telepon"
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                    />
                                </div>
                            </>
                        )}

                        <div className="input-group">
                            <Mail size={18} className="input-icon" />
                            <input
                                type="email"
                                placeholder="Email"
                                value={form.email}
                                onChange={e => setForm({ ...form, email: e.target.value })}
                                required
                            />
                        </div>

                        <div className="input-group">
                            <Lock size={18} className="input-icon" />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Password"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                className="password-toggle"
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>

                        <button type="submit" className="login-btn" disabled={loading}>
                            {loading ? <div className="spinner" style={{ width: 20, height: 20 }} /> : (isRegister ? 'Daftar' : 'Masuk')}
                        </button>
                    </form>

                    <div className="login-footer">
                        <button onClick={() => { setIsRegister(!isRegister); setError(''); }}>
                            {isRegister ? 'Sudah punya akun? Masuk' : 'Belum punya akun? Daftar'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
