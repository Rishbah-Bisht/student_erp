const { Pool } = require('pg');
require('dotenv').config();

// Use direct connection for local seeding since pooler is not needed locally
const pool = new Pool({
    connectionString: "postgresql://postgres:u%2BZL89%2F%23ZkzRL%3Fg@db.uhrpvpzswubseufmkoym.supabase.co:5432/postgres",
    ssl: { rejectUnauthorized: false }
});

const studentId = '69c14127368af9612ff37381'; // Rishabh Bisht

async function seed() {
    try {
        console.log('Seeding data for studentId:', studentId);

        // 1. Clear existing data
        await pool.query('DELETE FROM "FeePayment" WHERE "studentId" = $1', [studentId]);
        await pool.query('DELETE FROM "FeeBalance" WHERE "studentId" = $1', [studentId]);
        console.log('Cleared existing records.');

        // 2. Insert FeeBalance
        // Fields from schema: id, studentId, batchId, currentBalance, overdueAmount, status, lastChargedMonth, dueDate, etc.
        const balanceId = 'seeded-bal-' + Date.now();
        const batchId = 'cm8h1sqt80004v037m865s8g3'; // Found from FeeStructure
        await pool.query(`
            INSERT INTO "FeeBalance" (
                id, "studentId", "batchId", "currentBalance", "overdueAmount", 
                status, "lastChargedMonth", "totalCharged", "totalPaid", "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
        `, [
            balanceId, studentId, batchId, 1500.00, 0.00, 
            'PENDING', '2026-04', 3000.00, 1500.00
        ]);
        console.log('Inserted FeeBalance.');

        // 3. Insert FeePayment
        // Fields from schema: id, studentId, batchId, feeBalanceId, amount, billingMonth, paymentDate, paymentMethod, receiptNumber, etc.
        const paymentId = 'seeded-pay-' + Date.now();
        await pool.query(`
            INSERT INTO "FeePayment" (
                id, "studentId", "batchId", "feeBalanceId", amount, "billingMonth", "paymentDate", 
                "paymentMethod", "receiptNumber", "studentNameSnapshot", "rollNoSnapshot",
                "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, $4, $5, $6, NOW(), $7, $8, $9, $10, NOW(), NOW())
        `, [
            paymentId, studentId, batchId, balanceId, 1500.00, '2026-03', 
            'ONLINE', 'RCP-SEEDED-001', 'Rishabh Bisht', 'STU2601'
        ]);
        console.log('Inserted FeePayment.');

        console.log('SUCCESS: Live data seeded for your account!');
        console.log('Please refresh the Fee tab on your live site.');

    } catch (err) {
        console.error('SEEDING FAILED:', err);
    } finally {
        await pool.end();
    }
}

seed();
