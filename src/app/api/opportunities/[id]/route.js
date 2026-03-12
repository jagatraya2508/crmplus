import { NextResponse } from 'next/server';
import { query, getOne, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await initDatabase();
        const { id } = await params;

        const opportunity = await getOne(`
            SELECT o.*, c.name as customer_name, s.name as stage_name, u.name as assigned_name
            FROM opportunities o
            LEFT JOIN customers c ON o.customer_id = c.id
            LEFT JOIN pipeline_stages s ON o.stage_id = s.id
            LEFT JOIN users u ON o.assigned_to = u.id
            WHERE o.id = $1
        `, [id]);

        if (!opportunity) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ opportunity });
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
        const { title, customer_id, stage_id, value, probability, expected_close, description, status } = body;

        const result = await query(
            `UPDATE opportunities SET 
                title = COALESCE($1, title),
                customer_id = $2,
                stage_id = COALESCE($3, stage_id),
                value = COALESCE($4, value),
                probability = COALESCE($5, probability),
                expected_close = $6,
                description = $7,
                status = COALESCE($8, status),
                updated_at = NOW()
            WHERE id = $9 RETURNING *`,
            [title, customer_id || null, stage_id, value, probability, expected_close || null, description || null, status, id]
        );

        if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ opportunity: result.rows[0] });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { id } = await params;

        const result = await query('DELETE FROM opportunities WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
        return NextResponse.json({ message: 'Deleted successfully' });
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
