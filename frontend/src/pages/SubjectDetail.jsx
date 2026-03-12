import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import {
    Award, TrendingDown, BookOpen, AlertTriangle,
    ChevronLeft, Clock, RefreshCcw, ChevronDown
} from 'lucide-react';
import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import { useLanguage } from '../context/LanguageContext';

const TestDetailModal = ({ test, onClose }) => {
    const { t, language } = useLanguage();
    if (!test) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
            <div
                className="bg-white rounded-md w-full max-w-xl overflow-hidden shadow-2xl animate-in zoom-in-95 slide-in-from-bottom-4 duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className={`p-6 sm:p-8 flex items-center justify-between text-white ${test.hasPassed ? 'bg-gradient-to-br from-emerald-500 to-teal-600' : 'bg-gradient-to-br from-rose-500 to-orange-600'}`}>
                    <div className="space-y-1">
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{test.subject} • {t('Assessment')}</span>
                        <h3 className="text-xl sm:text-2xl font-black tracking-tight">{test.examName}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-10 w-10 rounded-md bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                        <ChevronDown size={24} className="rotate-90 sm:rotate-0" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-md bg-gray-50 border border-gray-100 space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Score Obtained')}</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-gray-900">{test.marksObtained}</span>
                                <span className="text-sm font-bold text-gray-400">/ {test.totalMarks}</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-md bg-gray-50 border border-gray-100 space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Percentage')}</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-2xl font-black ${test.hasPassed ? 'text-emerald-600' : 'text-rose-600'}`}>{test.percentage}%</span>
                                {test.hasPassed ? <Award size={20} className="text-emerald-500" /> : <TrendingDown size={20} className="text-rose-500" />}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">{t('Detailed Assessment')}</h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                <span className="text-sm font-bold text-gray-500">{t('Chapter')}</span>
                                <span className="text-sm font-black text-gray-800">{test.chapter}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                <span className="text-sm font-bold text-gray-500">{t('Test Date')}</span>
                                <span className="text-sm font-black text-gray-800">{new Date(test.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                <span className="text-sm font-bold text-gray-500">{t('Status')}</span>
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${test.hasPassed ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                    {test.hasPassed ? t('Pass / Excellent') : t('Needs Re-revision')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4 bg-blue-50/50 p-6 rounded-md border border-blue-100/50">
                        <div className="flex items-center gap-2 text-blue-600">
                            <Award size={18} />
                            <h4 className="text-xs font-black uppercase tracking-[0.2em]">{t("Teacher's Remarks")}</h4>
                        </div>
                        <p className="text-sm text-gray-700 italic font-medium leading-relaxed">
                            {test.remarks || t('No specific feedback provided for this assessment.')}
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-md hover:bg-gray-800 transition-all active:scale-95 shadow-xl shadow-gray-200"
                    >
                        {t('Close Details')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const SubjectDetail = () => {
    const { subjectName } = useParams();
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [error, setError] = useState('');
    const [selectedTest, setSelectedTest] = useState(null);
    const token = localStorage.getItem('studentToken');

    useEffect(() => {
        if (!token) {
            navigate('/student/login');
        }
    }, [navigate, token]);

    const { data: student, isLoading: studentLoading } = useQuery({
        queryKey: ['student', 'me'],
        enabled: !!token,
        queryFn: async () => {
            try {
                const res = await api.get('/student/me');
                if (res.data.success) {
                    await setCached('student.me', res.data.student);
                    return res.data.student;
                }
                throw new Error('Failed to load');
            } catch (err) {
                if (err.response?.status === 401) {
                    localStorage.removeItem('studentToken');
                    navigate('/student/login');
                    throw err;
                }
                const cached = await getCached('student.me');
                if (cached) return cached;
                throw err;
            }
        },
        onError: () => setError(t('Failed to load profile data.'))
    });

    const fetchSubjectPage = async ({ pageParam }) => {
        const cacheKey = `student.results.subject.${subjectName}`;
        try {
            const params = { limit: 25, subject: subjectName };
            if (pageParam) params.cursor = pageParam;
            const resResponse = await api.get('/student/results', { params });
            if (resResponse.data.success) {
                if (!pageParam) await setCached(cacheKey, resResponse.data);
                return resResponse.data;
            }
            throw new Error('Failed to load results');
        } catch (err) {
            if (err.response?.status === 401) {
                localStorage.removeItem('studentToken');
                navigate('/student/login');
                throw err;
            }
            if (!pageParam) {
                const cached = await getCached(cacheKey);
                if (cached) return cached;
            }
            throw err;
        }
    };

    const {
        data,
        isLoading: resultsLoading,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage
    } = useInfiniteQuery({
        queryKey: ['student', 'results', 'subject', subjectName],
        enabled: !!token,
        queryFn: fetchSubjectPage,
        getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
        onError: () => setError(t('Failed to load subject analytics.'))
    });

    const results = useMemo(() => (data?.pages || []).flatMap(page => page.results || []), [data]);

    const activeTeacher = useMemo(() => {
        if (!student || !student.subjectTeachers) return null;
        return student.subjectTeachers.find(st => st.subject === subjectName)?.teacher;
    }, [student, subjectName]);

    const weakChapters = useMemo(() => {
        return results.filter(r => !r.hasPassed);
    }, [results]);

    if (studentLoading || resultsLoading) {
        return (
            <StudentLayout title={subjectName}>
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <RefreshCcw className="animate-spin text-blue-500" size={32} />
                    <p className="text-gray-500 font-medium">{t('Loading {{subject}} analytics...', { subject: subjectName })}</p>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout title={`${subjectName} ${t('Analysis')}`}>
            <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-8 animate-in fade-in duration-500">

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center gap-2 text-sm border border-red-100">
                        <AlertTriangle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {/* Header Area */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="space-y-4">
                        <button
                            onClick={() => navigate('/student/results')}
                            className="flex items-center gap-2 text-gray-500 hover:text-gray-800 transition-colors group w-fit"
                        >
                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-all">
                                <ChevronLeft size={18} />
                            </div>
                            <span className="text-sm font-bold">{t('Back to Performance Dashboard')}</span>
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-md bg-gray-900 flex items-center justify-center text-white shadow-xl shadow-gray-200">
                                <BookOpen size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{subjectName}</h2>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-md border border-blue-100">{student?.batchName || t('Loading Batch...')}</span>
                                    <span className="text-gray-300">•</span>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{results.length} {t('Total Assessments')}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {activeTeacher && (
                        <div className="bg-white p-4 rounded-md border border-gray-100 shadow-sm flex items-center gap-4 animate-in slide-in-from-right-4 duration-500">
                            <div className="h-12 w-12 rounded-md bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-inner">
                                <Award size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Subject Specialist')}</p>
                                <p className="text-sm font-black text-gray-800">{activeTeacher}</p>
                            </div>
                        </div>
                    )}
                </div>

                {/* Audit Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8">

                    {/* Left: Weak Chapters (Audit) */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-md shadow-sm border border-orange-200 overflow-hidden sticky top-24">
                            <div className="p-6 bg-gradient-to-br from-orange-50 to-white border-b border-orange-100">
                                <h3 className="text-lg font-black text-orange-900 flex items-center gap-2 mb-1">
                                    <AlertTriangle size={20} className="text-orange-500" />
                                    <span>{t('Weak Chapters')}</span>
                                </h3>
                                <p className="text-orange-700/70 text-xs font-medium">{t('High priority areas requiring revision.')}</p>
                            </div>
                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {weakChapters.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
                                        <Award size={48} className="mb-3 opacity-20 text-emerald-500" />
                                        <p className="text-sm font-bold">{t('No Weak Chapters!')}</p>
                                        <p className="text-[10px] uppercase mt-1">{t('Excellent performance maintained.')}</p>
                                    </div>
                                ) : (
                                    weakChapters.map((wc, idx) => (
                                        <div
                                            key={wc._id || idx}
                                            className="p-4 rounded-md bg-gray-50 border border-gray-100 space-y-3 hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer group"
                                            onClick={() => setSelectedTest(wc)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-gray-800 text-sm truncate pr-2 group-hover:text-orange-700 transition-colors">{wc.chapter}</h4>
                                                <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">{wc.percentage}%</span>
                                            </div>
                                            {wc.remarks && (
                                                <div className="bg-white/60 p-3 rounded-md border border-gray-100 group-hover:bg-white transition-colors">
                                                    <p className="text-[10px] text-gray-500 italic leading-relaxed line-clamp-2">
                                                        <span className="font-black text-blue-500 inline-block mr-1 not-italic opacity-70">{t('REMARK:')}</span>
                                                        {wc.remarks}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right: History Timeline */}
                    <div className="lg:col-span-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-black text-gray-900 flex items-center gap-2">
                                <Clock size={20} className="text-blue-500" />
                                <span>{t('Subject Testimony')}</span>
                            </h3>
                        </div>

                        <div className="space-y-4">
                            {results.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-md border border-dashed border-gray-200">
                                    <p className="text-gray-400 font-medium">{t('No assessment history for this subject.')}</p>
                                </div>
                            ) : (
                                results.map((r, idx) => (
                                    <div
                                        key={r._id || idx}
                                        className="relative bg-white rounded-md p-4 sm:p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer group flex flex-col sm:flex-row gap-4 sm:gap-6 sm:items-center"
                                        onClick={() => setSelectedTest(r)}
                                    >
                                        {/* Header / Score Area (Mobile Layout Changes) */}
                                        <div className="flex justify-between items-start sm:items-center sm:w-auto w-full gap-4">

                                            {/* Exam Info (Mobile Only - This moves to the right on desktop) */}
                                            <div className="sm:hidden flex-1 min-w-0">
                                                <h4 className="text-base font-black text-gray-800 line-clamp-2 group-hover:text-blue-600 transition-colors uppercase tracking-tight leading-tight mb-1">{r.examName}</h4>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">{r.chapter}</p>
                                            </div>

                                            {/* Score Block */}
                                            <div className={`h-10 sm:h-14 px-3 sm:px-4 min-w-[4rem] sm:min-w-[5rem] rounded-md flex-shrink-0 flex items-baseline justify-center gap-1 border-2 transition-colors ${r.hasPassed ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
    <span className="text-lg sm:text-2xl font-black leading-none">{r.marksObtained}</span>
    <span className="text-[10px] sm:text-xs font-bold opacity-70 leading-none">/ {r.totalMarks}</span>
</div>
                                        </div>

                                        {/* Content Body */}
                                        <div className="flex-1 min-w-0 space-y-3 sm:space-y-3">

                                            {/* Desktop Exam Info & Status Badge */}
                                            <div className="flex flex-row items-center justify-between gap-2">

                                                {/* Desktop Exam Info (Hidden on mobile as it's at the top) */}
                                                <div className="hidden sm:block">
                                                    <h4 className="text-lg font-black text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{r.examName}</h4>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{r.chapter}</p>
                                                </div>

                                                {/* Status Badge */}
                                                <span className={`w-fit px-2.5 py-1 sm:px-3 sm:py-1 rounded-full text-[9px] sm:text-[10px] font-black uppercase tracking-widest border ${r.hasPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                                    {r.hasPassed ? t('Qualified') : t('Needs Revision')}
                                                </span>
                                            </div>

                                            {/* Remarks / Feedback Block */}
                                            {r.remarks && (
                                                <div className="bg-gray-50/50 p-3 sm:p-4 rounded-md border border-gray-100/50 group-hover:bg-blue-50/30 transition-colors">
                                                    <div className="flex items-center gap-2 mb-1 opacity-60">
                                                        <Award size={12} className="text-blue-500 sm:w-[14px] sm:h-[14px]" />
                                                        <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest">{t('Feedback')}</span>
                                                    </div>
                                                    <p className="text-xs sm:text-sm text-gray-600 italic font-medium leading-relaxed">
                                                        {r.remarks}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Metadata (Date & Performance) */}
                                            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-1 sm:pt-2 border-t border-gray-50 sm:border-transparent mt-2 sm:mt-0">
                                                <div className="flex items-center gap-1.5 text-gray-400">
                                                    <Clock size={12} className="shrink-0" />
                                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase">{new Date(r.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-400">
                                                    <TrendingDown size={12} className={`shrink-0 ${r.percentage >= 60 ? 'rotate-180 text-emerald-500' : 'text-rose-500'}`} />
                                                    <span className="text-[9px] sm:text-[10px] font-bold uppercase">{r.percentage}% Performance</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}

                            {hasNextPage && (
                                <div className="flex justify-center pt-4">
                                    <button
                                        onClick={() => fetchNextPage()}
                                        disabled={isFetchingNextPage}
                                        className="px-6 py-3 rounded-md bg-gray-900 text-white text-xs font-black uppercase tracking-widest hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
                                    >
                                        {isFetchingNextPage ? t('Loading more...') : t('Load more results')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <TestDetailModal
                test={selectedTest}
                onClose={() => setSelectedTest(null)}
            />
        </StudentLayout>
    );
};

export default SubjectDetail;
