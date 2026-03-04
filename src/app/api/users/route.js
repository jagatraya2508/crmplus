import { NextResponse } from 'next/server';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { query, getMany, getOne } from '@/lib/db';

// GET /api/users - List all users (admin only)
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const users = await getMany(
            `SELECT id, name, email, role, phone, is_active, created_at, updated_at 
             FROM users ORDER BY created_at DESC`
        );

        return NextResponse.json({ users });
    } catch (error) {
        console.error('Error fetching users:', error);
        return NextResponse.json({ error: 'Gagal mengambil data user' }, { status: 500 });
    }
}

// POST /api/users - Create a new user (admin only)
export async function POST(request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { name, email, password, role, phone } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Nama, email, dan password wajib diisi' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
        }

        const validRoles = ['admin', 'manager', 'sales'];
        if (role && !validRoles.includes(role)) {
            return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 });
        }

        // Check if email already exists
        const existing = await getOne('SELECT id FROM users WHERE email = $1', [email]);
        if (existing) {
            return NextResponse.json({ error: 'Email sudah terdaftar' }, { status: 400 });
        }

        const hashedPassword = await hashPassword(password);
        const result = await query(
            `INSERT INTO users (name, email, password, role, phone) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, name, email, role, phone, is_active, created_at`,
            [name, email, hashedPassword, role || 'sales', phone || '']
        );

        return NextResponse.json({ user: result.rows[0] }, { status: 201 });
    } catch (error) {
        console.error('Error creating user:', error);
        return NextResponse.json({ error: 'Gagal membuat user' }, { status: 500 });
    }
}
