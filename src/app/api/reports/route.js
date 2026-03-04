import { NextResponse } from 'next/server';
import { getMany, getOne, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        await initDatabase();

        const totalRevenue = await getOne("SELECT COALESCE(SUM(total), 0) as total FROM orders WHERE status IN ('approved', 'completed')");
        const totalOrders = await getOne("SELECT COUNT(*)::int as count FROM orders");
        const totalVisits = await getOne("SELECT COUNT(*)::int as count FROM visits");
        const totalCustomers = await getOne("SELECT COUNT(*)::int as count FROM customers");

        const topCustomers = await getMany(`
      SELECT c.name, COUNT(o.id)::int as order_count, COALESCE(SUM(o.total), 0) as total_value
      FROM orders o JOIN customers c ON o.customer_id = c.id
      GROUP BY c.id, c.name ORDER BY total_value DESC LIMIT 10
    `);

        const visitsBySales = await getMany(`
      SELECT u.name, COUNT(v.id)::int as visit_count
      FROM visits v JOIN users u ON v.user_id = u.id
      GROUP BY u.id, u.name ORDER BY visit_count DESC
    `);

        const ordersByStatus = await getMany(`
      SELECT status, COUNT(*)::int as count, COALESCE(SUM(total), 0) as total_value
      FROM orders GROUP BY status ORDER BY count DESC
    `);

        const customersByCategory = await getMany(`
      SELECT category, COUNT(*)::int as count FROM customers GROUP BY category ORDER BY count DESC
    `);

        return NextResponse.json({
            summary: {
                totalRevenue: totalRevenue?.total || 0,
                totalOrders: totalOrders?.count || 0,
                totalVisits: totalVisits?.count || 0,
                totalCustomers: totalCustomers?.count || 0,
            },
            topCustomers, visitsBySales, ordersByStatus, customersByCategory,
        });
    } catch (error) {
        console.error('Reports error:', error);
        return NextResponse.json({ summary: {}, topCustomers: [], visitsBySales: [], ordersByStatus: [], customersByCategory: [] });
    }
}
