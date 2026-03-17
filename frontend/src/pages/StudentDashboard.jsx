import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  Hash,
  Star,
  User,
  Wallet
} from 'lucide-react';
import Skeleton from '../components/Skeleton';
import { useQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import { useLanguage } from '../context/LanguageContext';

const formatCurrency = (value) => `\u20b9${Number(value || 0).toLocaleString('en-IN')}`;

const getPerformanceTone = (score) => {
  if (score >= 75) {
    return {
      text: 'text-emerald-600',
      soft: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      bar: 'bg-emerald-500',
      label: 'Strong'
    };
  }

  if (score >= 60) {
    return {
      text: 'text-amber-600',
      soft: 'bg-amber-50 text-amber-700 border-amber-100',
      bar: 'bg-amber-500',
      label: 'Stable'
    };
  }

  return {
    text: 'text-rose-600',
    soft: 'bg-rose-50 text-rose-700 border-rose-100',
    bar: 'bg-rose-500',
    label: 'Needs Focus'
  };
};

const getAttendanceBadgeClass = (status) => {
  if (status === 'Present') return 'bg-emerald-50 text-emerald-700 border-emerald-100';
  if (status === 'Late') return 'bg-amber-50 text-amber-700 border-amber-100';
  if (status === 'Absent') return 'bg-rose-50 text-rose-700 border-rose-100';
  return 'bg-slate-50 text-slate-600 border-slate-200';
};

const InsightCard = ({ icon: Icon, label, value, hint, tone }) => (
  <div className="min-w-0 rounded-[28px] border border-slate-200 bg-white p-5 shadow-[0_20px_50px_-35px_rgba(15,23,42,0.35)]">
    <div className="flex items-start justify-between gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-700">
        <Icon size={18} />
      </div>
      <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${tone.soft}`}>
        {tone.label}
      </span>
    </div>
    <p className="mt-4 text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{label}</p>
    <p className={`mt-2 break-words text-2xl font-black ${tone.text}`}>{value}</p>
    <p className="mt-1 text-sm font-medium text-slate-500">{hint}</p>
  </div>
);

const QuickActionCard = ({ icon: Icon, label, description, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    className="group flex w-full items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-left transition hover:border-slate-300 hover:bg-white"
  >
    <div className="flex min-w-0 items-center gap-3">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white">
        <Icon size={18} />
      </div>
      <div className="min-w-0">
        <p className="text-sm font-black text-slate-900">{label}</p>
        <p className="mt-1 break-words text-xs font-medium text-slate-500">{description}</p>
      </div>
    </div>
    <span className="shrink-0 rounded-full border border-slate-200 bg-white p-2 text-slate-500 transition group-hover:border-slate-900 group-hover:text-slate-900">
      <ArrowRight size={16} />
    </span>
  </button>
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

const StudentDashboard = () => {
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

  const { data: student, isLoading: isStudentLoading } = useQuery({
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
      setError(t('Failed to load dashboard data.'));
    }
  });

  const { data: feesData, isLoading: isFeesLoading } = useQuery({
    queryKey: ['student', 'fees'],
    enabled: !!token,
    queryFn: async () => {
      try {
        const res = await api.get('/student/fees');
        if (res.data.success) {
          await setCached('student.fees', res.data.fees);
          return res.data.fees;
        }
        throw new Error('Failed to load fees');
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('studentToken');
          navigate('/student/login');
          throw err;
        }
        const cached = await getCached('student.fees');
        if (cached) return cached;
        throw err;
      }
    },
    onError: () => {
      setError((current) => current || t('Failed to load fee summary.'));
    }
  });

  if (isStudentLoading || isFeesLoading) {
    return (
      <StudentLayout title="Dashboard">
        <div className="mx-auto max-w-6xl space-y-6">
          <Skeleton className="h-72 w-full rounded-[32px]" />
          <div className="grid gap-4 md:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <Skeleton key={item} className="h-44 w-full rounded-[28px]" />
            ))}
          </div>
          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <Skeleton className="h-96 w-full rounded-[28px]" />
            <Skeleton className="h-96 w-full rounded-[28px]" />
          </div>
          <Skeleton className="h-80 w-full rounded-[28px]" />
        </div>
      </StudentLayout>
    );
  }

  const fees = Array.isArray(feesData) ? feesData : [];
  const totalPaid = fees.reduce((sum, fee) => sum + (fee.amountPaid || 0), 0);
  const pendingFees = fees.reduce((sum, fee) => sum + Math.max(fee.pendingAmount || 0, 0), 0);

  if (!student) {
    return (
      <StudentLayout title="Dashboard">
        <div className="px-4 py-10">
          <div className="space-y-3 rounded-3xl border border-rose-100 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3 text-rose-600">
              <AlertTriangle size={18} />
              <p className="text-sm font-bold">{t('Dashboard data could not be loaded.')}</p>
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

  const overallScore = student.overallAverage || 0;
  const attendanceSummary = student.attendanceSummary || {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    percentage: 0
  };
  const attendanceRecent = Array.isArray(student.attendanceRecent) ? student.attendanceRecent : [];
  const subjectCount = Array.isArray(student.subjectTeachers) && student.subjectTeachers.length > 0
    ? student.subjectTeachers.length
    : Array.isArray(student.fullBatchData?.subjects)
      ? student.fullBatchData.subjects.length
      : 0;
  const performanceTone = getPerformanceTone(overallScore);
  const attendanceTone = getPerformanceTone(attendanceSummary.percentage || 0);
  const feeTone = pendingFees === 0
    ? {
      text: 'text-emerald-600',
      soft: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      bar: 'bg-emerald-500',
      label: t('Paid')
    }
    : {
      text: 'text-rose-600',
      soft: 'bg-rose-50 text-rose-700 border-rose-100',
      bar: 'bg-rose-500',
      label: t('Pending Fees')
    };

  const formatAttendanceDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-GB', {
      day: '2-digit',
      month: 'short'
    });
  };

  const quickActions = [
    {
      label: t('My Profile'),
      description: t('Review your personal and batch details.'),
      icon: User,
      to: '/student/profile'
    },
    {
      label: t('Subjects'),
      description: t('Open subject cards and faculty information.'),
      icon: BookOpen,
      to: '/student/subjects'
    },
    {
      label: t('Results'),
      description: t('Check tests, progress, and weak chapters.'),
      icon: FileText,
      to: '/student/results'
    },
    {
      label: t('Fees'),
      description: t('Track dues, payments, and receipts.'),
      icon: Wallet,
      to: '/student/fees'
    }
  ];

  return (
    <StudentLayout title="Dashboard">
      <div className="mx-auto max-w-6xl space-y-6">
        <section className="relative overflow-hidden rounded-[32px] border border-slate-900/80 bg-gradient-to-r from-slate-950 via-slate-800 to-indigo-950 shadow-[0_35px_80px_-40px_rgba(15,23,42,0.45)]">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_1px_1px,white_1px,transparent_0)] [background-size:18px_18px]" />

          <div className="relative px-5 pb-6 pt-6 sm:px-8 sm:pb-8 sm:pt-8">
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/60">{t('Student Dashboard')}</p>
              <h1 className="mt-3 break-words text-3xl font-black tracking-tight text-white sm:text-4xl">
                {t('Welcome back')}, {student.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-medium text-white/70 sm:text-base">
                {t('Track your academic progress, attendance, and fee status from one clean dashboard.')}
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/85 backdrop-blur-sm">
                  <Hash size={14} />
                  <span className="break-all">{student.rollNo || '-'}</span>
                </span>
                <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/85 backdrop-blur-sm">
                  <BookOpen size={14} />
                  <span className="break-words">{student.className || student.batchName || 'N/A'}</span>
                </span>
                <span className="inline-flex max-w-full items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-bold text-white/85 backdrop-blur-sm">
                  <User size={14} />
                  <span className="break-words">{subjectCount} {t('Subjects')}</span>
                </span>
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

        <div className="grid gap-4 md:grid-cols-3">
          <InsightCard
            icon={Star}
            label={t('Average Score')}
            value={`${overallScore}%`}
            hint={t('Overall Performance')}
            tone={{ ...performanceTone, label: t(performanceTone.label) }}
          />
          <InsightCard
            icon={CheckCircle2}
            label={t('Attendance')}
            value={`${attendanceSummary.percentage || 0}%`}
            hint={`${attendanceSummary.present || 0}/${attendanceSummary.total || 0} ${t('Present')}`}
            tone={{ ...attendanceTone, label: t(attendanceTone.label) }}
          />
          <InsightCard
            icon={Wallet}
            label={t('Pending Fees')}
            value={formatCurrency(pendingFees)}
            hint={`${formatCurrency(totalPaid)} ${t('Paid')}`}
            tone={feeTone}
          />
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <SectionCard
            eyebrow={t('Attendance')}
            title={t('Monthly Overview')}
            action={(
              <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${attendanceTone.soft}`}>
                {attendanceSummary.percentage || 0}%
              </span>
            )}
          >
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">{t('Overall Present')}</p>
                  <p className="mt-2 break-words text-sm font-semibold text-slate-600">
                    {attendanceSummary.present || 0} {t('out of')} {attendanceSummary.total || 0} {t('days')}
                  </p>
                </div>
                <div className="w-full max-w-xs">
                  <div className="h-2 overflow-hidden rounded-full bg-white ring-1 ring-slate-100">
                    <div
                      className={`h-full rounded-full ${attendanceTone.bar}`}
                      style={{ width: `${Math.max(0, Math.min(attendanceSummary.percentage || 0, 100))}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-5 grid grid-cols-3 gap-2 sm:gap-3">
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

              <div className="mt-5 flex items-center justify-between text-sm font-semibold text-slate-500">
                <span>{t('Total Sessions')}</span>
                <span className="text-slate-900">{attendanceSummary.total || 0}</span>
              </div>
            </div>
          </SectionCard>

          <SectionCard eyebrow={t('Academic')} title={t('Quick Access')}>
            <div className="space-y-3">
              {quickActions.map((action) => (
                <QuickActionCard
                  key={action.to}
                  icon={action.icon}
                  label={action.label}
                  description={action.description}
                  onClick={() => navigate(action.to)}
                />
              ))}
            </div>
          </SectionCard>
        </div>

        <SectionCard
          eyebrow={t('Recent Attendance')}
          title={t('Latest Sessions')}
          action={(
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-400">
              {attendanceRecent.length} {t('records')}
            </span>
          )}
        >
          {attendanceRecent.length > 0 ? (
            <div className="space-y-3">
              {attendanceRecent.map((item, idx) => {
                const subject = item.subjectId?.name || item.subjectName || 'Subject';
                const code = item.subjectId?.code ? ` (${item.subjectId.code})` : '';

                return (
                  <div
                    key={item._id || idx}
                    className="flex flex-col items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="break-words text-sm font-semibold text-slate-900 sm:truncate">{subject}{code}</p>
                      <p className="mt-1 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">
                        {formatAttendanceDate(item.attendanceDate)}
                      </p>
                    </div>
                    <span className={`shrink-0 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${getAttendanceBadgeClass(item.status)}`}>
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
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
