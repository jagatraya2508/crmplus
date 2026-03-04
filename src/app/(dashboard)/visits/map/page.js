'use client';
import { useState, useEffect } from 'react';
import { MapPin, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamic import to avoid SSR issues with Leaflet
const MapComponent = dynamic(() => import('@/components/MapView'), { ssr: false, loading: () => <div className="loading-center"><div className="spinner" /></div> });

export default function MapPage() {
    const [visits, setVisits] = useState([]);
    const [customers, setCustomers] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        Promise.all([
            fetch('/api/visits?limit=50').then(r => r.json()),
            fetch('/api/customers?limit=200').then(r => r.json()),
        ]).then(([vData, cData]) => {
            setVisits(vData.visits || []);
            setCustomers(cData.customers || []);
            setLoading(false);
        });
    }, []);

    if (loading) return <div className="loading-center"><div className="spinner" /></div>;

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Peta Kunjungan</h1>
                    <p className="page-subtitle">Lihat lokasi pelanggan dan kunjungan</p>
                </div>
                <Link href="/visits" className="btn btn-secondary"><ArrowLeft size={16} /> Kembali</Link>
            </div>

            <div style={{ height: 'calc(100vh - 200px)', borderRadius: 'var(--border-radius)', overflow: 'hidden', border: '1px solid var(--border-color)' }}>
                <MapComponent customers={customers} visits={visits} />
            </div>
        </div>
    );
}
