import { NextResponse } from 'next/server';
import { getMany, query, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await initDatabase();
        const leads = await getMany('SELECT l.*, u.name as assigned_name FROM leads l LEFT JOIN users u ON l.assigned_to = u.id ORDER BY l.created_at DESC');
        return NextResponse.json({ leads });
    } catch (error) { return NextResponse.json({ leads: [] }); }
}

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        const body = await request.json();
        const { name, email, phone, company, source, score, status, notes, campaign_id } = body;
        if (!name) return NextResponse.json({ error: 'Nama wajib diisi' }, { status: 400 });
        const result = await query(
            'INSERT INTO leads (name, email, phone, company, source, score, status, notes, campaign_id, assigned_to) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *',
            [name, email || null, phone || null, company || null, source || 'other', score || 0, status || 'new', notes || null, campaign_id || null, user.id]
        );
        return NextResponse.json({ lead: result.rows[0] }, { status: 201 });
    } catch (error) { return NextResponse.json({ error: error.message }, { status: 500 }); }
}
