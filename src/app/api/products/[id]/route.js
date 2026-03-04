import { NextResponse } from 'next/server';
import { getOne, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { id } = await params;
        const body = await request.json();
        const { name, sku, description, price, unit, category, stock, is_active } = body;

        const result = await query(
            `UPDATE products SET name=$1, sku=$2, description=$3, price=$4, unit=$5, category=$6, stock=$7, is_active=$8, updated_at=NOW() WHERE id=$9 RETURNING *`,
            [name, sku, description, price, unit, category, stock, is_active !== false, id]
        );
        return NextResponse.json({ product: result.rows[0] });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { id } = await params;
        await query('UPDATE products SET is_active = false WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
