import { NextResponse } from 'next/server';
import { getOne, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// Get visit detail
export async function GET(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const visit = await getOne(`
      SELECT v.*, c.name as customer_name, c.company as customer_company, c.address as customer_address,
             c.latitude as customer_lat, c.longitude as customer_lng,
             u.name as user_name
      FROM visits v 
      LEFT JOIN customers c ON v.customer_id = c.id 
      LEFT JOIN users u ON v.user_id = u.id 
      WHERE v.id = $1
    `, [id]);

        if (!visit) return NextResponse.json({ error: 'Kunjungan tidak ditemukan' }, { status: 404 });
        return NextResponse.json({ visit });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// Check-out
export async function PUT(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await request.json();
        const { checkout_lat, checkout_lng, checkout_address, summary } = body;

        const visit = await getOne('SELECT * FROM visits WHERE id = $1', [id]);
        if (!visit) return NextResponse.json({ error: 'Kunjungan tidak ditemukan' }, { status: 404 });
        if (visit.user_id !== user.id && user.role === 'sales') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const result = await query(`
      UPDATE visits SET 
        checkout_time = NOW(),
        checkout_lat = $1, checkout_lng = $2, checkout_address = $3,
        summary = $4, status = 'checked_out'
      WHERE id = $5 RETURNING *
    `, [checkout_lat || null, checkout_lng || null, checkout_address || null, summary || null, id]);

        return NextResponse.json({ visit: result.rows[0] });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// PATCH /api/visits/[id] - Admin/Manager edit visit
export async function PATCH(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (user.role === 'sales') {
            return NextResponse.json({ error: 'Hanya Admin atau Manager yang dapat mengedit kunjungan' }, { status: 403 });
        }

        const { id } = await params;
        const body = await request.json();
        const { customer_id, notes, summary, checkin_time, checkout_time, status } = body;

        const visit = await getOne('SELECT * FROM visits WHERE id = $1', [id]);
        if (!visit) return NextResponse.json({ error: 'Kunjungan tidak ditemukan' }, { status: 404 });

        const result = await query(`
      UPDATE visits SET 
        customer_id = COALESCE($1, customer_id),
        notes = $2,
        summary = $3,
        checkin_time = COALESCE($4, checkin_time),
        checkout_time = $5,
        status = COALESCE($6, status)
      WHERE id = $7 RETURNING *
    `, [
            customer_id || visit.customer_id,
            notes !== undefined ? notes : visit.notes,
            summary !== undefined ? summary : visit.summary,
            checkin_time || visit.checkin_time,
            checkout_time || visit.checkout_time,
            status || visit.status,
            id
        ]);

        return NextResponse.json({ visit: result.rows[0] });
    } catch (error) {
        console.error('Error editing visit:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// DELETE /api/visits/[id] - Delete visit permanently (Admin/Manager only)
export async function DELETE(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Only admin and manager can delete visits
        if (user.role === 'sales') {
            return NextResponse.json({ error: 'Hanya Admin atau Manager yang dapat menghapus data kunjungan' }, { status: 403 });
        }

        const { id } = await params;

        const visit = await getOne('SELECT id FROM visits WHERE id = $1', [id]);
        if (!visit) {
            return NextResponse.json({ error: 'Kunjungan tidak ditemukan' }, { status: 404 });
        }

        await query('DELETE FROM visits WHERE id = $1', [id]);

        return NextResponse.json({ success: true, message: 'Kunjungan berhasil dihapus' });
    } catch (error) {
        console.error('Error deleting visit:', error);
        return NextResponse.json({ error: 'Gagal menghapus kunjungan' }, { status: 500 });
    }
}
