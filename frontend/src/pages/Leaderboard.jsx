import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, Award, RefreshCcw, AlertTriangle } from 'lucide-react';
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
        if (!token) {
            navigate('/student/login');
        }
    }, [navigate, token]);

    useEffect(() => {
        if (lbType === 'batch' && lbSubject !== 'All') {
            setLbSubject('All');
        }
    }, [lbType, lbSubject]);

    const { data: resultsSummary, isLoading: summaryLoading } = useQuery({
        queryKey: ['student', 'results', 'summary'],
        enabled: !!token,
        queryFn: async () => {
            try {
                const res = await api.get('/student/results', { params: { limit: 1 } });
                if (res.data.success) {
                    await setCached('student.results.summary', res.data);
                    return res.data;
                }
                throw new Error('Failed to load');
            } catch (err) {
                if (err.response?.status === 401) {
                    localStorage.removeItem('studentToken');
                    navigate('/student/login');
                    throw err;
                }
                const cached = await getCached('student.results.summary');
                if (cached) return cached;
                throw err;
            }
        },
        onError: () => setError(t('Failed to load leaderboard context.'))
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
                if (err.response?.status === 401) {
                    localStorage.removeItem('studentToken');
                    navigate('/student/login');
                    throw err;
                }
                const cached = await getCached(leaderboardCacheKey);
                if (cached) return cached;
                throw err;
            }
        },
        onError: () => setError(t('Failed to load rankings.'))
    });

    const isLoading = summaryLoading || leaderboardLoading;
    const showRefreshing = leaderboardFetching && !leaderboardLoading;

    const getRankStyles = (idx) => {
        if (idx === 0) return 'bg-yellow-400 text-yellow-900 scale-110 shadow-yellow-500/20';
        if (idx === 1) return 'bg-gray-300 text-gray-900 shadow-gray-400/20';
        if (idx === 2) return 'bg-orange-400 text-orange-900 shadow-orange-500/20';
        return 'bg-white/10 text-gray-400 group-hover:bg-white/20 group-hover:text-white';
    };

    if (isLoading) {
        return (
            <StudentLayout title="Leaderboard">
                <div className="max-w-4xl mx-auto pb-12 space-y-6">
                    <div className="bg-gray-900 rounded-md p-10 space-y-8">
                        <div className="flex items-center justify-between">
                            <div className="space-y-2">
                                <Skeleton className="h-8 w-48 bg-gray-800" />
                                <Skeleton className="h-3 w-64 bg-gray-800" />
                            </div>
                            <Skeleton className="h-12 w-12 rounded-md bg-gray-800" />
                        </div>
                        <Skeleton className="h-14 w-full rounded-md bg-gray-800" />
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map(i => (
                                <div key={i} className="flex items-center justify-between p-4 bg-gray-800/50 rounded-md">
                                    <div className="flex items-center gap-4">
                                        <Skeleton className="h-10 w-10 rounded-md bg-gray-800" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-4 w-32 bg-gray-800" />
                                            <Skeleton className="h-3 w-20 bg-gray-800" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-8 w-16 bg-gray-800" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout title="Hall of Fame">
            <div className="max-w-4xl mx-auto pb-12">

                <div className="space-y-4 sm:space-y-6">
                    {error && (
                        <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center gap-2 text-sm border border-red-100">
                            <AlertTriangle size={16} />
                            <span>{error}</span>
                        </div>
                    )}

                    <div className="bg-gray-900 rounded-md shadow-xl border border-gray-800 p-6 sm:p-10 text-white">
                        <div className="flex items-center justify-between mb-10">
                            <div className="space-y-1">
                                <div className="flex items-center gap-3 text-yellow-400">
                                    <Trophy size={28} />
                                    <h3 className="text-2xl font-black uppercase tracking-tight">{t('Hall of Fame')}</h3>
                                </div>
                                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] pl-10">{t('Top Academic Performers')}</p>
                            </div>
                            <div className="h-12 w-12 rounded-md bg-white/5 border border-white/10 flex items-center justify-center text-white/20">
                                <Award size={24} />
                            </div>
                        </div>

                        <div className="flex gap-3 mb-10 p-1.5 bg-white/5 rounded-md border border-white/10">
                            <button
                                onClick={() => { setLbType('batch'); setLbSubject('All'); }}
                                className={`flex-1 py-3 rounded-md text-xs font-black uppercase tracking-widest transition-all duration-300 ${lbType === 'batch' ? 'bg-white text-gray-900 shadow-xl' : 'text-gray-400 hover:text-white'}`}
                            >
                                {t('My Batch')}
                            </button>
                            <button
                                onClick={() => setLbType('subject')}
                                className={`flex-1 py-3 rounded-md text-xs font-black uppercase tracking-widest transition-all duration-300 ${lbType === 'subject' ? 'bg-white text-gray-900 shadow-xl' : 'text-gray-400 hover:text-white'}`}
                            >
                                {t('Global')}
                            </button>
                        </div>

                        {lbType === 'subject' && (
                            <div className="mb-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-3 block ml-1">{t('Filter by Subject')}</label>
                                <select
                                    value={lbSubject}
                                    onChange={(e) => setLbSubject(e.target.value)}
                                    className="w-full px-5 py-4 bg-gray-800 border border-gray-700 rounded-md text-sm font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                                >
                                    {subjects.map(sub => (
                                        <option key={sub} value={sub}>{sub === 'All' ? t('All Subjects') : sub}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="space-y-2">
                            {showRefreshing && (
                                <div className="flex items-center justify-center gap-3 py-6 text-gray-500">
                                    <RefreshCcw className="animate-spin" size={20} />
                                    <p className="text-xs font-black uppercase tracking-[0.2em]">{t('Updating Ranks...')}</p>
                                </div>
                            )}

                            {!showRefreshing && leaderboard.length === 0 ? (
                                <div className="text-center py-20 bg-white/5 rounded-md border border-dashed border-white/10">
                                    <div className="flex flex-col items-center gap-4 text-gray-600">
                                        <Medal size={48} className="opacity-20" />
                                        <p className="text-xs font-bold uppercase tracking-widest italic">{t('No ranking data available yet.')}</p>
                                    </div>
                                </div>
                            ) : (
                                leaderboard.length > 0 && (
                                    <div className="space-y-1">
                                        {leaderboard.map((item, idx) => (
                                            <div
                                                key={item.studentId || item.rollNo || idx}
                                                className="flex items-center justify-between p-4 rounded-md transition-all border border-transparent hover:border-white/10 hover:bg-white/5 group"
                                            >
                                                <div className="flex items-center gap-4">
                                                    <div className={`h-10 w-10 rounded-md flex items-center justify-center text-sm font-black shadow-lg transition-transform group-hover:scale-110 ${getRankStyles(idx)}`}>
                                                        {idx + 1}
                                                    </div>
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-10 w-10 rounded-md bg-white/10 border border-white/5 flex items-center justify-center overflow-hidden shrink-0">
                                                            {item.profileImage ? (
                                                                <img src={item.profileImage} alt={item.studentName} className="h-full w-full object-cover" />
                                                            ) : (
                                                                <span className="text-white/40 font-black">{item.studentName?.[0] || 'S'}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-black text-gray-100 group-hover:text-white transition-colors">{item.studentName}</p>
                                                            <p className="text-[10px] font-black text-gray-500 uppercase tracking-tight mt-0.5">{item.batchName}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-xl font-black ${idx === 0 ? 'text-yellow-400' : 'text-gray-100'} group-hover:scale-105 transition-transform origin-right`}>{item.percentage}%</p>
                                                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-0.5">{item.testCount} {t('Tests')}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default Leaderboard;
