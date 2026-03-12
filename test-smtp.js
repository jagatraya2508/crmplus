const { Pool } = require('pg');
const nodemailer = require('nodemailer');

async function testSmtp() {
    const pool = new Pool({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'crmplus',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
    });

    console.log('=== Step 1: Checking SMTP settings in database ===');
    try {
        const result = await pool.query("SELECT * FROM settings WHERE key LIKE 'smtp_%'");
        console.log('SMTP settings found:', result.rows.length);
        result.rows.forEach(row => {
            const displayValue = row.key === 'smtp_pass' ? '***hidden***' : row.value;
            console.log(`  ${row.key} = "${displayValue}"`);
        });

        if (result.rows.length === 0) {
            console.log('\n❌ TIDAK ADA setting SMTP di database! Anda harus mengatur SMTP di halaman Pengaturan.');
            await pool.end();
            return;
        }

        const settings = {};
        result.rows.forEach(s => settings[s.key] = s.value);

        if (!settings.smtp_host || !settings.smtp_user || !settings.smtp_pass) {
            console.log('\n❌ Setting SMTP tidak lengkap! Host, User, dan Password harus diisi.');
            console.log('  smtp_host:', settings.smtp_host || '(kosong)');
            console.log('  smtp_user:', settings.smtp_user || '(kosong)');
            console.log('  smtp_pass:', settings.smtp_pass ? '(ada)' : '(kosong)');
            await pool.end();
            return;
        }

        console.log('\n=== Step 2: Testing SMTP Connection ===');
        const smtpPort = parseInt(settings.smtp_port) || 587;
        const isSecure = smtpPort === 465;
        console.log(`  Host: ${settings.smtp_host}`);
        console.log(`  Port: ${smtpPort}`);
        console.log(`  Secure: ${isSecure}`);
        console.log(`  User: ${settings.smtp_user}`);

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
            }
        });

        console.log('  Verifying connection...');
        await transporter.verify();
        console.log('✅ SMTP connection verified successfully!');

        console.log('\n=== Step 3: Sending test email ===');
        const info = await transporter.sendMail({
            from: settings.smtp_from || settings.smtp_user,
            to: settings.smtp_user, // Send to self for testing
            subject: 'CRM Plus - Test Email',
            text: 'Ini adalah email test dari CRM Plus. Jika Anda menerima email ini, konfigurasi SMTP berhasil!',
        });
        console.log('✅ Test email sent! Message ID:', info.messageId);

    } catch (error) {
        console.error('\n❌ ERROR:', error.message);
        if (error.code === 'EAUTH') {
            console.error('   → Autentikasi gagal. Periksa username dan password SMTP.');
            console.error('   → Untuk Gmail, gunakan App Password, bukan password biasa.');
        }
        if (error.code === 'ESOCKET' || error.code === 'ECONNREFUSED') {
            console.error('   → Gagal terhubung ke server SMTP. Periksa host dan port.');
        }
        if (error.code === 'ECONNECTION') {
            console.error('   → Koneksi ke server SMTP gagal. Periksa firewall atau jaringan.');
        }
    } finally {
        await pool.end();
    }
}

testSmtp();
