import { NextResponse } from 'next/server';
import { getMany, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

// GET all settings
export async function GET() {
    try {
        const settingsList = await getMany('SELECT * FROM settings');

        // Convert array of {key, value} to an object {key: value}
        const settings = {};
        for (const item of settingsList) {
            settings[item.key] = item.value;
        }

        return NextResponse.json(settings);
    } catch (error) {
        console.error('Error fetching settings:', error);
        return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
    }
}

// POST or update a setting
export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized. Admin only.' }, { status: 403 });
        }

        const body = await request.json();
        const { key, value } = body;

        if (!key) {
            return NextResponse.json({ error: 'Setting key is required' }, { status: 400 });
        }

        // Upsert setting
        await query(`
            INSERT INTO settings (key, value, updated_at) 
            VALUES ($1, $2, NOW()) 
            ON CONFLICT (key) DO UPDATE 
            SET value = EXCLUDED.value, updated_at = NOW()
        `, [key, value]);

        return NextResponse.json({ success: true, key, value });
    } catch (error) {
        console.error('Error updating setting:', error);
        return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 });
    }
}
