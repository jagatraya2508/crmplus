import { NextResponse } from 'next/server';
import { getOne, getMany, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { id } = await params;

        const order = await getOne(`
      SELECT o.*, c.name as customer_name, c.company as customer_company, c.address as customer_address,
             u.name as user_name, ap.name as approved_by_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users ap ON o.approved_by = ap.id
      WHERE o.id = $1
    `, [id]);

        if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

        const items = await getMany('SELECT * FROM order_items WHERE order_id = $1', [id]);

        return NextResponse.json({ order, items });
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
        const { status, notes } = body;

        // Only managers/admins can approve/reject
        if (['approved', 'rejected'].includes(status) && user.role === 'sales') {
            return NextResponse.json({ error: 'Hanya manager atau admin yang bisa approve/reject' }, { status: 403 });
        }

        let updateQuery = 'UPDATE orders SET status = $1, updated_at = NOW()';
        let updateParams = [status];
        let idx = 2;

        if (status === 'approved') {
            updateQuery += `, approved_by = $${idx}, approved_at = NOW()`;
            updateParams.push(user.id);
            idx++;
        }
        if (notes !== undefined) {
            updateQuery += `, notes = $${idx}`;
            updateParams.push(notes);
            idx++;
        }

        updateQuery += ` WHERE id = $${idx} RETURNING *`;
        updateParams.push(id);

        const result = await query(updateQuery, updateParams);
        return NextResponse.json({ order: result.rows[0] });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
