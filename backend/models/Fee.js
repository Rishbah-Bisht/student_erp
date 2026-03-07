const mongoose = require('mongoose');

const paymentHistorySchema = new mongoose.Schema({
    paidAmount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    paymentMethod: { type: String, enum: ['Cash', 'UPI', 'Bank', 'Online'], default: 'Cash' },
    transactionId: { type: String },
    paymentId: { type: String },
    remarks: { type: String },
    receiptNo: { type: String },
    bankName: { type: String },
    journalNo: { type: String }
});

const otherExpenseSchema = new mongoose.Schema({
    title: { type: String, required: true },
    amount: { type: Number, required: true },
    date: { type: Date, default: Date.now },
    description: { type: String }
});

const feeSchema = new mongoose.Schema({
    studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Student', required: true },
    batchId: { type: mongoose.Schema.Types.ObjectId, ref: 'Batch' },
    monthlyTuitionFee: { type: Number, required: true },
    registrationFee: { type: Number, default: 0 },
    otherExpenses: [otherExpenseSchema],
    totalFee: { type: Number }, // Calculated
    amountPaid: { type: Number, default: 0 },
    pendingAmount: { type: Number }, // Calculated
    dueDate: { type: Date },
    paidDate: { type: Date },
    status: { type: String, enum: ['paid', 'partial', 'pending', 'overdue'], default: 'pending' },
    fine: { type: Number, default: 0 },
    receipt: { type: String },
    month: { type: String },
    year: { type: Number, default: () => new Date().getFullYear() },
    paymentHistory: [paymentHistorySchema],
    createdAt: { type: Date, default: Date.now }
});

// Middleware to sync pendingAmount and totalFee before save
feeSchema.pre('save', function () {
    const expensesTotal = this.otherExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0);
    this.totalFee = (this.monthlyTuitionFee || 0) + (this.registrationFee || 0) + expensesTotal + (this.fine || 0);
    this.pendingAmount = this.totalFee - this.amountPaid;

    if (this.amountPaid >= this.totalFee && this.totalFee > 0) {
        this.status = 'paid';
    } else if (this.amountPaid > 0) {
        this.status = 'partial';
    } else {
        // Keeps 'overdue' if already set manually, else 'pending'
        if (this.status !== 'overdue') this.status = 'pending';
    }
});

// Unique index to prevent duplicates for same student in same billing period
feeSchema.index({ studentId: 1, month: 1, year: 1 }, { unique: true });

module.exports = mongoose.model('Fee', feeSchema);
