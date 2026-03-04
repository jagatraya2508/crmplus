import { NextResponse } from 'next/server';
import { getMany, getOne, query, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await initDatabase();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let where = [];
        let params = [];
        let idx = 1;

        if (search) {
            where.push(`(c.name ILIKE $${idx} OR c.company ILIKE $${idx} OR c.email ILIKE $${idx} OR c.phone ILIKE $${idx})`);
            params.push(`%${search}%`);
            idx++;
        }
        if (category) {
            where.push(`c.category = $${idx}`);
            params.push(category);
            idx++;
        }

        const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

        const countResult = await getOne(`SELECT COUNT(*)::int as count FROM customers c ${whereClause}`, params);

        params.push(limit, offset);
        const customers = await getMany(`
      SELECT c.*, u.name as assigned_name 
      FROM customers c 
      LEFT JOIN users u ON c.assigned_to = u.id 
      ${whereClause}
      ORDER BY c.created_at DESC 
      LIMIT $${idx} OFFSET $${idx + 1}
    `, params);

        return NextResponse.json({
            customers,
            total: countResult?.count || 0,
            page,
            totalPages: Math.ceil((countResult?.count || 0) / limit),
        });
    } catch (error) {
        console.error('Customers GET error:', error);
        return NextResponse.json({ customers: [], total: 0, page: 1, totalPages: 0 });
    }
}

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { name, company, email, phone, address, city, province, postal_code, latitude, longitude, category, notes, assigned_to } = body;

        if (!name) return NextResponse.json({ error: 'Nama pelanggan wajib diisi' }, { status: 400 });

        const result = await query(`
      INSERT INTO customers (name, company, email, phone, address, city, province, postal_code, latitude, longitude, category, notes, assigned_to, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [name, company || null, email || null, phone || null, address || null, city || null, province || null, postal_code || null, latitude || null, longitude || null, category || 'prospect', notes || null, assigned_to || user.id, user.id]);

        return NextResponse.json({ customer: result.rows[0] }, { status: 201 });
    } catch (error) {
        console.error('Customers POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
