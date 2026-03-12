const { Pool } = require('pg');

async function check() {
    const pool = new Pool({
        host: 'localhost', port: 5432, database: 'crmplus',
        user: 'postgres', password: 'sa'
    });

    const r = await pool.query("SELECT * FROM settings WHERE key LIKE 'smtp_%'");
    console.log('Found', r.rows.length, 'SMTP settings');
    r.rows.forEach(row => {
        if (row.key === 'smtp_pass') {
            console.log('  ', row.key, '=', row.value ? `(set, length=${row.value.length})` : '(EMPTY)');
        } else {
            console.log('  ', row.key, '=', JSON.stringify(row.value));
        }
    });

    // Now try nodemailer verify
    try {
        const nodemailer = require('nodemailer');
        const s = {};
        r.rows.forEach(x => s[x.key] = x.value);
        
        const port = parseInt(s.smtp_port) || 587;
        console.log('\nTrying SMTP connection to', s.smtp_host, 'port', port, 'secure:', port === 465);
        
        const transporter = nodemailer.createTransport({
            host: s.smtp_host.trim(),
            port: port,
            secure: port === 465,
            auth: { user: s.smtp_user.trim(), pass: s.smtp_pass },
            tls: { rejectUnauthorized: false },
            connectionTimeout: 10000,
            greetingTimeout: 10000,
        });

        await transporter.verify();
        console.log('SMTP VERIFY: SUCCESS');

        // Try sending a test email
        const info = await transporter.sendMail({
            from: s.smtp_from || s.smtp_user,
            to: s.smtp_user,
            subject: 'CRM Plus Test - ' + new Date().toISOString(),
            text: 'Test email dari CRM Plus diagnostic script.',
        });
        console.log('SEND TEST EMAIL: SUCCESS. MessageId:', info.messageId);
    } catch (err) {
        console.log('ERROR:', err.code, '-', err.message);
        if (err.responseCode) console.log('SMTP Response Code:', err.responseCode);
    }

    await pool.end();
}
check();
