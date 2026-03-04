import { NextResponse } from 'next/server';
import { getMany, query, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await initDatabase();
        const stages = await getMany('SELECT * FROM pipeline_stages WHERE is_active = true ORDER BY sort_order');

        // Get opportunities for each stage
        for (const stage of stages) {
            const opps = await getMany(`
        SELECT o.*, c.name as customer_name, u.name as assigned_name
        FROM opportunities o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN users u ON o.assigned_to = u.id
        WHERE o.stage_id = $1 AND o.status = 'open'
        ORDER BY o.created_at DESC
      `, [stage.id]);
            stage.opportunities = opps;
        }

        return NextResponse.json({ stages });
    } catch (error) {
        return NextResponse.json({ stages: [] });
    }
}
