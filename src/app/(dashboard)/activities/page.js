'use client';
import { useState, useEffect, useMemo } from 'react';
import { 
    Calendar, Phone, Users, Mail, MapPin, CheckSquare, 
    Search, Plus, X, Clock, AlertCircle, Edit, Trash2,
    ChevronUp, ChevronDown, LogIn, LogOut, Navigation, User
} from 'lucide-react';
import Link from 'next/link';
import styles from './activities.module.css';
import '../visits/visits.css';

export default function ActivitiesPage() {
    const [activities, setActivities] = useState([]);
    const [summary, setSummary] = useState({
        total: 0, count_call: 0, count_meeting: 0, count_email: 0, count_visit: 0, count_task: 0
    });
    const [filters, setFilters] = useState({
        query: '', status: 'all', type: 'all'
    });
    const [loading, setLoading] = useState(true);
    const [customers, setCustomers] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [editId, setEditId] = useState(null);
    const [submitting, setSubmitting] = useState(false);
    const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
    const [visitsData, setVisitsData] = useState([]);
    const [visitsLoading, setVisitsLoading] = useState(false);
    const [expandedMap, setExpandedMap] = useState(null);

    const [form, setForm] = useState({
        type: 'call',
        title: '',
        description: '',
        customer_id: '',
        scheduled_at: '',
        status: 'pending',
        email_to: '',
        email_subject: '',
        email_body: '',
        send_now: false
    });
    const [attachment, setAttachment] = useState(null);

    useEffect(() => {
        if (filters.type === 'visit') {
            fetchVisitsData();
        } else {
            fetchActivities();
        }
        fetchOptions();
    }, [filters.status, filters.type]); // Refresh on status or type filter change

    const fetchActivities = async () => {
        try {
            setLoading(true);
            const queryParams = new URLSearchParams(filters);
            if (filters.status === 'all') queryParams.delete('status');
            if (filters.type === 'all') queryParams.delete('type');
            if (!filters.query) queryParams.delete('query');

            const res = await fetch(`/api/activities?${queryParams}`);
            if (res.ok) {
                const data = await res.json();
                setActivities(data.activities);
                setSummary(data.summary || {});
            }
        } catch (error) {
            console.error('Failed to fetch activities:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchVisitsData = async () => {
        try {
            setVisitsLoading(true);
            const queryParams = new URLSearchParams({ limit: 100 });
            if (filters.status !== 'all') {
                queryParams.set('status', filters.status === 'completed' ? 'checked_out' : 'checked_in');
            }
            const res = await fetch(`/api/visits?${queryParams}`);
            if (res.ok) {
                const data = await res.json();
                setVisitsData(data.visits || []);
                // Update summary silently if needed or fetch activities summary without resetting visitsData
                const summaryRes = await fetch(`/api/activities`);
                if (summaryRes.ok) {
                     const sumData = await summaryRes.json();
                     setSummary(sumData.summary || {});
                }
            }
        } catch (error) {
            console.error('Failed to fetch visits:', error);
        } finally {
            setVisitsLoading(false);
        }
    };

    const fetchOptions = async () => {
        try {
            // Fetch customers for the dropdown
            const res = await fetch('/api/customers');
            if (res.ok) {
                const data = await res.json();
                // Assumes customer endpoint returns an array or {customers: []}
                setCustomers(Array.isArray(data) ? data : data.customers || []);
            }
        } catch (error) {
            console.error('Failed to fetch options:', error);
        }
    };

    const handleSearch = (e) => {
        e.preventDefault();
        fetchActivities();
    };

    const handleOpenModal = () => {
        setForm({
            type: 'call',
            title: '',
            description: '',
            customer_id: '',
            scheduled_at: '',
            status: 'pending',
            email_to: '',
            email_subject: '',
            email_body: '',
            send_now: false
        });
        setAttachment(null);
        setEditId(null);
        setShowModal(true);
    };

    const handleEdit = (activity) => {
        setForm({
            type: activity.type || 'call',
            title: activity.title || '',
            description: activity.description || '',
            customer_id: activity.customer_id || '',
            scheduled_at: activity.scheduled_at 
                ? new Date(new Date(activity.scheduled_at).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 16) 
                : '',
            status: activity.status || 'pending',
            email_to: '',
            email_subject: '',
            email_body: '',
            send_now: false
        });
        setAttachment(null);
        setEditId(activity.id);
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Apakah Anda yakin ingin menghapus activity ini?')) return;
        try {
            const res = await fetch(`/api/activities/${id}`, {
                method: 'DELETE',
            });
            if (res.ok) {
                fetchActivities();
            } else {
                const data = await res.json();
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('Delete error:', error);
            alert('Failed to delete activity');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            let res;
            if (form.type === 'email' && form.send_now) {
                // Use FormData for email with attachment
                console.log('[FRONTEND] Sending email via /api/activities/send-email');
                console.log('[FRONTEND] form.send_now:', form.send_now, 'form.type:', form.type);
                const formData = new FormData();
                Object.keys(form).forEach(key => formData.append(key, form[key]));
                if (attachment) formData.append('attachment', attachment);

                res = await fetch('/api/activities/send-email', {
                    method: 'POST',
                    body: formData
                });
            } else if (editId) {
                console.log('[FRONTEND] Updating activity via PUT');
                res = await fetch(`/api/activities/${editId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                });
            } else {
                console.log('[FRONTEND] Saving activity via POST (no email send)');
                console.log('[FRONTEND] form.type:', form.type, 'form.send_now:', form.send_now);
                res = await fetch('/api/activities', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(form)
                });
            }

            const data = await res.json();
            console.log('[FRONTEND] Response status:', res.status, 'data:', data);

            if (res.ok) {
                setShowModal(false);
                fetchActivities();
                if (form.type === 'email' && form.send_now) {
                    alert('✅ Email berhasil dikirim!');
                }
            } else {
                alert(`Error: ${data.error}`);
            }
        } catch (error) {
            console.error('[FRONTEND] Submit error:', error);
            alert('Failed to save activity: ' + error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const toggleStatus = async (id, currentStatus) => {
        const newStatus = currentStatus === 'completed' ? 'pending' : 'completed';
        try {
            const res = await fetch(`/api/activities/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    status: newStatus,
                    completed_at: newStatus === 'completed' ? new Date().toISOString() : null
                })
            });
            if (res.ok) {
                fetchActivities();
            }
        } catch (error) {
             console.error('Status check error:', error);
        }
    };

    const getTypeIcon = (type) => {
        switch (type) {
            case 'call': return <Phone size={16} />;
            case 'meeting': return <Users size={16} />;
            case 'email': return <Mail size={16} />;
            case 'visit': return <MapPin size={16} />;
            case 'task': return <CheckSquare size={16} />;
            default: return <CheckSquare size={16} />;
        }
    };

    const sortedActivities = useMemo(() => {
        let sortableItems = [...activities];
        if (sortConfig !== null && sortConfig.key) {
            sortableItems.sort((a, b) => {
                let aValue = a[sortConfig.key];
                let bValue = b[sortConfig.key];
                
                if (sortConfig.key === 'customer') {
                    aValue = (a.customer_name || '').toLowerCase();
                    bValue = (b.customer_name || '').toLowerCase();
                } else if (sortConfig.key === 'assigned') {
                    aValue = (a.user_name || 'Unassigned').toLowerCase();
                    bValue = (b.user_name || 'Unassigned').toLowerCase();
                } else if (sortConfig.key === 'title') {
                    aValue = (a.title || '').toLowerCase();
                    bValue = (b.title || '').toLowerCase();
                } else if (sortConfig.key === 'type' || sortConfig.key === 'status') {
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
    }, [activities, sortConfig]);

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
            ? <ChevronUp size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} /> 
            : <ChevronDown size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />;
    };

    const handleTypeFilter = (type) => {
        setFilters(prev => ({
            ...prev,
            type: prev.type === type ? 'all' : type
        }));
    };

    return (
        <div className={styles.activitiesPage}>
            <div className={styles.header}>
                <div className={styles.headerLeft}>
                    <Calendar size={24} color="#3b82f6" />
                    <h1 className={styles.headerTitle}>CRM - Activity Log</h1>
                </div>
                <button className={styles.addBtn} onClick={handleOpenModal}>
                    <Plus size={16} /> Tambah Activity
                </button>
            </div>

            <div className={styles.statsRow}>
                <div className={`${styles.statCard} ${filters.type === 'call' ? styles.activeCard : ''}`} onClick={() => handleTypeFilter('call')}>
                    <Phone className={`${styles.statIcon} ${styles.call}`} />
                    <span className={styles.statLabel}>Call</span>
                    <span className={styles.statValue}>{summary.count_call || 0}</span>
                </div>
                <div className={`${styles.statCard} ${filters.type === 'meeting' ? styles.activeCard : ''}`} onClick={() => handleTypeFilter('meeting')}>
                    <Users className={`${styles.statIcon} ${styles.meeting}`} />
                    <span className={styles.statLabel}>Meeting</span>
                    <span className={styles.statValue}>{summary.count_meeting || 0}</span>
                </div>
                <div className={`${styles.statCard} ${filters.type === 'email' ? styles.activeCard : ''}`} onClick={() => handleTypeFilter('email')}>
                    <Mail className={`${styles.statIcon} ${styles.email}`} />
                    <span className={styles.statLabel}>Email</span>
                    <span className={styles.statValue}>{summary.count_email || 0}</span>
                </div>
                <div className={`${styles.statCard} ${filters.type === 'visit' ? styles.activeCard : ''}`} onClick={() => handleTypeFilter('visit')}>
                    <MapPin className={`${styles.statIcon} ${styles.visit}`} />
                    <span className={styles.statLabel}>Visit</span>
                    <span className={styles.statValue}>{summary.count_visit || 0}</span>
                </div>
                <div className={`${styles.statCard} ${filters.type === 'task' ? styles.activeCard : ''}`} onClick={() => handleTypeFilter('task')}>
                    <CheckSquare className={`${styles.statIcon} ${styles.task}`} />
                    <span className={styles.statLabel}>Task</span>
                    <span className={styles.statValue}>{summary.count_task || 0}</span>
                </div>
            </div>

            <form className={styles.filterRow} onSubmit={handleSearch}>
                <input 
                    type="text" 
                    placeholder="Cari subjek, deskripsi..." 
                    className={styles.searchInput}
                    value={filters.query}
                    onChange={(e) => setFilters({...filters, query: e.target.value})}
                />
                <select 
                    className={styles.filterSelect}
                    value={filters.status}
                    onChange={(e) => setFilters({...filters, status: e.target.value})}
                >
                    <option value="all">Semua Status</option>
                    {filters.type === 'visit' ? (
                        <>
                            <option value="pending">Check-in</option>
                            <option value="completed">Completed (Check-out)</option>
                        </>
                    ) : (
                        <>
                            <option value="pending">Pending</option>
                            <option value="completed">Completed</option>
                            <option value="overdue">Overdue</option>
                        </>
                    )}
                </select>
                <button type="submit" className={styles.searchBtn}>
                    <Search size={16} /> Cari
                </button>
            </form>

            {filters.type === 'visit' ? (
                // Visits Custom List View
                <div style={{ marginTop: '20px' }}>
                    {visitsLoading ? (
                        <div className={styles.emptyState}>Loading visits...</div>
                    ) : visitsData.length === 0 ? (
                        <div className={styles.emptyState}>Belum ada data Kunjungan untuk filter ini</div>
                    ) : (
                        <div className="visits-list">
                            {visitsData.map(v => (
                                <div key={v.id} className={`visit-card ${v.status}`} style={{ margin: 0 }}>
                                    <div className="visit-status-indicator" />
                                    <div className="visit-info">
                                        <div className="visit-header">
                                            <h4>{v.customer_name || 'Unknown'}</h4>
                                            <span className={`badge ${v.status === 'checked_in' ? 'badge-success' : 'badge-secondary'}`}>
                                                {v.status === 'checked_in' ? '📍 Check-in' : '✅ Selesai'}
                                            </span>
                                        </div>
                                        <p className="visit-company">{v.customer_company || v.customer_address || ''}</p>
                                        <div className="visit-meta">
                                            <span><User size={13} /> {v.user_name}</span>
                                            <span><Clock size={13} /> {new Date(v.checkin_time).toLocaleString('id-ID')}</span>
                                            {v.checkout_time && <span><LogOut size={13} /> {new Date(v.checkout_time).toLocaleString('id-ID')}</span>}
                                            {v.checkout_time && (
                                                <span className="visit-duration">
                                                    {(() => {
                                                        const diff = new Date(v.checkout_time) - new Date(v.checkin_time);
                                                        const hours = Math.floor(diff / 3600000);
                                                        const mins = Math.floor((diff % 3600000) / 60000);
                                                        return `${hours}j ${mins}m`;
                                                    })()}
                                                </span>
                                            )}
                                        </div>

                                        {/* Koordinat Check-in & Check-out */}
                                        {(v.checkin_lat || v.checkout_lat) && (
                                            <div className="visit-coords">
                                                {v.checkin_lat && v.checkin_lng && (
                                                    <div className="coord-tag checkin">
                                                        <Navigation size={12} />
                                                        <span>Check-in: {parseFloat(v.checkin_lat).toFixed(6)}, {parseFloat(v.checkin_lng).toFixed(6)}</span>
                                                    </div>
                                                )}
                                                {v.checkout_lat && v.checkout_lng && (
                                                    <div className="coord-tag checkout">
                                                        <Navigation size={12} />
                                                        <span>Check-out: {parseFloat(v.checkout_lat).toFixed(6)}, {parseFloat(v.checkout_lng).toFixed(6)}</span>
                                                    </div>
                                                )}
                                                <button
                                                    className="btn btn-ghost btn-sm coord-map-btn"
                                                    onClick={() => setExpandedMap(expandedMap === v.id ? null : v.id)}
                                                    title="Lihat Peta"
                                                >
                                                    <MapPin size={13} /> {expandedMap === v.id ? 'Tutup Peta' : 'Lihat Peta'}
                                                </button>
                                            </div>
                                        )}

                                        {/* Inline Map */}
                                        {expandedMap === v.id && v.checkin_lat && v.checkin_lng && (
                                            <div className="visit-map-preview">
                                                <iframe
                                                    width="100%"
                                                    height="220"
                                                    style={{ border: 0, display: 'block' }}
                                                    loading="lazy"
                                                    src={`https://www.openstreetmap.org/export/embed.html?bbox=${parseFloat(v.checkin_lng) - 0.008}%2C${parseFloat(v.checkin_lat) - 0.005}%2C${parseFloat(v.checkout_lng || v.checkin_lng) + 0.008}%2C${parseFloat(v.checkout_lat || v.checkin_lat) + 0.005}&layer=mapnik&marker=${v.checkin_lat}%2C${v.checkin_lng}`}
                                                />
                                                <div className="visit-map-links">
                                                    <a
                                                        href={`https://www.openstreetmap.org/?mlat=${v.checkin_lat}&mlon=${v.checkin_lng}#map=16/${v.checkin_lat}/${v.checkin_lng}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                    >
                                                        📍 Check-in di OpenStreetMap
                                                    </a>
                                                    {v.checkout_lat && v.checkout_lng && (
                                                        <a
                                                            href={`https://www.openstreetmap.org/?mlat=${v.checkout_lat}&mlon=${v.checkout_lng}#map=16/${v.checkout_lat}/${v.checkout_lng}`}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                        >
                                                            🏁 Check-out di OpenStreetMap
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        {v.notes && <p className="visit-notes">{v.notes}</p>}
                                        {v.summary && <p className="visit-notes" style={{ borderLeftColor: 'var(--accent-success)' }}>{v.summary}</p>}
                                    </div>
                                    <div className="visit-actions">
                                        <Link href={`/visits`} className="btn btn-outline btn-sm">
                                            Lihat di Menu Kunjungan
                                        </Link>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div className={styles.tableContainer}>
                    <table>
                        <thead>
                            <tr>
                                <th onClick={() => requestSort('type')} style={{cursor: 'pointer'}}>
                                    <div style={{display: 'flex', alignItems: 'center'}}>Tipe {renderSortIcon('type')}</div>
                                </th>
                                <th onClick={() => requestSort('title')} style={{cursor: 'pointer'}}>
                                    <div style={{display: 'flex', alignItems: 'center'}}>Subjek {renderSortIcon('title')}</div>
                                </th>
                                <th onClick={() => requestSort('scheduled_at')} style={{cursor: 'pointer'}}>
                                    <div style={{display: 'flex', alignItems: 'center'}}>Tanggal & Waktu {renderSortIcon('scheduled_at')}</div>
                                </th>
                                <th onClick={() => requestSort('customer')} style={{cursor: 'pointer'}}>
                                    <div style={{display: 'flex', alignItems: 'center'}}>Lead/Opp/Customer {renderSortIcon('customer')}</div>
                                </th>
                                <th onClick={() => requestSort('assigned')} style={{cursor: 'pointer'}}>
                                    <div style={{display: 'flex', alignItems: 'center'}}>Assigned {renderSortIcon('assigned')}</div>
                                </th>
                                <th onClick={() => requestSort('status')} style={{cursor: 'pointer'}}>
                                    <div style={{display: 'flex', alignItems: 'center'}}>Status {renderSortIcon('status')}</div>
                                </th>
                                <th>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan="7" className={styles.emptyState}>Loading activities...</td>
                                </tr>
                            ) : activities.length === 0 ? (
                                <tr>
                                    <td colSpan="7" className={styles.emptyState}>Belum ada data Activity</td>
                                </tr>
                            ) : (
                                sortedActivities.map(activity => {
                                    const isOverdue = activity.status === 'pending' && new Date(activity.scheduled_at) < new Date();
                                    
                                    return (
                                    <tr key={activity.id}>
                                        <td>
                                            <div className={styles.typeContainer}>
                                                <div className={`${styles.typeIcon} ${styles[activity.type]}`}>
                                                    {getTypeIcon(activity.type)}
                                                </div>
                                                <span style={{textTransform: 'capitalize', fontSize: '13px'}}>{activity.type}</span>
                                            </div>
                                        </td>
                                        <td>
                                            <div className={styles.subjectTitle}>{activity.title}</div>
                                            {activity.description && (
                                                <div className={styles.subjectDesc}>{activity.description}</div>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                                {isOverdue && <AlertCircle size={14} color="#dc2626" />}
                                                <span style={{ color: isOverdue ? '#dc2626' : 'inherit' }}>
                                                    {activity.scheduled_at ? new Date(activity.scheduled_at).toLocaleString('id-ID', {
                                                        day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                                    }) : '-'}
                                                </span>
                                            </div>
                                        </td>
                                        <td>
                                            {activity.customer_name ? (
                                                <div>
                                                    <a href={`/customers/${activity.customer_id}`} className={styles.entityLink}>
                                                        {activity.customer_name}
                                                    </a>
                                                    {activity.company_name && <div className={styles.entitySub}>{activity.company_name}</div>}
                                                </div>
                                            ) : '-'}
                                        </td>
                                        <td>
                                            <div className={styles.userBadge}>
                                                {activity.user_name || 'Unassigned'}
                                            </div>
                                        </td>
                                        <td>
                                            <span className={`${styles.statusBadge} ${styles[activity.status]} ${isOverdue ? styles.overdue : ''}`}>
                                                {isOverdue ? 'Overdue' : activity.status}
                                            </span>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={activity.status === 'completed'}
                                                    onChange={() => toggleStatus(activity.id, activity.status)}
                                                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                                    title="Tandai selesai"
                                                />
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleEdit(activity)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex' }}
                                                    title="Edit Activity"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                <button 
                                                    type="button" 
                                                    onClick={() => handleDelete(activity.id)}
                                                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#ef4444', display: 'flex' }}
                                                    title="Hapus Activity"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modal}>
                        <div className={styles.modalHeader}>
                            <h2>{editId ? 'Edit Activity' : 'Tambah Activity'}</h2>
                            <button className={styles.closeBtn} onClick={() => setShowModal(false)}>
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGrid}>
                                <div className={styles.formGroup}>
                                    <label>Tipe Activity <span className={styles.required}>*</span></label>
                                    <select 
                                        className={styles.formControl}
                                        value={form.type}
                                        onChange={e => setForm({...form, type: e.target.value})}
                                        required
                                    >
                                        <option value="call">Call</option>
                                        <option value="meeting">Meeting</option>
                                        <option value="email">Email</option>
                                        <option value="visit">Visit</option>
                                        <option value="task">Task</option>
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Status</label>
                                    <select 
                                        className={styles.formControl}
                                        value={form.status}
                                        onChange={e => setForm({...form, status: e.target.value})}
                                    >
                                        <option value="pending">Pending</option>
                                        <option value="completed">Completed</option>
                                    </select>
                                </div>

                                {form.type === 'email' && (
                                    <div className={styles.emailFields + ' ' + styles.fullWidth}>
                                        <div className={styles.formGroup}>
                                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', marginBottom: '12px', color: 'var(--accent-primary)', fontWeight: 600 }}>
                                                <input 
                                                    type="checkbox" 
                                                    checked={form.send_now} 
                                                    onChange={e => setForm({...form, send_now: e.target.checked})} 
                                                    style={{ width: '18px', height: '18px' }}
                                                />
                                                Kirim Email Sekarang
                                            </label>
                                        </div>

                                        {form.send_now && (
                                            <div className={styles.emailInnerGrid}>
                                                <div className={styles.formGroup}>
                                                    <label>Kirim Ke <span className={styles.required}>*</span></label>
                                                    <input 
                                                        type="email" 
                                                        className={styles.formControl} 
                                                        placeholder="email@customer.com" 
                                                        value={form.email_to} 
                                                        onChange={e => setForm({...form, email_to: e.target.value})} 
                                                        required={form.send_now}
                                                    />
                                                </div>
                                                <div className={styles.formGroup}>
                                                    <label>Subjek Email <span className={styles.required}>*</span></label>
                                                    <input 
                                                        type="text" 
                                                        className={styles.formControl} 
                                                        placeholder="Subjek email" 
                                                        value={form.email_subject} 
                                                        onChange={e => setForm({...form, email_subject: e.target.value})} 
                                                        required={form.send_now}
                                                    />
                                                </div>
                                                <div className={styles.formGroup + ' ' + styles.fullWidth}>
                                                    <label>Isi Email <span className={styles.required}>*</span></label>
                                                    <textarea 
                                                        className={styles.formControl} 
                                                        rows={4} 
                                                        placeholder="Tulis pesan email Anda di sini..." 
                                                        value={form.email_body} 
                                                        onChange={e => setForm({...form, email_body: e.target.value})} 
                                                        required={form.send_now}
                                                    />
                                                </div>
                                                <div className={styles.formGroup + ' ' + styles.fullWidth}>
                                                    <label>Lampiran (Attachment)</label>
                                                    <div className={styles.fileInputWrapper}>
                                                        <input 
                                                            type="file" 
                                                            id="email-atc" 
                                                            className={styles.fileInput} 
                                                            onChange={e => setAttachment(e.target.files[0])} 
                                                        />
                                                        <label htmlFor="email-atc" className={styles.fileInputLabel}>
                                                            {attachment ? attachment.name : 'Pilih file lampiran...'}
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className={styles.formGroup + ' ' + styles.fullWidth}>
                                    <label>Subjek <span className={styles.required}>*</span></label>
                                    <input 
                                        type="text" 
                                        className={styles.formControl}
                                        placeholder="Contoh: Follow up proposal"
                                        value={form.title}
                                        onChange={e => setForm({...form, title: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup + ' ' + styles.fullWidth}>
                                    <label>Terkait Customer</label>
                                    <select 
                                        className={styles.formControl}
                                        value={form.customer_id}
                                        onChange={e => {
                                            const custId = e.target.value;
                                            const cust = customers.find(c => String(c.id) === String(custId));
                                            setForm({
                                                ...form, 
                                                customer_id: custId,
                                                email_to: cust?.email || form.email_to
                                            });
                                        }}
                                    >
                                        <option value="">- Pilih Customer -</option>
                                        {customers.map(c => (
                                            <option key={c.id} value={c.id}>{c.name} {c.company ? `(${c.company})` : ''}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className={styles.formGroup}>
                                    <label>Jadwal <span className={styles.required}>*</span></label>
                                    <input 
                                        type="datetime-local" 
                                        className={styles.formControl}
                                        value={form.scheduled_at}
                                        onChange={e => setForm({...form, scheduled_at: e.target.value})}
                                        required
                                    />
                                </div>
                                <div className={styles.formGroup + ' ' + styles.fullWidth}>
                                    <label>Deskripsi/Catatan</label>
                                    <textarea 
                                        className={styles.formControl}
                                        placeholder="Tambahkan detail atau catatan untuk activity ini..."
                                        value={form.description}
                                        onChange={e => setForm({...form, description: e.target.value})}
                                    />
                                </div>
                            </div>
                            <div className={styles.modalFooter}>
                                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>
                                    Batal
                                </button>
                                <button type="submit" className={styles.submitBtn} disabled={submitting}>
                                    {submitting ? 'Menyimpan...' : (editId ? 'Simpan Perubahan' : 'Simpan Activity')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
