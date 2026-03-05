import { NextResponse } from 'next/server';
import { getMany, getOne, query, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET - Admin/Manager: Get latest location of all active sales users
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

        let sql = `
            SELECT DISTINCT ON (ul.user_id)
                ul.user_id,
                ul.latitude,
                ul.longitude,
                ul.accuracy,
                ul.speed,
                ul.heading,
                ul.recorded_at,
                u.name as user_name,
                u.email as user_email,
                u.phone as user_phone,
                u.avatar as user_avatar,
                u.role as user_role
            FROM user_locations ul
            JOIN users u ON ul.user_id = u.id
            WHERE u.is_active = true
              AND u.role = 'sales'
              AND ul.recorded_at > NOW() - INTERVAL '24 hours'
        `;
        const params = [];
        let idx = 1;

        if (userId) {
            sql += ` AND ul.user_id = $${idx}`;
            params.push(parseInt(userId));
            idx++;
        }

        sql += ` ORDER BY ul.user_id, ul.recorded_at DESC`;

        const locations = await getMany(sql, params);

        // Add online status based on how recent the location is
        const now = new Date();
        const enriched = locations.map(loc => {
            const diff = (now - new Date(loc.recorded_at)) / 1000; // seconds
            let status = 'offline';
            if (diff < 60) status = 'online';
            else if (diff < 300) status = 'idle';
            return { ...loc, status, seconds_ago: Math.floor(diff) };
        });

        return NextResponse.json({ locations: enriched });
    } catch (error) {
        console.error('Tracking GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// POST - Sales: Send current GPS location
export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await initDatabase();

        const body = await request.json();
        const { latitude, longitude, accuracy, speed, heading } = body;

        if (!latitude || !longitude) {
            return NextResponse.json({ error: 'Latitude dan longitude diperlukan' }, { status: 400 });
        }

        await query(
            `INSERT INTO user_locations (user_id, latitude, longitude, accuracy, speed, heading, recorded_at)
             VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
            [user.id, latitude, longitude, accuracy || null, speed || null, heading || null]
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Tracking POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
