import { NextResponse } from 'next/server';
import { getMany, getOne, query, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await initDatabase();

        const { searchParams } = new URL(request.url);
        const status = searchParams.get('status') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let where = [];
        let params = [];
        let idx = 1;

        if (user.role === 'sales') {
            where.push(`o.user_id = $${idx}`);
            params.push(user.id);
            idx++;
        }
        if (status) {
            where.push(`o.status = $${idx}`);
            params.push(status);
            idx++;
        }

        const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';
        const countResult = await getOne(`SELECT COUNT(*)::int as count FROM orders o ${whereClause}`, params);

        params.push(limit, offset);
        const orders = await getMany(`
      SELECT o.*, c.name as customer_name, u.name as user_name, ap.name as approved_by_name
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN users ap ON o.approved_by = ap.id
      ${whereClause}
      ORDER BY o.created_at DESC
      LIMIT $${idx} OFFSET $${idx + 1}
    `, params);

        return NextResponse.json({ orders, total: countResult?.count || 0, page, totalPages: Math.ceil((countResult?.count || 0) / limit) });
    } catch (error) {
        console.error('Orders GET error:', error);
        return NextResponse.json({ orders: [], total: 0, page: 1, totalPages: 0 });
    }
}

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { customer_id, items, notes, status: orderStatus } = body;
        if (!customer_id) return NextResponse.json({ error: 'Pilih pelanggan' }, { status: 400 });
        if (!items || items.length === 0) return NextResponse.json({ error: 'Tambahkan minimal 1 produk' }, { status: 400 });

        // Generate order number
        const count = await getOne("SELECT COUNT(*)::int as count FROM orders");
        const orderNumber = `ORD-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String((count?.count || 0) + 1).padStart(4, '0')}`;

        let subtotal = 0;
        for (const item of items) {
            item.total = (item.quantity * item.price) - (item.discount || 0);
            subtotal += item.total;
        }
        const tax = subtotal * 0.11; // PPN 11%
        const total = subtotal + tax;

        const result = await query(
            `INSERT INTO orders (order_number, customer_id, user_id, status, subtotal, tax, total, notes) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [orderNumber, customer_id, user.id, orderStatus || 'pending', subtotal, tax, total, notes || null]
        );

        const order = result.rows[0];

        // Insert order items
        for (const item of items) {
            await query(
                `INSERT INTO order_items (order_id, product_id, product_name, quantity, price, discount, total) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [order.id, item.product_id, item.product_name, item.quantity, item.price, item.discount || 0, item.total]
            );
        }

        return NextResponse.json({ order }, { status: 201 });
    } catch (error) {
        console.error('Orders POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
