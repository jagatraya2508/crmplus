import { NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import path from 'path';

export async function GET(request, { params }) {
    try {
        const { path: pathSegments } = await params;
        const filePath = path.join(process.cwd(), 'public', 'uploads', ...pathSegments);

        // Security: prevent directory traversal
        const resolvedPath = path.resolve(filePath);
        const uploadsDir = path.resolve(path.join(process.cwd(), 'public', 'uploads'));
        if (!resolvedPath.startsWith(uploadsDir)) {
            return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
        }

        const file = await readFile(resolvedPath);

        // Determine content type from extension
        const ext = path.extname(resolvedPath).toLowerCase();
        const contentTypes = {
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png',
            '.gif': 'image/gif',
            '.webp': 'image/webp',
        };
        const contentType = contentTypes[ext] || 'application/octet-stream';

        return new NextResponse(file, {
            headers: {
                'Content-Type': contentType,
                'Cache-Control': 'public, max-age=31536000, immutable',
            },
        });
    } catch (error) {
        console.error('File serve error:', error);
        return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }
}
