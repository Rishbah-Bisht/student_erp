import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Skeleton from '../components/Skeleton';
import { BookOpen, User, ArrowRight, GraduationCap, Search, AlertTriangle } from 'lucide-react';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import { useQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import { useLanguage } from '../context/LanguageContext';

const StudentSubjects = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState('');
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
        onError: () => setError(t('Failed to load subjects.'))
    });

    const subjects = student?.subjectTeachers || [];

    const filteredSubjects = useMemo(() => subjects.filter((subjectRow) => {
        const subjectName = String(subjectRow?.subject || '').toLowerCase();
        const teacherName = String(subjectRow?.teacher || '').toLowerCase();
        const query = searchTerm.toLowerCase();

        return subjectName.includes(query) || teacherName.includes(query);
    }), [subjects, searchTerm]);

    const getScoreTone = (score) => {
        if (score >= 75) {
            return {
                text: 'text-emerald-600',
                badge: 'bg-emerald-50 text-emerald-700 border-emerald-100',
                bar: 'bg-emerald-500',
                label: t('Strong')
            };
        }

        if (score >= 40) {
            return {
                text: 'text-amber-600',
                badge: 'bg-amber-50 text-amber-700 border-amber-100',
                bar: 'bg-amber-500',
                label: t('Stable')
            };
        }

        return {
            text: 'text-rose-600',
            badge: 'bg-rose-50 text-rose-700 border-rose-100',
            bar: 'bg-rose-500',
            label: t('Needs Focus')
        };
    };

    if (isLoading) {
        return (
            <StudentLayout title="My Subjects">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6 sm:space-y-8">

                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 sm:gap-6">

                        <div>
                            <Skeleton className="h-8 sm:h-10 w-40 sm:w-64 mb-2" />
                            <Skeleton className="h-3 sm:h-4 w-56 sm:w-80" />
                        </div>

                        <Skeleton className="h-10 sm:h-12 w-full sm:w-80 rounded-md" />

                    </div>

                    {/* Subjects Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">

                        {[1, 2, 3, 4, 5, 6].map(i => (
                            <div
                                key={i}
                                className="bg-white rounded-md border border-gray-100 p-4 sm:p-6 space-y-3 sm:space-y-4"
                            >

                                <Skeleton className="h-10 w-10 sm:h-12 sm:w-12 rounded-md" />

                                <Skeleton className="h-5 sm:h-6 w-3/4" />

                                <Skeleton className="h-3 sm:h-4 w-1/2" />

                                <div className="space-y-2 pt-2 sm:pt-4">
                                    <Skeleton className="h-2 w-full" />
                                    <Skeleton className="h-2 w-full" />
                                </div>

                            </div>
                        ))}

                    </div>

                </div>
            </StudentLayout>
        );
    }

    return (
        <StudentLayout title="My Subjects">
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tight">{t('Academic Curriculum')}</h1>
                        <p className="text-gray-500 font-medium mt-1">{t('Review your enrolled subjects, faculty guidance, and current performance in one place.')}</p>
                    </div>

                    <div className="flex w-full md:w-auto flex-col sm:flex-row gap-3 sm:items-center">
                        <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-black uppercase tracking-[0.24em] text-slate-500 shadow-sm">
                            <BookOpen size={14} className="text-slate-400" />
                            {filteredSubjects.length} {t('Subjects')}
                        </div>

                        <div className="relative w-full md:w-80">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder={t('Search subjects or teachers...')}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-2xl shadow-sm focus:ring-2 focus:ring-slate-900/10 focus:border-slate-400 outline-none transition-all font-medium text-sm"
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-md flex items-center gap-2 text-sm border border-red-100">
                        <AlertTriangle size={16} />
                        <span>{error}</span>
                    </div>
                )}

                {subjects.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
                        {filteredSubjects.length > 0 ? filteredSubjects.map((s, idx) => {
                            const averageMarks = Number.isFinite(Number(s.averageMarks))
                                ? Math.max(0, Math.min(100, Number(s.averageMarks)))
                                : 0;
                            const scoreTone = getScoreTone(averageMarks);
                            const teacherName = s.teacher === 'Unassigned'
                                ? t('Unassigned')
                                : s.teacher;

                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => navigate(`/student/results/subject/${s.subject}`)}
                                    className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-[0_20px_45px_-28px_rgba(15,23,42,0.35)] transition-all duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_30px_60px_-30px_rgba(15,23,42,0.35)] focus:outline-none focus:ring-2 focus:ring-slate-900/10 active:scale-[0.99]"
                                >
                                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-slate-900 via-slate-700 to-slate-400 opacity-80" />

                                    <div className="flex items-start justify-between gap-4">
                                        <div className="min-w-0 flex items-center gap-3">
                                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-200">
                                                <BookOpen size={20} />
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{t('Subject')}</p>
                                                <h3 className="mt-1 line-clamp-2 text-lg font-black leading-tight text-slate-900">
                                                    {s.subject}
                                                </h3>
                                            </div>
                                        </div>

                                        <div className={`inline-flex shrink-0 items-center rounded-full border px-3 py-1 text-xs font-black ${scoreTone.badge}`}>
                                            {averageMarks}%
                                        </div>
                                    </div>

                                    <div className="mt-5 space-y-3">
                                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{t('Faculty')}</p>
                                            <div className="mt-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                                                <User size={15} className="shrink-0 text-slate-400" />
                                                <span className="truncate">{teacherName}</span>
                                            </div>
                                        </div>

                                        <div className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-3">
                                            <div className="flex items-center justify-between gap-3">
                                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{t('Average Score')}</p>
                                                <span className={`text-xs font-black uppercase tracking-[0.18em] ${scoreTone.text}`}>
                                                    {scoreTone.label}
                                                </span>
                                            </div>

                                            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-100">
                                                <div
                                                    className={`h-full rounded-full transition-all duration-500 ${scoreTone.bar}`}
                                                    style={{ width: `${averageMarks}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                                        <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.24em] text-slate-400">
                                            <GraduationCap size={14} className="shrink-0" />
                                            {t('Subject Hub')}
                                        </span>

                                        <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition-all group-hover:border-slate-900 group-hover:text-slate-900">
                                            <ArrowRight size={17} />
                                        </span>
                                    </div>
                                </button>
                            );
                        }) : (
                            <div className="sm:col-span-2 xl:col-span-3 rounded-3xl border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
                                <div className="mx-auto max-w-sm space-y-4">
                                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300">
                                        <Search size={30} />
                                    </div>
                                    <h3 className="text-lg font-bold text-slate-900">{t('No subjects found')}</h3>
                                    <p className="text-sm text-slate-500">
                                        {t('Try a different subject or teacher name to refine your search.')}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-md border-2 border-dashed border-gray-200 p-12 text-center">
                        <div className="max-w-sm mx-auto space-y-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-md flex items-center justify-center mx-auto">
                                <Search size={32} className="text-gray-300" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900">{t('No subjects found')}</h3>
                            <p className="text-gray-500 text-sm">{t('We couldn\'t find any subjects assigned to your batch. Please contact the administration if this is an error.')}</p>
                        </div>
                    </div>
                )}
            </div>
        </StudentLayout>
    );
};

export default StudentSubjects;
