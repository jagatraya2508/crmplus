const { Pool } = require('pg');
const nodemailer = require('nodemailer');

async function test() {
    const pool = new Pool({
        host: 'localhost', port: 5432, database: 'crmplus',
        user: 'postgres', password: 'sa'
    });

    const r = await pool.query("SELECT * FROM settings WHERE key LIKE 'smtp_%'");
    const s = {};
    r.rows.forEach(x => s[x.key] = x.value);
    
    const port = parseInt(s.smtp_port) || 587;
    
    const transporter = nodemailer.createTransport({
        host: s.smtp_host.trim(),
        port: port,
        secure: port === 465,
        auth: { user: s.smtp_user.trim(), pass: s.smtp_pass },
        tls: { rejectUnauthorized: false },
        debug: true,     // Enable debug output
        logger: true,    // Log to console
    });

    console.log('=== Verifying SMTP connection ===');
    await transporter.verify();
    console.log('=== VERIFIED OK ===\n');

    // Send to the same test address the user is trying
    const testTo = 'test@ikalus-167jkt.com';
    console.log('=== Sending test email to:', testTo, '===');
    
    const info = await transporter.sendMail({
        from: s.smtp_from || s.smtp_user,
        to: testTo,
        subject: 'CRM Plus Test - ' + new Date().toLocaleString(),
        text: 'Ini email test dari CRM Plus.\n\nJika email ini diterima, berarti SMTP berfungsi dengan baik.',
        html: '<h2>CRM Plus Test</h2><p>Ini email test dari CRM Plus.</p><p>Jika email ini diterima, berarti SMTP berfungsi dengan baik.</p>',
    });

    console.log('\n=== SEND RESULT ===');
    console.log('Message ID:', info.messageId);
    console.log('Response:', info.response);
    console.log('Accepted:', info.accepted);
    console.log('Rejected:', info.rejected);
    console.log('Pending:', info.pending);
    console.log('Envelope:', info.envelope);
    
    await pool.end();
    console.log('\nDone! Check inbox AND spam folder of:', testTo);
}

test().catch(err => {
    console.error('FATAL ERROR:', err);
    process.exit(1);
});
