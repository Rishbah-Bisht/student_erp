const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgresql://postgres:u%2BZL89%2F%23ZkzRL%3Fg@db.uhrpvpzswubseufmkoym.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
});
async function find() {
    try {
        const r = await pool.query('SELECT id FROM "Batch" LIMIT 1');
        console.log(JSON.stringify(r.rows));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
find();
