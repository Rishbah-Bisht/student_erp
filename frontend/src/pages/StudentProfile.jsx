import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import {
    User, Mail, Calendar, MapPin,
    Lock, RefreshCcw, AlertTriangle,
    CheckCircle2, Users, Home, GraduationCap,
    Phone, CreditCard, School, ExternalLink, Bell,
    ChevronRight, Award, X
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getCached, setCached } from '../utils/offlineCache';
import { useLanguage } from '../context/LanguageContext';

// 1. Mobile-Optimized Info Card
const InfoCard = ({ icon: Icon, label, value, colorClass = "bg-blue-50 text-blue-600" }) => (
    <div className="flex flex-col p-3.5 rounded-2xl bg-white border border-gray-100 shadow-sm active:scale-[0.98] transition-transform">
        <div className={`h-8 w-8 rounded-full flex items-center justify-center mb-2 ${colorClass}`}>
            <Icon size={16} />
        </div>
        <div>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-0.5">{label}</p>
            <p className="text-sm font-semibold text-gray-800 truncate">{value || '—'}</p>
        </div>
    </div>
);

// 2. Native Mobile Bottom Sheet for Batch Details
const BatchDetailModal = ({ isOpen, onClose, batch, room }) => {
    const { t } = useLanguage();
    if (!isOpen || !batch) return null;
    return (
        <div
            className="fixed inset-0 z-[100] flex items-end justify-center bg-black/40 backdrop-blur-sm"
            onClick={onClose}
        >
            {/* Bottom Sheet */}
            <div
                className="w-full bg-white rounded-t-3xl shadow-2xl max-h-[92vh] flex flex-col animate-in slide-in-from-bottom-full duration-300"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Drag Handle */}
                <div className="flex justify-center pt-3 pb-2">
                    <div className="w-14 h-1.5 bg-gray-300 rounded-full"></div>
                </div>

                {/* Header */}
                <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">
                            {t('Assigned Batch')}
                        </span>
                        <h3 className="text-lg font-black text-gray-900 leading-tight">
                            {batch?.name || t('Batch')}
                        </h3>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 bg-gray-100 rounded-full active:scale-90 transition"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Scroll Content */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-6">
                    {/* Info Cards */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                {t('Classroom')}
                            </p>
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                                {room || "N/A"}
                            </p>
                        </div>

                        <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                                {t('Course Type')}
                            </p>
                            <p className="text-sm font-semibold text-gray-800 mt-1">
                                {batch?.course || t('Academic')}
                            </p>
                        </div>
                    </div>

                    {/* Subjects */}
                    <div>
                        <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">
                            {t('Batch Subjects')}
                        </p>
                        <div className="flex flex-wrap gap-2">
                            {batch?.subjects?.length ? (
                                batch.subjects.map((subject) => (
                                    <span
                                        key={subject}
                                        className="px-3 py-1.5 bg-blue-50 text-blue-600 text-[11px] font-semibold rounded-full border border-blue-100"
                                    >
                                        {subject}
                                    </span>
                                ))
                            ) : (
                                <p className="text-xs text-gray-400">{t('No subjects assigned')}</p>
                            )}
                        </div>
                    </div>
                </div>

                {/* Bottom Button */}
                <div className="p-4 border-t border-gray-100 bg-white pb-safe">
                    <button
                        onClick={onClose}
                        className="w-full p-3.5 text-white text-sm font-semibold rounded-xl bg-gradient-to-r from-gray-800 to-black active:scale-95 transition-all"
                    >
                        {t('Close')}
                    </button>
                </div>
            </div>
        </div>
    );
};

const StudentProfile = () => {
    const navigate = useNavigate();
    const { t, language } = useLanguage();
    const pushEnabledInBuild = import.meta.env.VITE_ENABLE_PUSH === 'true';
    const apiBaseUrl = api.defaults.baseURL || '/api';
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isBatchModalOpen, setIsBatchModalOpen] = useState(false);
    const [pushStatus, setPushStatus] = useState(() => {
        if (!pushEnabledInBuild) return 'disabled';
        return localStorage.getItem('pushNotificationsEnabled') === 'true' ? 'granted' : 'idle';
    });
    const [pushNotice, setPushNotice] = useState('');
    const [pushLoading, setPushLoading] = useState(false);
    const token = localStorage.getItem('studentToken');

    const [pwdData, setPwdData] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
    const [pwdLoading, setPwdLoading] = useState(false);

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

    const handlePwdChange = (e) => {
        setPwdData({ ...pwdData, [e.target.name]: e.target.value });
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (pwdData.newPassword !== pwdData.confirmPassword) {
            setError(t('New passwords do not match.'));
            return;
        }

        setPwdLoading(true);
        try {
            const res = await api.post('/student/reset-password', {
                currentPassword: pwdData.currentPassword,
                newPassword: pwdData.newPassword
            });
            if (res.data.success) {
                setSuccess(t('Password updated successfully.'));
                setPwdData({ currentPassword: '', newPassword: '', confirmPassword: '' });
            }
        } catch (err) {
            setError(err.response?.data?.message || t('Failed to reset password.'));
        } finally {
            setPwdLoading(false);
        }
    };

    const handleEnableNotifications = async () => {
        setPushLoading(true);
        setPushNotice('');

        const { registerPushNotifications } = await import('../services/pushNotifications');
        const result = await registerPushNotifications({ requestPermission: true });

        if (result.ok) {
            setPushStatus('granted');
            setPushNotice(t('Notifications enabled for this device.'));
        } else {
            setPushStatus(result.reason || 'error');
            setPushNotice(result.message || t('Unable to enable notifications right now.'));
        }

        setPushLoading(false);
    };

    if (isLoading) {
        return (
            <StudentLayout title="Profile">
                <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                    <RefreshCcw className="animate-spin text-blue-500" size={28} />
                    <p className="text-gray-400 font-bold uppercase tracking-widest text-[10px]">{t('Loading Profile...')}</p>
                </div>
            </StudentLayout>
        );
    }

    if (!student) {
        return (
            <StudentLayout title="Profile">
                <div className="px-4 py-10">
                    <div className="bg-white rounded-2xl border border-rose-100 shadow-sm p-5 space-y-3">
                        <div className="flex items-center gap-3 text-rose-600">
                            <AlertTriangle size={18} />
                            <p className="text-sm font-bold">{t('Profile data could not be loaded.')}</p>
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

    const attendanceSummary = student.attendanceSummary || { total: 0, present: 0, absent: 0, late: 0, percentage: 0 };
    const attendanceRecent = Array.isArray(student.attendanceRecent) ? student.attendanceRecent : [];
    const attendanceTone = attendanceSummary.percentage >= 75 ? 'text-emerald-500' : attendanceSummary.percentage >= 60 ? 'text-amber-500' : 'text-rose-500';

    const getAttendanceBadgeClass = (status) => {
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

    const pushStatusClass = pushStatus === 'granted'
        ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
        : 'bg-amber-50 text-amber-600 border-amber-100';
    const pushStatusLabel = pushStatus === 'granted'
        ? t('Enabled')
        : pushStatus === 'unsupported'
            ? t('App Only')
            : pushStatus === 'disabled'
                ? t('Disabled')
                : t('Not Enabled');

    return (
        <StudentLayout title="Profile">
            <div className="w-full max-w-md mx-auto pb-24 sm:pb-12 animate-in fade-in duration-300 bg-gray-50 min-h-screen">
                
                {/* 1. Hero Profile Header */}
                <div className="bg-white px-6 pt-8 pb-6 rounded-b-3xl shadow-sm mb-6 flex flex-col items-center relative border-b border-gray-100">
                    <div className="h-24 w-24 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white flex items-center justify-center text-4xl font-black shadow-lg shadow-blue-500/20 overflow-hidden mb-4 border-4 border-white">
                        {student.profileImage ? (
                            <img src={student.profileImage} alt={student.name} className="h-full w-full object-cover" />
                        ) : (
                            student.name[0].toUpperCase()
                        )}
                    </div>
                    <h2 className="text-xl font-black text-gray-900 tracking-tight text-center">{student.name}</h2>
                    <div className="flex items-center gap-2 mt-2 bg-gray-50 px-3 py-1 rounded-full border border-gray-100">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{student.rollNo}</p>
                    </div>
                </div>

                {/* 2. Enrollment Horizontal Scroll */}
                <div className="px-4 mb-6">
                    <div className="flex items-center gap-2 mb-3 px-1">
                        <School size={16} className="text-blue-500" />
                        <span className="text-[11px] font-black text-gray-800 uppercase tracking-widest">{t('Enrollment')}</span>
                    </div>
                    <div className="flex overflow-x-auto gap-3 pb-2 -mx-4 px-4 hide-scrollbar snap-x">
                        {/* Class Card */}
                        <div className="min-w-[140px] bg-white p-4 rounded-2xl border border-gray-100 shadow-sm snap-start shrink-0">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('Class / Level')}</p>
                            <p className="text-sm font-bold text-gray-800 truncate">{student.className || t('Not Assigned')}</p>
                        </div>
                        {/* Batch Card (Clickable) */}
                        <div 
                            onClick={() => setIsBatchModalOpen(true)}
                            className="min-w-[140px] bg-blue-50/50 p-4 rounded-2xl border border-blue-100 shadow-sm snap-start shrink-0 active:scale-[0.98] transition-transform cursor-pointer"
                        >
                            <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1">{t('Active Batch')}</p>
                            <div className="flex items-center gap-1.5 text-blue-600">
                                <p className="text-sm font-bold truncate">{student.batchName}</p>
                                <ExternalLink size={12} className="shrink-0" />
                            </div>
                        </div>
                        {/* Admission Card */}
                        <div className="min-w-[140px] bg-white p-4 rounded-2xl border border-gray-100 shadow-sm snap-start shrink-0">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">{t('Admission')}</p>
                            <p className="text-sm font-bold text-gray-800 truncate">
                                {student.admissionDate ? new Date(student.admissionDate).toLocaleDateString('en-GB') : '—'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 3. Identity Grid (2 Column Mobile) */}
                <div className="px-4 mb-6">

    <div className="flex items-center gap-2 mb-3">
        <User size={16} className="text-indigo-500" />
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            {t('Personal Details')}
        </h3>
    </div>

    <div className="overflow-x-auto bg-white rounded-md shadow-sm border">
        <table className="w-full text-sm text-left">
            <tbody className="divide-y">

                <tr>
                    <td className="font-semibold text-gray-600 p-3 w-40">{t('Date of Birth')}</td>
                    <td className="p-3">
                        {student.dob
                            ? new Date(student.dob).toLocaleDateString('en-GB')
                            : '—'}
                    </td>
                </tr>

                <tr>
                    <td className="font-semibold text-gray-600 p-3">{t('Gender')}</td>
                    <td className="p-3">{student.gender || '—'}</td>
                </tr>

                <tr>
                    <td className="font-semibold text-gray-600 p-3">{t('Contact')}</td>
                    <td className="p-3">{student.contact || '—'}</td>
                </tr>

                <tr>
                    <td className="font-semibold text-gray-600 p-3">{t('Email')}</td>
                    <td className="p-3 break-all">{student.email || '—'}</td>
                </tr>

                <tr>
                    <td className="font-semibold text-gray-600 p-3">{t('Address')}</td>
                    <td className="p-3">{student.address || '—'}</td>
                </tr>

            </tbody>
        </table>
    </div>

</div>
<div className="px-4 mb-6">

    <div className="flex items-center gap-2 mb-3">
        <Users size={16} className="text-indigo-500" />
        <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider">
            {t('Parents / Guardians')}
        </h3>
    </div>

    <div className="overflow-x-auto bg-white rounded-md shadow-sm border">
        <table className="w-full text-sm text-left">
            <tbody className="divide-y">

                <tr>
                    <td className="font-semibold text-gray-600 p-3 w-40">{t('Father Name')}</td>
                    <td className="p-3">{student.fatherName || '—'}</td>
                </tr>

                <tr>
                    <td className="font-semibold text-gray-600 p-3">{t('Mother Name')}</td>
                    <td className="p-3">{student.motherName || '—'}</td>
                </tr>

                <tr>
                    <td className="font-semibold text-gray-600 p-3">{t('Guardian Contact')}</td>
                    <td className="p-3">{student.parentContact || '—'}</td>
                </tr>

            </tbody>
        </table>
    </div>

</div>

                {/* 4. Mobile Attendance Overview */}
                <div className="px-4 mb-6 space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <Award size={16} className="text-emerald-500" />
                        <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">{t('Attendance Stats')}</h3>
                    </div>
                    
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {/* Summary Block */}
                        <div className="p-5 flex items-center justify-between border-b border-gray-50 bg-gray-50/30">
                            <div>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{t('Overall Present')}</p>
                                <p className="text-xs font-semibold text-gray-600 mt-0.5">{attendanceSummary.present || 0} {t('out of')} {attendanceSummary.total || 0} {t('days')}</p>
                            </div>
                            <div className={`text-3xl font-black ${attendanceTone}`}>{attendanceSummary.percentage || 0}%</div>
                        </div>
                        {/* 3-way Split */}
                        <div className="grid grid-cols-3 divide-x divide-gray-100">
                            <div className="p-4 text-center bg-emerald-50/30">
                                <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest mb-1">{t('Present')}</p>
                                <p className="text-xl font-black text-emerald-700">{attendanceSummary.present || 0}</p>
                            </div>
                            <div className="p-4 text-center bg-rose-50/30">
                                <p className="text-[9px] font-black text-rose-600 uppercase tracking-widest mb-1">{t('Absent')}</p>
                                <p className="text-xl font-black text-rose-700">{attendanceSummary.absent || 0}</p>
                            </div>
                            <div className="p-4 text-center bg-amber-50/30">
                                <p className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-1">{t('Late')}</p>
                                <p className="text-xl font-black text-amber-700">{attendanceSummary.late || 0}</p>
                            </div>
                        </div>
                    </div>

                    {/* Recent List */}
                    {attendanceRecent.length > 0 && (
                        <div className="space-y-2 mt-4">
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">{t('Recent Records')}</p>
                            {attendanceRecent.map((item, idx) => {
                                const subject = item.subjectId?.name || item.subjectName || 'Subject';
                                return (
                                    <div key={item._id || idx} className="flex items-center justify-between bg-white border border-gray-100 rounded-md px-4 py-3 shadow-sm">
                                        <div className="min-w-0 pr-2">
                                            <p className="text-sm font-semibold text-gray-800 truncate">{subject}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">
                                                {formatAttendanceDate(item.attendanceDate)}
                                            </p>
                                        </div>
                                        <span className={`shrink-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${getAttendanceBadgeClass(item.status)}`}>
                                            {item.status || '—'}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* 5. Mobile Security/Password Reset Form */}
                <div className="px-4 mb-6 space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <Lock size={16} className="text-rose-500" />
                        <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">{t('Security')}</h3>
                    </div>
                    
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
                        {(error || success) && (
                            <div className={`p-3.5 rounded-md mb-5 flex items-start gap-3 animate-in slide-in-from-top-2 ${error ? 'bg-rose-50 text-rose-600 border border-rose-100' : 'bg-emerald-50 text-emerald-600 border border-emerald-100'}`}>
                                <div className="mt-0.5">
                                    {error ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                                </div>
                                <span className="text-xs font-bold leading-relaxed">{error || success}</span>
                            </div>
                        )}
                        
                        <form onSubmit={handleResetPassword} className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">{t('Current Password')}</label>
                                <input
                                    type="password" name="currentPassword" required
                                    value={pwdData.currentPassword} onChange={handlePwdChange}
                                    className="w-full px-4 h-12 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
                                    placeholder={t('Enter current password')}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">{t('New Password')}</label>
                                <input
                                    type="password" name="newPassword" required
                                    value={pwdData.newPassword} onChange={handlePwdChange}
                                    className="w-full px-4 h-12 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
                                    placeholder={t('Enter new password')}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">{t('Confirm Password')}</label>
                                <input
                                    type="password" name="confirmPassword" required
                                    value={pwdData.confirmPassword} onChange={handlePwdChange}
                                    className="w-full px-4 h-12 bg-gray-50 border border-gray-200 rounded-md focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm font-semibold text-gray-900 placeholder:text-gray-400 placeholder:font-normal"
                                    placeholder={t('Confirm new password')}
                                />
                            </div>
                            <button
                                type="submit" disabled={pwdLoading}
                                className="w-full mt-2 h-12 bg-gray-900 text-white text-xs font-black uppercase tracking-widest rounded-md active:scale-[0.98] transition-transform disabled:opacity-50 shadow-md shadow-gray-900/10 flex items-center justify-center gap-2"
                            >
                                {pwdLoading && <RefreshCcw size={14} className="animate-spin" />}
                                {pwdLoading ? t('Validating...') : t('Update Password')}
                            </button>
                        </form>
                    </div>
                </div>

                <div className="px-4 mb-6 space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <Bell size={16} className="text-blue-500" />
                        <h3 className="text-[11px] font-black text-gray-800 uppercase tracking-widest">{t('Notifications')}</h3>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-gray-900">{t('Push Notifications')}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                    {t('Enable alerts on this phone for announcements and updates.')}
                                </p>
                            </div>
                            <span className={`shrink-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${pushStatusClass}`}>
                                {pushStatusLabel}
                            </span>
                        </div>

                        {pushNotice && (
                            <div className={`p-3 rounded-md text-xs font-bold ${pushStatus === 'granted' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                {pushNotice}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleEnableNotifications}
                            disabled={pushLoading || !pushEnabledInBuild}
                            className="w-full mt-2 h-12 bg-blue-600 text-white text-xs font-black uppercase tracking-widest rounded-md active:scale-[0.98] transition-transform disabled:opacity-50 shadow-md shadow-blue-600/20 flex items-center justify-center gap-2"
                        >
                            {pushLoading && <RefreshCcw size={14} className="animate-spin" />}
                            {pushLoading
                                ? t('Enabling...')
                                : pushStatus === 'granted'
                                    ? t('Refresh Notification Setup')
                                    : t('Enable Notifications')}
                        </button>
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
