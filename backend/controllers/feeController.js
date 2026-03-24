const db = require('../config/postgres');
const Student = require('../models/Student');
const { sendApiError } = require('../utils/apiError');

const FALLBACK_POSTGRES_ERROR_CODES = new Set(['42P01', '42703']);

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);

const toNumber = (value, fallback = 0) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
};

const toArray = (value) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return Array.isArray(parsed) ? parsed : [];
        } catch (error) {
            return [];
        }
    }
    return [];
};

const toDateOrNull = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
};

const getMonthName = (billingMonthValue) => {
    if (!billingMonthValue) return 'Current';

    const billingMonthStr = String(billingMonthValue).trim();
    const parts = billingMonthStr.split('-');

    if (parts.length === 2) {
        const month = parts[1].padStart(2, '0');
        const date = new Date(`${parts[0]}-${month}-02T00:00:00.000Z`);
        if (!Number.isNaN(date.getTime())) {
            return date.toLocaleString('default', { month: 'long', timeZone: 'UTC' });
        }
    }

    return billingMonthStr;
};

const getYearStr = (billingMonthValue) => {
    if (!billingMonthValue) return new Date().getFullYear();

    const billingMonthStr = String(billingMonthValue).trim();
    const parts = billingMonthStr.split('-');
    return parts.length >= 1 ? parts[0] : billingMonthStr;
};

const normalizePaymentHistory = (value) => toArray(value)
    .filter(isObject)
    .map((item) => ({
        date: item.date || item.paidDate || null,
        amount: toNumber(item.amount ?? item.paidAmount),
        method: item.method || item.paymentMethod || item.mode || 'N/A',
        receiptNo: item.receiptNo || item.receipt || item.receiptNumber || 'N/A',
        transactionId: item.transactionId || item.paymentId || item.referenceNo || 'N/A'
    }));

const normalizeOtherExpenses = (value) => toArray(value)
    .filter(isObject)
    .map((item) => ({
        title: item.title || item.name || 'Other Expense',
        amount: toNumber(item.amount)
    }));

const sortFees = (fees) => {
    fees.sort((a, b) => {
        const aPaid = a.status === 'paid';
        const bPaid = b.status === 'paid';

        if (!aPaid && bPaid) return -1;
        if (aPaid && !bPaid) return 1;

        const aDate = toDateOrNull(a.paidDate || a.dueDate);
        const bDate = toDateOrNull(b.paidDate || b.dueDate);

        if (aDate && bDate) return bDate - aDate;
        return 0;
    });

    return fees;
};

const shouldFallbackToLegacyFees = (error) => FALLBACK_POSTGRES_ERROR_CODES.has(error?.code);

const buildPrimaryBalanceFee = (student, feeBalance) => {
    const currentBalance = toNumber(feeBalance.currentBalance);
    const overdueAmount = toNumber(feeBalance.overdueAmount);
    const billingMonth = feeBalance.lastChargedMonth || `${new Date().getFullYear()}-${new Date().getMonth() + 1}`;

    if (currentBalance <= 0) {
        return null;
    }

    return {
        _id: String(feeBalance.id),
        studentId: student,
        month: getMonthName(billingMonth),
        year: getYearStr(billingMonth),
        status: overdueAmount > 0 ? 'overdue' : 'pending',
        totalFee: currentBalance,
        monthlyTuitionFee: Math.max(currentBalance - overdueAmount, 0),
        registrationFee: 0,
        fine: overdueAmount,
        otherExpenses: [],
        amountPaid: 0,
        pendingAmount: currentBalance,
        paidDate: null,
        dueDate: feeBalance.dueDate || null,
        paymentHistory: []
    };
};

const buildPrimaryPaymentFee = (student, feePayment) => {
    const amount = toNumber(feePayment.amount);
    if (amount <= 0) {
        return null;
    }

    return {
        _id: String(feePayment.id),
        studentId: student,
        month: getMonthName(feePayment.billingMonth),
        year: getYearStr(feePayment.billingMonth),
        status: 'paid',
        totalFee: amount,
        monthlyTuitionFee: amount,
        registrationFee: 0,
        fine: 0,
        otherExpenses: [],
        amountPaid: amount,
        pendingAmount: 0,
        paidDate: feePayment.paymentDate || null,
        dueDate: null,
        paymentHistory: [{
            date: feePayment.paymentDate || null,
            amount,
            method: feePayment.paymentMethod || 'N/A',
            receiptNo: feePayment.receiptNumber || 'N/A',
            transactionId: feePayment.referenceNo || 'N/A'
        }]
    };
};

const buildLegacyFee = (student, feeRow) => {
    const otherExpenses = normalizeOtherExpenses(feeRow.other_expenses || feeRow.otherExpenses);
    const paymentHistory = normalizePaymentHistory(feeRow.payment_history || feeRow.paymentHistory);
    const monthlyTuitionFee = toNumber(feeRow.monthly_tuition_fee ?? feeRow.monthlyTuitionFee);
    const registrationFee = toNumber(feeRow.registration_fee ?? feeRow.registrationFee);
    const fine = toNumber(feeRow.fine);
    const amountPaid = toNumber(feeRow.amount_paid ?? feeRow.amountPaid);
    const expensesTotal = otherExpenses.reduce((sum, item) => sum + toNumber(item.amount), 0);
    const totalFee = toNumber(
        feeRow.total_fee ?? feeRow.totalFee,
        monthlyTuitionFee + registrationFee + fine + expensesTotal
    );
    const pendingAmount = toNumber(
        feeRow.pending_amount ?? feeRow.pendingAmount,
        Math.max(totalFee - amountPaid, 0)
    );
    const rawStatus = String(feeRow.status || '').trim().toLowerCase();
    const status = rawStatus || (
        pendingAmount <= 0 && totalFee > 0
            ? 'paid'
            : amountPaid > 0
                ? 'partial'
                : 'pending'
    );

    return {
        _id: String(feeRow.id),
        studentId: student,
        month: feeRow.month || getMonthName(feeRow.billing_month || feeRow.billingMonth),
        year: feeRow.year || getYearStr(feeRow.billing_month || feeRow.billingMonth),
        status,
        totalFee,
        monthlyTuitionFee,
        registrationFee,
        fine,
        otherExpenses,
        amountPaid,
        pendingAmount,
        paidDate: feeRow.paid_date || feeRow.paidDate || paymentHistory[0]?.date || null,
        dueDate: feeRow.due_date || feeRow.dueDate || null,
        paymentHistory
    };
};

const fetchPrimaryFees = async (studentId, student) => {
    const [balanceRes, paymentRes] = await Promise.all([
        db.query(
            'SELECT id, "lastChargedMonth", "currentBalance", "overdueAmount", "dueDate" FROM "FeeBalance" WHERE "studentId" = $1',
            [studentId]
        ),
        db.query(
            'SELECT id, "billingMonth", amount, "paymentDate", "paymentMethod", "receiptNumber", "referenceNo" FROM "FeePayment" WHERE "studentId" = $1 ORDER BY "paymentDate" DESC',
            [studentId]
        )
    ]);

    const fees = [];
    const pendingFee = balanceRes.rows?.[0] ? buildPrimaryBalanceFee(student, balanceRes.rows[0]) : null;
    if (pendingFee) {
        fees.push(pendingFee);
    }

    for (const row of paymentRes.rows || []) {
        const paidFee = buildPrimaryPaymentFee(student, row);
        if (paidFee) {
            fees.push(paidFee);
        }
    }

    return sortFees(fees);
};

const fetchLegacyFees = async (studentId, student) => {
    const feeRes = await db.query(
        'SELECT * FROM fees WHERE student_id = $1 ORDER BY COALESCE(paid_date, due_date, created_at) DESC',
        [studentId]
    );

    return sortFees((feeRes.rows || []).map((row) => buildLegacyFee(student, row)));
};

const fetchStudentFees = async (studentId, student) => {
    try {
        return await fetchPrimaryFees(studentId, student);
    } catch (error) {
        if (!shouldFallbackToLegacyFees(error)) {
            throw error;
        }

        console.warn('[Fees] Falling back to legacy fees table.', {
            studentId,
            code: error.code,
            message: error.message
        });

        return fetchLegacyFees(studentId, student);
    }
};

const fetchPrimaryReceipt = async (paymentId, studentId, student) => {
    const paymentRes = await db.query(
        'SELECT id, "billingMonth", amount, "paymentDate", "paymentMethod", "receiptNumber", "referenceNo" FROM "FeePayment" WHERE id = $1 AND "studentId" = $2',
        [String(paymentId), String(studentId)]
    );

    const feePayment = paymentRes.rows?.[0];
    return feePayment ? buildPrimaryPaymentFee(student, feePayment) : null;
};

const fetchLegacyReceipt = async (paymentId, studentId, student) => {
    const paymentRes = await db.query(
        'SELECT * FROM fees WHERE id = $1 AND student_id = $2',
        [String(paymentId), String(studentId)]
    );

    const feeRow = paymentRes.rows?.[0];
    if (!feeRow) {
        return null;
    }

    const fee = buildLegacyFee(student, feeRow);
    return fee.amountPaid > 0 || fee.status === 'paid' ? fee : null;
};

const fetchStudentReceipt = async (paymentId, studentId, student) => {
    try {
        return await fetchPrimaryReceipt(paymentId, studentId, student);
    } catch (error) {
        if (!shouldFallbackToLegacyFees(error)) {
            throw error;
        }

        console.warn('[Receipt] Falling back to legacy fees table.', {
            paymentId,
            studentId,
            code: error.code,
            message: error.message
        });

        return fetchLegacyReceipt(paymentId, studentId, student);
    }
};

// GET /api/student/fees
exports.getStudentFees = async (req, res) => {
    try {
        const studentId = req.user?.id || req.user?._id;

        if (!studentId) {
            console.error('[Fees] No student ID found in request user.');
            return res.status(401).json({ success: false, message: 'Authentication failed: Student ID missing.' });
        }

        const student = await Student.findById(studentId)
            .select('name rollNo session')
            .lean();

        if (!student) {
            console.error(`[Fees] Student ${studentId} not found in MongoDB.`);
            return res.status(404).json({ success: false, message: 'Student record not found.' });
        }

        const fees = await fetchStudentFees(String(studentId), student);
        res.json({ success: true, fees });
    } catch (error) {
        console.error('CRITICAL ERROR in getStudentFees:', error);
        sendApiError(res, error, 'Unable to fetch fees right now.');
    }
};

// GET /api/student/fees/:id/receipt
exports.getFeeReceipt = async (req, res) => {
    try {
        const paymentId = req.params.id;
        const studentId = req.user?.id || req.user?._id;

        if (!studentId) {
            return res.status(401).json({ success: false, message: 'Authentication failed: Student ID missing.' });
        }

        const student = await Student.findById(studentId).lean();
        if (!student) {
            console.error(`[Receipt] Student ${studentId} not found for payment ${paymentId}`);
            return res.status(404).json({ success: false, message: 'Student record not found.' });
        }

        const fee = await fetchStudentReceipt(paymentId, String(studentId), student);
        if (!fee) {
            console.warn(`[Receipt] Fee record ${paymentId} not found for student ${studentId}`);
            return res.status(404).json({ success: false, message: 'Fee record not found.' });
        }

        res.json({ success: true, receipt: fee });
    } catch (error) {
        console.error('Error fetching FeePayment receipt:', error);
        sendApiError(res, error, 'Unable to fetch receipt right now.');
    }
};

// Keep placeholder for POST/create if they really need it
exports.createFee = async (req, res) => {
    res.status(501).json({ success: false, message: 'Create fee is handled via Admin Panel with the Prisma schema.' });
};
