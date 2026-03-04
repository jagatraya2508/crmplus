import { NextResponse } from 'next/server';
import { loginUser } from '@/lib/auth';

export async function POST(request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: 'Email dan password wajib diisi' }, { status: 400 });
        }

        const { token, user } = await loginUser(email, password);

        const response = NextResponse.json({ success: true, user });
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 7 * 24 * 60 * 60, // 7 days
            path: '/',
        });

        return response;
    } catch (error) {
        return NextResponse.json({ error: error.message }, { status: 401 });
    }
}
