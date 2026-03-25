import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import StudentLayout from '../components/StudentLayout';
import {
    Lock, RefreshCcw, AlertTriangle,
    CheckCircle2, Bell
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const StudentSettings = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const pushEnabledInBuild = import.meta.env.VITE_ENABLE_PUSH === 'true';
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
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

        try {
            const { registerPushNotifications } = await import('../services/pushNotifications');
            const result = await registerPushNotifications({ requestPermission: true });

            if (result.ok) {
                setPushStatus('granted');
                setPushNotice(t('Notifications enabled for this device.'));
            } else {
                setPushStatus(result.reason || 'error');
                setPushNotice(result.message || t('Unable to enable notifications right now.'));
            }
        } catch (err) {
            setPushStatus('error');
            setPushNotice(t('Unable to enable notifications right now.'));
        } finally {
            setPushLoading(false);
        }
    };

    const pushStatusClass = pushStatus === 'granted'
        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
        : 'bg-amber-50 text-amber-700 border-amber-200';
    
    const pushStatusLabel = pushStatus === 'granted'
        ? t('Enabled')
        : pushStatus === 'unsupported'
            ? t('App Only')
            : pushStatus === 'disabled'
                ? t('Disabled')
                : t('Not Enabled');

    return (
        <StudentLayout title="Settings">
            <div className="w-full max-w-2xl mx-auto px-4 pt-4 pb-24 sm:pb-12 animate-in fade-in duration-300 min-h-screen bg-[radial-gradient(circle_at_top,#e0e7ff_0%,#f8fafc_35%,#f8fafc_100%)]">
                <div className="mb-6 rounded-[28px] border border-slate-200/80 bg-white/95 backdrop-blur-sm p-5 shadow-[0_20px_45px_rgba(15,23,42,0.08)] sm:p-6">
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-slate-500">{t('Preferences')}</p>
                    <h2 className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-slate-900">{t('Personalize your account settings')}</h2>
                    <p className="mt-2 text-sm text-slate-600">
                        {t('Manage password security and notification preferences from one place.')}
                    </p>
                </div>

                {/* Security Section */}
                <section className="mb-6 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-6">
                    <div className="flex items-center justify-between gap-3 mb-5">
                        <div className="flex items-center gap-2.5">
                            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
                                <Lock size={16} />
                            </span>
                            <div>
                                <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-800">{t('Security')}</h3>
                                <p className="text-xs text-slate-500 mt-0.5">{t('Keep your account protected')}</p>
                            </div>
                        </div>
                        <span className="hidden sm:inline-flex px-3 py-1 rounded-full bg-slate-100 text-[10px] font-black uppercase tracking-wider text-slate-600 border border-slate-200">
                            {t('Recommended')}
                        </span>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5">
                        {(error || success) && (
                            <div className={`p-3.5 rounded-xl mb-5 flex items-start gap-3 animate-in slide-in-from-top-2 ${error ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}`}>
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
                                    className="w-full px-4 h-12 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                                    placeholder={t('Enter current password')}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">{t('New Password')}</label>
                                <input
                                    type="password" name="newPassword" required
                                    value={pwdData.newPassword} onChange={handlePwdChange}
                                    className="w-full px-4 h-12 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                                    placeholder={t('Enter new password')}
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">{t('Confirm Password')}</label>
                                <input
                                    type="password" name="confirmPassword" required
                                    value={pwdData.confirmPassword} onChange={handlePwdChange}
                                    className="w-full px-4 h-12 bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-sm font-semibold text-slate-900 placeholder:text-slate-400 placeholder:font-normal"
                                    placeholder={t('Confirm new password')}
                                />
                            </div>
                            <button
                                type="submit" disabled={pwdLoading}
                                className="w-full mt-2 h-12 bg-[#191838] text-white text-xs font-black uppercase tracking-widest rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50 shadow-md shadow-indigo-900/20 flex items-center justify-center gap-2"
                            >
                                {pwdLoading && <RefreshCcw size={14} className="animate-spin" />}
                                {pwdLoading ? t('Validating...') : t('Update Password')}
                            </button>

                            <p className="text-[11px] text-slate-500 leading-relaxed pt-1">
                                {t('Use at least 8 characters with a mix of letters, numbers, and symbols.')}
                            </p>
                        </form>
                    </div>
                </section>

                {/* Notifications Section */}
                <section className="mb-6 rounded-[28px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_40px_rgba(15,23,42,0.06)] sm:p-6">
                    <div className="flex items-center gap-2.5 mb-5">
                        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
                            <Bell size={16} />
                        </span>
                        <div>
                            <h3 className="text-sm font-black uppercase tracking-[0.16em] text-slate-800">{t('Notifications')}</h3>
                            <p className="text-xs text-slate-500 mt-0.5">{t('Control app alerts for this device')}</p>
                        </div>
                    </div>

                    <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4 sm:p-5 space-y-4">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-sm font-semibold text-slate-900">{t('Push Notifications')}</p>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    {t('Enable alerts on this phone for announcements and updates.')}
                                </p>
                            </div>
                            <span className={`shrink-0 px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full border ${pushStatusClass}`}>
                                {pushStatusLabel}
                            </span>
                        </div>

                        {pushNotice && (
                            <div className={`p-3 rounded-xl text-xs font-bold ${pushStatus === 'granted' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
                                {pushNotice}
                            </div>
                        )}

                        <button
                            type="button"
                            onClick={handleEnableNotifications}
                            disabled={pushLoading || !pushEnabledInBuild}
                            className="w-full mt-2 h-12 bg-indigo-600 text-white text-xs font-black uppercase tracking-widest rounded-xl active:scale-[0.98] transition-transform disabled:opacity-50 shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
                        >
                            {pushLoading && <RefreshCcw size={14} className="animate-spin" />}
                            {pushLoading
                                ? t('Enabling...')
                                : pushStatus === 'granted'
                                    ? t('Refresh Notification Setup')
                                    : t('Enable Notifications')}
                        </button>

                        <p className="text-[11px] text-slate-500 leading-relaxed">
                            {t('You can change this anytime from app or device notification settings.')}
                        </p>
                    </div>
                </section>

            </div>
        </StudentLayout>
    );
};

export default StudentSettings;
