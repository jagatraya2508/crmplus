'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/AppShell';
import { UserCog, Plus, Pencil, Power, X, Search, Users as UsersIcon, Trash2 } from 'lucide-react';
import './users.css';

const ROLE_COLORS = {
    admin: '#ef4444',
    manager: '#f59e0b',
    sales: '#3b82f6',
};

const AVATAR_COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#ef4444'];

function getAvatarColor(name) {
    let hash = 0;
    for (let i = 0; i < (name || '').length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name) {
    return (name || '?').split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
}

export default function UsersPage() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [editUser, setEditUser] = useState(null);
    const [saving, setSaving] = useState(false);

    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'sales', phone: '' });

    useEffect(() => {
        fetchUsers();
    }, []);

    async function fetchUsers() {
        try {
            const res = await fetch('/api/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data.users || []);
            }
        } catch (e) {
            console.error('Error fetching users:', e);
        } finally {
            setLoading(false);
        }
    }

    function openCreateModal() {
        setEditUser(null);
        setForm({ name: '', email: '', password: '', role: 'sales', phone: '' });
        setModalOpen(true);
    }

    function openEditModal(u) {
        setEditUser(u);
        setForm({ name: u.name, email: u.email, password: '', role: u.role, phone: u.phone || '' });
        setModalOpen(true);
    }

    function closeModal() {
        setModalOpen(false);
        setEditUser(null);
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setSaving(true);

        try {
            if (editUser) {
                // Update user
                const payload = { name: form.name, email: form.email, role: form.role, phone: form.phone };
                if (form.password) payload.password = form.password;

                const res = await fetch(`/api/users/${editUser.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                });

                if (res.ok) {
                    alert('User berhasil diupdate');
                    closeModal();
                    fetchUsers();
                } else {
                    const data = await res.json();
                    alert(data.error || 'Gagal mengupdate user');
                }
            } else {
                // Create user
                if (!form.password) {
                    alert('Password wajib diisi untuk user baru');
                    setSaving(false);
                    return;
                }

                const res = await fetch('/api/users', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form),
                });

                if (res.ok) {
                    alert('User berhasil dibuat');
                    closeModal();
                    fetchUsers();
                } else {
                    const data = await res.json();
                    alert(data.error || 'Gagal membuat user');
                }
            }
        } catch (error) {
            console.error('Error saving user:', error);
            alert('Terjadi kesalahan');
        } finally {
            setSaving(false);
        }
    }

    async function toggleActive(u) {
        const action = u.is_active ? 'menonaktifkan' : 'mengaktifkan';
        if (!confirm(`Yakin ingin ${action} user "${u.name}"?`)) return;

        try {
            if (u.is_active) {
                // Deactivate
                await fetch(`/api/users/${u.id}`, { method: 'DELETE' });
            } else {
                // Reactivate
                await fetch(`/api/users/${u.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ is_active: true }),
                });
            }
            fetchUsers();
        } catch (error) {
            console.error('Error toggling user:', error);
        }
    }

    async function deleteUser(u) {
        if (!confirm(`⚠️ HAPUS PERMANEN\n\nYakin ingin menghapus user "${u.name}" secara permanen?\nAksi ini TIDAK BISA dibatalkan!`)) return;

        try {
            const res = await fetch(`/api/users/${u.id}?permanent=true`, { method: 'DELETE' });
            if (res.ok) {
                alert(`User "${u.name}" berhasil dihapus permanen.`);
                fetchUsers();
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal menghapus user');
            }
        } catch (error) {
            console.error('Error deleting user:', error);
            alert('Terjadi kesalahan saat menghapus user');
        }
    }

    const filteredUsers = users.filter(u =>
        (u.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.email || '').toLowerCase().includes(search.toLowerCase()) ||
        (u.role || '').toLowerCase().includes(search.toLowerCase())
    );

    if (currentUser?.role !== 'admin') {
        return (
            <div className="empty-state">
                <UserCog size={48} />
                <h2>Akses Ditolak</h2>
                <p>Hanya admin yang dapat mengakses halaman ini.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Kelola User</h1>
                    <p className="page-subtitle">Buat, edit, dan kelola akun pengguna aplikasi</p>
                </div>
                <button className="btn btn-primary" onClick={openCreateModal}>
                    <Plus size={18} /> Tambah User
                </button>
            </div>

            <div className="card">
                <div className="users-toolbar">
                    <div className="users-search">
                        <div style={{ position: 'relative' }}>
                            <Search size={16} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                className="form-control"
                                placeholder="Cari user..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                style={{ paddingLeft: 36 }}
                            />
                        </div>
                    </div>
                    <span className="text-sm text-muted">{filteredUsers.length} user</span>
                </div>

                {loading ? (
                    <div style={{ textAlign: 'center', padding: 40 }}>
                        <div className="spinner" />
                    </div>
                ) : filteredUsers.length === 0 ? (
                    <div className="empty-state">
                        <UsersIcon size={48} />
                        <p>Belum ada user ditemukan</p>
                    </div>
                ) : (
                    <div className="users-table-wrap">
                        <table className="users-table">
                            <thead>
                                <tr>
                                    <th>User</th>
                                    <th>Role</th>
                                    <th>Telepon</th>
                                    <th>Status</th>
                                    <th>Bergabung</th>
                                    <th style={{ width: 100 }}>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredUsers.map(u => (
                                    <tr key={u.id}>
                                        <td>
                                            <div className="user-info">
                                                <div className="user-avatar" style={{ background: getAvatarColor(u.name) }}>
                                                    {getInitials(u.name)}
                                                </div>
                                                <div>
                                                    <div className="user-name">{u.name}</div>
                                                    <div className="user-email">{u.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td><span className={`role-badge ${u.role}`}>{u.role}</span></td>
                                        <td style={{ color: 'var(--text-secondary)' }}>{u.phone || '-'}</td>
                                        <td>
                                            <span className={`status-badge ${u.is_active ? 'active' : 'inactive'}`}>
                                                <span className="status-dot" />
                                                {u.is_active ? 'Aktif' : 'Nonaktif'}
                                            </span>
                                        </td>
                                        <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                                            {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-'}
                                        </td>
                                        <td>
                                            <div className="action-btns">
                                                <button title="Edit" onClick={() => openEditModal(u)}>
                                                    <Pencil size={14} />
                                                </button>
                                                {u.id !== currentUser.id && (
                                                    <>
                                                        <button
                                                            title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                                                            className={u.is_active ? 'danger' : ''}
                                                            onClick={() => toggleActive(u)}
                                                        >
                                                            <Power size={14} />
                                                        </button>
                                                        <button
                                                            title="Hapus Permanen"
                                                            className="danger"
                                                            onClick={() => deleteUser(u)}
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal Form */}
            {modalOpen && (
                <div className="modal-overlay" onClick={closeModal}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>{editUser ? 'Edit User' : 'Tambah User Baru'}</h3>
                            <button className="modal-close" onClick={closeModal}><X size={18} /></button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body">
                                <div className="form-group">
                                    <label className="form-label">Nama Lengkap *</label>
                                    <input
                                        className="form-control"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        required
                                        placeholder="Nama lengkap"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Email *</label>
                                    <input
                                        className="form-control"
                                        type="email"
                                        value={form.email}
                                        onChange={e => setForm({ ...form, email: e.target.value })}
                                        required
                                        placeholder="email@contoh.com"
                                    />
                                </div>
                                <div className="form-group">
                                    <label className="form-label">
                                        Password {editUser ? '(kosongkan jika tidak diubah)' : '*'}
                                    </label>
                                    <input
                                        className="form-control"
                                        type="password"
                                        value={form.password}
                                        onChange={e => setForm({ ...form, password: e.target.value })}
                                        required={!editUser}
                                        placeholder={editUser ? '••••••••' : 'Minimal 6 karakter'}
                                        minLength={form.password ? 6 : undefined}
                                    />
                                    {editUser && <p className="password-hint">Isi field ini hanya jika ingin mengubah password.</p>}
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Role</label>
                                    <select
                                        className="form-control"
                                        value={form.role}
                                        onChange={e => setForm({ ...form, role: e.target.value })}
                                    >
                                        <option value="sales">Sales</option>
                                        <option value="manager">Manager</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div className="form-group">
                                    <label className="form-label">Telepon</label>
                                    <input
                                        className="form-control"
                                        value={form.phone}
                                        onChange={e => setForm({ ...form, phone: e.target.value })}
                                        placeholder="08xxxxxxxxxx"
                                    />
                                </div>
                            </div>
                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={closeModal}>Batal</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Menyimpan...' : (editUser ? 'Simpan Perubahan' : 'Buat User')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
