import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import StudentLayout from '../components/StudentLayout';
import { IndianRupee, Clock, CheckCircle2, AlertCircle, FileText, Download, Loader2, Calendar } from 'lucide-react';
import ReceiptPreviewModal from '../components/ReceiptPreviewModal';
import api from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import { Capacitor } from '@capacitor/core';
import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { useLanguage } from '../context/LanguageContext';

const StudentFees = () => {
    const { t } = useLanguage();
    const [stats, setStats] = useState({ totalPaid: 0, pendingDues: 0 });
    const [previewPdf, setPreviewPdf] = useState({ isOpen: false, blobUrl: null, filename: '' });

    // Fallback student info from local storage if needed
    const studentInfo = JSON.parse(localStorage.getItem('studentInfo') || '{}');

    const { data: fees = [], isLoading } = useQuery({
        queryKey: ['student', 'fees'],
        queryFn: async () => {
            try {
                const { data } = await api.get('/student/fees');
                if (data.success) {
                    await setCached('student.fees', data.fees);
                    return data.fees;
                }
                return [];
            } catch (error) {
                const cached = await getCached('student.fees');
                if (cached) return cached;
                throw error;
            }
        }
    });

    useEffect(() => {
        let paid = 0;
        let pending = 0;
        fees.forEach(f => {
            paid += (f.amountPaid || 0);
            pending += (f.pendingAmount > 0 ? f.pendingAmount : 0);
        });
        setStats({ totalPaid: paid, pendingDues: pending });
    }, [fees]);

    const fmt = n => (n || 0).toLocaleString('en-IN');

    const numberToWords = (num) => {
        const a = ['', 'one ', 'two ', 'three ', 'four ', 'five ', 'six ', 'seven ', 'eight ', 'nine ', 'ten ', 'eleven ', 'twelve ', 'thirteen ', 'fourteen ', 'fifteen ', 'sixteen ', 'seventeen ', 'eighteen ', 'nineteen '];
        const b = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety'];
        const inWords = (n) => {
            if ((n = n.toString()).length > 9) return 'overflow';
            let nArr = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
            if (!nArr) return '';
            let str = '';
            str += nArr[1] != 0 ? (a[Number(nArr[1])] || b[nArr[1][0]] + ' ' + a[nArr[1][1]]) + 'crore ' : '';
            str += nArr[2] != 0 ? (a[Number(nArr[2])] || b[nArr[2][0]] + ' ' + a[nArr[2][1]]) + 'lakh ' : '';
            str += nArr[3] != 0 ? (a[Number(nArr[3])] || b[nArr[3][0]] + ' ' + a[nArr[3][1]]) + 'thousand ' : '';
            str += nArr[4] != 0 ? a[Number(nArr[4])] + 'hundred ' : '';
            str += nArr[5] != 0 ? ((str != '') ? 'and ' : '') + (a[Number(nArr[5])] || b[nArr[5][0]] + ' ' + a[nArr[5][1]]) : '';
            return str.toUpperCase();
        };
        return inWords(num) + ' RUPEES ONLY.';
    };

    const generateReceipt = async (feeData, paymentData, previewOnly = false) => {
        const paymentAmount = Number(paymentData.paidAmount || paymentData.amount || 0);
        const receiptNo = paymentData.receiptNo;
        const mode = paymentData.paymentMethod || paymentData.mode || 'Cash';
        const txnId = paymentData.transactionId || 'N/A';
        const rawDate = paymentData.date ? new Date(paymentData.date) : new Date();
        const dateStr = rawDate.toLocaleDateString('en-GB');

        const settings = JSON.parse(localStorage.getItem('instituteSettings') || '{}');
        const coachingName = settings.coachingName || 'ERP ACADEMY';
        const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });

        const logoUrl = settings.instituteLogo ?
            (settings.instituteLogo.startsWith('http') ? settings.instituteLogo : settings.instituteLogo) : null;

        if (logoUrl) {
            try {
                const imgBase64 = await new Promise((resolve) => {
                    const img = new Image();
                    img.crossOrigin = 'Anonymous';
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL('image/png'));
                    };
                    img.onerror = () => resolve(null);
                    img.src = logoUrl;
                });

                if (imgBase64) {
                    doc.setGState(new doc.GState({ opacity: 0.1 }));
                    doc.addImage(imgBase64, 'PNG', 55, 100, 100, 100);
                    doc.setGState(new doc.GState({ opacity: 1 }));
                } else {
                    doc.setGState(new doc.GState({ opacity: 0.1 }));
                    doc.setFontSize(60);
                    doc.setTextColor(100, 100, 150);
                    doc.text(coachingName.toUpperCase(), 105, 148, { align: 'center', angle: 45 });
                    doc.setGState(new doc.GState({ opacity: 1 }));
                    doc.setTextColor(0, 0, 0);
                }
            } catch (e) {
                console.log(e);
            }
        } else {
            doc.setGState(new doc.GState({ opacity: 0.1 }));
            doc.setFontSize(60);
            doc.setTextColor(100, 100, 150);
            doc.text(coachingName.toUpperCase(), 105, 148, { align: 'center', angle: 45 });
            doc.setGState(new doc.GState({ opacity: 1 }));
            doc.setTextColor(0, 0, 0);
        }

        // --- Header Section ---
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text(coachingName.toUpperCase(), 105, 15, { align: 'center' });

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(settings.address || 'Institute Campus Address Line 1, City, State, ZIP', 105, 21, { align: 'center' });
        doc.text(`Phone: ${settings.phone || '+91 0000000000'} | Email: ${settings.email || 'info@institute.ac.in'}`, 105, 27, { align: 'center' });

        doc.setDrawColor(200);
        doc.line(15, 31, 195, 31);

        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('FEE PAYMENT RECEIPT', 105, 39, { align: 'center' });

        // --- Student & Payment Information Section ---
        let y = 48;
        doc.setFontSize(9);
        const col1_X = 15;
        const col1_ValX = 45;
        const col2_X = 110;
        const col2_ValX = 145;

        const drawPair = (lLabel, lVal, rLabel, rVal, currentY) => {
            doc.setFont('helvetica', 'bold');
            doc.text(`${lLabel}:`, col1_X, currentY);
            if (rLabel) doc.text(`${rLabel}:`, col2_X, currentY);

            doc.setFont('helvetica', 'normal');

            const lValStr = String(lVal);
            const rValStr = String(rVal || '');

            const lLines = doc.splitTextToSize(lValStr, 60);
            doc.text(lLines, col1_ValX, currentY);

            let rLines = [];
            if (rLabel) {
                rLines = doc.splitTextToSize(rValStr, 50);
                doc.text(rLines, col2_ValX, currentY);
            }

            const maxLines = Math.max(lLines.length, rLines.length);
            return currentY + (maxLines * 5) + 2; // Return the new Y position
        };

        const currentStudent = studentInfo || {};

        y = drawPair('Name', currentStudent.name?.toUpperCase() || 'N/A', 'Receipt No', receiptNo || 'N/A', y);
        y = drawPair('S/O/D/O', currentStudent.fatherName?.toUpperCase() || 'N/A', 'Receipt Date', dateStr, y);
        y = drawPair('Mother Name', currentStudent.motherName?.toUpperCase() || 'N/A', 'Payment Mode', mode.toUpperCase(), y);
        y = drawPair('Student ID', currentStudent.rollNo || 'N/A', 'Transaction ID', txnId, y);
        y = drawPair('Course', currentStudent.className?.toUpperCase() || 'N/A', 'Transaction Date', dateStr, y);
        y = drawPair('Fin. Session', currentStudent.session || '2025/26', '', '', y);
        y = drawPair('Domicile', 'State Domicile', '', '', y);
        y = drawPair('Address', (currentStudent.address || 'N/A').replace(/\n/g, ' ').slice(0, 150), '', '', y);

        y += 12;

        // --- Chronological Historical Deductions ---
        let historicalRemaining = 0;
        let found = false;

        if (feeData.paymentHistory && feeData.paymentHistory.length > 0) {
            for (const p of feeData.paymentHistory) {
                if ((paymentData._id && p._id === paymentData._id) || (paymentData.receiptNo && p.receiptNo === paymentData.receiptNo)) {
                    found = true;
                    break;
                }
                historicalRemaining += (p.paidAmount || 0);
            }
            if (!found) {
                historicalRemaining = feeData.paymentHistory.reduce((s, p) => s + (p.paidAmount || 0), 0);
            }
        }

        let mutableHistoricalRemaining = historicalRemaining;
        const drainHist = (amt) => {
            const drained = Math.min(amt, mutableHistoricalRemaining);
            mutableHistoricalRemaining -= drained;
            return drained;
        };

        let currentPaymentRemaining = paymentAmount;
        const distribute = (amt, alreadyPaidOffAmt = 0) => {
            const actualRemainingToPayForThisItem = amt - alreadyPaidOffAmt;
            const paidAmt = Math.min(actualRemainingToPayForThisItem, currentPaymentRemaining);
            currentPaymentRemaining -= paidAmt;
            return paidAmt;
        };

        // --- Fee Breakdown Table ---
        const feeBodyLines = [];

        const totalTuitionDue = feeData.monthlyTuitionFee || 0;
        const totalRegDue = feeData.registrationFee || 0;
        const totalFineDue = feeData.fine || 0;

        const histTuition = drainHist(totalTuitionDue);
        const histReg = drainHist(totalRegDue);
        const histFine = drainHist(totalFineDue);

        const t = distribute(totalTuitionDue, histTuition);
        if (t > 0 || totalTuitionDue > 0) feeBodyLines.push([`Tuition Fee (${feeData.month} ${feeData.year})`, totalTuitionDue.toLocaleString()]);

        const r = distribute(totalRegDue, histReg);
        if (r > 0 || totalRegDue > 0) feeBodyLines.push(['Registration Fee', totalRegDue.toLocaleString()]);

        const f = distribute(totalFineDue, histFine);
        if (f > 0 || totalFineDue > 0) feeBodyLines.push(['Late Fine / Penalty', totalFineDue.toLocaleString()]);

        if (feeData.otherExpenses && feeData.otherExpenses.length > 0) {
            feeData.otherExpenses.forEach(exp => {
                const histExp = drainHist(exp.amount || 0);
                const ex = distribute(exp.amount || 0, histExp);
                feeBodyLines.push([exp.title || 'Other Expense', (exp.amount || 0).toLocaleString()]);
            });
        }

        autoTable(doc, {
            startY: y,
            head: [['Fee Type', 'Amount (RS.)']],
            body: feeBodyLines,
            theme: 'grid',
            styles: { fontSize: 9, cellPadding: 3 },
            headStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' },
            columnStyles: { 0: { cellWidth: 120 }, 1: { cellWidth: 50, halign: 'right' } },
            margin: { left: 20 }
        });

        const tableEnd = doc.lastAutoTable.finalY + 5;

        const totalReceivedTillThisReceipt = historicalRemaining + paymentAmount;
        const totalBalanceAfterThisReceipt = (feeData.totalFee || 0) - totalReceivedTillThisReceipt;

        // --- Totals ---
        autoTable(doc, {
            startY: tableEnd,
            margin: { left: 90 },
            body: [
                ['Subtotal :', (feeData.totalFee || 0).toLocaleString()],
                ['Total Amount Paid :', paymentAmount.toLocaleString()],
                ['Balance Amount :', totalBalanceAfterThisReceipt.toLocaleString()],
            ],
            theme: 'plain',
            styles: { fontSize: 9, fontStyle: 'bold', halign: 'right' },
            columnStyles: { 0: { cellWidth: 50 }, 1: { cellWidth: 30, halign: 'right' } }
        });

        let currentY = doc.lastAutoTable.finalY + 15;

        // --- Amount In Words Section ---
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('Amount (In Words):', 15, currentY);
        doc.setFont('helvetica', 'normal');
        doc.text(`${numberToWords(paymentAmount).toUpperCase()}`, 15, currentY + 6);

        // --- Status Section ---
        let statusText = 'PENDING';
        let statusColor = [220, 38, 38]; // Red
        if (totalBalanceAfterThisReceipt <= 0) {
            statusText = 'PAID';
            statusColor = [22, 163, 74]; // Green
        } else if (totalReceivedTillThisReceipt > 0) {
            statusText = 'PARTIAL / PENDING';
            statusColor = [234, 88, 12]; // Orange
        }

        doc.setFont('helvetica', 'bold');
        doc.setFillColor(...statusColor);
        doc.rect(195 - 40, currentY - 5, 40, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.text(statusText, 195 - 20, currentY + 0.5, { align: 'center', baseline: 'middle' });
        doc.setTextColor(0, 0, 0);

        // --- Footer Section ---
        const footerY = 260;
        doc.setFontSize(8);
        doc.setFont('helvetica', 'bold');
        doc.text('System Generated Receipt', 15, footerY + 10);

        doc.text('AUTHORIZED SIGNATURE', 195 - 15, footerY + 10, { align: 'right' });
        doc.setDrawColor(0);
        doc.line(195 - 65, footerY + 5, 195, footerY + 5);

        if (previewOnly) {
            return doc.output('bloburl');
        } else {
            doc.save(`Receipt_${receiptNo || currentStudent.rollNo || 'N/A'}.pdf`);
        }
    };

    const handleViewReceipt = async (fee, payment) => {
        try {
            const url = await generateReceipt(fee, payment, true);
            setPreviewPdf({ isOpen: true, blobUrl: url, filename: `Receipt_${payment.receiptNo}.pdf` });
        } catch (e) {
            console.error(e);
            alert(t('Error generating receipt'));
        }
    };

    const blobToBase64 = (blob) => new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });

    const handleDownloadReceipt = async () => {
        if (!previewPdf.blobUrl) return;

        // Web (browser) flow
        if (!Capacitor.isNativePlatform()) {
            const link = document.createElement('a');
            link.href = previewPdf.blobUrl;
            link.download = previewPdf.filename || 'receipt.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            return;
        }

        // Native Android/iOS flow
        try {
            const blob = await fetch(previewPdf.blobUrl).then(r => r.blob());
            const base64 = await blobToBase64(blob);
            const base64Data = String(base64).split(',')[1];
            const path = `receipts/${previewPdf.filename || 'receipt.pdf'}`;

            const saved = await Filesystem.writeFile({
                path,
                data: base64Data,
                directory: Directory.Documents
            });

            await Share.share({
                title: t('Fee Receipt'),
                text: t('Student fee receipt PDF'),
                url: saved.uri
            });
        } catch (err) {
            console.error(err);
            alert(t('Unable to save receipt on this device.'));
        }
    };

    if (isLoading) {
        return (
            <StudentLayout title="My Fees">
                <div className="flex h-64 items-center justify-center">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                        <Loader2 className="animate-spin" size={32} />
                        <p>{t('Loading fee details...')}</p>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout title="My Fees">
            <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-md bg-white p-5 shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-red-50 text-red-600">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">{t('Pending Dues')}</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-0.5">₹{fmt(stats.pendingDues)}</h3>
                    </div>
                </div>

                <div className="rounded-md bg-white p-5 shadow-sm border border-slate-100 flex items-center gap-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-emerald-50 text-emerald-600">
                        <CheckCircle2 size={24} />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-slate-500 uppercase tracking-widest">{t('Total Paid')}</p>
                        <h3 className="text-2xl font-bold text-slate-900 mt-0.5">₹{fmt(stats.totalPaid)}</h3>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <h3 className="text-lg font-bold text-slate-800">{t('Fee History')}</h3>

                {fees.length === 0 ? (
                    <div className="rounded-md bg-white p-8 text-center border border-slate-100 shadow-sm">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center w-full rounded-md bg-slate-50 text-slate-300 mb-4">
                            <FileText size={32} />
                        </div>
                        <h3 className="text-base font-bold text-slate-700">{t('No Fee Records Found')}</h3>
                        <p className="text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                            {t("It looks like you don't have any generated bills yet. Please wait for the admin to initiate a billing cycle.")}
                        </p>
                    </div>
                ) : (
                    fees.map((fee) => (
                        <div key={fee._id} className="rounded-md bg-white shadow-sm border border-slate-100 overflow-hidden">
                            <div className={`px-5 py-4 flex items-center justify-between border-b border-slate-100
                                ${fee.status === 'paid' ? 'bg-emerald-50/50' : fee.status === 'overdue' ? 'bg-red-50/50' : 'bg-slate-50/50'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg 
                                        ${fee.status === 'paid' ? 'bg-emerald-100 text-emerald-600' :
                                            fee.status === 'overdue' ? 'bg-red-100 text-red-600' : 'bg-slate-200 text-slate-600'}`}
                                    >
                                        <Calendar size={20} />
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-slate-900">{fee.month} {fee.year}</h4>
                                        <div className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                                            {t('Status:')} <span className={`font-semibold uppercase tracking-wider
                                                ${fee.status === 'paid' ? 'text-emerald-600' :
                                                    fee.status === 'overdue' ? 'text-red-600' : 'text-slate-600'}`}>
                                                {fee.status}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-xl font-bold text-slate-900">₹{fmt(fee.totalFee)}</div>
                                    <div className="text-xs text-slate-500 mt-0.5">{t('Total Billed')}</div>
                                </div>
                            </div>

                            <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Breakdown */}
                                <div>
                                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{t('Bill Breakdown')}</h5>
                                    <div className="space-y-2 text-sm">
                                        <div className="flex justify-between items-center text-slate-600">
                                            <span>{t('Monthly Tuition')}</span>
                                            <span className="font-medium text-slate-900">₹{fmt(fee.monthlyTuitionFee)}</span>
                                        </div>
                                        {fee.registrationFee > 0 && (
                                            <div className="flex justify-between items-center text-slate-600">
                                                <span>{t('Registration Fee')}</span>
                                                <span className="font-medium text-slate-900">₹{fmt(fee.registrationFee)}</span>
                                            </div>
                                        )}
                                        {fee.fine > 0 && (
                                            <div className="flex justify-between items-center text-red-500">
                                                <span>{t('Late Fine Penalty')}</span>
                                                <span className="font-medium">₹{fmt(fee.fine)}</span>
                                            </div>
                                        )}
                                        {fee.otherExpenses?.map((exp, i) => (
                                            <div key={i} className="flex justify-between items-center text-slate-600">
                                                <span>{exp.title}</span>
                                                <span className="font-medium text-slate-900">₹{fmt(exp.amount)}</span>
                                            </div>
                                        ))}
                                        <div className="pt-2 mt-2 border-t border-slate-100 flex justify-between items-center font-bold">
                                            <span className="text-slate-900">{t('Net Payable')}</span>
                                            <span className="text-slate-900">₹{fmt(fee.totalFee)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Payments & Receipts */}
                                <div>
                                    <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">{t('Payment History')}</h5>
                                    {fee.paymentHistory && fee.paymentHistory.length > 0 ? (
                                        <div className="space-y-3">
                                            {fee.paymentHistory.map((p, i) => (
                                                <div key={i} className="flex justify-between items-center bg-slate-50 p-3 rounded-md border border-slate-100">
                                                    <div>
                                                        <div className="font-medium text-slate-900">₹{fmt(p.paidAmount)} <span className="text-xs text-slate-500 font-normal">({p.paymentMethod})</span></div>
                                                        <div className="text-xs text-slate-500 mt-0.5">{new Date(p.date).toLocaleDateString()}</div>
                                                    </div>
                                                    <button
                                                        onClick={() => handleViewReceipt(fee, p)}
                                                        className="h-8 w-8 flex items-center justify-center rounded-lg bg-white border border-slate-200 text-indigo-600 hover:bg-indigo-50 hover:border-indigo-200 transition-colors"
                                                        title={t('Download Receipt')}
                                                    >
                                                        <Download size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                            {fee.pendingAmount > 0 && (
                                                <div className="pt-2 text-sm flex justify-between font-bold text-red-600">
                                                    <span>{t('Remaining Due')}</span>
                                                    <span>₹{fmt(fee.pendingAmount)}</span>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="h-full flex items-center text-sm text-slate-500 bg-slate-50 rounded-md p-4 border border-slate-100">
                                            {t('No payments made yet towards this billing cycle.')}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <ReceiptPreviewModal
                isOpen={previewPdf.isOpen}
                onClose={() => setPreviewPdf({ ...previewPdf, isOpen: false })}
                blobUrl={previewPdf.blobUrl}
                filename={previewPdf.filename}
                onDownload={handleDownloadReceipt}
            />
        </StudentLayout>
    );
};

export default StudentFees;
