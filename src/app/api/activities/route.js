import { NextResponse } from 'next/server';
import { getMany, query } from '@/lib/db';
import { requireRole } from '@/lib/auth';

export const GET = requireRole('admin', 'manager', 'sales')(async (request) => {
    try {
        const { searchParams } = new URL(request.url);
        const customerId = searchParams.get('customer_id');
        const opportunityId = searchParams.get('opportunity_id');
        const userId = searchParams.get('user_id');
        const status = searchParams.get('status');
        const type = searchParams.get('type');
        const querySearch = searchParams.get('query');
        
        // Use current user's role to limit access
        const currentUser = request.user;
        let authFilter = '';
        let authParams = [];
        let paramIndex = 1;
        
        if (currentUser.role === 'sales') {
            authFilter = ` AND a.user_id = $${paramIndex} `;
            authParams.push(currentUser.id);
            paramIndex++;
        }

        let q = `
            SELECT 
                a.*, 
                c.name as customer_name,
                c.company as company_name,
                o.title as opportunity_title,
                u.name as user_name
            FROM activities a
            LEFT JOIN customers c ON a.customer_id = c.id
            LEFT JOIN opportunities o ON a.opportunity_id = o.id
            LEFT JOIN users u ON a.user_id = u.id
            WHERE 1=1 ${authFilter}
        `;
        const params = [...authParams];

        if (customerId) {
            q += ` AND a.customer_id = $${paramIndex}`;
            params.push(customerId);
            paramIndex++;
        }
        if (opportunityId) {
            q += ` AND a.opportunity_id = $${paramIndex}`;
            params.push(opportunityId);
            paramIndex++;
        }
        if (userId) {
            q += ` AND a.user_id = $${paramIndex}`;
            params.push(userId);
            paramIndex++;
        }
        if (status) {
            if (status === 'overdue') {
                q += ` AND a.status = 'pending' AND a.scheduled_at < NOW()`;
            } else if (status !== 'all') {
                q += ` AND a.status = $${paramIndex}`;
                params.push(status);
                paramIndex++;
            }
        }
        if (type) {
            q += ` AND a.type = $${paramIndex}`;
            params.push(type);
            paramIndex++;
        }
        if (querySearch) {
            q += ` AND (a.title ILIKE $${paramIndex} OR a.description ILIKE $${paramIndex})`;
            params.push(`%${querySearch}%`);
            paramIndex++;
        }

        q += ' ORDER BY COALESCE(a.scheduled_at, a.created_at) DESC';

        const activities = await getMany(q, params);
        
        // Get Summary counts
        const statsQuery = `
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN type = 'call' THEN 1 ELSE 0 END) as count_call,
                SUM(CASE WHEN type = 'meeting' THEN 1 ELSE 0 END) as count_meeting,
                SUM(CASE WHEN type = 'email' THEN 1 ELSE 0 END) as count_email,
                SUM(CASE WHEN type = 'visit' THEN 1 ELSE 0 END) as count_visit,
                SUM(CASE WHEN type = 'task' THEN 1 ELSE 0 END) as count_task
            FROM activities a
            WHERE 1=1 ${authFilter}
        `;
        const stats = await getMany(statsQuery, authParams);
        
        return NextResponse.json({
            activities,
            summary: stats[0] || {}
        });
    } catch (error) {
        console.error('Fetch activities error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});

export const POST = requireRole('admin', 'manager', 'sales')(async (request) => {
    try {
        const body = await request.json();
        const {
            type,
            title,
            description,
            customer_id,
            opportunity_id,
            user_id,
            scheduled_at,
            status
        } = body;

        if (!type || !title) {
            return NextResponse.json({ error: 'Type and title are required' }, { status: 400 });
        }

        // Auto assign to current user if not provided
        const assignedUserId = user_id || request.user.id;

        const result = await query(`
            INSERT INTO activities (
                type, title, description, customer_id, opportunity_id, user_id, scheduled_at, status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
            RETURNING *
        `, [
            type,
            title,
            description || null,
            customer_id || null,
            opportunity_id || null,
            assignedUserId,
            scheduled_at || null,
            status || 'pending'
        ]);

        return NextResponse.json(result.rows[0], { status: 201 });
    } catch (error) {
        console.error('Create activity error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
});
