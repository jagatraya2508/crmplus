import { NextResponse } from 'next/server';
import { getMany, query, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await initDatabase();

        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') || '';

        let whereStr = 'is_active = true';
        let params = [];
        
        if (type) {
            whereStr += ' AND type = $1';
            params.push(type);
        }

        const categories = await getMany(`SELECT * FROM product_categories WHERE ${whereStr} ORDER BY name`, params);
        return NextResponse.json({ categories });
    } catch (error) {
        return NextResponse.json({ categories: [] });
    }
}

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        
        const body = await request.json();
        const { name, type } = body;
        
        if (!name || !type) return NextResponse.json({ error: 'Nama dan Tipe Kategori wajib diisi' }, { status: 400 });

        const result = await query(
            'INSERT INTO product_categories (name, type) VALUES ($1, $2) RETURNING *',
            [name, type]
        );
        return NextResponse.json({ category: result.rows[0] }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
