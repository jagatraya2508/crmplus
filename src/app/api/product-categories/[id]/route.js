import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const { id } = await params;
        const body = await request.json();
        const { name, type } = body;

        if (!name || !type) return NextResponse.json({ error: 'Nama dan Tipe Kategori wajib diisi' }, { status: 400 });

        const result = await query(
            'UPDATE product_categories SET name = $1, type = $2 WHERE id = $3 RETURNING *',
            [name, type, id]
        );
        return NextResponse.json({ category: result.rows[0] });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const { id } = await params;
        // Soft delete
        await query('UPDATE product_categories SET is_active = false WHERE id = $1', [id]);
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
