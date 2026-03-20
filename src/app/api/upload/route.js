import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { photo, type } = body;

        if (!photo) {
            return NextResponse.json({ error: 'No photo provided' }, { status: 400 });
        }

        // Must be base64 string
        if (!photo.startsWith('data:image')) {
            return NextResponse.json({ error: 'Invalid photo format' }, { status: 400 });
        }

        // Extract base64 part
        const matches = photo.match(/^data:image\/([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            return NextResponse.json({ error: 'Invalid string format' }, { status: 400 });
        }

        const extension = matches[1] === 'jpeg' ? 'jpg' : matches[1];
        const base64Data = matches[2];
        const buffer = Buffer.from(base64Data, 'base64');

        const uploadDir = path.join(process.cwd(), 'public', 'uploads', 'visits');
        
        // Ensure directory exists
        try {
            await mkdir(uploadDir, { recursive: true });
        } catch (e) {
            if (e.code !== 'EEXIST') throw e;
        }

        const filename = `${user.id}_${Date.now()}_${type || 'photo'}.${extension}`;
        const filePath = path.join(uploadDir, filename);

        await writeFile(filePath, buffer);

        // Return the public URL
        const fileUrl = `/uploads/visits/${filename}`;

        return NextResponse.json({ url: fileUrl });
    } catch (error) {
        console.error('Upload Error:', error);
        return NextResponse.json({ error: 'Failed to upload photo' }, { status: 500 });
    }
}
