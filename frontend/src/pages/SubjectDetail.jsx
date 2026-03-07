import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import {
    Award, TrendingDown, BookOpen, AlertTriangle,
    ChevronLeft, Clock, RefreshCcw, ChevronDown
} from 'lucide-react';

const TestDetailModal = ({ test, onClose }) => {
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

const SubjectDetail = () => {
    const { subjectName } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [results, setResults] = useState([]);
    const [student, setStudent] = useState(null);
    const [selectedTest, setSelectedTest] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Fetch results and profile in parallel
                const [resResponse, profileResponse] = await Promise.all([
                    api.get('/api/student/results'),
                    api.get('/api/student/me')
                ]);

                if (resResponse.data.success) {
                    const filtered = resResponse.data.results.filter(r => r.subject === subjectName);
                    setResults(filtered);
                }

                if (profileResponse.data.success) {
                    setStudent(profileResponse.data.student);
                }
            } catch (err) {
                console.error('Error fetching subject detail data:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [subjectName]);

    const activeTeacher = useMemo(() => {
        if (!student || !student.subjectTeachers) return null;
        return student.subjectTeachers.find(st => st.subject === subjectName)?.teacher;
    }, [student, subjectName]);

    const weakChapters = useMemo(() => {
        return results.filter(r => !r.hasPassed);
    }, [results]);

    if (loading) {
        return (
            <StudentLayout title={subjectName}>
                <div className="flex flex-col items-center justify-center p-20 gap-4">
                    <RefreshCcw className="animate-spin text-blue-500" size={32} />
                    <p className="text-gray-500 font-medium">Loading {subjectName} analytics...</p>
                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout title={`${subjectName} Analysis`}>
            <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 space-y-8 animate-in fade-in duration-500">

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
                            <span className="text-sm font-bold">Back to Performance Dashboard</span>
                        </button>

                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-gray-900 flex items-center justify-center text-white shadow-xl shadow-gray-200">
                                <BookOpen size={32} />
                            </div>
                            <div>
                                <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{subjectName}</h2>
                                <div className="flex flex-wrap items-center gap-2 mt-1">
                                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[10px] font-black uppercase rounded-md border border-blue-100">{student?.batchName || 'Loading Batch...'}</span>
                                    <span className="text-gray-300">•</span>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{results.length} Total Assessments</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {activeTeacher && (
                        <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-4 animate-in slide-in-from-right-4 duration-500">
                            <div className="h-12 w-12 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center shadow-inner">
                                <Award size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Subject Specialist</p>
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
                                    <span>Weak Chapters</span>
                                </h3>
                                <p className="text-orange-700/70 text-xs font-medium">High priority areas requiring revision.</p>
                            </div>
                            <div className="p-6 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
                                {weakChapters.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-8 text-center text-gray-400">
                                        <Award size={48} className="mb-3 opacity-20 text-emerald-500" />
                                        <p className="text-sm font-bold">No Weak Chapters!</p>
                                        <p className="text-[10px] uppercase mt-1">Excellent performance maintained.</p>
                                    </div>
                                ) : (
                                    weakChapters.map((wc, idx) => (
                                        <div
                                            key={wc._id || idx}
                                            className="p-4 rounded-2xl bg-gray-50 border border-gray-100 space-y-3 hover:border-orange-200 hover:bg-orange-50/30 transition-all cursor-pointer group"
                                            onClick={() => setSelectedTest(wc)}
                                        >
                                            <div className="flex items-center justify-between">
                                                <h4 className="font-bold text-gray-800 text-sm truncate pr-2 group-hover:text-orange-700 transition-colors">{wc.chapter}</h4>
                                                <span className="text-xs font-black text-rose-600 bg-rose-50 px-2 py-0.5 rounded-lg border border-rose-100">{wc.percentage}%</span>
                                            </div>
                                            {wc.remarks && (
                                                <div className="bg-white/60 p-3 rounded-xl border border-gray-100 group-hover:bg-white transition-colors">
                                                    <p className="text-[10px] text-gray-500 italic leading-relaxed line-clamp-2">
                                                        <span className="font-black text-blue-500 inline-block mr-1 not-italic opacity-70">REMARK:</span>
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
                                <span>Subject Testimony</span>
                            </h3>
                        </div>

                        <div className="space-y-4">
                            {results.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-md border border-dashed border-gray-200">
                                    <p className="text-gray-400 font-medium">No assessment history for this subject.</p>
                                </div>
                            ) : (
                                results.map((r, idx) => (
                                    <div
                                        key={r._id || idx}
                                        className="relative bg-white rounded-md p-5 sm:p-6 border border-gray-100 shadow-sm hover:shadow-xl hover:border-blue-100 transition-all cursor-pointer group flex flex-col sm:flex-row gap-6 sm:items-center"
                                        onClick={() => setSelectedTest(r)}
                                    >
                                        <div className={`h-16 w-16 sm:h-20 sm:w-20 rounded-md flex-shrink-0 flex flex-col items-center justify-center border-2 transition-colors ${r.hasPassed ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                                            <span className="text-xl sm:text-2xl font-black">{r.marksObtained}</span>
                                            <span className="text-[10px] font-bold opacity-60">/ {r.totalMarks}</span>
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-3">
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                                <div>
                                                    <h4 className="text-base sm:text-lg font-black text-gray-800 line-clamp-1 group-hover:text-blue-600 transition-colors uppercase tracking-tight">{r.examName}</h4>
                                                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{r.chapter}</p>
                                                </div>
                                                <span className={`w-fit px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${r.hasPassed ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                                                    {r.hasPassed ? 'Qualified' : 'Needs Revision'}
                                                </span>
                                            </div>

                                            {r.remarks && (
                                                <div className="bg-gray-50/50 p-4 rounded-2xl border border-gray-100/50 group-hover:bg-blue-50/30 transition-colors">
                                                    <div className="flex items-center gap-2 mb-1.5 opacity-60">
                                                        <Award size={14} className="text-blue-500" />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Feedback</span>
                                                    </div>
                                                    <p className="text-sm text-gray-600 italic font-medium leading-relaxed">
                                                        {r.remarks}
                                                    </p>
                                                </div>
                                            )}

                                            <div className="flex items-center gap-4 pt-2">
                                                <div className="flex items-center gap-1.5 text-gray-400">
                                                    <Clock size={12} />
                                                    <span className="text-[10px] font-bold uppercase">{new Date(r.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                                </div>
                                                <div className="flex items-center gap-1.5 text-gray-400">
                                                    <TrendingDown size={12} className={r.percentage >= 60 ? 'rotate-180 text-emerald-500' : 'text-rose-500'} />
                                                    <span className="text-[10px] font-bold uppercase">{r.percentage}% Performance</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
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
