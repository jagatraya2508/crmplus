import { NextResponse } from 'next/server';
import { getOne, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const customer = await getOne(`
      SELECT c.*, u.name as assigned_name 
      FROM customers c 
      LEFT JOIN users u ON c.assigned_to = u.id 
      WHERE c.id = $1
    `, [id]);

        if (!customer) return NextResponse.json({ error: 'Pelanggan tidak ditemukan' }, { status: 404 });

        return NextResponse.json({ customer });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;
        const body = await request.json();
        const { name, company, email, phone, address, city, province, postal_code, latitude, longitude, category, notes, assigned_to } = body;

        const result = await query(`
      UPDATE customers SET 
        name = COALESCE($1, name), company = $2, email = $3, phone = $4,
        address = $5, city = $6, province = $7, postal_code = $8,
        latitude = $9, longitude = $10, category = COALESCE($11, category),
        notes = $12, assigned_to = $13, updated_at = NOW()
      WHERE id = $14 RETURNING *
    `, [name, company, email, phone, address, city, province, postal_code, latitude, longitude, category, notes, assigned_to, id]);

        return NextResponse.json({ customer: result.rows[0] });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== 'admin' && user.role !== 'manager') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const { id } = await params;
        await query('DELETE FROM customers WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
