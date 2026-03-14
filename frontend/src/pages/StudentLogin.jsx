import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../services/api';
import instituteLogo from '../assets/icon.png';
import { useLanguage } from '../context/LanguageContext';

const StudentLogin = () => {
    const { t } = useLanguage();
    const [rollNo, setRollNo] = useState('');
    const [password, setPassword] = useState('');
    const [formError, setFormError] = useState('');
    const [fieldErrors, setFieldErrors] = useState({ rollNo: '', password: '' });
    const [touched, setTouched] = useState({ rollNo: false, password: false });
    const [submitAttempted, setSubmitAttempted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('studentToken');
        if (!token) return;

        try {
            const student = JSON.parse(localStorage.getItem('studentInfo') || '{}');
            const needsSetup = student?.needsSetup !== undefined
                ? student.needsSetup
                : (student?.isFirstLogin || !student?.profileImage);

            navigate(needsSetup ? '/student/setup' : '/student/dashboard', { replace: true });
        } catch {
            navigate('/student/dashboard', { replace: true });
        }
    }, [navigate]);

    const validate = (nextRollNo = rollNo, nextPassword = password) => {
        const errors = { rollNo: '', password: '' };
        if (!nextRollNo.trim()) {
            errors.rollNo = t('Student ID or email is required.');
        }
        if (!nextPassword.trim()) {
            errors.password = t('Password is required.');
        }
        setFieldErrors(errors);
        return !errors.rollNo && !errors.password;
    };

    const handleFieldChange = (field, value) => {
        if (field === 'rollNo') {
            setRollNo(value);
        } else {
            setPassword(value);
        }
        setFormError('');
        if (submitAttempted || touched[field]) {
            validate(field === 'rollNo' ? value : rollNo, field === 'password' ? value : password);
        }
    };

    const shouldShowFieldError = (field) => (submitAttempted || touched[field]) && fieldErrors[field];

    const handleLogin = async (e) => {
        e.preventDefault();
        if (loading) return;
        setFormError('');
        setSubmitAttempted(true);
        const normalizedRollNo = rollNo.trim();
        const isValid = validate(normalizedRollNo, password);
        if (!isValid) return;

        setLoading(true);
        try {
            const response = await api.post('/student/login', { rollNo: normalizedRollNo, password });
            if (response.data.success) {
                localStorage.setItem('studentToken', response.data.token);
                localStorage.setItem('studentInfo', JSON.stringify(response.data.student));
                if (response.data.student.isFirstLogin) {
                    navigate('/student/setup');
                } else {
                    navigate('/student/dashboard');
                }
            }
        } catch (err) {
            if (err.response?.status === 401) {
                setFormError(t('Invalid ID or password. Please try again.'));
            } else if (err.response?.status === 429) {
                setFormError(t('Too many attempts. Please wait a minute and try again.'));
            } else if (!err.response) {
                setFormError(t('Unable to reach the server. Check your internet connection.'));
            } else {
                setFormError(err.response?.data?.message || t('Login failed. Please try again.'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center p-4 font-sans overflow-hidden bg-[#0a1128]">
            
            {/* --- INLINE CSS FOR ADVANCED ANIMATIONS --- */}
            <style>
                {`
                    @keyframes float {
                        0%, 100% { transform: translateY(0) rotate(0deg); }
                        50% { transform: translateY(-20px) rotate(5deg); }
                    }
                    @keyframes float-reverse {
                        0%, 100% { transform: translateY(0) rotate(0deg); }
                        50% { transform: translateY(20px) rotate(-5deg); }
                    }
                    @keyframes spin-slow {
                        from { transform: rotate(0deg); }
                        to { transform: rotate(360deg); }
                    }
                    @keyframes draw-line {
                        from { stroke-dashoffset: 1000; }
                        to { stroke-dashoffset: 0; }
                    }
                    @keyframes pulse-glow {
                        0%, 100% { opacity: 0.3; transform: scale(1); }
                        50% { opacity: 0.8; transform: scale(1.2); }
                    }
                    
                    .film-reel-1 { animation: float 12s ease-in-out infinite; }
                    .film-reel-2 { animation: float-reverse 15s ease-in-out infinite; }
                    .spin-element { animation: spin-slow 25s linear infinite; transform-origin: center; }
                    
                    .glowing-path {
                        stroke-dasharray: 1000;
                        stroke-dashoffset: 1000;
                        animation: draw-line 8s linear infinite alternate;
                    }
                `}
            </style>

            {/* --- ANIMATED BACKGROUND ELEMENTS --- */}
            
            {/* Base Radial Gradient */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/40 via-[#0a1128] to-[#0a1128]"></div>

            {/* Animated Glowing Light Lines (SVG) */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60" preserveAspectRatio="none">
                <defs>
                    <linearGradient id="cyan-glow" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#06b6d4" stopOpacity="0" />
                        <stop offset="50%" stopColor="#22d3ee" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                    </linearGradient>
                    <linearGradient id="purple-glow" x1="100%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#a855f7" stopOpacity="0" />
                        <stop offset="50%" stopColor="#c084fc" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                    </linearGradient>
                </defs>
                {/* Curved swishes mimicking cinematic light leaks */}
                <path d="M-100,800 C300,600 500,100 1200,300" fill="none" stroke="url(#cyan-glow)" strokeWidth="8" className="glowing-path" style={{ filter: 'blur(4px)' }} />
                <path d="M1200,800 C800,900 300,400 -100,200" fill="none" stroke="url(#purple-glow)" strokeWidth="6" className="glowing-path" style={{ animationDelay: '-4s', filter: 'blur(6px)' }} />
                <path d="M-200,500 C400,300 800,800 1400,400" fill="none" stroke="url(#cyan-glow)" strokeWidth="3" className="glowing-path" style={{ animationDelay: '-2s' }} />
            </svg>

            {/* Floating Film Reels (Pure SVG) */}
            <div className="absolute top-10 right-[10%] opacity-20 film-reel-1 pointer-events-none">
                <svg width="180" height="180" viewBox="0 0 100 100" className="spin-element text-cyan-200">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="8" strokeDasharray="12 6" />
                    <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="2" />
                    <circle cx="50" cy="50" r="10" fill="currentColor" />
                    <line x1="50" y1="20" x2="50" y2="80" stroke="currentColor" strokeWidth="2" />
                    <line x1="20" y1="50" x2="80" y2="50" stroke="currentColor" strokeWidth="2" />
                    <line x1="29" y1="29" x2="71" y2="71" stroke="currentColor" strokeWidth="2" />
                    <line x1="29" y1="71" x2="71" y2="29" stroke="currentColor" strokeWidth="2" />
                </svg>
            </div>

            <div className="absolute bottom-10 left-[5%] opacity-20 film-reel-2 pointer-events-none">
                <svg width="220" height="220" viewBox="0 0 100 100" className="spin-element text-purple-200" style={{ animationDirection: 'reverse', animationDuration: '35s' }}>
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="10" strokeDasharray="15 5" />
                    <circle cx="50" cy="50" r="28" fill="none" stroke="currentColor" strokeWidth="3" />
                    <circle cx="50" cy="50" r="12" fill="none" stroke="currentColor" strokeWidth="4" />
                    <path d="M50 22 L50 78 M22 50 L78 50 M30 30 L70 70 M30 70 L70 30" stroke="currentColor" strokeWidth="3" />
                </svg>
            </div>

            {/* Glowing Particles/Dust */}
            <div className="absolute top-[20%] left-[20%] w-2 h-2 bg-cyan-400 rounded-full blur-[2px]" style={{ animation: 'pulse-glow 3s infinite' }}></div>
            <div className="absolute top-[60%] right-[25%] w-3 h-3 bg-purple-400 rounded-full blur-[2px]" style={{ animation: 'pulse-glow 4s infinite 1s' }}></div>
            <div className="absolute bottom-[30%] left-[30%] w-1.5 h-1.5 bg-blue-300 rounded-full blur-[1px]" style={{ animation: 'pulse-glow 2.5s infinite 2s' }}></div>


            {/* --- FOREGROUND LOGIN CARD (Remains exactly like your design) --- */}
            <div className="relative z-10 w-full max-w-[420px] bg-white rounded-[24px] shadow-[0_20px_60px_rgb(0,0,0,0.4)] border border-slate-100 p-8 sm:p-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
                
                {/* Top Icon & Headers */}
                <div className="flex flex-col items-center mb-8 relative">
                    {/* Glowing effect strictly behind the shield icon to tie it to the background */}
                    {/* Top Icon / Logo Section */}
    
   
    {/* Image Container */}
    <div className="relative w-20 h-20 bg-white rounded-md flex items-center justify-center shadow-lg shadow-slate-900/10 mb-6 p-2 border border-slate-50 group hover:-translate-y-1 hover:shadow-xl transition-all duration-300">
        <img 
            src={instituteLogo} 
            alt="Institute Logo" 
            className="w-full h-full object-contain drop-shadow-sm group-hover:scale-105 transition-transform duration-300" 
        />
    </div>

                    <h1 className="text-2xl font-bold text-[#0f172a] tracking-tight mb-2">
                        {t('De Facto Institute Erp')}
                    </h1>
                    <p className="text-slate-500 text-sm font-medium">
                        {t('Secure login for students only.')}
                    </p>
                </div>

                {/* Error Banner */}
                {formError && (
                    <div className="mb-6 bg-red-50 border border-red-100 text-red-600 p-3 rounded-xl flex items-center gap-3 animate-in fade-in zoom-in duration-300" role="alert">
                        <AlertCircle size={18} className="shrink-0" />
                        <p className="text-sm font-medium">{formError}</p>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="space-y-5" noValidate>
                    
                    {/* Student ID Field */}
                    <div className="space-y-2">
                        <label htmlFor="student-roll" className="block text-sm font-semibold text-[#0f172a]">
                            {t('Student ID')}
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Mail size={18} className={`transition-colors ${shouldShowFieldError('rollNo') ? 'text-red-400' : 'text-slate-400 group-focus-within:text-[#0f172a]'}`} />
                            </div>
                            <input
                                id="student-roll"
                                type="text"
                                value={rollNo}
                                onChange={(e) => handleFieldChange('rollNo', e.target.value)}
                                onBlur={() => setTouched((prev) => ({ ...prev, rollNo: true }))}
                                placeholder={t('Student ID')}
                                autoComplete="username"
                                className={`w-full pl-10 pr-4 py-3 bg-[#f8fafc] border ${shouldShowFieldError('rollNo') ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20' : 'border-slate-200 focus:border-[#0f172a] focus:ring-[#0f172a]/10'} rounded-xl text-[#0f172a] placeholder-slate-400 focus:outline-none focus:ring-4 transition-all`}
                            />
                        </div>
                        {shouldShowFieldError('rollNo') && (
                            <p className="text-xs text-red-500 font-medium">{fieldErrors.rollNo}</p>
                        )}
                    </div>

                    {/* Password Field */}
                    <div className="space-y-2">
                        <label htmlFor="student-password" className="block text-sm font-semibold text-[#0f172a]">
                            {t('Password')}
                        </label>
                        <div className="relative group">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                <Lock size={18} className={`transition-colors ${shouldShowFieldError('password') ? 'text-red-400' : 'text-slate-400 group-focus-within:text-[#0f172a]'}`} />
                            </div>
                            <input
                                id="student-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => handleFieldChange('password', e.target.value)}
                                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                                placeholder={t('Enter your password')}
                                autoComplete="current-password"
                                className={`w-full pl-10 pr-12 py-3 bg-[#f8fafc] border ${shouldShowFieldError('password') ? 'border-red-300 focus:border-red-400 focus:ring-red-400/20' : 'border-slate-200 focus:border-[#0f172a] focus:ring-[#0f172a]/10'} rounded-xl text-[#0f172a] placeholder-slate-400 focus:outline-none focus:ring-4 transition-all`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-[#0f172a] transition-colors"
                                aria-label={showPassword ? t('Hide password') : t('Show password')}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {shouldShowFieldError('password') && (
                            <p className="text-xs text-red-500 font-medium">{fieldErrors.password}</p>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full mt-8 py-3.5 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl font-semibold text-[15px] flex items-center justify-center gap-2 shadow-[0_4px_14px_0_rgb(15,23,42,0.39)] hover:shadow-[0_6px_20px_rgba(15,23,42,0.23)] hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed group overflow-hidden relative"
                    >
                        {/* Button Shimmer Effect */}
                        <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent group-hover:animate-[shimmer_1.5s_infinite]"></div>
                        
                        {loading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin relative z-10" />
                        ) : (
                            <>
                                <span className="relative z-10">{t('Secure Login Access')}</span>
                                <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                            </>
                        )}
                    </button>
                    
                    {/* Add shimmer keyframe to the style block */}
                    <style>{`@keyframes shimmer { 100% { transform: translateX(100%); } }`}</style>
                </form>

            </div>
        </div>
    );
};

export default StudentLogin;