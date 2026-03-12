import { NextResponse } from 'next/server';
import { getOne, query as logQuery } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const GET = requireRole('admin', 'manager', 'sales')(async (request, context) => {
    try {
        // Await context.params
        const resolvedParams = await context.params;
        const id = resolvedParams.id;
        
        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const activity = await getOne(`
            SELECT a.*, c.name as customer_name, o.title as opportunity_title, u.name as user_name
            FROM activities a
            LEFT JOIN customers c ON a.customer_id = c.id
            LEFT JOIN opportunities o ON a.opportunity_id = o.id
            LEFT JOIN users u ON a.user_id = u.id
            WHERE a.id = $1
        `, [id]);

        if (!activity) {
            return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
        }

        return NextResponse.json(activity);
    } catch (error) {
        console.error('Fetch activity error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

export const PUT = requireRole('admin', 'manager', 'sales')(async (request, context) => {
    try {
        // Await context.params
        const resolvedParams = await context.params;
        const id = resolvedParams.id;
        
        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const body = await request.json();
        
        // Build dynamic update query
        const updates = [];
        const values = [];
        let paramIndex = 1;

        const allowedFields = ['type', 'title', 'description', 'customer_id', 'opportunity_id', 'user_id', 'scheduled_at', 'status', 'completed_at'];
        
        for (const [key, value] of Object.entries(body)) {
            if (allowedFields.includes(key)) {
                updates.push(`${key} = $${paramIndex}`);
                values.push(value);
                paramIndex++;
            }
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
        }

        values.push(id);
        const updateQuery = `
            UPDATE activities 
            SET ${updates.join(', ')} 
            WHERE id = $${paramIndex}
            RETURNING *
        `;

        const result = await logQuery(updateQuery, values);
        
        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
        }

        return NextResponse.json(result.rows[0]);
    } catch (error) {
        console.error('Update activity error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

export const DELETE = requireRole('admin', 'manager', 'sales')(async (request, context) => {
    try {
        const resolvedParams = await context.params;
        const id = resolvedParams.id;
        
        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        const result = await logQuery('DELETE FROM activities WHERE id = $1 RETURNING id', [id]);
        
        if (result.rowCount === 0) {
            return NextResponse.json({ error: 'Activity not found' }, { status: 404 });
        }

        return NextResponse.json({ success: true, message: 'Activity deleted' });
    } catch (error) {
        console.error('Delete activity error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
