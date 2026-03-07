import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
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
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80">{test.subject} • Assessment</span>
                        <h3 className="text-xl sm:text-2xl font-black tracking-tight">{test.examName}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-10 w-10 rounded-2xl bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
                    >
                        <ChevronDown size={24} className="rotate-90 sm:rotate-0" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 sm:p-8 space-y-8 max-h-[70vh] overflow-y-auto">

                    {/* Summary Metrics */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Score Obtained</p>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black text-gray-900">{test.marksObtained}</span>
                                <span className="text-sm font-bold text-gray-400">/ {test.totalMarks}</span>
                            </div>
                        </div>
                        <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-1">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Percentage</p>
                            <div className="flex items-center gap-2">
                                <span className={`text-2xl font-black ${test.hasPassed ? 'text-emerald-600' : 'text-rose-600'}`}>{test.percentage}%</span>
                                {test.hasPassed ? <Award size={20} className="text-emerald-500" /> : <TrendingDown size={20} className="text-rose-500" />}
                            </div>
                        </div>
                    </div>

                    {/* Details Table */}
                    <div className="space-y-4">
                        <h4 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Detailed Assessment</h4>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                <span className="text-sm font-bold text-gray-500">Chapter</span>
                                <span className="text-sm font-black text-gray-800">{test.chapter}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                <span className="text-sm font-bold text-gray-500">Test Date</span>
                                <span className="text-sm font-black text-gray-800">{new Date(test.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-gray-50">
                                <span className="text-sm font-bold text-gray-500">Status</span>
                                <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-lg ${test.hasPassed ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-rose-50 text-rose-700 border border-rose-100'}`}>
                                    {test.hasPassed ? 'Pass / Excellent' : 'Needs Re-revision'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Teacher Remarks */}
                    <div className="space-y-4 bg-blue-50/50 p-6 rounded-md border border-blue-100/50">
                        <div className="flex items-center gap-2 text-blue-600">
                            <Award size={18} />
                            <h4 className="text-xs font-black uppercase tracking-[0.2em]">Teacher's Remarks</h4>
                        </div>
                        <p className="text-sm text-gray-700 italic font-medium leading-relaxed">
                            {test.remarks || "No specific feedback provided for this assessment."}
                        </p>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-2xl hover:bg-gray-800 transition-all active:scale-95 shadow-xl shadow-gray-200"
                    >
                        Close Details
                    </button>
                </div>
            </div>
        </div>
    );
};

const StudentResults = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Data states
    const [results, setResults] = useState([]);
    const [stats, setStats] = useState(null);
    const [studentInfo, setStudentInfo] = useState(null);
    const [weakSubjects, setWeakSubjects] = useState([]);
    const [leaderboard, setLeaderboard] = useState([]);
    const [leaderboardLoading, setLeaderboardLoading] = useState(false);

    // Filter states
    const [searchTerm, setSearchTerm] = useState('');
    const [subjectFilter, setSubjectFilter] = useState('All');
    const [statusFilter, setStatusFilter] = useState('All'); // 'All', 'Passed', 'Needs Work'
    const [sortOrder, setSortOrder] = useState('desc'); // 'desc' or 'asc'
    const [selectedTest, setSelectedTest] = useState(null);

    // Leaderboard Filter States
    const [lbType, setLbType] = useState('batch'); // 'batch' or 'subject'
    const [lbSubject, setLbSubject] = useState('');

    const fetchLeaderboard = async (type, subject) => {
        setLeaderboardLoading(true);
        try {
            const params = { type };
            if (type === 'subject' && subject) params.subject = subject;

            const response = await api.get('/api/student/results/leaderboard', { params });
            if (response.data.success) {
                setLeaderboard(response.data.leaderboard);
            }
        } catch (err) {
            console.error('Error fetching leaderboard:', err);
        } finally {
            setLeaderboardLoading(false);
        }
    };

    useEffect(() => {
        const token = localStorage.getItem('studentToken');
        if (!token) {
            navigate('/student/login');
            return;
        }

        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const resResponse = await api.get('/api/student/results');
                if (resResponse.data.success) {
                    setResults(resResponse.data.results);
                    setStats(resResponse.data.stats);
                    setWeakSubjects(resResponse.data.weakSubjects);
                    setStudentInfo(resResponse.data.studentInfo);
                }

                // Fetch initial batch leaderboard
                await fetchLeaderboard('batch');
            } catch (err) {
                console.error('Error fetching results:', err);
                if (err.response?.status === 401) {
                    localStorage.removeItem('studentToken');
                    navigate('/student/login');
                } else {
                    setError('Failed to load results data. Please try again later.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchInitialData();
    }, [navigate]);

    // Re-fetch leaderboard when filters change
    useEffect(() => {
        if (!loading) {
            fetchLeaderboard(lbType, lbSubject);
        }
    }, [lbType, lbSubject]);

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
                    label: 'Score Percentage',
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
                    label: (context) => `Score: ${context.parsed.y}%`
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

    if (loading) {
        return (
            <StudentLayout title="My Results">
                <div className="loader-wrap flex items-center justify-center p-8 sm:p-12">
                    <div className="flex flex-col items-center gap-4">
                        <RefreshCcw className="animate-spin text-blue-500" size={32} />
                        <p className="text-gray-500 text-sm sm:text-base text-center">Compiling your performance reports...</p>
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
                        <h1 className="text-xl sm:text-2xl font-bold text-gray-800">Academic Analytics</h1>
                        {studentInfo?.batchName && (
                            <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded border border-blue-100">{studentInfo.batchName}</span>
                        )}
                    </div>
                    <p className="text-gray-500 text-sm sm:text-base">View your test scores, track progress, and identify areas for improvement.</p>
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
                            <p className="text-xs sm:text-sm text-gray-500 font-medium">Tests Attempted</p>
                            <h3 className="text-xl sm:text-2xl font-bold text-gray-800">{stats?.totalTests || 0}</h3>
                        </div>
                    </div>

                    <div className="bg-white rounded-md shadow-sm border border-gray-100 p-4 sm:p-6 flex items-center gap-3 sm:gap-4">
                        <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                            <Award size={20} className="sm:hidden" />
                            <Award size={24} className="hidden sm:block" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-xs sm:text-sm text-gray-500 font-medium">Average Score</p>
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
                            <p className="text-xs sm:text-sm text-gray-500 font-medium">Warning Status</p>
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 truncate">
                                {weakSubjects.length > 0 ? `${weakSubjects.length} Weak Subjects` : 'On Track'}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Main Content Layout: Performance & Leaderboard */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

                    {/* Left Column: Progress & Weak Subjects (Takes 2 columns on big screens) */}
                    <div className="lg:col-span-2 space-y-4 sm:space-y-6">

                        {/* Progressive Chart Box */}
                        <div className="bg-white rounded-md shadow-sm border border-gray-100 p-4 sm:p-6">
                            <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                                <TrendingUp className="text-blue-500 shrink-0" size={18} />
                                <span>Progress Over Time</span>
                            </h3>
                            {results.length > 1 ? (
                                <div className="h-48 sm:h-64 w-full">
                                    <Line data={chartData} options={chartOptions} />
                                </div>
                            ) : (
                                <div className="h-48 sm:h-64 flex flex-col items-center justify-center text-gray-400 bg-gray-50 rounded-lg p-4">
                                    <BookOpen size={28} className="mb-2 opacity-50" />
                                    <p className="text-sm text-center">More test data needed to chart progress.</p>
                                </div>
                            )}
                        </div>

                        {/* Weak Subjects Alert Box - Interactive */}
                        {weakSubjects.length > 0 && (
                            <div className="bg-white rounded-md shadow-sm border border-orange-200 overflow-hidden">
                                <div className="p-4 sm:p-6 bg-orange-50/50 border-b border-orange-100">
                                    <h3 className="text-base sm:text-lg font-bold text-orange-800 mb-1 flex items-center gap-2">
                                        <AlertTriangle size={18} className="shrink-0" />
                                        <span>Priority Subject Focus</span>
                                    </h3>
                                    <p className="text-orange-700 text-[11px] sm:text-xs">Click on a subject to review weak chapters and teacher's feedback.</p>
                                </div>

                                <div className="p-4 sm:p-6 space-y-6">
                                    {/* Horizontal Tab List - Now Navigates to dedicated page */}
                                    <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar scroll-smooth">
                                        {weakSubjects.map((ws, idx) => (
                                            <button
                                                key={ws.subject}
                                                onClick={() => navigate(`/student/results/subject/${ws.subject}`)}
                                                className={`flex-shrink-0 px-5 py-3 rounded-2xl border-2 transition-all duration-300 flex flex-col items-start gap-1 min-w-[140px] bg-white border-gray-100 text-gray-500 hover:border-blue-200 hover:bg-blue-50/30 hover:shadow-lg hover:shadow-blue-50 group`}
                                            >
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400 group-hover:text-blue-500 transition-colors">{ws.subject}</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-lg font-black text-gray-800">{ws.percentage}%</span>
                                                    <TrendingDown size={14} className="text-orange-500" />
                                                </div>
                                                <div className="mt-2 text-[8px] font-black uppercase text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    View Focus Audit →
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
                                <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-3 sm:mb-4">Complete Test History</h3>

                                {/* Filters Row 1: Search & Subject */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4 mb-3 sm:mb-4">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <input
                                            type="text"
                                            placeholder="Search by test name or chapter..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2 text-sm sm:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                    <div className="relative w-full sm:w-auto sm:min-w-[150px]">
                                        <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <select
                                            value={subjectFilter}
                                            onChange={(e) => setSubjectFilter(e.target.value)}
                                            className="w-full pl-9 pr-8 py-2 text-sm sm:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
                                        >
                                            {subjects.map(sub => (
                                                <option key={sub} value={sub}>{sub}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={16} />
                                    </div>
                                </div>

                                {/* Filters Row 2: Status & Sort */}
                                <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
                                    <div className="relative flex-1 sm:max-w-[200px]">
                                        <Award className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <select
                                            value={statusFilter}
                                            onChange={(e) => setStatusFilter(e.target.value)}
                                            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white font-medium"
                                        >
                                            <option value="All">All Statuses</option>
                                            <option value="Passed">Passed</option>
                                            <option value="Needs Work">Needs Work</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                    </div>

                                    <div className="relative flex-1 sm:max-w-[200px]">
                                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                        <select
                                            value={sortOrder}
                                            onChange={(e) => setSortOrder(e.target.value)}
                                            className="w-full pl-9 pr-8 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white font-medium"
                                        >
                                            <option value="desc">Newest First</option>
                                            <option value="asc">Oldest First</option>
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" size={14} />
                                    </div>
                                </div>
                            </div>

                            {/* Mobile Card View */}
                            <div className="block sm:hidden divide-y divide-gray-100">
                                {filteredResults.length === 0 ? (
                                    <div className="px-4 py-8 text-center text-gray-500 text-sm">
                                        No results match your criteria.
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
                                                    <div className="font-semibold text-gray-800 text-sm truncate">{r.examName}</div>
                                                    <div className="text-xs text-gray-500 truncate">{r.subject} • {r.chapter}</div>
                                                </div>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium border shrink-0 ${r.hasPassed
                                                    ? 'bg-green-50 text-green-700 border-green-200'
                                                    : 'bg-red-50 text-red-700 border-red-200'
                                                    }`}>
                                                    {r.hasPassed ? 'Passed' : 'Needs Work'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between text-sm">
                                                <div className="flex items-center gap-1.5 text-gray-500">
                                                    <Clock size={12} />
                                                    <span className="text-xs">
                                                        {new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                    </span>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-bold text-gray-800">{r.marksObtained}</span>
                                                    <span className="text-xs text-gray-500">/{r.totalMarks}</span>
                                                    <span className="text-xs text-gray-500 ml-1">({r.percentage}%)</span>
                                                </div>
                                            </div>
                                            {r.remarks && (
                                                <div className="bg-gray-50 p-2 rounded border border-gray-100 mt-1">
                                                    <p className="text-[10px] sm:text-xs text-gray-500 italic flex gap-1 items-start">
                                                        <span className="font-bold text-blue-600 not-italic shrink-0">Remark:</span> {r.remarks}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Desktop Table View */}
                            <div className="hidden sm:block overflow-x-auto">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-gray-50 text-gray-500 text-xs sm:text-sm">
                                            <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium">Test & Chapter</th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium">Date</th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium">Score</th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium">Teacher's Remark</th>
                                            <th className="px-4 sm:px-6 py-3 sm:py-4 font-medium">Status</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {filteredResults.length === 0 ? (
                                            <tr>
                                                <td colSpan="4" className="px-4 sm:px-6 py-8 text-center text-gray-500 text-sm">
                                                    No results match your criteria.
                                                </td>
                                            </tr>
                                        ) : (
                                            filteredResults.map((r, idx) => (
                                                <tr
                                                    key={r._id || r.id || idx}
                                                    className="hover:bg-gray-50 transition-colors cursor-pointer"
                                                    onClick={() => setSelectedTest(r)}
                                                >
                                                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                        <div className="font-semibold text-gray-800 text-sm sm:text-base">{r.examName}</div>
                                                        <div className="text-xs sm:text-sm text-gray-500">{r.subject} • {r.chapter}</div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-600">
                                                        <div className="flex items-center gap-1.5 sm:gap-2">
                                                            <Clock size={14} className="shrink-0" />
                                                            <span>{new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                        <div className="font-bold text-gray-800 text-sm sm:text-base">{r.marksObtained} <span className="text-xs sm:text-sm font-normal text-gray-500">/ {r.totalMarks}</span></div>
                                                        <div className="text-xs text-gray-500">{r.percentage}%</div>
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm text-gray-500 italic max-w-xs truncate" title={r.remarks}>
                                                        {r.remarks || '-'}
                                                    </td>
                                                    <td className="px-4 sm:px-6 py-3 sm:py-4">
                                                        <span className={`px-2 sm:px-2.5 py-1 rounded-full text-xs font-medium border ${r.hasPassed
                                                            ? 'bg-green-50 text-green-700 border-green-200'
                                                            : 'bg-red-50 text-red-700 border-red-200'
                                                            }`}>
                                                            {r.hasPassed ? 'Passed' : 'Needs Work'}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Leaderboard (Sticky on Desktop) */}
                    <div className="space-y-4 sm:space-y-6">
                        <div className="bg-gray-900 rounded-md shadow-xl border border-gray-800 p-6 sm:p-8 text-white sticky top-24">
                            <div className="flex items-center justify-between mb-8">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 text-yellow-400">
                                        <Trophy size={20} />
                                        <h3 className="text-lg font-black uppercase tracking-[0.1em]">Hall of Fame</h3>
                                    </div>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest pl-7">Top Academic Performers</p>
                                </div>
                                <div className="h-10 w-10 rounded-2xl bg-white/10 flex items-center justify-center text-white/40">
                                    <Award size={20} />
                                </div>
                            </div>

                            {/* Leaderboard Filters */}
                            <div className="flex gap-2 mb-8 p-1 bg-white/5 rounded-2xl border border-white/10">
                                <button
                                    onClick={() => setLbType('batch')}
                                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lbType === 'batch' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    My Batch
                                </button>
                                <button
                                    onClick={() => setLbType('subject')}
                                    className={`flex-1 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${lbType === 'subject' ? 'bg-white text-gray-900 shadow-lg' : 'text-gray-400 hover:text-white'}`}
                                >
                                    Global
                                </button>
                            </div>

                            {lbType === 'subject' && (
                                <div className="mb-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <select
                                        value={lbSubject}
                                        onChange={(e) => setLbSubject(e.target.value)}
                                        className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                    >
                                        <option value="">Select Subject</option>
                                        {subjects.filter(s => s !== 'All').map(sub => (
                                            <option key={sub} value={sub}>{sub}</option>
                                        ))}
                                    </select>
                                </div>
                            )}

                            {/* Ranking List */}
                            <div className="space-y-2">
                                {leaderboardLoading ? (
                                    <div className="flex flex-col items-center justify-center py-12 gap-3 text-gray-500">
                                        <RefreshCcw className="animate-spin" size={24} />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Updating Ranks...</p>
                                    </div>
                                ) : leaderboard.length === 0 ? (
                                    <div className="text-center py-12 text-gray-500 text-xs italic">
                                        No ranking data available for this selection.
                                    </div>
                                ) : (
                                    <div className="space-y-1">
                                        {leaderboard.map((student, idx) => (
                                            <div
                                                key={student.studentId || student.rollNo || idx}
                                                className={`flex items-center justify-between p-3 rounded-2xl transition-all border border-transparent hover:border-white/10 hover:bg-white/5 group`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-8 w-8 rounded-lg flex items-center justify-center text-xs font-black shadow-lg ${idx === 0 ? 'bg-yellow-400 text-yellow-900 scale-110' :
                                                        idx === 1 ? 'bg-gray-300 text-gray-900' :
                                                            idx === 2 ? 'bg-orange-400 text-orange-900' :
                                                                'bg-white/10 text-gray-400 group-hover:bg-white/20 group-hover:text-white'
                                                        }`}>
                                                        {idx + 1}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-bold text-gray-100">{student.studentName}</p>
                                                        <p className="text-[9px] font-black text-gray-500 uppercase tracking-tight">{student.batchName}</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className={`text-sm font-black ${idx === 0 ? 'text-yellow-400' : 'text-gray-100'}`}>{student.percentage}%</p>
                                                    <p className="text-[9px] font-bold text-gray-500 leading-none">{student.testCount} Tests</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Self Context (Optional) */}
                            <div className="mt-8 pt-8 border-t border-white/5 space-y-4">
                                <p className="text-[9px] font-black text-gray-500 uppercase tracking-[0.2em] text-center">Your Academic Standing</p>
                                <div className="bg-blue-600/20 border border-blue-500/30 rounded-2xl p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-900/40">
                                            <Award size={20} />
                                        </div>
                                        <div>
                                            <p className="text-xs font-black text-white">Elite Performer</p>
                                            <p className="text-[10px] font-bold text-blue-300">Keep pushin' forward!</p>
                                        </div>
                                    </div>
                                    <ChevronDown className="-rotate-90 text-blue-400" size={16} />
                                </div>
                            </div>
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