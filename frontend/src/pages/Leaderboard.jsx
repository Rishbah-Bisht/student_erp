import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Award, RefreshCcw, AlertTriangle, ChevronDown, User } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import { useQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import useDebouncedValue from '../hooks/useDebouncedValue';
import { useLanguage } from '../context/LanguageContext';

const Leaderboard = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [error, setError] = useState('');

    const [lbType, setLbType] = useState('batch');
    const [lbSubject, setLbSubject] = useState('All');

    const token = localStorage.getItem('studentToken');
    const debouncedSubject = useDebouncedValue(lbSubject, 300);

    useEffect(() => {
        if (!token) navigate('/student/login');
    }, [navigate, token]);

    useEffect(() => {
        if (lbType === 'batch' && lbSubject !== 'All') setLbSubject('All');
    }, [lbType, lbSubject]);

    const { data: resultsSummary, isLoading: summaryLoading } = useQuery({
        queryKey: ['student', 'results', 'summary'],
        enabled: !!token,
        queryFn: async () => {
            const res = await api.get('/student/results', { params: { limit: 1 } });
            if (res.data.success) {
                await setCached('student.results.summary', res.data);
                return res.data;
            }
            throw new Error('Failed');
        }
    });

    const subjects = useMemo(() => {
        const stats = resultsSummary?.stats?.subjectStats || {};
        return ['All', ...Object.keys(stats)];
    }, [resultsSummary]);

    const leaderboardCacheKey = `student.leaderboard:${lbType}:${debouncedSubject || 'All'}`;
    const { data: leaderboard = [], isLoading: leaderboardLoading, isFetching: leaderboardFetching } = useQuery({
        queryKey: ['student', 'leaderboard', lbType, debouncedSubject || 'All'],
        enabled: !!token,
        placeholderData: (previous) => previous,
        queryFn: async () => {
            try {
                const params = { type: lbType };
                if (lbType === 'subject' && debouncedSubject && debouncedSubject !== 'All') {
                    params.subject = debouncedSubject;
                }
                const response = await api.get('/student/results/leaderboard', { params });
                if (response.data.success) {
                    await setCached(leaderboardCacheKey, response.data.leaderboard);
                    return response.data.leaderboard;
                }
                return [];
            } catch (err) {
                const cached = await getCached(leaderboardCacheKey);
                if (cached) return cached;
                throw err;
            }
        }
    });

    const isLoading = summaryLoading || leaderboardLoading;
    const showRefreshing = leaderboardFetching && !leaderboardLoading;

    const getRankStyles = (idx) => {
        if (idx === 0) return 'bg-amber-100 text-amber-600 border-amber-200';
        if (idx === 1) return 'bg-slate-100 text-slate-500 border-slate-200';
        if (idx === 2) return 'bg-orange-100 text-orange-600 border-orange-200';
        return 'bg-gray-50 text-gray-400 border-gray-100';
    };

    if (isLoading) return (
        <StudentLayout title="Leaderboard">
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
                <Skeleton className="h-48 w-full rounded-[32px]" />
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-20 w-full rounded-2xl" />)}
                </div>
            </div>
        </StudentLayout>
    );

    return (
        <StudentLayout title="Hall of Fame">
            <div className="max-w-4xl mx-auto p0">

                {/* Fixed Header Card */}
                <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-[#1e293b] to-[#0f172a] p-8 text-white shadow-xl mb-8">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-yellow-500/10 rounded-full -mr-20 -mt-20 blur-3xl" />
                    <div className="relative flex items-center justify-between">
                        <div className="space-y-2">
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-yellow-400/20 rounded-2xl border border-yellow-400/30">
                                    <Trophy size={28} className="text-yellow-400" />
                                </div>
                                <p className="text-2xl font-black uppercase tracking-tight italic">{t('Hall of Fame')}</p>
                            </div>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] ml-2">
                                {t('Academic Performance Rankings')}
                            </p> {/* Fixed closing tag here */}
                        </div>
                        <Award size={48} className="text-white/5" />
                    </div>
                </div>

                {/* Controls Section */}
                <div className="bg-white p-4 rounded-[28px] border border-slate-100 shadow-sm mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex flex-1 p-1.5 bg-slate-50 rounded-2xl border border-slate-100">
                            <button
                                onClick={() => { setLbType('batch'); setLbSubject('All'); }}
                                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${lbType === 'batch' ? 'bg-white text-[#1e293b] shadow-md' : 'text-slate-400'}`}
                            >
                                {t('Global')}
                            </button>
                            <button
                                onClick={() => setLbType('subject')}
                                className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${lbType === 'subject' ? 'bg-white text-[#1e293b] shadow-md' : 'text-slate-400'}`}
                            >
                                {t('My Batch')}
                            </button>
                        </div>

                        {lbType === 'subject' && (
                            <div className="relative min-w-[200px] animate-in fade-in slide-in-from-right-4 duration-300">
                                <select
                                    value={lbSubject}
                                    onChange={(e) => setLbSubject(e.target.value)}
                                    className="w-full h-full px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold text-slate-700 outline-none appearance-none cursor-pointer"
                                >
                                    {subjects.map(sub => (
                                        <option key={sub} value={sub}>{sub === 'All' ? t('All Subjects') : sub}</option>
                                    ))}
                                </select>
                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Leaderboard List */}
                <div className="space-y-3">
                    {showRefreshing && (
                        <div className="flex items-center justify-center gap-3 py-4 animate-pulse">
                            <RefreshCcw className="animate-spin text-indigo-500" size={18} />
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{t('Syncing Live Ranks...')}</p>
                        </div>
                    )}

                    {leaderboard.length === 0 && !showRefreshing ? (
                        <div className="text-center py-20 bg-white rounded-[32px] border-2 border-dashed border-slate-100">
                            <Medal size={48} className="mx-auto text-slate-200 mb-4" />
                            <p className="text-sm font-bold text-slate-400">{t('No rankings available.')}</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {leaderboard.map((item, idx) => (
                                <div
                                    key={item.studentId || idx}
                                    className="group flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all active:scale-[0.99]"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`h-11 w-11 shrink-0 rounded-xl flex items-center justify-center text-[15px] font-black border ${getRankStyles(idx)}`}>
                                            {idx + 1}
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full border-2 border-white bg-slate-100 shadow-sm overflow-hidden flex items-center justify-center">
                                                {item.profileImage ? (
                                                    <img src={item.profileImage} alt={item.studentName} className="h-full w-full object-cover" />
                                                ) : (
                                                    <User size={18} className="text-slate-300" />
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-sm font-black text-slate-800 truncate leading-tight">{item.studentName}</p>
                                                <p className="text-[9px] font-bold text-indigo-500 uppercase tracking-tighter mt-1">{item.batchName || 'General'}</p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`text-lg font-black tracking-tight ${idx === 0 ? 'text-amber-500' : 'text-slate-800'}`}>{item.percentage}%</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest leading-none mt-1">{item.testCount} {t('Tests')}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <p className="text-center text-[9px] font-black text-slate-300 uppercase tracking-[0.3em] mt-12 mb-6">
                    ClassNexus RankEngine v3.2
                </p>
            </div>
        </StudentLayout>
    );
};

export default Leaderboard;