const db = require('../config/postgres');
const Student = require('../models/Student');
const { sendApiError } = require('../utils/apiError');

// Helper to format months
const getMonthName = (billingMonthStr) => {
    if (!billingMonthStr) return 'Current';
    const parts = billingMonthStr.split('-');
    if (parts.length === 2) {
        const d = new Date(`${billingMonthStr}-02`); // Offset for timezone safety
        return d.toLocaleString('default', { month: 'long' });
    }
    return billingMonthStr;
};

const getYearStr = (billingMonthStr) => {
    if (!billingMonthStr) return new Date().getFullYear();
    return billingMonthStr.split('-')[0];
};

// GET /api/student/fees
exports.getStudentFees = async (req, res) => {
    try {
        const studentId = req.user?.id || req.user?._id; // Handle both id and _id just in case
        
        if (!studentId) {
            console.error('[Fees] No student ID found in request user.');
            return res.status(401).json({ success: false, message: 'Authentication failed: Student ID missing.' });
        }

        // Fetch student from MongoDB
        const student = await Student.findById(studentId)
            .select('name rollNo session')
            .lean();

        if (!student) {
            console.error(`[Fees] Student ${studentId} not found in MongoDB.`);
            return res.status(404).json({ success: false, message: 'Student record not found.' });
        }

        const fees = [];

        // 1. Get FeeBalance (For Pending Dues overview)
        const balanceRes = await db.query(
            'SELECT * FROM "FeeBalance" WHERE "studentId" = $1',
            [String(studentId)] // Ensure it's a string
        );

        if (balanceRes.rows && balanceRes.rows.length > 0) {
            const fb = balanceRes.rows[0];
            const currentBalance = Number(fb.currentBalance) || 0;
            const overdueAmount = Number(fb.overdueAmount) || 0;

            if (currentBalance > 0) {
                let mObj = fb.lastChargedMonth ? fb.lastChargedMonth : `${new Date().getFullYear()}-${new Date().getMonth()+1}`;
                
                fees.push({
                    _id: fb.id,
                    studentId: student,
                    month: getMonthName(mObj),
                    year: getYearStr(mObj),
                    status: overdueAmount > 0 ? 'overdue' : 'pending',
                    totalFee: currentBalance,
                    monthlyTuitionFee: currentBalance - overdueAmount,
                    registrationFee: 0,
                    fine: overdueAmount,
                    otherExpenses: [],
                    amountPaid: 0,
                    pendingAmount: currentBalance,
                    paidDate: null,
                    dueDate: fb.dueDate,
                    paymentHistory: []
                });
            }
        }

        // 2. Get FeePayments (For Breakdown / Invoices)
        const paymentsRes = await db.query(
            'SELECT * FROM "FeePayment" WHERE "studentId" = $1 ORDER BY "paymentDate" DESC',
            [String(studentId)]
        );
        
        paymentsRes.rows.forEach(fp => {
            const amount = Number(fp.amount) || 0;
            if (amount <= 0) return;
            
            fees.push({
                _id: fp.id,
                studentId: student,
                month: getMonthName(fp.billingMonth),
                year: getYearStr(fp.billingMonth),
                status: 'paid',
                totalFee: amount,
                monthlyTuitionFee: amount,
                registrationFee: 0,
                fine: 0,
                otherExpenses: [],
                amountPaid: amount,
                pendingAmount: 0,
                paidDate: fp.paymentDate,
                dueDate: null,
                paymentHistory: [{
                    date: fp.paymentDate,
                    amount: amount,
                    method: fp.paymentMethod,
                    receiptNo: fp.receiptNumber,
                    transactionId: fp.referenceNo || 'N/A'
                }]
            });
        });

        fees.sort((a, b) => {
            if (a.status !== 'paid' && b.status === 'paid') return -1;
            if (a.status === 'paid' && b.status !== 'paid') return 1;
            if (a.paidDate && b.paidDate) return new Date(b.paidDate) - new Date(a.paidDate);
            return 0;
        });

        res.json({ success: true, fees });

    } catch (error) {
        console.error('CRITICAL ERROR in getStudentFees:', error);
        console.error('Stack Trace:', error.stack);
        // Expose real error message in debug response to help identifying cause on Vercel
        const message = process.env.NODE_ENV === 'development' ? error.message : 'Unable to fetch fees right now.';
        res.status(500).json({ 
            success: false, 
            message, 
            debug: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined 
        });
    }
};

// GET /api/student/fees/:id/receipt
exports.getFeeReceipt = async (req, res) => {
    try {
        const paymentId = req.params.id; // from frontend
        const studentId = req.user?.id || req.user?._id;

        if (!studentId) {
             return res.status(401).json({ success: false, message: 'Authentication failed: Student ID missing.' });
        }

        const student = await Student.findById(studentId).lean();
        if (!student) {
             console.error(`[Receipt] Student ${studentId} not found for payment ${paymentId}`);
             return res.status(404).json({ success: false, message: 'Student record not found.' });
        }

        // Verify the payment ID actually belongs to this student
        // Use quotes for studentId column if it's mixed case in SQL
        const pRes = await db.query(
            'SELECT * FROM "FeePayment" WHERE id = $1 AND "studentId" = $2',
            [String(paymentId), String(studentId)]
        );

        if (!pRes.rows || pRes.rows.length === 0) {
            console.warn(`[Receipt] Fee Payment ${paymentId} not found in Postgres for student ${studentId}`);
            return res.status(404).json({ success: false, message: 'Fee Payment record not found.' });
        }

        const fp = pRes.rows[0];
        const amount = Number(fp.amount);

        const fee = {
            _id: fp.id,
            studentId: student,
            month: getMonthName(fp.billingMonth),
            year: getYearStr(fp.billingMonth),
            status: 'paid',
            totalFee: amount,
            monthlyTuitionFee: amount,
            registrationFee: 0,
            fine: 0,
            otherExpenses: [],
            amountPaid: amount,
            pendingAmount: 0,
            paidDate: fp.paymentDate,
            dueDate: null,
            paymentHistory: [{
                date: fp.paymentDate,
                amount: amount,
                method: fp.paymentMethod,
                receiptNo: fp.receiptNumber,
                transactionId: fp.referenceNo || 'N/A'
            }]
        };

        res.json({ success: true, receipt: fee });
    } catch (error) {
        console.error('Error fetching FeePayment receipt:', error);
        sendApiError(res, error, 'Unable to fetch receipt right now.');
    }
};

// Keep placeholder for POST/create if they really need it
exports.createFee = async (req, res) => {
    res.status(501).json({ success: false, message: 'Create fee is handled via Admin Panel with the Prisma schema.'});
};
