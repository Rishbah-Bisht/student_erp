import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Camera, Lock, CheckCircle2, AlertTriangle, RefreshCcw, ShieldCheck, Eye, EyeOff, ArrowRight, ArrowLeft } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggleButton from '../components/LanguageToggleButton';

const StudentSetup = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [step, setStep] = useState(1);
    const [image, setImage] = useState(null);
    const [preview, setPreview] = useState(null);
    const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    useEffect(() => {
        const student = JSON.parse(localStorage.getItem('studentInfo') || '{}');
        const token = localStorage.getItem('studentToken');

        if (!token) {
            navigate('/student/login');
            return;
        }

        const needsSetup = student.needsSetup !== undefined
            ? student.needsSetup
            : (student.isFirstLogin || !student.profileImage);

        if (!needsSetup) {
            navigate('/student/dashboard');
        }
    }, [navigate]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setError(t('Image size must be less than 2MB'));
                return;
            }
            setImage(file);
            setPreview(URL.createObjectURL(file));
            setError('');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!image) {
            setError(t('Please upload a profile picture'));
            return;
        }

        if (passwords.newPassword.length < 6) {
            setError(t('Password must be at least 6 characters long'));
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            setError(t('Passwords do not match'));
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append('profileImage', image);
        formData.append('newPassword', passwords.newPassword);

        try {
            const res = await api.post('/student/complete-setup', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });

            if (res.data.success) {
                const studentInfo = JSON.parse(localStorage.getItem('studentInfo') || '{}');
                studentInfo.isFirstLogin = false;
                studentInfo.profileImage = res.data.student?.profileImage || studentInfo.profileImage;
                studentInfo.needsSetup = false;
                localStorage.setItem('studentInfo', JSON.stringify(studentInfo));

                setStep(3);
                setTimeout(() => navigate('/student/dashboard'), 2000);
            }
        } catch (err) {
            setError(err.response?.data?.message || t('Failed to complete setup'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center p-4 font-sans overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100">
            <div className="absolute right-4 top-4 z-[120]">
                <LanguageToggleButton variant="topbar" />
            </div>

            {/* Subtle background pattern */}
            <div className="absolute inset-0 opacity-[0.03] [background-image:radial-gradient(circle_at_1px_1px,rgba(0,0,0,0.8)_1px,transparent_0)] [background-size:20px_20px]" />

            {/* Decorative blobs */}
            <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] bg-indigo-100 rounded-full blur-[100px] opacity-50 pointer-events-none" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[350px] h-[350px] bg-emerald-100 rounded-full blur-[100px] opacity-40 pointer-events-none" />

            {/* --- MAIN CARD --- */}
            <div className="relative z-10 w-full max-w-[440px] bg-white rounded-[24px] sm:rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.08)] border border-gray-200 overflow-hidden">

                {/* Step Indicator */}
                <div className="px-6 pt-6 sm:px-8 sm:pt-8">
                    <div className="flex items-center gap-2">
                        {[1, 2, 3].map((s) => (
                            <div key={s} className="flex-1">
                                <div className={`h-1.5 rounded-full transition-all duration-500 ${
                                    s <= step ? 'bg-[#191838]' : 'bg-gray-100'
                                }`} />
                            </div>
                        ))}
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-400 mt-2.5">
                        {t('Step')} {step} {t('of')} 3
                    </p>
                </div>

                {/* Header */}
                <div className="px-6 pt-4 pb-2 sm:px-8 text-center">
                    <div className="flex items-center justify-center gap-2.5 mb-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#191838] text-white">
                            <ShieldCheck size={18} />
                        </div>
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">{t('Setup Portal')}</h2>
                    <p className="text-gray-500 text-sm mt-2 font-medium">{t('Verify your identity and secure your workspace.')}</p>
                </div>

                {/* Content */}
                <div className="px-6 pb-8 pt-4 sm:px-8 sm:pb-10">
                    {error && (
                        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-start gap-3 mb-6 animate-in fade-in zoom-in duration-300">
                            <AlertTriangle size={18} className="shrink-0 mt-0.5" />
                            <span className="text-sm font-bold leading-snug">{error}</span>
                        </div>
                    )}

                    {/* STEP 1: Photo Upload */}
                    {step === 1 && (
                        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                            <div className="flex flex-col items-center space-y-5">
                                <div className="relative">
                                    <div className="h-32 w-32 sm:h-36 sm:w-36 rounded-full bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden transition-all hover:border-[#191838]/30 group">
                                        {preview ? (
                                            <img src={preview} alt="Preview" className="h-full w-full object-cover rounded-full" />
                                        ) : (
                                            <Camera className="text-gray-300 group-hover:text-[#191838] transition-colors" size={40} />
                                        )}
                                    </div>
                                    <label className="absolute -bottom-1 -right-1 h-10 w-10 bg-[#191838] text-white rounded-full shadow-lg shadow-gray-300/60 flex items-center justify-center cursor-pointer hover:bg-[#12112a] transition-all active:scale-95 border-3 border-white">
                                        <Camera size={16} />
                                        <input type="file" className="hidden" accept="image/*" onChange={handleImageChange} />
                                    </label>
                                </div>
                                <div className="text-center space-y-1.5">
                                    <h3 className="text-lg font-black text-gray-900 tracking-tight">{t('Professional Photo')}</h3>
                                    <p className="text-xs text-gray-500 font-medium leading-relaxed max-w-[280px]">
                                        {t('Upload a clear front-facing photo. This will be used for your official ID card and cannot be changed.')}
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => image ? setStep(2) : setError(t('Please upload your photo to continue'))}
                                className="w-full py-3.5 bg-[#191838] hover:bg-[#12112a] text-white text-sm font-bold rounded-2xl flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(25,24,56,0.25)] hover:shadow-[0_6px_20px_rgba(25,24,56,0.3)] hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] group"
                            >
                                <span>{t('Continue')}</span>
                                <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    )}

                    {/* STEP 2: Password Setup */}
                    {step === 2 && (
                        <form onSubmit={handleSubmit} className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-500">
                            {/* Preview thumbnail */}
                            {preview && (
                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-200 mb-2">
                                    <img src={preview} alt="Profile" className="h-10 w-10 rounded-full object-cover ring-2 ring-[#191838]/10" />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-900 truncate">{t('Photo uploaded')}</p>
                                        <p className="text-[10px] text-gray-400 font-medium">{t('Ready for activation')}</p>
                                    </div>
                                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">{t('Set New Password')}</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Lock size={18} className="text-gray-400 group-focus-within:text-[#191838] transition-colors" />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={passwords.newPassword}
                                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                            className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#191838] focus:ring-4 focus:ring-[#191838]/5 transition-all text-sm font-medium"
                                            placeholder={t('Choose a strong password')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#191838] transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-bold text-gray-700">{t('Confirm Password')}</label>
                                    <div className="relative group">
                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                            <Lock size={18} className="text-gray-400 group-focus-within:text-[#191838] transition-colors" />
                                        </div>
                                        <input
                                            type={showConfirm ? 'text' : 'password'}
                                            required
                                            value={passwords.confirmPassword}
                                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                            className="w-full pl-10 pr-12 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-[#191838] focus:ring-4 focus:ring-[#191838]/5 transition-all text-sm font-medium"
                                            placeholder={t('Repeat the password')}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowConfirm(!showConfirm)}
                                            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-[#191838] transition-colors"
                                        >
                                            {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Password hint */}
                            <p className="text-[11px] text-gray-400 font-medium">
                                {t('Use at least 6 characters with a mix of letters and numbers.')}
                            </p>

                            <div className="flex gap-3 pt-1">
                                <button
                                    type="button"
                                    onClick={() => setStep(1)}
                                    className="flex-1 py-3 bg-gray-50 border border-gray-200 text-gray-600 text-sm font-bold rounded-2xl hover:bg-gray-100 transition-all flex items-center justify-center gap-1.5"
                                >
                                    <ArrowLeft size={15} />
                                    <span>{t('Back')}</span>
                                </button>
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex-[2] py-3 bg-[#191838] hover:bg-[#12112a] text-white text-sm font-bold rounded-2xl shadow-[0_4px_14px_rgba(25,24,56,0.25)] hover:shadow-[0_6px_20px_rgba(25,24,56,0.3)] hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {loading ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            <span>{t('Activate Portal')}</span>
                                            <ArrowRight size={16} />
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    )}

                    {/* STEP 3: Success */}
                    {step === 3 && (
                        <div className="py-10 sm:py-14 text-center space-y-5 animate-in fade-in duration-500">
                            <div className="h-20 w-20 sm:h-24 sm:w-24 bg-emerald-50 border border-emerald-200 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg shadow-emerald-100">
                                <CheckCircle2 size={40} />
                            </div>
                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">{t('Identity Verified')}</h3>
                                <p className="text-sm text-emerald-600 font-bold uppercase tracking-widest">{t('Entry Granted')}</p>
                            </div>
                            <div className="flex flex-col items-center gap-3 pt-3">
                                <RefreshCcw className="animate-spin text-[#191838]" size={20} />
                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{t('Redirecting to Dashboard')}</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentSetup;
