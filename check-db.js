process.env.DB_PASSWORD = 'sa';
import { getMany, query } from './src/lib/db.js';

async function check() {
  try {
    const settings = await getMany("SELECT * FROM settings WHERE key LIKE 'smtp_%'");
    console.log("SMTP Settings in DB:");
    console.log(settings);

    // Also check last activity to see if any was inserted successfully
    const activities = await getMany("SELECT * FROM activities ORDER BY id DESC LIMIT 5");
    console.log("\nLast 5 activities:");
    console.log(activities);
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

check();
