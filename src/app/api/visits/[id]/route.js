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
