import { NextResponse } from 'next/server';
import { getMany, getOne, query, initDatabase } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function GET(request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        await initDatabase();

        const { searchParams } = new URL(request.url);
        const search = searchParams.get('search') || '';
        const category = searchParams.get('category') || '';
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');
        const offset = (page - 1) * limit;

        let where = [];
        let params = [];
        let idx = 1;

        if (user.role === 'sales') {
            where.push(`c.assigned_to = $${idx}`);
            params.push(user.id);
            idx++;
        }

        if (search) {
            where.push(`(c.name ILIKE $${idx} OR c.company ILIKE $${idx} OR c.email ILIKE $${idx} OR c.phone ILIKE $${idx} OR c.customer_code ILIKE $${idx})`);
            params.push(`%${search}%`);
            idx++;
        }
        if (category) {
            where.push(`c.category = $${idx}`);
            params.push(category);
            idx++;
        }

        const whereClause = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

        const countResult = await getOne(`SELECT COUNT(*)::int as count FROM customers c ${whereClause}`, params);

        params.push(limit, offset);
        const customers = await getMany(`
      SELECT c.*, u.name as assigned_name 
      FROM customers c 
      LEFT JOIN users u ON c.assigned_to = u.id 
      ${whereClause}
      ORDER BY c.created_at DESC 
      LIMIT $${idx} OFFSET $${idx + 1}
    `, params);

        return NextResponse.json({
            customers,
            total: countResult?.count || 0,
            page,
            totalPages: Math.ceil((countResult?.count || 0) / limit),
        });
    } catch (error) {
        console.error('Customers GET error:', error);
        return NextResponse.json({ customers: [], total: 0, page: 1, totalPages: 0 });
    }
}

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { name, company, email, phone, address, city, province, postal_code, latitude, longitude, category, notes, assigned_to, customer_code, lead_id } = body;

        if (!name) return NextResponse.json({ error: 'Nama pelanggan wajib diisi' }, { status: 400 });

        let finalCustomerCode = (customer_code && customer_code.trim()) ? customer_code.trim() : null;

        if (!finalCustomerCode) {
            // Generate customer_code berdasarkan nomor urut tertinggi di database
            const maxResult = await getOne(`
                SELECT MAX(CAST(SUBSTRING(customer_code FROM 'CUST-([0-9]+)') AS INTEGER)) as max_num
                FROM customers 
                WHERE customer_code ~ '^CUST-[0-9]+'
            `);

            let nextNum = (maxResult && maxResult.max_num) ? maxResult.max_num + 1 : 1;

            // Cari kode yang belum terpakai (loop untuk menghindari konflik)
            let generatedCode = null;
            for (let attempt = 0; attempt < 10; attempt++) {
                const candidateCode = `CUST-${String(nextNum + attempt).padStart(4, '0')}`;
                const existing = await getOne('SELECT id FROM customers WHERE customer_code = $1', [candidateCode]);
                if (!existing) {
                    generatedCode = candidateCode;
                    break;
                }
            }

            // Fallback: gunakan timestamp jika semua kode konflik
            if (!generatedCode) {
                generatedCode = `CUST-${Date.now().toString(36).toUpperCase()}`;
            }

            const result = await query(`
                INSERT INTO customers (name, company, email, phone, address, city, province, postal_code, latitude, longitude, category, notes, assigned_to, created_by, lead_id, customer_code)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                RETURNING *
            `, [name, company || null, email || null, phone || null, address || null, city || null, province || null, postal_code || null, latitude || null, longitude || null, category || 'prospect', notes || null, assigned_to || user.id, user.id, lead_id || null, generatedCode]);

            // Update lead status to 'converted' jika ada lead_id
            if (lead_id) {
                await query('UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2', ['converted', lead_id]);
            }

            return NextResponse.json({ customer: result.rows[0] }, { status: 201 });
        } else {
            // Customer code sudah ada (dari leads) — cek dulu apakah sudah terpakai
            const existingCode = await getOne('SELECT id FROM customers WHERE customer_code = $1', [finalCustomerCode]);
            if (existingCode) {
                // Tambahkan suffix unik agar tidak konflik
                finalCustomerCode = `${finalCustomerCode}-${Date.now().toString(36)}`;
            }

            const result = await query(`
                INSERT INTO customers (name, company, email, phone, address, city, province, postal_code, latitude, longitude, category, notes, assigned_to, created_by, lead_id, customer_code)
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
                RETURNING *
            `, [name, company || null, email || null, phone || null, address || null, city || null, province || null, postal_code || null, latitude || null, longitude || null, category || 'prospect', notes || null, assigned_to || user.id, user.id, lead_id || null, finalCustomerCode]);

            // Update lead status to 'converted' jika ada lead_id
            if (lead_id) {
                await query('UPDATE leads SET status = $1, updated_at = NOW() WHERE id = $2', ['converted', lead_id]);
            }

            return NextResponse.json({ customer: result.rows[0] }, { status: 201 });
        }
    } catch (error) {
        console.error('Customers POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
