import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import { 
    BadgeCheck, Calendar, Clock, CheckCircle2, 
    XCircle, AlertCircle, ChevronRight, BookOpen,
    ArrowLeft, Loader2
} from 'lucide-react';
import Skeleton from '../components/Skeleton';
import { useQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import { useLanguage } from '../context/LanguageContext';

// --- Components ---

const AttendanceCard = ({ label, value, sub, icon: Icon, color, bg }) => (
    <div className="bg-white p-5 rounded-md border border-gray-100 shadow-sm transition-all hover:shadow-md">
        <div className={`h-10 w-10 ${bg} ${color} rounded-full flex items-center justify-center mb-3`}>
            <Icon size={20} />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{label}</p>
        <p className="text-2xl font-black text-gray-900">{value}</p>
        <p className="text-[10px] text-gray-400 font-bold mt-1">{sub}</p>
    </div>
);

// --- Main Page ---

const StudentAttendance = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [error, setError] = useState('');
    const apiBaseUrl = api.defaults.baseURL || '/api';
    const token = localStorage.getItem('studentToken');

    useEffect(() => {
        if (!token) {
            navigate('/student/login');
        }
    }, [navigate, token]);

    const { data: student, isLoading } = useQuery({
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
        onError: () => {
            setError(t('Failed to load attendance data.'));
        }
    });

    if (isLoading) {
        return (
            <StudentLayout title="Attendance">
                <div className="page-hdr mb-8">
                    <Skeleton className="h-8 w-48 mb-2" />
                    <Skeleton className="h-4 w-64" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                    {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 w-full rounded-md" />)}
                </div>
                <Skeleton className="h-64 w-full rounded-md" />
            </StudentLayout>
        );
    }

    if (!student) {
        return (
            <StudentLayout title="Attendance">
                <div className="px-4 py-10">
                    <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5 space-y-3">
                        <div className="flex items-center gap-3 text-rose-600">
                            <AlertCircle size={18} />
                            <p className="text-sm font-bold">{t('Attendance data could not be loaded.')}</p>
                        </div>
                        <p className="text-xs text-gray-600 leading-relaxed">
                            {error || t('This build is trying to reach {{url}}. If you are using the local backend, keep it running and connect the phone to the same Wi-Fi.', { url: apiBaseUrl })}
                        </p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="w-full h-11 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-md"
                        >
                            {t('Retry')}
                        </button>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    const { attendanceSummary: summary, attendanceSubjects: subjects = [] } = student;

    return (
        <StudentLayout title="Attendance">
            <div className="page-hdr mb-8">
                <h1 className="text-2xl font-black text-gray-900">{t('Attendance Dashboard')}</h1>
                <p className="text-gray-500 font-medium">{t('Track your presence across all academic subjects.')}</p>
            </div>

            {error && <div className="alert alert-error mb-6">⚠ {error}</div>}

            {/* 1. Summary Section */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <AttendanceCard 
                    label={t('Total Classes')} 
                    value={summary?.total || 0} 
                    sub={t('Cumulative Sessions')} 
                    icon={Calendar} 
                    color="text-indigo-600" 
                    bg="bg-indigo-50" 
                />
                <AttendanceCard 
                    label={t('Classes Attended')} 
                    value={summary?.present || 0} 
                    sub={t('Sessions Present')} 
                    icon={CheckCircle2} 
                    color="text-emerald-600" 
                    bg="bg-emerald-50" 
                />
                <AttendanceCard 
                    label={t('Overall Percentage')} 
                    value={`${summary?.percentage || 0}%`} 
                    sub={t('Presence Rating')} 
                    icon={BadgeCheck} 
                    color="text-blue-600" 
                    bg="bg-blue-50" 
                />
            </div>

            {/* 2. Subject Breakdown Section */}
            <div>
                <div className="flex items-center gap-2 mb-4 px-1">
                    <BookOpen size={18} className="text-gray-400" />
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-wider">{t('Subject-wise Analytics')}</h3>
                </div>

                {subjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {subjects.map((sub, idx) => (
                            <div 
                                key={idx} 
                                onClick={() => navigate(`/student/attendance/${sub.subjectId}`)}
                                className="group bg-white p-6 rounded-md border border-gray-100 shadow-sm hover:border-blue-200 hover:shadow-md transition-all cursor-pointer relative overflow-hidden"
                            >
                                {/* Progress Bar Background */}
                                <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-50">
                                    <div 
                                        className={`h-full transition-all duration-1000 ${sub.percentage >= 75 ? 'bg-emerald-500' : sub.percentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'}`}
                                        style={{ width: `${sub.percentage}%` }}
                                    ></div>
                                </div>

                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-0.5">{sub.subjectCode}</p>
                                        <h4 className="text-base font-black text-gray-900 group-hover:text-blue-600 transition-colors uppercase leading-tight">{sub.subjectName}</h4>
                                    </div>
                                    <div className={`text-xl font-black ${sub.percentage >= 75 ? 'text-emerald-600' : sub.percentage >= 60 ? 'text-amber-600' : 'text-rose-600'}`}>
                                        {sub.percentage}%
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{t('Total Classes')}</p>
                                        <p className="text-sm font-black text-gray-800">{sub.total}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-md border border-gray-100">
                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">{t('Attended')}</p>
                                        <p className="text-sm font-black text-gray-800">{sub.present}</p>
                                    </div>
                                </div>

                                <div className="mt-4 flex items-center justify-between text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    <span>{t('View Details')}</span>
                                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-16 bg-white rounded-md border border-dashed border-gray-200 text-center">
                        <div className="h-12 w-12 bg-gray-50 text-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                            <BookOpen size={24} />
                        </div>
                        <p className="text-sm font-bold text-gray-400">{t('No subject attendance data available yet.')}</p>
                    </div>
                )}
            </div>

            <div className="mt-12 p-6 bg-blue-50 border border-blue-100 rounded-md flex items-start gap-4">
                <div className="mt-1 text-blue-500">
                    <AlertCircle size={20} />
                </div>
                <div>
                    <h4 className="text-sm font-bold text-blue-900 mb-1">{t('Academic Requirement')}</h4>
                    <p className="text-xs text-blue-700 leading-relaxed font-medium">
                        {t('Students must maintain at least 75% attendance in each subject to be eligible for final examinations. For any disputes regarding your status, please visit the HOD office.')}
                    </p>
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentAttendance;
