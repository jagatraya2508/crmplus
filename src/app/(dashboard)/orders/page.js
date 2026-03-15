'use client';
import { useState, useEffect } from 'react';
import { ShoppingCart, Plus, Search, Eye, Check, X as XIcon, ChevronLeft, ChevronRight, Clock, Truck, Package, Trash2, Printer, FileText, FileSpreadsheet, Download } from 'lucide-react';
import Link from 'next/link';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import './orders.css';

const statusLabels = {
    draft: 'Draft', pending: 'Menunggu', approved: 'Disetujui', rejected: 'Ditolak',
    processing: 'Diproses', shipped: 'Dikirim', completed: 'Selesai', cancelled: 'Dibatalkan',
};

const statusBadge = {
    draft: 'badge-secondary', pending: 'badge-warning', approved: 'badge-success', rejected: 'badge-danger',
    processing: 'badge-info', shipped: 'badge-primary', completed: 'badge-success', cancelled: 'badge-danger',
};

export default function OrdersPage() {
    const [orders, setOrders] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState('');
    const [isExporting, setIsExporting] = useState(false);
    const [showExportMenu, setShowExportMenu] = useState(false);

    useEffect(() => { fetchOrders(); }, [page, statusFilter]);

    async function fetchOrders() {
        setLoading(true);
        const params = new URLSearchParams({ page, limit: 20 });
        if (statusFilter) params.set('status', statusFilter);
        try {
            const res = await fetch(`/api/orders?${params}`);
            const data = await res.json();
            setOrders(data.orders || []);
            setTotal(data.total || 0);
            setTotalPages(data.totalPages || 0);
        } catch (e) { console.error(e); }
        setLoading(false);
    }

    async function updateStatus(id, status) {
        try {
            await fetch(`/api/orders/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status }),
            });
            fetchOrders();
        } catch (e) { console.error(e); }
    }

    async function deleteOrder(o) {
        if (!confirm(`Yakin ingin menghapus pesanan "${o.order_number}"?\nAksi ini tidak bisa dibatalkan!`)) return;
        try {
            const res = await fetch(`/api/orders/${o.id}`, { method: 'DELETE' });
            if (res.ok) {
                fetchOrders();
            } else {
                const data = await res.json();
                alert(data.error || 'Gagal menghapus pesanan');
            }
        } catch (e) {
            console.error(e);
            alert('Terjadi kesalahan saat menghapus pesanan');
        }
    }

    async function fetchAllOrders() {
        const params = new URLSearchParams({ limit: 9999 });
        if (statusFilter) params.set('status', statusFilter);
        const res = await fetch(`/api/orders?${params}`);
        const data = await res.json();
        return data.orders || [];
    }

    async function handleExportExcel() {
        setIsExporting(true);
        try {
            const allOrders = await fetchAllOrders();
            const exportData = allOrders.map((o, i) => ({
                'No': i + 1,
                'No. Order': o.order_number,
                'Pelanggan': o.customer_name || '-',
                'Sales': o.user_name || '-',
                'Total': parseFloat(o.total || 0),
                'Status': statusLabels[o.status] || o.status,
                'Tanggal': new Date(o.created_at).toLocaleDateString('id-ID'),
            }));
            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Pesanan');
            XLSX.writeFile(wb, 'Data_Pesanan.xlsx');
        } catch (e) { console.error(e); alert('Gagal export Excel'); }
        setIsExporting(false);
        setShowExportMenu(false);
    }

    async function handleExportPDF() {
        setIsExporting(true);
        try {
            const allOrders = await fetchAllOrders();
            const doc = new jsPDF('landscape');
            doc.setFontSize(16);
            doc.text('Laporan Pesanan', 14, 15);
            doc.setFontSize(10);
            doc.text('Tanggal cetak: ' + new Date().toLocaleDateString('id-ID'), 14, 22);
            if (statusFilter) doc.text('Filter Status: ' + (statusLabels[statusFilter] || statusFilter), 14, 27);

            const tableData = allOrders.map((o, i) => [
                i + 1,
                o.order_number,
                o.customer_name || '-',
                o.user_name || '-',
                'Rp ' + parseFloat(o.total || 0).toLocaleString('id-ID'),
                statusLabels[o.status] || o.status,
                new Date(o.created_at).toLocaleDateString('id-ID'),
            ]);

            autoTable(doc, {
                head: [['No', 'No. Order', 'Pelanggan', 'Sales', 'Total', 'Status', 'Tanggal']],
                body: tableData,
                startY: statusFilter ? 32 : 27,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [59, 130, 246] },
            });
            doc.save('Data_Pesanan.pdf');
        } catch (e) { console.error(e); alert('Gagal export PDF'); }
        setIsExporting(false);
        setShowExportMenu(false);
    }

    async function handlePrint() {
        setIsExporting(true);
        try {
            const allOrders = await fetchAllOrders();
            let rows = '';
            allOrders.forEach((o, i) => {
                rows += '<tr>';
                rows += '<td>' + (i + 1) + '</td>';
                rows += '<td>' + (o.order_number || '') + '</td>';
                rows += '<td>' + (o.customer_name || '-') + '</td>';
                rows += '<td>' + (o.user_name || '-') + '</td>';
                rows += '<td style="text-align:right">Rp ' + parseFloat(o.total || 0).toLocaleString('id-ID') + '</td>';
                rows += '<td>' + (statusLabels[o.status] || o.status) + '</td>';
                rows += '<td>' + new Date(o.created_at).toLocaleDateString('id-ID') + '</td>';
                rows += '</tr>';
            });

            const printWindow = window.open('', '_blank');
            printWindow.document.write(
                '<!DOCTYPE html><html><head><title>Cetak Pesanan</title>' +
                '<style>body{font-family:Arial,sans-serif;padding:20px}table{width:100%;border-collapse:collapse;margin-top:16px}' +
                'th,td{border:1px solid #ddd;padding:8px;font-size:12px}th{background:#3b82f6;color:white;text-align:left}' +
                'tr:nth-child(even){background:#f8fafc}h1{font-size:18px;color:#1a1a2e}</style></head>' +
                '<body><h1>Laporan Pesanan</h1>' +
                '<p>Tanggal cetak: ' + new Date().toLocaleDateString('id-ID') + '</p>' +
                '<table><thead><tr><th>No</th><th>No. Order</th><th>Pelanggan</th><th>Sales</th><th>Total</th><th>Status</th><th>Tanggal</th></tr></thead>' +
                '<tbody>' + rows + '</tbody></table></body></html>'
            );
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); }, 500);
        } catch (e) { console.error(e); alert('Gagal mencetak'); }
        setIsExporting(false);
        setShowExportMenu(false);
    }

    async function fetchOrderDetail(id) {
        const res = await fetch(`/api/orders/${id}`);
        const data = await res.json();
        return data;
    }

    async function printVoucher(orderId) {
        try {
            const { order, items } = await fetchOrderDetail(orderId);
            if (!order) { alert('Data pesanan tidak ditemukan'); return; }

            let itemRows = '';
            let itemsSubtotal = 0;
            (items || []).forEach((item, i) => {
                const subtotal = parseFloat(item.quantity || 0) * parseFloat(item.price || 0);
                itemsSubtotal += subtotal;
                itemRows += '<tr>';
                itemRows += '<td style="text-align:center">' + (i + 1) + '</td>';
                itemRows += '<td>' + (item.product_name || item.description || '-') + '</td>';
                itemRows += '<td style="text-align:center">' + (item.quantity || 0) + '</td>';
                itemRows += '<td style="text-align:right">Rp ' + parseFloat(item.price || 0).toLocaleString('id-ID') + '</td>';
                itemRows += '<td style="text-align:right">Rp ' + subtotal.toLocaleString('id-ID') + '</td>';
                itemRows += '</tr>';
            });
            const grandTotal = parseFloat(order.total || 0);
            const ppnAmount = grandTotal - itemsSubtotal;

            const printWindow = window.open('', '_blank');
            printWindow.document.write(
                '<!DOCTYPE html><html><head><title>Request Order</title>' +
                '<style>' +
                'body{font-family:Arial,sans-serif;padding:30px;max-width:800px;margin:0 auto;color:#1a1a2e}' +
                '.voucher-header{text-align:center;border-bottom:3px solid #3b82f6;padding-bottom:16px;margin-bottom:20px}' +
                '.voucher-header h1{font-size:22px;color:#3b82f6;margin:0 0 4px}' +
                '.voucher-header p{margin:2px 0;font-size:12px;color:#64748b}' +
                '.info-grid{display:flex;justify-content:space-between;margin-bottom:20px;gap:20px}' +
                '.info-box{flex:1;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;padding:12px}' +
                '.info-box h4{margin:0 0 8px;font-size:12px;color:#64748b;text-transform:uppercase}' +
                '.info-box p{margin:2px 0;font-size:13px}' +
                'table{width:100%;border-collapse:collapse;margin-top:12px}' +
                'th,td{border:1px solid #e2e8f0;padding:8px 10px;font-size:12px}' +
                'th{background:#3b82f6;color:white;text-align:left;font-weight:600}' +
                'tr:nth-child(even){background:#f8fafc}' +
                '.total-row{font-weight:700;background:#eef2ff !important}' +
                '.footer{margin-top:40px;display:flex;justify-content:space-between}' +
                '.sign-box{text-align:center;width:200px}' +
                '.sign-box .line{border-top:1px solid #333;margin-top:60px;padding-top:4px;font-size:12px}' +
                '.status-badge{display:inline-block;padding:3px 10px;border-radius:4px;font-size:11px;font-weight:600}' +
                '@media print{body{padding:15px}}' +
                '</style></head>' +
                '<body>' +
                '<div class="voucher-header">' +
                '<h1>REQUEST ORDER / PESANAN</h1>' +
                '<p>No. ' + (order.order_number || '-') + '</p>' +
                '</div>' +
                '<div class="info-grid">' +
                '<div class="info-box">' +
                '<h4>Informasi Pelanggan</h4>' +
                '<p><strong>' + (order.customer_name || '-') + '</strong></p>' +
                '<p>' + (order.customer_company || '') + '</p>' +
                '<p>' + (order.customer_address || '') + '</p>' +
                '</div>' +
                '<div class="info-box">' +
                '<h4>Informasi Pesanan</h4>' +
                '<p>Tanggal: ' + new Date(order.created_at).toLocaleDateString('id-ID', {day:'numeric',month:'long',year:'numeric'}) + '</p>' +
                '<p>Sales: ' + (order.user_name || '-') + '</p>' +
                '<p>Status: <span class="status-badge" style="background:#eef2ff;color:#3b82f6">' + (statusLabels[order.status] || order.status) + '</span></p>' +
                (order.approved_by_name ? '<p>Disetujui oleh: ' + order.approved_by_name + '</p>' : '') +
                '</div>' +
                '</div>' +
                '<table><thead><tr><th style="width:40px;text-align:center">No</th><th>Produk / Deskripsi</th><th style="width:60px;text-align:center">Qty</th><th style="width:120px;text-align:right">Harga</th><th style="width:130px;text-align:right">Subtotal</th></tr></thead>' +
                '<tbody>' + itemRows +
                '<tr style="background:#f8fafc"><td colspan="4" style="text-align:right;font-weight:600">Subtotal</td><td style="text-align:right">Rp ' + itemsSubtotal.toLocaleString('id-ID') + '</td></tr>' +
                '<tr style="background:#f8fafc"><td colspan="4" style="text-align:right;font-weight:600">PPN</td><td style="text-align:right">Rp ' + ppnAmount.toLocaleString('id-ID') + '</td></tr>' +
                '<tr class="total-row"><td colspan="4" style="text-align:right">GRAND TOTAL</td><td style="text-align:right">Rp ' + grandTotal.toLocaleString('id-ID') + '</td></tr>' +
                '</tbody></table>' +
                (order.notes ? '<p style="margin-top:12px;font-size:12px;color:#64748b"><strong>Catatan:</strong> ' + order.notes + '</p>' : '') +
                '<div class="footer">' +
                '<div class="sign-box"><div class="line">Pembuat Pesanan</div></div>' +
                '<div class="sign-box"><div class="line">Disetujui Oleh</div></div>' +
                '</div>' +
                '</body></html>'
            );
            printWindow.document.close();
            printWindow.focus();
            setTimeout(() => { printWindow.print(); }, 500);
        } catch (e) { console.error(e); alert('Gagal mencetak voucher'); }
    }

    async function exportVoucherPDF(orderId) {
        try {
            const { order, items } = await fetchOrderDetail(orderId);
            if (!order) { alert('Data pesanan tidak ditemukan'); return; }

            const doc = new jsPDF();
            // Title
            doc.setFontSize(18);
            doc.setTextColor(59, 130, 246);
            doc.text('REQUEST ORDER / PESANAN', 105, 18, { align: 'center' });
            doc.setFontSize(11);
            doc.setTextColor(100, 116, 139);
            doc.text('No. ' + (order.order_number || '-'), 105, 25, { align: 'center' });

            // Line
            doc.setDrawColor(59, 130, 246);
            doc.setLineWidth(0.8);
            doc.line(14, 28, 196, 28);

            // Info
            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59);
            doc.text('Pelanggan:', 14, 36);
            doc.setFont(undefined, 'bold');
            doc.text(order.customer_name || '-', 50, 36);
            doc.setFont(undefined, 'normal');
            if (order.customer_company) doc.text(order.customer_company, 50, 41);
            if (order.customer_address) doc.text(order.customer_address, 50, 46);

            doc.text('Tanggal:', 120, 36);
            doc.text(new Date(order.created_at).toLocaleDateString('id-ID'), 150, 36);
            doc.text('Sales:', 120, 41);
            doc.text(order.user_name || '-', 150, 41);
            doc.text('Status:', 120, 46);
            doc.text(statusLabels[order.status] || order.status, 150, 46);

            // Items table
            let pdfItemsSubtotal = 0;
            const tableData = (items || []).map((item, i) => {
                const subtotal = parseFloat(item.quantity || 0) * parseFloat(item.price || 0);
                pdfItemsSubtotal += subtotal;
                return [
                    i + 1,
                    item.product_name || item.description || '-',
                    item.quantity || 0,
                    'Rp ' + parseFloat(item.price || 0).toLocaleString('id-ID'),
                    'Rp ' + subtotal.toLocaleString('id-ID'),
                ];
            });
            const pdfGrandTotal = parseFloat(order.total || 0);
            const pdfPPN = pdfGrandTotal - pdfItemsSubtotal;

            // Add subtotal, PPN, grand total rows
            tableData.push([
                { content: 'Subtotal', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: 'Rp ' + pdfItemsSubtotal.toLocaleString('id-ID'), styles: { halign: 'right' } },
            ]);
            tableData.push([
                { content: 'PPN', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: 'Rp ' + pdfPPN.toLocaleString('id-ID'), styles: { halign: 'right' } },
            ]);
            tableData.push([
                { content: 'GRAND TOTAL', colSpan: 4, styles: { halign: 'right', fontStyle: 'bold' } },
                { content: 'Rp ' + pdfGrandTotal.toLocaleString('id-ID'), styles: { halign: 'right', fontStyle: 'bold' } },
            ]);

            autoTable(doc, {
                head: [['No', 'Produk / Deskripsi', 'Qty', 'Harga', 'Subtotal']],
                body: tableData,
                startY: 52,
                styles: { fontSize: 9 },
                headStyles: { fillColor: [59, 130, 246] },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 12 },
                    2: { halign: 'center', cellWidth: 15 },
                    3: { halign: 'right', cellWidth: 30 },
                    4: { halign: 'right', cellWidth: 35 },
                },
            });

            // Notes
            const finalY = doc.lastAutoTable.finalY || 120;
            if (order.notes) {
                doc.setFontSize(9);
                doc.setTextColor(100, 116, 139);
                doc.text('Catatan: ' + order.notes, 14, finalY + 8);
            }

            // Signature
            const sigY = finalY + 30;
            doc.setFontSize(10);
            doc.setTextColor(30, 41, 59);
            doc.line(14, sigY + 25, 60, sigY + 25);
            doc.text('Pembuat Pesanan', 18, sigY + 30);
            doc.line(140, sigY + 25, 190, sigY + 25);
            doc.text('Disetujui Oleh', 150, sigY + 30);

            doc.save('Voucher_' + (order.order_number || 'Order') + '.pdf');
        } catch (e) { console.error(e); alert('Gagal export voucher PDF'); }
    }

    return (
        <div>
            <div className="page-header">
                <div>
                    <h1 className="page-title">Pesanan</h1>
                    <p className="page-subtitle">{total} pesanan</p>
                </div>
                <Link href="/orders/new" className="btn btn-primary"><Plus size={18} /> Buat Pesanan</Link>
            </div>

            <div className="toolbar">
                <select className="form-control" style={{ width: 'auto', minWidth: 160 }} value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
                    <option value="">Semua Status</option>
                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <div style={{ marginLeft: 'auto', position: 'relative' }}>
                    <button
                        className="btn btn-outline"
                        onClick={() => setShowExportMenu(!showExportMenu)}
                        disabled={isExporting}
                    >
                        {isExporting ? <span className="spinner" style={{ width: 16, height: 16 }} /> : <Download size={16} />}
                        {' '}Export
                    </button>
                    {showExportMenu && (
                        <div style={{
                            position: 'absolute', right: 0, top: '100%', marginTop: 4,
                            background: 'white', border: '1px solid #e2e8f0', borderRadius: 8,
                            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 50, minWidth: 160, overflow: 'hidden'
                        }}>
                            <button onClick={handlePrint} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'white', cursor: 'pointer', fontSize: 13 }}>
                                <Printer size={15} /> Cetak (Print)
                            </button>
                            <button onClick={handleExportPDF} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'white', cursor: 'pointer', fontSize: 13 }}>
                                <FileText size={15} /> Download PDF
                            </button>
                            <button onClick={handleExportExcel} style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '10px 14px', border: 'none', background: 'white', cursor: 'pointer', fontSize: 13 }}>
                                <FileSpreadsheet size={15} /> Download Excel
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {loading ? (
                <div className="loading-center"><div className="spinner" /></div>
            ) : orders.length === 0 ? (
                <div className="empty-state">
                    <div className="empty-icon"><ShoppingCart size={36} /></div>
                    <h3>Belum ada pesanan</h3>
                    <p>Buat pesanan pertama dari pelanggan Anda</p>
                    <Link href="/orders/new" className="btn btn-primary"><Plus size={18} /> Buat Pesanan</Link>
                </div>
            ) : (
                <>
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>No. Order</th>
                                    <th>Pelanggan</th>
                                    <th>Sales</th>
                                    <th>Total</th>
                                    <th>Status</th>
                                    <th>Tanggal</th>
                                    <th>Aksi</th>
                                </tr>
                            </thead>
                            <tbody>
                                {orders.map(o => (
                                    <tr key={o.id}>
                                        <td><strong>{o.order_number}</strong></td>
                                        <td>{o.customer_name || '-'}</td>
                                        <td>{o.user_name || '-'}</td>
                                        <td className="text-right"><strong>Rp {parseFloat(o.total || 0).toLocaleString('id-ID')}</strong></td>
                                        <td><span className={`badge ${statusBadge[o.status] || 'badge-secondary'}`}>{statusLabels[o.status] || o.status}</span></td>
                                        <td>{new Date(o.created_at).toLocaleDateString('id-ID')}</td>
                                        <td>
                                            <div className="flex gap-sm">
                                                {o.status === 'pending' && (
                                                    <>
                                                        <button className="btn btn-success btn-sm" onClick={() => updateStatus(o.id, 'approved')} title="Approve"><Check size={14} /></button>
                                                        <button className="btn btn-danger btn-sm" onClick={() => updateStatus(o.id, 'rejected')} title="Reject"><XIcon size={14} /></button>
                                                    </>
                                                )}
                                                {o.status === 'approved' && (
                                                    <button className="btn btn-secondary btn-sm" onClick={() => updateStatus(o.id, 'completed')} title="Selesai"><Package size={14} /></button>
                                                )}
                                                <button className="btn btn-ghost btn-sm" onClick={() => printVoucher(o.id)} title="Cetak Voucher">
                                                    <Printer size={14} />
                                                </button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => exportVoucherPDF(o.id)} title="Download Voucher PDF">
                                                    <FileText size={14} />
                                                </button>
                                                <button className="btn btn-ghost btn-sm" onClick={() => deleteOrder(o)} title="Hapus Pesanan"><Trash2 size={14} /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {totalPages > 1 && (
                        <div className="pagination">
                            <button disabled={page <= 1} onClick={() => setPage(page - 1)}><ChevronLeft size={16} /></button>
                            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => <button key={i + 1} className={page === i + 1 ? 'active' : ''} onClick={() => setPage(i + 1)}>{i + 1}</button>)}
                            <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}><ChevronRight size={16} /></button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
