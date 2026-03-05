import { NextResponse } from 'next/server';
import { getMany, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET - Admin/Manager: Get location history for a specific user on a specific date
export async function GET(request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        if (user.role !== 'admin' && user.role !== 'manager') {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        await initDatabase();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('user_id');
        const date = searchParams.get('date') || new Date().toISOString().split('T')[0];

        if (!userId) {
            return NextResponse.json({ error: 'user_id diperlukan' }, { status: 400 });
        }

        const history = await getMany(
            `SELECT latitude, longitude, accuracy, speed, heading, recorded_at
             FROM user_locations
             WHERE user_id = $1 AND recorded_at::date = $2
             ORDER BY recorded_at ASC`,
            [parseInt(userId), date]
        );

        return NextResponse.json({ history, user_id: parseInt(userId), date });
    } catch (error) {
        console.error('Tracking history GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
