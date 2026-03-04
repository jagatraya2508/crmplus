import { NextResponse } from 'next/server';
import { registerUser, generateToken } from '@/lib/auth';
import { initDatabase } from '@/lib/db';

export async function POST(request) {
    try {
        // Ensure database tables exist
        await initDatabase();

        const { name, email, password, role, phone } = await request.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: 'Nama, email, dan password wajib diisi' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
        }

        const user = await registerUser({ name, email, password, role: 'admin', phone: phone || '' });
        const token = generateToken(user);

        const response = NextResponse.json({ success: true, user });
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60,
            path: '/',
        });

        return response;
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
}
