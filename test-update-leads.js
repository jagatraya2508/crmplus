require('dotenv').config({ path: '.env.local' });
const { query } = require('./src/lib/db.js');

async function updateLeads() {
    try {
        const res = await query("UPDATE leads SET status='converted' WHERE id IN (SELECT lead_id FROM customers WHERE lead_id IS NOT NULL)");
        console.log(res.rowCount + ' leads updated');
    } catch (e) {
        console.error(e);
    } finally {
        process.exit(0);
    }
}

updateLeads();
