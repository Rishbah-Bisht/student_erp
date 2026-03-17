import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import {
    User,
    Mail,
    Calendar,
    MapPin,
    RefreshCcw,
    AlertTriangle,
    Users,
    Home,
    GraduationCap,
    Phone,
    CreditCard,
    School,
    ExternalLink,
    Award,
    X
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import { useLanguage } from '../context/LanguageContext';

const EMPTY_VALUE = '-';

const formatValue = (value) => {
    if (value === null || value === undefined) return EMPTY_VALUE;
    if (typeof value === 'string' && value.trim() === '') return EMPTY_VALUE;
    return value;
};

const formatDateValue = (value, locale) => {
    if (!value) return EMPTY_VALUE;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return EMPTY_VALUE;

    return date.toLocaleDateString(locale, {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
};

const getAttendanceBadgeClass = (status) => {
    if (status === 'Present') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
    if (status === 'Late') return 'bg-amber-50 text-amber-700 border-amber-100';
    if (status === 'Absent') return 'bg-rose-50 text-rose-700 border-rose-100';
    return 'bg-slate-50 text-slate-600 border-slate-200';
};

const getAttendanceTone = (percentage) => {
    if (percentage >= 75) {
        return {
            text: 'text-emerald-600',
            soft: 'bg-emerald-50 text-emerald-700 border-emerald-100'
        };
    }

    if (percentage >= 60) {
        return {
            text: 'text-amber-600',
            soft: 'bg-amber-50 text-amber-700 border-amber-100'
        };
    }

    return {
        text: 'text-rose-600',
        soft: 'bg-rose-50 text-rose-700 border-rose-100'
    };
};

const DetailCard = ({ icon: Icon, label, value, subtitle = null }) => (
    <div className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-lg shadow-slate-200">
                <Icon size={18} />
            </div>
            <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
                <p className="mt-1 break-words text-sm font-semibold leading-6 text-slate-900 whitespace-pre-line">
                    {formatValue(value)}
                </p>
                {subtitle ? (
                    <p className="mt-1 break-words text-xs font-medium text-slate-500">{subtitle}</p>
                ) : null}
            </div>
        </div>
    </div>
);

const MetricCard = ({ label, value, hint, toneClass = 'text-white' }) => (
    <div className="min-w-0 rounded-3xl border border-white/15 bg-white/10 px-4 py-4 backdrop-blur-sm">
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">{label}</p>
        <p className={`mt-2 break-words text-2xl font-black ${toneClass}`}>{value}</p>
        <p className="mt-1 break-words text-xs font-semibold text-white/70">{hint}</p>
    </div>
);

const SectionCard = ({ icon: Icon, title, action = null, children }) => (
    <section className="rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_24px_55px_-35px_rgba(15,23,42,0.35)] sm:p-6">
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
                    <Icon size={18} />
                </div>
                <div className="min-w-0">
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{title}</p>
                </div>
            </div>
            {action ? <div className="w-full sm:w-auto">{action}</div> : null}
        </div>
        {children}
    </section>
);

const BatchDetailModal = ({ isOpen, onClose, batch, room }) => {
    const { t } = useLanguage();

    if (!isOpen || !batch) return null;

    return (
        <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-slate-950/45 p-0 backdrop-blur-sm sm:items-center sm:p-6"
            onClick={onClose}
        >
            <div
                className="w-full max-w-2xl overflow-hidden rounded-t-[32px] border border-white/40 bg-white shadow-2xl sm:rounded-[32px]"
                onClick={(event) => event.stopPropagation()}
            >
                <div className="relative overflow-hidden border-b border-slate-100 px-5 pb-5 pt-6 sm:px-6">
                    <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-r from-slate-950 via-slate-800 to-indigo-950" />
                    <div className="absolute inset-x-0 top-0 h-28 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />

                    <div className="relative flex items-start justify-between gap-4">
                        <div className="min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">{t('Assigned Batch')}</p>
                            <h3 className="mt-2 break-words text-2xl font-black text-white">{batch.name || t('Batch')}</h3>
                            <p className="mt-1 break-words text-sm font-medium text-white/70">{batch.course || t('Academic')}</p>
                        </div>
                        <button
                            type="button"
                            onClick={onClose}
                            className="relative flex h-11 w-11 items-center justify-center rounded-2xl border border-white/15 bg-white/10 text-white transition hover:bg-white/15"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="space-y-6 px-5 py-5 sm:px-6">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <DetailCard icon={Home} label={t('Classroom')} value={room} />
                        <DetailCard icon={School} label={t('Course Type')} value={batch.course || t('Academic')} />
                    </div>

                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{t('Batch Subjects')}</p>
                        <div className="mt-3 flex flex-wrap gap-2">
                            {batch.subjects?.length ? (
                                batch.subjects.map((subject) => (
                                    <span
                                        key={subject}
                                        className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                    >
                                        {subject}
                                    </span>
                                ))
                            ) : (
                                <p className="text-sm text-slate-500">{t('No subjects assigned')}</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const StudentProfile = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const apiBaseUrl = api.defaults.baseURL || '/api';
    const locale = language === 'hi' ? 'hi-IN' : 'en-GB';
    const [error, setError] = useState('');
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
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
        onError: () => setError(t('Failed to load profile data.'))
    });

    if (isLoading) {
        return (
            <StudentLayout title="Profile">
                <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
                    <RefreshCcw className="animate-spin text-slate-700" size={28} />
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{t('Loading Profile...')}</p>
                </div>
            </StudentLayout>
        );
    }

    if (!student) {
        return (
            <StudentLayout title="Profile">
                <div className="px-4 py-10">
                    <div className="space-y-3 rounded-3xl border border-rose-100 bg-white p-5 shadow-sm">
                        <div className="flex items-center gap-3 text-rose-600">
                            <AlertTriangle size={18} />
                            <p className="text-sm font-bold">{t('Profile data could not be loaded.')}</p>
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

    const attendanceSummary = student.attendanceSummary || {
        total: 0,
        present: 0,
        absent: 0,
        late: 0,
        percentage: 0
    };
    const attendanceRecent = Array.isArray(student.attendanceRecent) ? student.attendanceRecent : [];
    const attendanceTone = getAttendanceTone(attendanceSummary.percentage || 0);
    const batchSubjects = Array.isArray(student.fullBatchData?.subjects) ? student.fullBatchData.subjects : [];
    const initials = String(student.name || 'S')
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || 'S';

    return (
        <StudentLayout title="Profile">
            <div className="mx-auto max-w-6xl space-y-6 px-4 pb-24 pt-2 sm:px-6 sm:pb-10">
                <section className="relative overflow-hidden rounded-[32px] border border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 shadow-[0_35px_80px_-40px_rgba(15,23,42,0.45)]">
                    <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />

                    <div className="relative px-5 pb-5 pt-6 sm:px-8 sm:pb-8 sm:pt-8">
                        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
                            <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-[28px] border-4 border-white/80 bg-white text-3xl font-black text-slate-900 shadow-[0_20px_40px_-20px_rgba(15,23,42,0.65)]">
                                    {student.profileImage ? (
                                        <img src={student.profileImage} alt={student.name} className="h-full w-full object-cover" />
                                    ) : (
                                        initials
                                    )}
                                </div>

                                <div className="min-w-0 flex-1">
                                    <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/60">{t('My Profile')}</p>
                                    <h1 className="mt-2 break-words text-3xl font-black tracking-tight text-white sm:text-4xl">
                                        {student.name}
                                    </h1>
                                    <div className="mt-4 flex flex-wrap gap-2">
                                        <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/85 backdrop-blur-sm">
                                            <CreditCard size={14} />
                                            <span className="break-all">{student.rollNo || EMPTY_VALUE}</span>
                                        </span>
                                        <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/85 backdrop-blur-sm">
                                            <School size={14} />
                                            <span className="break-words">{student.className || t('Not Assigned')}</span>
                                        </span>
                                        <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/85 backdrop-blur-sm">
                                            <GraduationCap size={14} />
                                            <span className="break-words">{student.batchName || t('Not Assigned')}</span>
                                        </span>
                                    </div>
                                    <div className="mt-4 grid gap-2 text-sm font-medium text-white/75 sm:flex sm:flex-wrap sm:gap-3">
                                        <span className="inline-flex min-w-0 items-start gap-2">
                                            <Mail size={15} />
                                            <span className="break-all">{formatValue(student.email)}</span>
                                        </span>
                                        <span className="inline-flex min-w-0 items-start gap-2">
                                            <Phone size={15} />
                                            <span className="break-all">{formatValue(student.contact)}</span>
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid gap-3 sm:grid-cols-3 xl:w-[420px]">
                                <MetricCard
                                    label={t('Attendance')}
                                    value={`${attendanceSummary.percentage || 0}%`}
                                    hint={`${attendanceSummary.present || 0}/${attendanceSummary.total || 0} ${t('Present')}`}
                                    toneClass="text-white"
                                />
                                <MetricCard
                                    label={t('Active Batch')}
                                    value={formatValue(student.batchName)}
                                    hint={formatValue(student.className)}
                                />
                                <MetricCard
                                    label={t('Classroom')}
                                    value={formatValue(student.roomAllocation)}
                                    hint={`${batchSubjects.length} ${t('Subjects')}`}
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {error ? (
                    <div className="flex items-center gap-2 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-700">
                        <AlertTriangle size={16} />
                        <span>{error}</span>
                    </div>
                ) : null}

                <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                    <div className="space-y-6">
                        <SectionCard icon={User} title={t('Personal Details')}>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <DetailCard icon={Calendar} label={t('Date of Birth')} value={formatDateValue(student.dob, locale)} />
                                <DetailCard icon={User} label={t('Gender')} value={student.gender} />
                                <DetailCard icon={Phone} label={t('Contact')} value={student.contact} />
                                <DetailCard icon={Mail} label={t('Email')} value={student.email} />
                                <DetailCard icon={MapPin} label={t('Address')} value={student.address} />
                                <DetailCard icon={Calendar} label={t('Admission')} value={formatDateValue(student.admissionDate, locale)} />
                            </div>
                        </SectionCard>

                        <SectionCard icon={Users} title={t('Parents / Guardians')}>
                            <div className="grid gap-3 sm:grid-cols-2">
                                <DetailCard icon={Users} label={t('Father Name')} value={student.fatherName} />
                                <DetailCard icon={Users} label={t('Mother Name')} value={student.motherName} />
                                <DetailCard icon={Phone} label={t('Guardian Contact')} value={student.parentContact} />
                                <DetailCard icon={Home} label={t('Address')} value={student.address} />
                            </div>
                        </SectionCard>
                    </div>

                    <div className="space-y-6">
                        <SectionCard
                            icon={GraduationCap}
                            title={t('Enrollment')}
                            action={(
                                <button
                                    type="button"
                                    onClick={() => setIsBatchModalOpen(true)}
                                    className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black uppercase tracking-[0.2em] text-slate-600 transition hover:border-slate-300 hover:bg-slate-100 sm:w-auto"
                                >
                                    <ExternalLink size={14} />
                                    {t('Active Batch')}
                                </button>
                            )}
                        >
                            <div className="grid gap-3">
                                <DetailCard icon={School} label={t('Class / Level')} value={student.className || t('Not Assigned')} />
                                <DetailCard icon={GraduationCap} label={t('Active Batch')} value={student.batchName || t('Not Assigned')} />
                                <DetailCard icon={Home} label={t('Classroom')} value={student.roomAllocation} />
                            </div>

                            <div className="mt-5">
                                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{t('Batch Subjects')}</p>
                                <div className="mt-3 flex flex-wrap gap-2">
                                    {batchSubjects.length > 0 ? (
                                        batchSubjects.map((subject) => (
                                            <span
                                                key={subject}
                                                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-700"
                                            >
                                                {subject}
                                            </span>
                                        ))
                                    ) : (
                                        <p className="text-sm text-slate-500">{t('No subjects assigned')}</p>
                                    )}
                                </div>
                            </div>
                        </SectionCard>

                        <SectionCard icon={Award} title={t('Attendance Stats')}>
                            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
                                <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-slate-400">{t('Overall Present')}</p>
                                        <p className="mt-2 break-words text-sm font-semibold text-slate-600">
                                            {attendanceSummary.present || 0} {t('out of')} {attendanceSummary.total || 0} {t('days')}
                                        </p>
                                    </div>
                                    <div className={`inline-flex w-fit rounded-full border px-4 py-2 text-3xl font-black ${attendanceTone.soft}`}>
                                        {attendanceSummary.percentage || 0}%
                                    </div>
                                </div>

                                <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-3">
                                    <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-3 text-center">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600">{t('Present')}</p>
                                        <p className="mt-2 text-xl font-black text-emerald-700">{attendanceSummary.present || 0}</p>
                                    </div>
                                    <div className="rounded-2xl border border-rose-100 bg-rose-50 p-3 text-center">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-600">{t('Absent')}</p>
                                        <p className="mt-2 text-xl font-black text-rose-700">{attendanceSummary.absent || 0}</p>
                                    </div>
                                    <div className="rounded-2xl border border-amber-100 bg-amber-50 p-3 text-center">
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-600">{t('Late')}</p>
                                        <p className="mt-2 text-xl font-black text-amber-700">{attendanceSummary.late || 0}</p>
                                    </div>
                                </div>
                            </div>

                            {attendanceRecent.length > 0 ? (
                                <div className="mt-5 space-y-3">
                                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{t('Recent Records')}</p>
                                    {attendanceRecent.map((item, index) => {
                                        const subject = item.subjectId?.name || item.subjectName || 'Subject';
                                        return (
                                            <div
                                                key={item._id || index}
                                                className="flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                                            >
                                                <div className="min-w-0 w-full sm:w-auto">
                                                    <p className="break-words text-sm font-semibold text-slate-900 sm:truncate">{subject}</p>
                                                    <p className="mt-1 text-xs font-medium text-slate-500">
                                                        {formatDateValue(item.attendanceDate, locale)}
                                                    </p>
                                                </div>
                                                <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${getAttendanceBadgeClass(item.status)}`}>
                                                    {t(item.status || EMPTY_VALUE)}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </SectionCard>
                    </div>
                </div>

                <BatchDetailModal
                    isOpen={isBatchModalOpen}
                    onClose={() => setIsBatchModalOpen(false)}
                    batch={student.fullBatchData}
                    room={student.roomAllocation}
                />
            </div>
        </StudentLayout>
    );
};

export default StudentProfile;
