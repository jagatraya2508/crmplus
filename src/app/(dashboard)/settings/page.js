'use client';
import { useState } from 'react';
import { useAuth } from '@/components/AppShell';
import { useTheme, THEMES } from '@/components/ThemeProvider';
import { Settings as SettingsIcon, User, Building, Shield, Palette, Check, Image as ImageIcon } from 'lucide-react';

export default function SettingsPage() {
    const { user, settings, refreshSettings } = useAuth();
    const { theme, setTheme } = useTheme();
    const [uploading, setUploading] = useState(false);

    const handleLogoUpload = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 2 * 1024 * 1024) {
            alert('Ukuran file maksimal 2MB');
            return;
        }

        setUploading(true);
        try {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64Data = reader.result;
                const res = await fetch('/api/settings', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ key: 'app_logo', value: base64Data }),
                });

                if (res.ok) {
                    await refreshSettings();
                    alert('Logo berhasil diubah');
                } else {
                    alert('Gagal mengubah logo');
                }
                setUploading(false);
            };
            reader.readAsDataURL(file);
        } catch (error) {
            console.error('Error uploading logo:', error);
            alert('Terjadi kesalahan saat mengunggah logo');
            setUploading(false);
        }
    };

    return (
        <div>
            <div className="page-header">
                <div><h1 className="page-title">Pengaturan</h1><p className="page-subtitle">Konfigurasi aplikasi CRM Plus</p></div>
            </div>

            <div className="grid grid-2">
                {/* Pengaturan Aplikasi (Admin Only) */}
                {user?.role === 'admin' && (
                    <div className="card" style={{ gridColumn: '1 / -1' }}>
                        <div className="card-header"><h3 className="card-title"><ImageIcon size={18} /> Pengaturan Aplikasi</h3></div>
                        <p className="text-sm text-muted mb-md">Ubah logo dan pengaturan global aplikasi (khusus Admin).</p>

                        <div className="form-group" style={{ maxWidth: 400 }}>
                            <label className="form-label">Logo Aplikasi</label>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                                {settings?.app_logo ? (
                                    <div style={{ padding: 8, background: 'var(--bg-tertiary)', borderRadius: 8, border: '1px solid var(--border-color)' }}>
                                        <img src={settings.app_logo} alt="App Logo" style={{ height: 40, objectFit: 'contain' }} />
                                    </div>
                                ) : (
                                    <div style={{ width: 40, height: 40, background: 'var(--gradient-primary)', borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold' }}>
                                        CRM
                                    </div>
                                )}
                                <div>
                                    <input
                                        type="file"
                                        id="logo-upload"
                                        accept="image/png, image/jpeg, image/svg+xml"
                                        onChange={handleLogoUpload}
                                        style={{ display: 'none' }}
                                        disabled={uploading}
                                    />
                                    <label htmlFor="logo-upload" className="btn btn-secondary" style={{ cursor: uploading ? 'not-allowed' : 'pointer' }}>
                                        {uploading ? 'Mengunggah...' : 'Pilih File Logo'}
                                    </label>
                                    <p className="text-sm text-muted mt-sm" style={{ fontSize: '0.75rem' }}>PNG, JPG, SVG max 2MB.</p>
                                </div>
                                {settings?.app_logo && (
                                    <button
                                        className="btn btn-ghost"
                                        style={{ color: 'var(--accent-danger)' }}
                                        onClick={async () => {
                                            if (confirm('Hapus logo kustom?')) {
                                                await fetch('/api/settings', {
                                                    method: 'POST',
                                                    headers: { 'Content-Type': 'application/json' },
                                                    body: JSON.stringify({ key: 'app_logo', value: '' }),
                                                });
                                                refreshSettings();
                                            }
                                        }}
                                    >
                                        Hapus
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {/* Tampilan / Appearance */}
                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <div className="card-header"><h3 className="card-title"><Palette size={18} /> Tampilan</h3></div>
                    <p className="text-sm text-muted mb-md">Pilih tema warna yang sesuai dengan preferensi Anda.</p>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                        {THEMES.map(t => (
                            <button
                                key={t.id}
                                id={`theme-${t.id}`}
                                onClick={() => setTheme(t.id)}
                                style={{
                                    position: 'relative',
                                    width: 180,
                                    padding: 0,
                                    border: theme === t.id ? '2px solid var(--accent-primary)' : '2px solid var(--border-color)',
                                    borderRadius: 'var(--border-radius)',
                                    cursor: 'pointer',
                                    background: 'var(--bg-secondary)',
                                    overflow: 'hidden',
                                    transition: 'all 0.25s ease',
                                    boxShadow: theme === t.id ? 'var(--shadow-glow)' : 'none',
                                }}
                            >
                                {/* Preview bar */}
                                <div style={{
                                    display: 'flex',
                                    height: 60,
                                }}>
                                    <div style={{ flex: '0 0 40px', background: t.colors[2] || t.colors[0] }} />
                                    <div style={{ flex: 1, background: t.colors[0], display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <div style={{
                                            width: '60%',
                                            height: 8,
                                            background: t.colors[1],
                                            borderRadius: 4
                                        }} />
                                    </div>
                                </div>
                                {/* Label */}
                                <div style={{
                                    padding: '12px 14px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'space-between',
                                    borderTop: '1px solid var(--border-color)',
                                }}>
                                    <span style={{
                                        fontSize: '0.875rem',
                                        fontWeight: 600,
                                        color: 'var(--text-primary)',
                                        fontFamily: 'inherit',
                                    }}>
                                        {t.icon} {t.label}
                                    </span>
                                    {theme === t.id && (
                                        <div style={{
                                            width: 22,
                                            height: 22,
                                            borderRadius: '50%',
                                            background: 'var(--gradient-primary)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                        }}>
                                            <Check size={13} color="white" />
                                        </div>
                                    )}
                                </div>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="card">
                    <div className="card-header"><h3 className="card-title"><User size={18} /> Profil Saya</h3></div>
                    <div className="form-group"><label className="form-label">Nama</label><input className="form-control" value={user?.name || ''} readOnly /></div>
                    <div className="form-group"><label className="form-label">Email</label><input className="form-control" value={user?.email || ''} readOnly /></div>
                    <div className="form-group"><label className="form-label">Role</label><input className="form-control" value={user?.role || ''} readOnly style={{ textTransform: 'capitalize' }} /></div>
                </div>

                <div className="card">
                    <div className="card-header"><h3 className="card-title"><Building size={18} /> Informasi Perusahaan</h3></div>
                    <div className="form-group"><label className="form-label">Nama Perusahaan</label><input className="form-control" defaultValue="CRM Plus" /></div>
                    <div className="form-group"><label className="form-label">Alamat</label><textarea className="form-control" rows={2} defaultValue="" /></div>
                    <div className="form-group"><label className="form-label">Telepon</label><input className="form-control" defaultValue="" /></div>
                </div>

                <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <div className="card-header"><h3 className="card-title"><Shield size={18} /> Keamanan</h3></div>
                    <p className="text-sm text-muted mb-md">Ubah password dan pengaturan keamanan akun Anda.</p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                        <div className="form-group"><label className="form-label">Password Lama</label><input className="form-control" type="password" /></div>
                        <div className="form-group"><label className="form-label">Password Baru</label><input className="form-control" type="password" /></div>
                        <div className="form-group"><label className="form-label">Konfirmasi Password</label><input className="form-control" type="password" /></div>
                    </div>
                    <button className="btn btn-primary">Ubah Password</button>
                </div>
            </div>
        </div>
    );
}
