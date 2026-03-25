const Student = require('../models/Student');
const Fee = require('../models/Fee');
const { sendApiError } = require('../utils/apiError');

const isObject = (value) => value && typeof value === 'object' && !Array.isArray(value);
const looksLikeObjectId = (value) => /^[a-f\d]{24}$/i.test(String(value || ''));

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

const buildMongoFee = (student, feeDoc) => {
    const otherExpenses = normalizeOtherExpenses(feeDoc.otherExpenses);
    const paymentHistory = normalizePaymentHistory(feeDoc.paymentHistory);
    const monthlyTuitionFee = toNumber(feeDoc.monthlyTuitionFee);
    const registrationFee = toNumber(feeDoc.registrationFee);
    const fine = toNumber(feeDoc.fine);
    const amountPaid = toNumber(feeDoc.amountPaid);
    const expensesTotal = otherExpenses.reduce((sum, item) => sum + toNumber(item.amount), 0);
    const totalFee = toNumber(
        feeDoc.totalFee,
        monthlyTuitionFee + registrationFee + fine + expensesTotal
    );
    const pendingAmount = toNumber(
        feeDoc.pendingAmount,
        Math.max(totalFee - amountPaid, 0)
    );
    const rawStatus = String(feeDoc.status || '').trim().toLowerCase();
    const status = rawStatus || (
        pendingAmount <= 0 && totalFee > 0
            ? 'paid'
            : amountPaid > 0
                ? 'partial'
                : 'pending'
    );

    return {
        _id: String(feeDoc._id),
        studentId: student,
        month: feeDoc.month || 'Current',
        year: feeDoc.year || new Date().getFullYear(),
        status,
        totalFee,
        monthlyTuitionFee,
        registrationFee,
        fine,
        otherExpenses,
        amountPaid,
        pendingAmount,
        paidDate: feeDoc.paidDate || paymentHistory[0]?.date || null,
        dueDate: feeDoc.dueDate || null,
        paymentHistory
    };
};

const buildStudentSummaryFee = (student) => {
    const totalFee = toNumber(student.fees);
    const amountPaid = toNumber(student.feesPaid);
    const pendingAmount = Math.max(totalFee - amountPaid, 0);

    if (totalFee <= 0 && amountPaid <= 0) {
        return null;
    }

    return {
        _id: `student-summary-${String(student._id)}`,
        studentId: student,
        month: 'Current',
        year: new Date().getFullYear(),
        status: pendingAmount <= 0 && totalFee > 0
            ? 'paid'
            : amountPaid > 0
                ? 'partial'
                : 'pending',
        totalFee,
        monthlyTuitionFee: totalFee,
        registrationFee: 0,
        fine: 0,
        otherExpenses: [],
        amountPaid,
        pendingAmount,
        paidDate: null,
        dueDate: null,
        paymentHistory: []
    };
};

const fetchMongoFees = async (studentId, student) => {
    const mongoFees = await Fee.find({ studentId })
        .sort({ paidDate: -1, dueDate: -1, createdAt: -1, _id: -1 })
        .lean();

    if (mongoFees.length > 0) {
        return sortFees(mongoFees.map((feeDoc) => buildMongoFee(student, feeDoc)));
    }

    const summaryFee = buildStudentSummaryFee(student);
    return summaryFee ? [summaryFee] : [];
};

const fetchMongoReceipt = async (paymentId, studentId, student) => {
    if (!looksLikeObjectId(paymentId)) {
        return null;
    }

    const feeDoc = await Fee.findOne({ _id: paymentId, studentId }).lean();
    if (!feeDoc) {
        return null;
    }

    const fee = buildMongoFee(student, feeDoc);
    return fee.amountPaid > 0 || fee.status === 'paid' ? fee : null;
};

const fetchStudentFees = async (studentId, student) => {
    return fetchMongoFees(studentId, student);
};

const fetchStudentReceipt = async (paymentId, studentId, student) => {
    return fetchMongoReceipt(paymentId, studentId, student);
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
            .select('name rollNo session fees feesPaid')
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
