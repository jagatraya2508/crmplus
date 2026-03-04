import { NextResponse } from 'next/server';
import { getCurrentUser, hashPassword } from '@/lib/auth';
import { query, getOne } from '@/lib/db';

// PUT /api/users/[id] - Update user (admin only)
export async function PUT(request, { params }) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const { name, email, role, phone, is_active, password } = await request.json();

        // Check user exists
        const existing = await getOne('SELECT id FROM users WHERE id = $1', [id]);
        if (!existing) {
            return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
        }

        // Check email uniqueness if email changed
        if (email) {
            const emailCheck = await getOne('SELECT id FROM users WHERE email = $1 AND id != $2', [email, id]);
            if (emailCheck) {
                return NextResponse.json({ error: 'Email sudah digunakan user lain' }, { status: 400 });
            }
        }

        // Build update query dynamically
        const updates = [];
        const values = [];
        let paramIndex = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramIndex++}`);
            values.push(name);
        }
        if (email !== undefined) {
            updates.push(`email = $${paramIndex++}`);
            values.push(email);
        }
        if (role !== undefined) {
            const validRoles = ['admin', 'manager', 'sales'];
            if (!validRoles.includes(role)) {
                return NextResponse.json({ error: 'Role tidak valid' }, { status: 400 });
            }
            updates.push(`role = $${paramIndex++}`);
            values.push(role);
        }
        if (phone !== undefined) {
            updates.push(`phone = $${paramIndex++}`);
            values.push(phone);
        }
        if (is_active !== undefined) {
            updates.push(`is_active = $${paramIndex++}`);
            values.push(is_active);
        }
        if (password) {
            if (password.length < 6) {
                return NextResponse.json({ error: 'Password minimal 6 karakter' }, { status: 400 });
            }
            const hashedPassword = await hashPassword(password);
            updates.push(`password = $${paramIndex++}`);
            values.push(hashedPassword);
        }

        if (updates.length === 0) {
            return NextResponse.json({ error: 'Tidak ada data yang diubah' }, { status: 400 });
        }

        updates.push(`updated_at = NOW()`);
        values.push(id);

        const result = await query(
            `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIndex}
             RETURNING id, name, email, role, phone, is_active, created_at, updated_at`,
            values
        );

        return NextResponse.json({ user: result.rows[0] });
    } catch (error) {
        console.error('Error updating user:', error);
        return NextResponse.json({ error: 'Gagal mengupdate user' }, { status: 500 });
    }
}

// DELETE /api/users/[id] - Delete user (admin only)
// Use ?permanent=true for hard delete, otherwise soft delete
export async function DELETE(request, { params }) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser || currentUser.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const { id } = await params;
        const { searchParams } = new URL(request.url);
        const permanent = searchParams.get('permanent') === 'true';

        // Prevent self-deletion
        if (parseInt(id) === currentUser.id) {
            return NextResponse.json({ error: 'Tidak bisa menghapus akun sendiri' }, { status: 400 });
        }

        const existing = await getOne('SELECT id, name FROM users WHERE id = $1', [id]);
        if (!existing) {
            return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
        }

        if (permanent) {
            // Hard delete - permanently remove user from database
            await query('DELETE FROM users WHERE id = $1', [id]);
            return NextResponse.json({ success: true, message: `User "${existing.name}" berhasil dihapus permanen` });
        } else {
            // Soft delete - just deactivate
            await query('UPDATE users SET is_active = false, updated_at = NOW() WHERE id = $1', [id]);
            return NextResponse.json({ success: true, message: 'User berhasil dinonaktifkan' });
        }
    } catch (error) {
        console.error('Error deleting user:', error);
        return NextResponse.json({ error: 'Gagal menghapus user' }, { status: 500 });
    }
}
