import { NextResponse } from 'next/server';
import { query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(request, { params }) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const { id } = await params;
        const body = await request.json();
        const { name, type, status, budget, start_date, end_date, description, target_audience } = body;
        const result = await query(
            'UPDATE campaigns SET name=$1, type=$2, status=$3, budget=$4, start_date=$5, end_date=$6, description=$7, target_audience=$8, updated_at=NOW() WHERE id=$9 RETURNING *',
            [name, type, status, budget, start_date || null, end_date || null, description, target_audience, id]
        );
        return NextResponse.json({ campaign: result.rows[0] });
    } catch (error) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
