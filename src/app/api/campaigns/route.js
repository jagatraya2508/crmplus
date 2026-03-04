import { NextResponse } from 'next/server';
import { getMany, query, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await initDatabase();
        const campaigns = await getMany('SELECT * FROM campaigns ORDER BY created_at DESC');
        return NextResponse.json({ campaigns });
    } catch (error) { return NextResponse.json({ campaigns: [] }); }
}

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const body = await request.json();
        const { name, type, status, budget, start_date, end_date, description, target_audience } = body;
        if (!name) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
        const result = await query(
            'INSERT INTO campaigns (name, type, status, budget, start_date, end_date, description, target_audience, created_by) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *',
            [name, type || 'other', status || 'draft', budget || 0, start_date || null, end_date || null, description || null, target_audience || null, user.id]
        );
        return NextResponse.json({ campaign: result.rows[0] }, { status: 201 });
    } catch (error) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
