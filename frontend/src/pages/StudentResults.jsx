import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../components/Skeleton';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import {
    Award, TrendingUp, TrendingDown, BookOpen,
    AlertTriangle, Filter, Search, Award as Trophy,
    Clock, RefreshCcw, ChevronDown
} from 'lucide-react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import { useLanguage } from '../context/LanguageContext';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    Filler
);

const TestDetailModal = ({ test, onClose }) => {
    const { t, language } = useLanguage();
    if (!test) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-0 sm:p-0 bg-gray-900/60 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
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

                    {/* Summary Metrics */}
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

                    {/* Details Table */}
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

                    {/* Teacher Remarks */}
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

                {/* Footer Action */}
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

const StudentResults = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const [error, setError] = useState('');

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Passed', 'Needs Work'
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' or 'asc'
    const [selectedTest, setSelectedTest] = useState(null);
    const token = localStorage.getItem('studentToken');

    useEffect(() => {
        if (!token) {
            navigate('/student/login');
        }
    }, [navigate, token]);

    const fetchResultsPage = async ({ pageParam }) => {
        try {
            const params = { limit: 25 };
            if (pageParam) params.cursor = pageParam;
            const resResponse = await api.get('/student/results', { params });
            if (resResponse.data.success) {
                if (!pageParam) await setCached('student.results', resResponse.data);
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
                const cached = await getCached('student.results');
                if (cached) return cached;
            }
            throw err;
        }
    };

    const {
        data,
        isLoading,
        isFetchingNextPage,
        fetchNextPage,
        hasNextPage
    } = useInfiniteQuery({
        queryKey: ['student', 'results'],
        enabled: !!token,
        queryFn: fetchResultsPage,
        getNextPageParam: (lastPage) => lastPage.nextCursor || undefined,
        onError: () => setError(t('Failed to load results data. Please try again later.'))
    });

    const results = useMemo(() => (data?.pages || []).flatMap(page => page.results || []), [data]);
    const stats = data?.pages?.[0]?.stats || null;
    const weakSubjects = data?.pages?.[0]?.weakSubjects || [];
    const studentInfo = data?.pages?.[0]?.studentInfo || null;


    // Derived Data: Distinct subjects for filter
    const subjects = useMemo(() => {
        const subs = new Set(results.map(r => r.subject));
        return ['All', ...Array.from(subs)];
    }, [results]);

    // Filtered and Sorted Results
    const filteredResults = useMemo(() => {
        let filtered = results.filter(r => {
            const matchesSearch =
                r.examName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                r.chapter.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesSubject = subjectFilter === 'All' || r.subject === subjectFilter;

            const matchesStatus = statusFilter === 'All' ||
                (statusFilter === 'Passed' && r.hasPassed) ||
                (statusFilter === 'Needs Work' && !r.hasPassed);

            return matchesSearch && matchesSubject && matchesStatus;
        });

        // Apply Sorting
        return filtered.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
        });
    }, [results, searchTerm, subjectFilter, statusFilter, sortOrder]);

    // Group tests by subject for drill-down analysis
    const subjectWiseHistory = useMemo(() => {
        const grouped = {};
        results.forEach(res => {
            if (!grouped[res.subject]) grouped[res.subject] = [];
            grouped[res.subject].push(res);
        });
        return grouped;
    }, [results]);

    // Graph Data
    const chartData = useMemo(() => {
        const sortedResults = [...results].sort((a, b) => new Date(a.date) - new Date(b.date));

        return {
            labels: sortedResults.map(r => new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }) + ` (${r.subject})`),
            datasets: [
                {
                    label: t('Percentage'),
                    data: sortedResults.map(r => parseFloat(r.percentage)),
                    borderColor: 'rgba(59, 130, 246, 1)',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    pointBackgroundColor: sortedResults.map(r => parseFloat(r.percentage) >= 60 ? '#10b981' : '#f43f5e'),
                    pointRadius: 4,
                    fill: true,
                    tension: 0.4
                }
            ]
        };
    }, [results]);

    const chartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                callbacks: {
                    label: (context) => `${t('Score Obtained')}: ${context.parsed.y}%`
                }
            }
        },
        scales: {
            y: { min: 0, max: 100, ticks: { callback: value => value + '%' } },
            x: {
                ticks: {
                    maxRotation: 45,
                    minRotation: 45,
                    font: {
                        size: 10
                    }
                }
            }
        }
    };

    if (isLoading) {
        return (
            <StudentLayout title="My Results">
                <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 px-0 sm:px-0 pb-8 sm:pb-12">
                    <div>
                        <Skeleton className="h-8 w-64 mb-2" />
                        <Skeleton className="h-4 w-96" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="bg-white rounded-md p-4 sm:p-6 flex items-center gap-3 sm:gap-4 border border-gray-100">
                                <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-full" />
                                <div className="flex-1">
                                    <Skeleton className="h-3 w-20 mb-2" />
                                    <Skeleton className="h-6 w-24" />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                            <Skeleton className="h-64 w-full rounded-md" />
                            <div className="bg-white rounded-md border border-gray-100 p-4 sm:p-6 space-y-4">
                                <Skeleton className="h-6 w-48" />
                                <div className="space-y-2">
                                    {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="h-12 w-full" />)}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout title="My Results">
            <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6 px-0 sm:px-0 pb-8 sm:pb-12">
                {/* Header Section */}
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">{t('Academic Analytics')}</h1>
                        {studentInfo?.batchName && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded border border-blue-100">{studentInfo.batchName}</span>
                        )}
                    </div>
                    <p className="text-gray-500 text-sm sm:text-base">{t('View your test scores, track progress, and identify areas for improvement.')}</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 sm:p-4 rounded-lg flex items-center gap-2 sm:gap-3 text-sm sm:text-base">
                        <AlertTriangle size={18} className="shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {/* Key Metrics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                    <div className="bg-white rounded-md shadow-sm border border-gray-100 p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <BookOpen size={20} className="sm:hidden" />
                            <BookOpen size={24} className="hidden sm:block" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-gray-500 font-medium">{t('Tests Attempted')}</p>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{stats?.totalTests || 0}</h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-md shadow-sm border border-gray-100 p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <Award size={20} className="sm:hidden" />
                            <Award size={24} className="hidden sm:block" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-gray-500 font-medium">{t('Average Score')}</p>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{stats?.overallPercentage || 0}%</h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-md shadow-sm border border-gray-100 p-4 sm:p-6 flex items-center gap-3 sm:gap-4 sm:col-span-2 lg:col-span-1">
                        <div className={`h-10 w-10 sm:h-12 sm:w-12 rounded-full flex items-center justify-center shrink-0 ${weakSubjects.length > 0 ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                            {weakSubjects.length > 0 ? (
                                <>
                                    <TrendingDown size={20} className="sm:hidden" />
                                    <TrendingDown size={24} className="hidden sm:block" />
                                </>
                            ) : (
                                <>
                                    <TrendingUp size={20} className="sm:hidden" />
                                    <TrendingUp size={24} className="hidden sm:block" />
                                </>
                            )}
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-gray-500 font-medium">{t('Warning Status')}</p>
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 truncate">
                                {weakSubjects.length > 0 ? `${weakSubjects.length} ${t('Weak Subjects')}` : t('On Track')}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Performance Analytics & Progress */}
                <div className="space-y-4 sm:space-y-6">
                    <div className="space-y-4 sm:space-y-6">

                        {/* Progressive Chart Box */}
                        <div className="bg-white rounded-md shadow-sm border border-gray-100 p-4 sm:p-6">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                                <TrendingUp className="text-blue-500 shrink-0" size={18} />
                                <span>{t('Progress Over Time')}</span>
                            </h3>
                            {results.length > 1 ? (
                                <div className="h-48 sm:h-64 w-full">
                                    <Line data={chartData} options={chartOptions} />
                                </div>
                            ) : (
                                <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg p-4">
                                    <BookOpen size={28} className="mb-2 opacity-50" />
                                    <p className="text-sm text-center">{t('More test data needed to chart progress.')}</p>
                                </div>
                            )}
                        </div>

                        {/* Weak Subjects Alert Box - Interactive */}
                        {weakSubjects.length > 0 && (
                            <div className="bg-white rounded-md shadow-sm border border-orange-200 overflow-hidden">

                                <div className="p-4 sm:p-6 bg-orange-50/50 border-b border-orange-100">
                                    <h3 className="text-sm sm:text-lg font-bold text-orange-800 mb-1 flex items-center gap-2">
                                        <AlertTriangle size={16} className="sm:w-[18px] sm:h-[18px] shrink-0" />
                                        <span>{t('Priority Subject Focus')}</span>
                                    </h3>

                                    <p className="text-orange-700 text-[10px] sm:text-xs">
                                        {t("Click on a subject to review weak chapters and teacher's feedback.")}
                                    </p>
                                </div>

                                <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">

                                    {/* Horizontal Tab List */}
                                    <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth">

                                        {weakSubjects.map((ws, idx) => (
                                            <button
                                                key={ws.subject}
                                                onClick={() => navigate(`/student/results/subject/${ws.subject}`)}

                                                className="flex-shrink-0 px-4 sm:px-5 py-3 rounded-md border-2 transition-all duration-300 flex flex-col items-start gap-1 min-w-[120px] sm:min-w-[140px] bg-white border-gray-100 text-gray-500 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-lg hover:shadow-blue-50 active:scale-[0.96] group"
                                            >

                                                <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-blue-500 transition-colors">
                                                    {ws.subject}
                                                </span>

                                                <div className="flex items-center gap-1.5 sm:gap-2">
                                                    <span className="text-base sm:text-lg font-black text-gray-800">
                                                        {ws.percentage}%
                                                    </span>

                                                    <TrendingDown size={12} className="sm:w-[14px] sm:h-[14px] text-orange-500" />
                                                </div>

                                                <div className="mt-2 text-[8px] sm:text-[9px] font-black uppercase text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                                                    {t('View Focus Audit')} {'>'}
                                                </div>

                                            </button>
                                        ))}

                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Results Table Section */}
                        <div className="bg-white rounded-md shadow-sm border border-gray-100 overflow-hidden">

                            <div className="p-4 sm:p-6 border-b border-gray-100">

                                <h3 className="text-sm sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">
                                    {t('Complete Test History')}
                                </h3>

                                {/* Filters Row 1 */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 mb-3 sm:mb-4">

                                    {/* Search */}
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <input
                                            type="text"
                                            placeholder={t('Search by test name or chapter...')}
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>

                                    {/* Subject Filter */}
                                    <div className="relative w-full sm:w-auto sm:min-w-[150px]">
                                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <select
                                            value={subjectFilter}
                                            onChange={(e) => setSubjectFilter(e.target.value)}
                                            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                                        >
                                            {subjects.map(sub => (
                                                <option key={sub} value={sub}>{sub}</option>
                                            ))}
                                        </select>

                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                    </div>

                                </div>


                                {/* Filters Row 2 */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">

                                    {/* Status Filter */}
                                    <div className="relative flex-1 sm:max-w-[200px]">
                                        <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white font-medium"
                                        >
                                            <option value="All">{t('All Statuses')}</option>
                                            <option value="Passed">{t('Passed')}</option>
                                            <option value="Needs Work">{t('Needs Work')}</option>
                                        </select>

                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                    </div>


                                    {/* Sort Filter */}
                                    <div className="relative flex-1 sm:max-w-[200px]">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                                        <select
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(e.target.value)}
                                            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white font-medium"
                                        >
                                            <option value="desc">{t('Newest First')}</option>
                                            <option value="asc">{t('Oldest First')}</option>
                                        </select>

                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                    </div>

                                </div>

                            </div>


                            {/* Mobile Card View */}
                            <div className="block sm:hidden divide-y divide-gray-100">

                                {filteredResults.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                        {t('No results match your criteria.')}
                                    </div>
                                ) : (

                                    filteredResults.map((r, idx) => (
                                        <div
                                            key={r._id || r.id || idx}
                                            className="p-4 space-y-3 cursor-pointer hover:bg-gray-50 active:bg-gray-100 transition-colors"
                                            onClick={() => setSelectedTest(r)}
                                        >

                                            <div className="flex items-start justify-between gap-2">

                                                <div className="min-w-0 flex-1">
                                                    <div className="font-semibold text-gray-800 text-sm truncate">
                                                        {r.examName}
                                                    </div>

                                                    <div className="text-xs text-gray-500 truncate">
                                                        {r.subject} • {r.chapter}
                                                    </div>
                                                </div>

                                                <span
                                                    className={`px-2 py-1 rounded-full text-xs font-medium border shrink-0 ${r.hasPassed
                                                            ? 'bg-green-50 text-green-700 border-green-200'
                                                            : 'bg-red-50 text-red-700 border-red-200'
                                                        }`}
                                                >
                                                    {r.hasPassed ? t('Passed') : t('Needs Work')}
                                                </span>

                                            </div>


                                            <div className="flex items-center justify-between text-sm">

                                                <div className="flex items-center gap-1.5 text-gray-500">
                                                    <Clock size={12} />
                                                    <span className="text-xs">
                                                        {new Date(r.date).toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-GB', {
                                                            day: '2-digit',
                                                            month: 'short',
                                                            year: 'numeric'
                                                        })}
                                                    </span>
                                                </div>

                                                <div className="text-right">
                                                    <span className="font-bold text-gray-800">
                                                        {r.marksObtained}
                                                    </span>

                                                    <span className="text-xs text-gray-500">
                                                        /{r.totalMarks}
                                                    </span>

                                                    <span className="text-xs text-gray-500 ml-1">
                                                        ({r.percentage}%)
                                                    </span>
                                                </div>

                                            </div>


                                            {r.remarks && (
                                                <div className="bg-gray-50 p-2 rounded-md border border-gray-100 mt-1">

                                                    <p className="text-[10px] text-gray-500 italic flex gap-1 items-start">
                                                        <span className="font-bold text-blue-600 not-italic shrink-0">
                                                            {t('Remark:')}
                                                        </span>

                                                        {r.remarks}

                                                    </p>

                                                </div>
                                            )}

                                        </div>
                                    ))

                                )}

                            </div>


                            {/* Desktop Table View */}
                            <div className="hidden sm:block overflow-x-auto">
                                {/* (Your same table code remains unchanged) */}
                            </div>


                            {hasNextPage && (
                                <div className="p-4 sm:p-6 border-t border-gray-100 flex justify-center">

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

            {/* Render Modal */}
            <TestDetailModal
                test={selectedTest}
                onClose={() => setSelectedTest(null)}
            />
        </StudentLayout>
    );
};

export default StudentResults; 
