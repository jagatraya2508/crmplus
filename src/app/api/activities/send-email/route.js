import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { getMany, query } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request) {
    try {
        console.log('[SEND-EMAIL] === START ===');
        
        const user = await getCurrentUser();
        if (!user) {
            console.log('[SEND-EMAIL] ERROR: User not authenticated');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        console.log('[SEND-EMAIL] User:', user.id, user.name);

        const formData = await request.formData();
        const type = formData.get('type');
        const title = formData.get('title');
        const description = formData.get('description');
        let customer_id = formData.get('customer_id');
        if (customer_id === 'null' || customer_id === 'undefined' || customer_id === '' || !customer_id) {
            customer_id = null;
        }
        const scheduled_at = formData.get('scheduled_at');
        
        const email_to = formData.get('email_to');
        const email_subject = formData.get('email_subject');
        const email_body = formData.get('email_body');
        const attachment = formData.get('attachment');

        console.log('[SEND-EMAIL] Form data:', { type, title, email_to, email_subject, customer_id, scheduled_at });
        console.log('[SEND-EMAIL] Email body length:', email_body?.length || 0);
        console.log('[SEND-EMAIL] Attachment:', attachment ? `${attachment.name} (${attachment.size} bytes)` : 'none');

        // Validate required email fields
        if (!email_to) {
            return NextResponse.json({ error: 'Alamat email tujuan (email_to) harus diisi.' }, { status: 400 });
        }
        if (!email_subject) {
            return NextResponse.json({ error: 'Subjek email harus diisi.' }, { status: 400 });
        }

        // Fetch SMTP Settings
        console.log('[SEND-EMAIL] Fetching SMTP settings...');
        const settingsList = await getMany("SELECT * FROM settings WHERE key LIKE 'smtp_%'");
        const settings = {};
        settingsList.forEach(s => settings[s.key] = s.value);
        console.log('[SEND-EMAIL] SMTP settings found:', Object.keys(settings).join(', '));

        if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_pass) {
            console.log('[SEND-EMAIL] ERROR: Incomplete SMTP config');
            return NextResponse.json({ error: 'Konfigurasi SMTP belum lengkap. Silakan atur di Pengaturan.' }, { status: 400 });
        }

        const smtpPort = parseInt(settings.smtp_port) || 587;
        const isSecure = smtpPort === 465;
        console.log('[SEND-EMAIL] SMTP:', settings.smtp_host, 'port:', smtpPort, 'secure:', isSecure);

        // Setup Transporter
        const transporter = nodemailer.createTransport({
            host: settings.smtp_host.trim(),
            port: smtpPort,
            secure: isSecure,
            auth: {
                user: settings.smtp_user.trim(),
                pass: settings.smtp_pass,
            },
            tls: {
                rejectUnauthorized: false
            },
            connectionTimeout: 15000,
            greetingTimeout: 15000,
            socketTimeout: 30000,
        });

        // Prepare Mail Options
        const mailOptions = {
            from: settings.smtp_from || settings.smtp_user,
            to: email_to,
            subject: email_subject,
            text: email_body || '',
        };

        if (attachment && typeof attachment === 'object' && attachment.size > 0 && attachment.arrayBuffer) {
            const bytes = await attachment.arrayBuffer();
            const buffer = Buffer.from(bytes);
            mailOptions.attachments = [
                {
                    filename: attachment.name,
                    content: buffer,
                }
            ];
            console.log('[SEND-EMAIL] Attachment added:', attachment.name);
        }

        // Send Email
        console.log('[SEND-EMAIL] Sending email to:', email_to);
        const info = await transporter.sendMail(mailOptions);
        console.log('[SEND-EMAIL] Email sent! Message ID:', info.messageId);

        // Save Activity
        console.log('[SEND-EMAIL] Saving activity to database...');
        const result = await query(`
            INSERT INTO activities (
                type, title, description, customer_id, user_id, scheduled_at, status, completed_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
            RETURNING *
        `, [
            type || 'email',
            title || email_subject,
            description || email_body || null,
            customer_id ? parseInt(customer_id) : null,
            user.id,
            scheduled_at || new Date().toISOString(),
            'completed' 
        ]);
        console.log('[SEND-EMAIL] Activity saved, id:', result.rows[0]?.id);

        return NextResponse.json({ success: true, activity: result.rows[0] });

    } catch (error) {
        console.error('[SEND-EMAIL] FULL ERROR:', error);
        console.error('[SEND-EMAIL] Error code:', error.code);
        console.error('[SEND-EMAIL] Error message:', error.message);
        let errorMsg = error.message;
        if (error.code === 'EAUTH') errorMsg = 'Autentikasi SMTP gagal. Periksa username/password.';
        if (error.code === 'ESOCKET') errorMsg = 'Gagal terhubung ke host SMTP. Periksa host/port.';
        if (error.code === 'ECONNECTION') errorMsg = 'Koneksi ke server SMTP gagal. Periksa jaringan/firewall.';
        if (error.code === 'ETIMEDOUT') errorMsg = 'Koneksi ke server SMTP timeout.';
        
        return NextResponse.json({ error: errorMsg }, { status: 500 });
    }
}
