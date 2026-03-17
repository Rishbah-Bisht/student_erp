import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import {
    AlertCircle,
    AlertTriangle,
    BadgeCheck,
    BookOpen,
    Calendar,
    CheckCircle2,
    ChevronRight,
    Clock,
    Loader2,
    XCircle
} from 'lucide-react';
import Skeleton from '../components/Skeleton';
import { useQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import { useLanguage } from '../context/LanguageContext';

const getPercentageTone = (value) => {
    if (value >= 75) {
        return {
            text: 'text-emerald-600',
            soft: 'bg-emerald-50 text-emerald-700 border-emerald-100',
            bar: 'bg-emerald-500',
            label: 'Present'
        };
    }

    if (value >= 60) {
        return {
            text: 'text-amber-600',
            soft: 'bg-amber-50 text-amber-700 border-amber-100',
            bar: 'bg-amber-500',
            label: 'Attendance'
        };
    }

    return {
        text: 'text-rose-600',
        soft: 'bg-rose-50 text-rose-700 border-rose-100',
        bar: 'bg-rose-500',
        label: 'Absent'
    };
};

const getStatusBadgeClass = (status) => {
    if (status === 'Present') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'Late') return 'bg-amber-50 text-amber-700 border-amber-100';
    if (status === 'Absent') return 'bg-rose-50 text-rose-700 border-rose-100';
    return 'bg-slate-50 text-slate-600 border-slate-200';
};

const HeroMetric = ({ label, value, hint }) => (
    <div className="min-w-0 rounded-3xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">{label}</p>
        <p className="mt-2 break-words text-2xl font-black text-white">{value}</p>
        <p className="mt-1 break-words text-xs font-semibold text-white/70">{hint}</p>
    </div>
);

const SummaryCard = ({ icon: Icon, label, value, sub, tone }) => (
    <div className="min-w-0 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)]">
        <div className="flex items-start justify-between gap-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                <Icon size={18} />
            </div>
            <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${tone.soft}`}>
                {sub}
            </span>
        </div>
        <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
        <p className={`mt-2 break-words text-2xl font-black ${tone.text}`}>{value}</p>
    </div>
);

const SectionCard = ({ eyebrow, title, action = null, children }) => (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_55px_-35px_rgba(15,23,42,0.35)] sm:p-6">
        <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{eyebrow}</p>
                <h3 className="mt-2 text-xl font-black text-slate-900">{title}</h3>
            </div>
            {action ? <div className="w-full sm:w-auto">{action}</div> : null}
        </div>
        {children}
    </section>
);

const SubjectCard = ({ subject, onOpen, t }) => {
    const tone = getPercentageTone(subject.percentage || 0);

    return (
        <button
            type="button"
            onClick={onOpen}
            className="group w-full rounded-[28px] border border-slate-200 bg-white p-5 text-left shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)] transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-[0_30px_65px_-38px_rgba(15,23,42,0.35)]"
        >
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
                        {subject.subjectCode || t('Subject')}
                    </p>
                    <h4 className="mt-2 break-words text-lg font-black leading-tight text-slate-900">
                        {subject.subjectName}
                    </h4>
                </div>
                <span className={`shrink-0 rounded-full border px-3 py-1 text-xs font-black ${tone.soft}`}>
                    {subject.percentage || 0}%
                </span>
            </div>

            <div className="mt-5 rounded-3xl border border-slate-200 bg-slate-50 p-4">
                <div className="flex items-center justify-between gap-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{t('Overall Percentage')}</p>
                    <p className={`text-sm font-black ${tone.text}`}>{subject.percentage || 0}%</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-100">
                    <div
                        className={`h-full rounded-full ${tone.bar}`}
                        style={{ width: `${Math.max(0, Math.min(subject.percentage || 0, 100))}%` }}
                    />
                </div>

                <div className="mt-4 grid grid-cols-2 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('Total Classes')}</p>
                        <p className="mt-2 text-lg font-black text-slate-900">{subject.total || 0}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{t('Attended')}</p>
                        <p className="mt-2 text-lg font-black text-slate-900">{subject.present || 0}</p>
                    </div>
                </div>
            </div>

            <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
                <span className="inline-flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">
                    <BookOpen size={14} className="shrink-0" />
                    {t('View Details')}
                </span>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition group-hover:border-slate-900 group-hover:text-slate-900">
                    <ChevronRight size={16} />
                </span>
            </div>
        </button>
    );
};

const StudentAttendance = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
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
                <div className="mx-auto max-w-6xl space-y-6">
                    <Skeleton className="h-72 w-full rounded-[32px]" />
                    <div className="grid gap-4 md:grid-cols-3">
                        {[1, 2, 3].map((item) => (
                            <Skeleton key={item} className="h-44 w-full rounded-[28px]" />
                        ))}
                    </div>
                    <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                        <Skeleton className="h-[30rem] w-full rounded-[28px]" />
                        <Skeleton className="h-[30rem] w-full rounded-[28px]" />
                    </div>
                </div>
            </StudentLayout>
        );
    }

    if (!student) {
        return (
            <StudentLayout title="Attendance">
                <div className="px-4 py-10">
                    <div className="space-y-3 rounded-3xl border border-rose-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3 text-rose-600">
                            <AlertCircle size={18} />
                            <p className="text-sm font-bold">{t('Attendance data could not be loaded.')}</p>
                        </div>
                        <p className="text-xs leading-relaxed text-slate-600">
                            {error || t('This build is trying to reach {{url}}. If you are using the local backend, keep it running and connect the phone to the same Wi-Fi.', { url: apiBaseUrl })}
                        </p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="h-11 w-full rounded-2xl bg-slate-900 text-xs font-black uppercase tracking-[0.24em] text-white"
                        >
                            {t('Retry')}
                        </button>
                    </div>
                </div>
            </StudentLayout>
        );
    }

    const summary = student.attendanceSummary || {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        percentage: 0
    };
    const subjects = Array.isArray(student.attendanceSubjects) ? student.attendanceSubjects : [];
    const recent = Array.isArray(student.attendanceRecent) ? student.attendanceRecent : [];
    const overallTone = getPercentageTone(summary.percentage || 0);

    const formatAttendanceDate = (value) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-GB', {
            day: '2-digit',
            month: 'short'
        });
    };

    return (
        <StudentLayout title="Attendance">
            <div className="mx-auto max-w-6xl space-y-6">
                <section className="relative overflow-hidden rounded-[32px] border border-slate-900/80 bg-gradient-to-r from-slate-950 via-slate-800 to-indigo-950 shadow-[0_35px_80px_-40px_rgba(15,23,42,0.45)]">
                    <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />

                    <div className="relative px-5 pb-6 pt-6 sm:px-8 sm:pb-8 sm:pt-8">
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/60">{t('Attendance Dashboard')}</p>
                            <h1 className="mt-3 break-words text-3xl font-black tracking-tight text-white sm:text-4xl">
                                {t('Track your presence across all academic subjects.')}
                            </h1>
                            <p className="mt-3 max-w-2xl text-sm font-medium text-white/70 sm:text-base">
                                {t('Review your subject-wise consistency, overall percentage, and recent attendance activity from one place.')}
                            </p>
                        </div>

                        <div className="mt-6 grid gap-3 sm:grid-cols-3">
                            <HeroMetric
                                label={t('Overall Percentage')}
                                value={`${summary.percentage || 0}%`}
                                hint={t('Presence Rating')}
                            />
                            <HeroMetric
                                label={t('Total Classes')}
                                value={summary.total || 0}
                                hint={t('Cumulative Sessions')}
                            />
                            <HeroMetric
                                label={t('Classes Attended')}
                                value={summary.present || 0}
                                hint={t('Sessions Present')}
                            />
                        </div>
                    </div>
                </section>

                {error ? (
                    <div className="flex items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                        <AlertTriangle size={16} />
                        <span>{error}</span>
                    </div>
                ) : null}

                <div className="grid gap-4 md:grid-cols-3">
                    <SummaryCard
                        icon={Calendar}
                        label={t('Total Classes')}
                        value={summary.total || 0}
                        sub={t('Cumulative Sessions')}
                        tone={{ ...getPercentageTone(70), label: t('Attendance') }}
                    />
                    <SummaryCard
                        icon={CheckCircle2}
                        label={t('Classes Attended')}
                        value={summary.present || 0}
                        sub={t('Sessions Present')}
                        tone={{ ...getPercentageTone(85), label: t('Present') }}
                    />
                    <SummaryCard
                        icon={BadgeCheck}
                        label={t('Overall Percentage')}
                        value={`${summary.percentage || 0}%`}
                        sub={t('Presence Rating')}
                        tone={{ ...overallTone, label: t(overallTone.label) }}
                    />
                </div>

                <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
                    <SectionCard
                        eyebrow={t('Subject-wise Analytics')}
                        title={t('Attendance Dashboard')}
                        action={(
                            <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${overallTone.soft}`}>
                                {subjects.length} {t('Subjects')}
                            </span>
                        )}
                    >
                        {subjects.length > 0 ? (
                            <div className="grid gap-4 sm:grid-cols-2">
                                {subjects.map((subject, index) => (
                                    <SubjectCard
                                        key={subject.subjectId || index}
                                        subject={subject}
                                        t={t}
                                        onOpen={() => navigate(`/student/attendance/${subject.subjectId}`)}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-10 text-center">
                                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-300 shadow-sm">
                                    <BookOpen size={24} />
                                </div>
                                <p className="mt-4 text-sm font-semibold text-slate-500">{t('No subject attendance data available yet.')}</p>
                            </div>
                        )}
                    </SectionCard>

                    <div className="space-y-6">
                        <SectionCard eyebrow={t('Attendance')} title={t('Recent Attendance')}>
                            {recent.length > 0 ? (
                                <div className="space-y-3">
                                    {recent.map((item, index) => {
                                        const subject = item.subjectId?.name || item.subjectName || 'Subject';

                                        return (
                                            <div
                                                key={item._id || index}
                                                className="flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div className="min-w-0">
                                                    <p className="break-words text-sm font-semibold text-slate-900 sm:truncate">{subject}</p>
                                                    <p className="mt-1 inline-flex items-center gap-2 text-xs font-medium text-slate-500">
                                                        <Clock size={13} className="shrink-0" />
                                                        {formatAttendanceDate(item.attendanceDate)}
                                                    </p>
                                                </div>
                                                <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${getStatusBadgeClass(item.status)}`}>
                                                    {t(item.status || '-')}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
                                    <p className="text-sm font-semibold text-slate-500">{t('No recent attendance records yet.')}</p>
                                </div>
                            )}
                        </SectionCard>

                        <SectionCard eyebrow={t('Academic Requirement')} title={t('Attendance')}>
                            <div className="rounded-3xl border border-blue-100 bg-blue-50 p-5">
                                <div className="flex items-start gap-3">
                                    <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white text-blue-600 shadow-sm">
                                        <AlertCircle size={18} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-black text-blue-950">{t('Academic Requirement')}</p>
                                        <p className="mt-2 text-sm font-medium leading-6 text-blue-800">
                                            {t('Students must maintain at least 75% attendance in each subject to be eligible for final examinations. For any disputes regarding your status, please visit the HOD office.')}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 grid grid-cols-3 gap-3">
                                <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-center">
                                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-emerald-600 shadow-sm">
                                        <CheckCircle2 size={18} />
                                    </div>
                                    <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">{t('Present')}</p>
                                    <p className="mt-2 text-xl font-black text-emerald-700">{summary.present || 0}</p>
                                </div>
                                <div className="rounded-2xl border border-rose-100 bg-rose-50 p-4 text-center">
                                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-rose-600 shadow-sm">
                                        <XCircle size={18} />
                                    </div>
                                    <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-rose-600">{t('Absent')}</p>
                                    <p className="mt-2 text-xl font-black text-rose-700">{summary.absent || 0}</p>
                                </div>
                                <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-center">
                                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-2xl bg-white text-amber-600 shadow-sm">
                                        <Loader2 size={18} />
                                    </div>
                                    <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">{t('Late')}</p>
                                    <p className="mt-2 text-xl font-black text-amber-700">{summary.late || 0}</p>
                                </div>
                            </div>
                        </SectionCard>
                    </div>
                </div>
            </div>
        </StudentLayout>
    );
};

export default StudentAttendance;
