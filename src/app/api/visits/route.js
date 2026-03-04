import { NextResponse } from 'next/server';
import { getMany, getOne, query, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await initDatabase();

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date') || '';
        const userId = searchParams.get('user_id') || '';
        const status = searchParams.get('status') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let where = [];
        let params = [];
        let idx = 1;

        // Sales users can only see their own visits
        if (user.role === 'sales') {
            where.push(`v.user_id = $${idx}`);
            params.push(user.id);
            idx++;
        } else if (userId) {
            where.push(`v.user_id = $${idx}`);
            params.push(userId);
            idx++;
        }

        if (date) {
            where.push(`v.checkin_time::date = $${idx}`);
            params.push(date);
            idx++;
        }

        if (status) {
            where.push(`v.status = $${idx}`);
            params.push(status);
            idx++;
        }

        const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

        const countResult = await getOne(`SELECT COUNT(*)::int as count FROM visits v ${whereClause}`, params);

        params.push(limit, offset);
        const visits = await getMany(`
      SELECT v.*, c.name as customer_name, c.company as customer_company, c.address as customer_address,
             u.name as user_name
      FROM visits v 
      LEFT JOIN customers c ON v.customer_id = c.id 
      LEFT JOIN users u ON v.user_id = u.id 
      ${whereClause}
      ORDER BY v.checkin_time DESC 
      LIMIT $${idx} OFFSET $${idx + 1}
    `, params);

        return NextResponse.json({
            visits,
            total: countResult?.count || 0,
            page,
            totalPages: Math.ceil((countResult?.count || 0) / limit),
        });
    } catch (error) {
        console.error('Visits GET error:', error);
        return NextResponse.json({ visits: [], total: 0, page: 1, totalPages: 0 });
    }
}

// Check-in
export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { customer_id, checkin_lat, checkin_lng, checkin_address, notes } = body;

        if (!customer_id) return NextResponse.json({ error: 'Pilih pelanggan terlebih dahulu' }, { status: 400 });

        // Check if user already has an active check-in
        const activeVisit = await getOne(
            "SELECT id FROM visits WHERE user_id = $1 AND status = 'checked_in'",
            [user.id]
        );
        if (activeVisit) {
            return NextResponse.json({ error: 'Anda masih memiliki kunjungan aktif. Silakan check-out terlebih dahulu.' }, { status: 400 });
        }

        const result = await query(`
      INSERT INTO visits (customer_id, user_id, checkin_lat, checkin_lng, checkin_address, notes, status)
      VALUES ($1, $2, $3, $4, $5, $6, 'checked_in')
      RETURNING *
    `, [customer_id, user.id, checkin_lat || null, checkin_lng || null, checkin_address || null, notes || null]);

        // Create activity log
        await query(`
      INSERT INTO activities (type, title, customer_id, user_id, status, completed_at)
      VALUES ('visit', $1, $2, $3, 'completed', NOW())
    `, [`Check-in di ${checkin_address || 'lokasi pelanggan'}`, customer_id, user.id]);

        return NextResponse.json({ visit: result.rows[0] }, { status: 201 });
    } catch (error) {
        console.error('Visit POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
