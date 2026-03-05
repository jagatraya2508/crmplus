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

        let where = ['p.is_active = true'];
        let params = [];
        let idx = 1;

        if (search) {
            where.push(`(p.name ILIKE $${idx} OR p.sku ILIKE $${idx} OR p.product_code ILIKE $${idx})`);
            params.push(`%${search}%`);
            idx++;
        }
        if (category) {
            where.push(`p.category = $${idx}`);
            params.push(category);
            idx++;
        }

        const products = await getMany(`SELECT * FROM products p WHERE ${where.join(' AND ')} ORDER BY p.name`, params);
        return NextResponse.json({ products });
    } catch (error) {
        return NextResponse.json({ products: [] });
    }
}

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { name, sku, description, price, unit, category, stock } = body;
        if (!name) return NextResponse.json({ error: 'Nama produk wajib diisi' }, { status: 400 });

        // Auto-generate product_code (e.g., PR001)
        // Ensure we only match PR followed by exactly 3 digits (PR___) to avoid conflicting with PRD-XXX formats
        const maxCodeResult = await query(
            "SELECT product_code FROM products WHERE product_code LIKE 'PR___' AND product_code NOT LIKE 'PRD%' ORDER BY product_code DESC LIMIT 1"
        );
        let nextCode = 'PR001';
        if (maxCodeResult.rows.length > 0 && maxCodeResult.rows[0].product_code) {
            const currentCode = maxCodeResult.rows[0].product_code;
            const numericPart = parseInt(currentCode.substring(2));
            if (!isNaN(numericPart)) {
                nextCode = `PR${String(numericPart + 1).padStart(3, '0')}`;
            }
        }

        const result = await query(
            'INSERT INTO products (product_code, name, sku, description, price, unit, category, stock) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
            [nextCode, name, sku || null, description || null, price || 0, unit || 'pcs', category || null, stock || 0]
        );
        return NextResponse.json({ product: result.rows[0] }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
