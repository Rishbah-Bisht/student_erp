import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import { User, Hash, BookOpen, Star, Wallet, CheckCircle2 } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import { useQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import { useLanguage } from '../context/LanguageContext';

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
      setError(t('Failed to load dashboard data.'));
    }
  });

  if (isLoading) {
    return (
      <StudentLayout title="Dashboard">
        <div className="page-hdr" style={{ marginBottom: 20 }}>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-64" />
        </div>

        <div className="stats-grid" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div className="stat-card" key={i} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <Skeleton className="h-12 w-12 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-3 w-20 mb-2" />
                <Skeleton className="h-6 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
          ))}
        </div>

        <div className="panel-container" style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '20px'
        }}>
          <Skeleton className="h-64 w-full rounded-md" />
          <Skeleton className="h-64 w-full rounded-md" />
        </div>
      </StudentLayout>
    );
  }

  if (!student) {
    return (
      <StudentLayout title="Dashboard">
        <div className="px-4 py-10">
          <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5 space-y-3">
            <div className="flex items-center gap-3 text-rose-600">
              <CheckCircle2 size={18} />
              <p className="text-sm font-bold">{t('Dashboard data could not be loaded.')}</p>
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

  const pendingFees = (student.fees || 0) + (student.registrationFee || 0) - (student.feesPaid || 0);
  const overallScore = student.overallAverage || 0;
  const attendanceSummary = student.attendanceSummary || {
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    percentage: 0
  };
  const attendanceRecent = Array.isArray(student.attendanceRecent) ? student.attendanceRecent : [];

  const getScoreTheme = (score) => {
    if (score >= 75) return { cls: 'ic-green', text: '#16a34a' };
    if (score >= 60) return { cls: 'ic-orange', text: '#ca8a04' };
    return { cls: 'ic-red', text: '#dc2626' };
  };
  const scoreTheme = getScoreTheme(overallScore);

  const getAttendanceTheme = (percentage) => {
    if (percentage >= 75) return { cls: 'ic-green', text: '#16a34a' };
    if (percentage >= 60) return { cls: 'ic-orange', text: '#ca8a04' };
    return { cls: 'ic-red', text: '#dc2626' };
  };
  const attendanceTheme = getAttendanceTheme(attendanceSummary.percentage || 0);
  const attendanceTone = attendanceSummary.percentage >= 75
    ? 'text-green-600'
    : attendanceSummary.percentage >= 60
      ? 'text-yellow-600'
      : 'text-red-600';
  const feeTheme = pendingFees === 0
    ? { cls: 'ic-green', text: '#16a34a' }
    : { cls: 'ic-red', text: '#dc2626' };

  const getStatusClass = (status) => {
    if (status === 'Present') return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    if (status === 'Late') return 'bg-amber-50 text-amber-600 border-amber-100';
    if (status === 'Absent') return 'bg-rose-50 text-rose-600 border-rose-100';
    return 'bg-gray-50 text-gray-500 border-gray-200';
  };

  const formatAttendanceDate = (value) => {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '-';
    return date.toLocaleDateString(language === 'hi' ? 'hi-IN' : 'en-GB', { day: '2-digit', month: 'short' });
  };

  const translateAttendanceStatus = (status) => {
    if (!status) return '-';
    return t(status);
  };

  const stats = [
    { label: t('Student Name'), value: student.name, sub: t('Enrolled Account'), icon: User, cls: 'ic-blue', valueColor: '' },
    { label: t('Roll Number'), value: student.rollNo, sub: t('Unique ID'), icon: Hash, cls: 'ic-indigo', valueColor: '' },
    { label: t('Class / Batch'), value: student.className || student.batchName || 'N/A', sub: t('Assigned Cohort'), icon: BookOpen, cls: 'ic-orange', valueColor: '' },
    { label: t('Average Score'), value: `${overallScore}%`, sub: t('Overall Performance'), icon: Star, cls: scoreTheme.cls, valueColor: scoreTheme.text },
    { label: t('Attendance'), value: `${attendanceSummary.percentage || 0}%`, sub: `${attendanceSummary.present || 0}/${attendanceSummary.total || 0} ${t('Present')}`, icon: CheckCircle2, cls: attendanceTheme.cls, valueColor: attendanceTheme.text },
    { label: t('Pending Fees'), value: `\u20b9${pendingFees.toLocaleString()}`, sub: `\u20b9${(student.feesPaid || 0).toLocaleString()} ${t('Paid')}`, icon: Wallet, cls: feeTheme.cls, valueColor: feeTheme.text }
  ];

  return (
    <StudentLayout title="Dashboard">
      <div className="page-hdr" style={{ marginBottom: 20 }}>
        <h1>{t('Student Dashboard')}</h1>
        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          {t('Welcome back')}, <strong>{student.name}</strong>!
        </p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>! {error}</div>}

      <div className="stats-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))',
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div className="stat-card" key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className={`stat-icon ${s.cls}`}>
                <Icon size={22} />
              </div>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize: '1.4rem', fontWeight: '700', color: s.valueColor || 'inherit' }}>{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="panel-container"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',
          gap: '20px'
        }}
      >
        <div className="bg-white rounded-md border border-gray-100 p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Attendance')}</p>
              <h3 className="text-lg font-black text-gray-900">{t('Monthly Overview')}</h3>
            </div>
            <div className={`text-2xl font-black ${attendanceTone}`}>{attendanceSummary.percentage || 0}%</div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-md p-3">
              <p className="text-[9px] font-black uppercase tracking-widest">{t('Present')}</p>
              <p className="text-lg font-black">{attendanceSummary.present || 0}</p>
            </div>
            <div className="bg-rose-50 text-rose-600 border border-rose-100 rounded-md p-3">
              <p className="text-[9px] font-black uppercase tracking-widest">{t('Absent')}</p>
              <p className="text-lg font-black">{attendanceSummary.absent || 0}</p>
            </div>
            <div className="bg-amber-50 text-amber-600 border border-amber-100 rounded-md p-3">
              <p className="text-[9px] font-black uppercase tracking-widest">{t('Late')}</p>
              <p className="text-lg font-black">{attendanceSummary.late || 0}</p>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs text-gray-500 font-bold">
            <span>{t('Total Sessions')}</span>
            <span>{attendanceSummary.total || 0}</span>
          </div>
        </div>

        <div className="bg-white rounded-md border border-gray-100 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{t('Recent Attendance')}</p>
              <h3 className="text-lg font-black text-gray-900">{t('Latest Sessions')}</h3>
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest text-gray-400">
              {attendanceRecent.length} {t('records')}
            </div>
          </div>

          {attendanceRecent.length > 0 ? (
            <div className="space-y-3">
              {attendanceRecent.map((item, idx) => {
                const subject = item.subjectId?.name || item.subjectName || 'Subject';
                const code = item.subjectId?.code ? ` (${item.subjectId.code})` : '';
                return (
                  <div key={item._id || idx} className="flex items-center justify-between bg-gray-50 border border-gray-100 rounded-md px-4 py-3">
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-gray-800 truncate">{subject}{code}</p>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                        {formatAttendanceDate(item.attendanceDate)}
                      </p>
                    </div>
                    <span className={`px-2.5 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${getStatusClass(item.status)}`}>
                      {translateAttendanceStatus(item.status)}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="bg-gray-50 border border-dashed border-gray-200 rounded-md p-6 text-center text-gray-400 text-sm font-bold">
              {t('No recent attendance records yet.')}
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;
