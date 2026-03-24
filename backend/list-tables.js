const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgresql://postgres:u%2BZL89%2F%23ZkzRL%3Fg@db.uhrpvpzswubseufmkoym.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
});
async function list() {
    try {
        const r1 = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'");
        console.log('Tables:', r1.rows.map(row => row.table_name));

        const r2 = await pool.query("SELECT column_name, is_nullable, data_type FROM information_schema.columns WHERE table_name = 'FeeBalance'");
        console.log('FeeBalance Columns:', JSON.stringify(r2.rows, null, 2));

        const r3 = await pool.query("SELECT * FROM \"FeeStructure\" LIMIT 1");
        console.log('FeeStructure Sample:', JSON.stringify(r3.rows, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await pool.end();
    }
}
list();
