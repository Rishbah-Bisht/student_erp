import React, { useState } from 'react';
import { 
    AlertCircle,
    BadgeIndianRupee,
    CalendarDays,
    CheckCircle2,
    Wallet
} from 'lucide-react';
import api from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import { useLanguage } from '../context/LanguageContext';
import Skeleton from '../components/Skeleton';
import FeeInfoModal from '../components/FeeInfoModal';

const StudentFees = () => {
    const { t } = useLanguage();
    const [selectedFee, setSelectedFee] = useState(null);

    const { data: feesData, isLoading } = useQuery({
        queryKey: ['student', 'fees'],
        queryFn: async () => {
            try {
                const { data } = await api.get('/student/fees');
                if (data.success) {
                    await setCached('student.fees', data.fees);
                    return data.fees;
                }
            } catch (err) {
                // Browsers can return 304 for conditional requests; axios treats it as an error.
                if (err?.response?.status !== 401) {
                    const cached = await getCached('student.fees');
                    if (cached) return cached;
                }

                throw err;
            }

            return [];
        },
        retry: 1,
        refetchOnWindowFocus: false
    });

    const fees = React.useMemo(() => feesData || [], [feesData]);
    const stats = React.useMemo(() => {
        let paid = 0;
        let pending = 0;
        fees.forEach(f => {
            paid += (f.amountPaid || 0);
            pending += (f.pendingAmount > 0 ? f.pendingAmount : 0);
        });
        const totalAmount = paid + pending;
        const paidRatio = totalAmount > 0 ? Math.min((paid / totalAmount) * 100, 100) : 0;
        return { totalPaid: paid, pendingDues: pending, totalAmount, paidRatio };
    }, [fees]);

    const fmt = n => (n || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    
    if (isLoading) {
        return (
            <div className="animate-in fade-in duration-500 min-h-screen bg-[#f4f8f7] pb-16">
                <div className="px-5 sm:px-7 pt-8 pb-3">
                    <div className="max-w-5xl mx-auto rounded-3xl bg-white border border-slate-200 p-5 sm:p-8 shadow-sm">
                        <Skeleton className="h-7 w-44 mb-3" />
                        <Skeleton className="h-4 w-72 mb-5" />
                        <Skeleton className="h-2.5 w-full rounded-full" />
                    </div>
                </div>
                <div className="max-w-5xl mx-auto px-5 sm:px-7 space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Skeleton className="h-28 w-full rounded-2xl" />
                        <Skeleton className="h-28 w-full rounded-2xl" />
                        <Skeleton className="h-28 w-full rounded-2xl" />
                    </div>
                    <div className="space-y-4">
                        <Skeleton className="h-6 w-52" />
                        {[1, 2, 3].map((i) => (
                            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
        <div className="min-h-screen bg-[radial-gradient(circle_at_20%_0%,#eff6ff,transparent_40%),radial-gradient(circle_at_80%_20%,#fff7ed,transparent_40%),#f8fafc] pb-16 selection:bg-sky-200/60">
            <div className="p0">
                <div className="max-w-5xl mx-auto rounded-[28px] border border-sky-100 bg-white/90 backdrop-blur-sm shadow-[0_20px_45px_-35px_rgba(2,132,199,0.55)] overflow-hidden">
                    <div className="bg-[linear-gradient(110deg,#172554_0%,#1d4ed8_60%,#1e40af_100%)] p-6 sm:p-8">
                        <div className="flex items-start justify-between gap-4">
                            <div>
                                <p className="text-[11px] sm:text-xs uppercase tracking-[0.22em] font-extrabold text-sky-100/90 mb-2">
                                    {t('Financial Overview')}
                                </p>
                                <p className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                                    {t('Fees & Payments Ledger')}
                                </p>
                                <p className="text-sm text-sky-50/85 mt-2 max-w-xl">
                                    {t('Manage your tuition, view payment history, and download receipts.')}
                                </p>
                            </div>
                            <div className="hidden sm:flex w-14 h-14 rounded-2xl items-center justify-center bg-white/15 border border-white/20 text-white shrink-0">
                                <Wallet size={30} strokeWidth={1.8} />
                            </div>
                        </div>

                        <div className="mt-6">
                            <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.2em] font-extrabold text-sky-100/85 mb-2">
                                <span>{t('Collection Progress')}</span>
                                <span>{Math.round(stats.paidRatio)}%</span>
                            </div>
                            <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
                                <div
                                    className="h-full rounded-full bg-[linear-gradient(90deg,#60a5fa_0%,#22d3ee_100%)] transition-all duration-700"
                                    style={{ width: `${stats.paidRatio}%` }}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-5xl mx-auto p0 sm:p0 mt-5 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="bg-white border border-rose-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black tracking-[0.16em] uppercase text-rose-500">{t('Pending Dues')}</span>
                            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center">
                                <AlertCircle size={16} strokeWidth={2.6} />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-rose-700 tracking-tight tabular-nums">₹{fmt(stats.pendingDues)}</p>
                        <p className="text-xs text-slate-500 mt-2">{stats.pendingDues > 0 ? t('Action required this cycle') : t('No outstanding dues')}</p>
                    </div>

                    <div className="bg-white border border-sky-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black tracking-[0.16em] uppercase text-sky-600">{t('Total Paid')}</span>
                            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                                <CheckCircle2 size={16} strokeWidth={2.5} />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-sky-700 tracking-tight tabular-nums">₹{fmt(stats.totalPaid)}</p>
                        <p className="text-xs text-slate-500 mt-2">{t('Session')}: {fees[0]?.studentId?.session || 'N/A'}</p>
                    </div>

                    <div className="bg-white border border-sky-100 rounded-2xl p-5 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-[11px] font-black tracking-[0.16em] uppercase text-sky-600">{t('Total Billed')}</span>
                            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                                <BadgeIndianRupee size={16} strokeWidth={2.4} />
                            </div>
                        </div>
                        <p className="text-2xl font-black text-sky-700 tracking-tight tabular-nums">₹{fmt(stats.totalAmount)}</p>
                        <p className="text-xs text-slate-500 mt-2">{t('Across all records')}</p>
                    </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="px-5 sm:px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-white border border-slate-200 text-slate-700 flex items-center justify-center">
                            <CalendarDays size={16} strokeWidth={2.4} />
                        </div>
                        <h2 className="text-base sm:text-lg font-black text-slate-800 tracking-tight">
                            {t('Monthly Breakdown')}
                        </h2>
                    </div>

                    <div className="p-4 sm:p-5 space-y-3">
                        {fees.length > 0 ? (
                            fees.map((fee) => {
                                const isPaid = fee.status === 'paid';

                                return (
                                    <div 
                                        key={fee._id} 
                                        className={`rounded-2xl border overflow-hidden cursor-pointer hover:shadow-sm transition-all ${isPaid ? 'border-emerald-200 bg-emerald-50/30' : 'border-rose-200 bg-rose-50/30'}`}
                                        onClick={() => setSelectedFee(fee)}
                                    >
                                        <div className="p-4 sm:p-5 flex items-center justify-between select-none bg-slate-50/40">
                                            <div className="flex items-center gap-3 min-w-0">
                                                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${isPaid ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                                                <h4 className="font-extrabold text-slate-900 text-[15px] sm:text-[16px] tracking-tight leading-tight truncate">
                                                    {fee.month} {fee.year}
                                                </h4>
                                            </div>

                                            <div className="flex items-center gap-3 pl-3 shrink-0">
                                                <span className={`text-[10px] font-black uppercase tracking-wider ${isPaid ? 'text-emerald-600' : 'text-rose-600'}`}>
                                                    {isPaid ? t('Paid') : t('Unpaid')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                                <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-500 mb-4">
                                    <Wallet size={32} strokeWidth={1.5} />
                                </div>
                                <h3 className="text-lg font-black text-slate-800 mb-1">{t('No Fees Found')}</h3>
                                <p className="text-sm font-medium text-slate-400 max-w-[200px]">{t('You do not have any fee records for this session yet.')}</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>

        <FeeInfoModal
            isOpen={Boolean(selectedFee)}
            onClose={() => setSelectedFee(null)}
            fee={selectedFee}
            student={fees[0]?.studentId}
        />

        </>
    );
};

export default StudentFees;