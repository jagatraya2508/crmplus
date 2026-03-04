import { NextResponse } from 'next/server';
import { query, getMany, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await initDatabase();
        const opportunities = await getMany(`
      SELECT o.*, c.name as customer_name, s.name as stage_name, s.color as stage_color, u.name as assigned_name
      FROM opportunities o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN pipeline_stages s ON o.stage_id = s.id
      LEFT JOIN users u ON o.assigned_to = u.id
      ORDER BY o.created_at DESC
    `);
        return NextResponse.json({ opportunities });
    } catch (error) {
        return NextResponse.json({ opportunities: [] });
    }
}

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const body = await request.json();
        const { title, customer_id, stage_id, value, probability, expected_close, description } = body;
        if (!title) return NextResponse.json({ error: 'Judul wajib diisi' }, { status: 400 });

        const result = await query(
            `INSERT INTO opportunities (title, customer_id, stage_id, value, probability, expected_close, description, assigned_to, created_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
            [title, customer_id || null, stage_id || null, value || 0, probability || 50, expected_close || null, description || null, user.id, user.id]
        );
        return NextResponse.json({ opportunity: result.rows[0] }, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
