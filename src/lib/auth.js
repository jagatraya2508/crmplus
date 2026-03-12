import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query, getOne } from './db';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const JWT_SECRET = process.env.JWT_SECRET || 'crm-plus-secret-key-2024';
const TOKEN_EXPIRY = '7d';

export async function hashPassword(password) {
    return bcrypt.hash(password, 12);
}

export async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

export function generateToken(user) {
    return jwt.sign(
        { id: user.id, email: user.email, role: user.role, name: user.name },
        JWT_SECRET,
        { expiresIn: TOKEN_EXPIRY }
    );
}

export function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch {
        return null;
    }
}

export async function getCurrentUser() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('token')?.value;
        if (!token) return null;

        const decoded = verifyToken(token);
        if (!decoded) return null;

        const user = await getOne(
            'SELECT id, name, email, role, phone, avatar, is_active FROM users WHERE id = $1',
            [decoded.id]
        );

        return user;
    } catch {
        return null;
    }
}

export async function registerUser({ name, email, password, role = 'sales', phone = '' }) {
    const existing = await getOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) {
        throw new Error('Email sudah terdaftar');
    }

    const hashedPassword = await hashPassword(password);
    const result = await query(
        'INSERT INTO users (name, email, password, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id, name, email, role',
        [name, email, hashedPassword, role, phone]
    );

    return result.rows[0];
}

export async function loginUser(email, password) {
    const user = await getOne('SELECT * FROM users WHERE email = $1', [email]);
    if (!user) {
        throw new Error('Email tidak ditemukan');
    }

    if (!user.is_active) {
        throw new Error('Akun tidak aktif');
    }

    const valid = await comparePassword(password, user.password);
    if (!valid) {
        throw new Error('Password salah');
    }

    const token = generateToken(user);
    return { token, user: { id: user.id, name: user.name, email: user.email, role: user.role } };
}

export function requireRole(...roles) {
    return function(handler) {
        return async function (request, ...args) {
            try {
                const user = await getCurrentUser();
                if (!user) {
                    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
                }
                if (roles.length > 0 && !roles.includes(user.role)) {
                    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
                }
                
                // NextRequest might be frozen, use defineProperty or just catch
                try {
                    Object.defineProperty(request, 'user', { value: user, writable: true });
                } catch (e) {
                    // Ignore if we absolutely cannot set it
                }
                
                return await handler(request, ...args);
            } catch (err) {
                console.error("requireRole middleware error:", err);
                return NextResponse.json({ error: "Internal Server Error in Middleware: " + err.message }, { status: 500 });
            }
        };
    };
}
