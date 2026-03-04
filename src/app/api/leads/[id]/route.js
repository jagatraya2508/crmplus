import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { id } = await params;
        const body = await request.json();
        const { name, email, phone, company, source, score, status, notes } = body;
        const result = await query(
            'UPDATE leads SET name=$1, email=$2, phone=$3, company=$4, source=$5, score=$6, status=$7, notes=$8, updated_at=NOW() WHERE id=$9 RETURNING *',
            [name, email, phone, company, source, score, status, notes, id]
        );
        return NextResponse.json({ lead: result.rows[0] });
    } catch (error) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
