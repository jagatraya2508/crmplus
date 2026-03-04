import { NextResponse } from 'next/server';
import { getMany, getOne, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await initDatabase();

        const totalCustomers = await getOne('SELECT COUNT(*)::int as count FROM customers');
        const activeDeals = await getOne("SELECT COUNT(*)::int as count FROM opportunities WHERE status = 'open'");
        const monthOrders = await getOne(`
      SELECT COUNT(*)::int as count FROM orders 
      WHERE created_at >= date_trunc('month', NOW())
    `);
        const todayVisits = await getOne(`
      SELECT COUNT(*)::int as count FROM visits 
      WHERE checkin_time::date = CURRENT_DATE
    `);

        const recentActivities = await getMany(`
      SELECT a.*, c.name as customer_name 
      FROM activities a 
      LEFT JOIN customers c ON a.customer_id = c.id 
      ORDER BY a.created_at DESC 
      LIMIT 10
    `);

        return NextResponse.json({
            stats: {
                totalCustomers: totalCustomers?.count || 0,
                activeDeals: activeDeals?.count || 0,
                monthOrders: monthOrders?.count || 0,
                todayVisits: todayVisits?.count || 0,
            },
            recentActivities,
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        return NextResponse.json({ stats: { totalCustomers: 0, activeDeals: 0, monthOrders: 0, todayVisits: 0 }, recentActivities: [] });
    }
}
