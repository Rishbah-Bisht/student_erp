import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight, AlertCircle } from 'lucide-react';
import api from '../services/api';
import instituteLogo from '../assets/icon.png';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggleButton from '../components/LanguageToggleButton';
import { isNativeShell } from '../services/nativeAuth';


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

        if (isNativeShell()) {
            const webUrl = import.meta.env.VITE_STUDENT_WEB_URL;
            if (webUrl) {
                try {
                    const targetOrigin = new URL(webUrl).origin;
                    if (window.location.origin !== targetOrigin) {
                        window.location.assign(webUrl);
                        return;
                    }
                } catch (e) {
                    console.error('Invalid VITE_STUDENT_WEB_URL:', webUrl);
                }
            }
        }

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

                if (isNativeShell()) {
                    const webUrl = import.meta.env.VITE_STUDENT_WEB_URL;
                    if (webUrl) {
                        try {
                            const targetOrigin = new URL(webUrl).origin;
                            if (window.location.origin !== targetOrigin) {
                                window.location.assign(webUrl);
                            }
                        } catch (e) {
                            console.error('Invalid VITE_STUDENT_WEB_URL:', webUrl);
                            navigate('/student/dashboard');
                        }
                    } else {
                        navigate('/student/dashboard');
                    }
                } else if (response.data.student.isFirstLogin) {
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
        <div className="sl-page">
            {/* --- INLINE STYLES --- */}
            <style>
                {`
                    /* ═══ PAGE SHELL ═══ */
                    .sl-page {
                        display: flex;
                        flex-direction: column;
                        min-height: 100vh;
                        min-height: 100dvh;
                        font-family: 'Inter', system-ui, -apple-system, sans-serif;
                        background: #f5f7fa;
                        overflow-x: hidden;
                        position: relative;
                    }

                    /* ═══ HERO (TOP SECTION) ═══ */
                    .sl-hero {
                        position: relative;
                        flex-shrink: 0;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        padding: 52px 24px 72px;
                        background: linear-gradient(165deg, #1e1b4b 0%, #191838 35%, #0f0e24 100%);
                        overflow: hidden;
                    }

                    /* Subtle grid pattern on hero */
                    .sl-hero::before {
                        content: '';
                        position: absolute;
                        inset: 0;
                        background-image:
                            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px);
                        background-size: 40px 40px;
                        pointer-events: none;
                    }

                    /* Gradient orbs */
                    .sl-hero::after {
                        content: '';
                        position: absolute;
                        width: 300px;
                        height: 300px;
                        border-radius: 50%;
                        background: radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%);
                        top: -60px;
                        right: -80px;
                        pointer-events: none;
                    }

                    .sl-orb-2 {
                        position: absolute;
                        width: 200px;
                        height: 200px;
                        border-radius: 50%;
                        background: radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 70%);
                        bottom: 20px;
                        left: -50px;
                        pointer-events: none;
                    }

                    /* ═══ LOGO & GLOW ═══ */
                    .sl-logo-wrap {
                        position: relative;
                        margin-bottom: 24px;
                        animation: sl-fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) both;
                    }

                    .sl-logo-glow {
                        position: absolute;
                        inset: -16px;
                        border-radius: 28px;
                        background: radial-gradient(circle, rgba(99, 102, 241, 0.25) 0%, transparent 70%);
                        animation: sl-glow-pulse 3s ease-in-out infinite;
                        pointer-events: none;
                    }

                    .sl-logo-box {
                        position: relative;
                        width: 80px;
                        height: 80px;
                        border-radius: 22px;
                        background: rgba(255, 255, 255, 0.08);
                        border: 1px solid rgba(255, 255, 255, 0.12);
                        backdrop-filter: blur(12px);
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 10px;
                        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                    }

                    .sl-logo-box img {
                        width: 100%;
                        height: 100%;
                        object-fit: contain;
                        filter: drop-shadow(0 2px 8px rgba(0,0,0,0.3));
                    }

                    .sl-hero-title {
                        color: #ffffff;
                        font-size: 24px;
                        font-weight: 800;
                        letter-spacing: -0.02em;
                        margin: 0 0 8px;
                        text-align: center;
                        animation: sl-fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s both;
                    }

                    .sl-hero-sub {
                        color: rgba(255, 255, 255, 0.5);
                        font-size: 14px;
                        font-weight: 500;
                        margin: 0;
                        text-align: center;
                        animation: sl-fade-up 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.2s both;
                    }

                    /* ═══ FORM CARD (BOTTOM SHEET) ═══ */
                    .sl-card {
                        position: relative;
                        flex: 1;
                        margin-top: -36px;
                        background: #ffffff;
                        border-radius: 32px 32px 0 0;
                        padding: 36px 24px 40px;
                        box-shadow: 0 -8px 40px rgba(0, 0, 0, 0.08);
                        animation: sl-slide-up 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.15s both;
                        z-index: 10;
                    }

                    @media (min-width: 480px) {
                        .sl-card { padding: 40px 32px 48px; }
                        .sl-hero { padding: 60px 32px 80px; }
                        .sl-hero-title { font-size: 28px; }
                    }

                    /* ═══ ERROR BANNER ═══ */
                    .sl-error {
                        display: flex;
                        align-items: flex-start;
                        gap: 12px;
                        padding: 14px 16px;
                        background: #fef2f2;
                        border: 1px solid #fecaca;
                        border-radius: 16px;
                        margin-bottom: 24px;
                        animation: sl-fade-in 0.3s ease both;
                    }

                    .sl-error-icon { color: #f43f5e; flex-shrink: 0; margin-top: 1px; }
                    .sl-error-title { font-size: 13px; font-weight: 700; color: #be123c; margin: 0; }
                    .sl-error-hint { font-size: 11px; color: #f43f5e; margin: 4px 0 0; }

                    /* ═══ FORM FIELDS ═══ */
                    .sl-form { display: flex; flex-direction: column; gap: 20px; }

                    .sl-field-label {
                        display: block;
                        font-size: 13px;
                        font-weight: 700;
                        color: #374151;
                        margin-bottom: 8px;
                        letter-spacing: -0.01em;
                    }

                    .sl-input-wrap {
                        position: relative;
                        display: flex;
                        align-items: center;
                    }

                    .sl-input-icon {
                        position: absolute;
                        left: 16px;
                        color: #9ca3af;
                        pointer-events: none;
                        transition: color 0.2s;
                        z-index: 2;
                    }

                    .sl-input-wrap:focus-within .sl-input-icon { color: #191838; }
                    .sl-input-wrap.sl-has-error .sl-input-icon { color: #f43f5e; }

                    .sl-input {
                        width: 100%;
                        height: 52px;
                        padding: 0 16px 0 48px;
                        background: #f8fafc;
                        border: 1.5px solid #e5e7eb;
                        border-radius: 16px;
                        font-size: 15px;
                        font-weight: 500;
                        font-family: inherit;
                        color: #111827;
                        outline: none;
                        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                    }

                    .sl-input::placeholder { color: #9ca3af; font-weight: 400; }

                    .sl-input:focus {
                        border-color: #191838;
                        background: #ffffff;
                        box-shadow: 0 0 0 4px rgba(25, 24, 56, 0.06);
                    }

                    .sl-input.sl-input-error {
                        border-color: #fca5a5;
                    }
                    .sl-input.sl-input-error:focus {
                        border-color: #f43f5e;
                        box-shadow: 0 0 0 4px rgba(244, 63, 94, 0.08);
                    }

                    .sl-input-pw { padding-right: 52px; }

                    .sl-eye-btn {
                        position: absolute;
                        right: 14px;
                        background: none;
                        border: none;
                        color: #9ca3af;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        padding: 4px;
                        border-radius: 8px;
                        transition: all 0.15s;
                        z-index: 2;
                    }
                    .sl-eye-btn:hover { color: #191838; background: rgba(25,24,56,0.04); }

                    .sl-field-error {
                        display: block;
                        font-size: 12px;
                        font-weight: 600;
                        color: #f43f5e;
                        margin-top: 6px;
                        padding-left: 2px;
                    }

                    /* ═══ SUBMIT BUTTON ═══ */
                    .sl-submit {
                        width: 100%;
                        height: 54px;
                        margin-top: 12px;
                        border: none;
                        border-radius: 18px;
                        background: linear-gradient(135deg, #191838 0%, #2d2a6e 100%);
                        color: #ffffff;
                        font-size: 15px;
                        font-weight: 700;
                        font-family: inherit;
                        cursor: pointer;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 10px;
                        position: relative;
                        overflow: hidden;
                        transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
                        box-shadow: 0 4px 16px rgba(25, 24, 56, 0.3);
                        letter-spacing: -0.01em;
                    }

                    .sl-submit:hover:not(:disabled) {
                        transform: translateY(-2px);
                        box-shadow: 0 8px 24px rgba(25, 24, 56, 0.35);
                    }

                    .sl-submit:active:not(:disabled) {
                        transform: scale(0.98) translateY(0);
                    }

                    .sl-submit:disabled {
                        opacity: 0.65;
                        cursor: not-allowed;
                        transform: none;
                        box-shadow: none;
                    }

                    /* Shimmer on hover */
                    .sl-submit::after {
                        content: '';
                        position: absolute;
                        inset: 0;
                        background: linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.12) 50%, transparent 60%);
                        transform: translateX(-100%);
                        transition: none;
                    }
                    .sl-submit:hover:not(:disabled)::after {
                        animation: sl-shimmer 1.5s infinite;
                    }

                    .sl-spinner {
                        width: 22px;
                        height: 22px;
                        border: 2.5px solid rgba(255,255,255,0.25);
                        border-top-color: #ffffff;
                        border-radius: 50%;
                        animation: sl-spin 0.7s linear infinite;
                    }

                    .sl-btn-arrow {
                        transition: transform 0.2s;
                    }
                    .sl-submit:hover:not(:disabled) .sl-btn-arrow {
                        transform: translateX(4px);
                    }

                    /* ═══ FOOTER ═══ */
                    .sl-footer {
                        display: flex;
                        align-items: center;
                        justify-content: center;
                        gap: 6px;
                        margin-top: 28px;
                        padding-top: 20px;
                        border-top: 1px solid #f1f5f9;
                    }

                    .sl-footer-icon { color: #a5b4fc; }

                    .sl-footer-text {
                        font-size: 11px;
                        font-weight: 600;
                        color: #9ca3af;
                        letter-spacing: 0.02em;
                    }

                    /* ═══ LANGUAGE TOGGLE ═══ */
                    .sl-lang-toggle {
                        position: absolute;
                        top: 16px;
                        right: 16px;
                        z-index: 120;
                    }

                    /* ═══ KEYFRAMES ═══ */
                    @keyframes sl-fade-up {
                        from { opacity: 0; transform: translateY(20px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    @keyframes sl-slide-up {
                        from { opacity: 0; transform: translateY(30px); }
                        to { opacity: 1; transform: translateY(0); }
                    }

                    @keyframes sl-fade-in {
                        from { opacity: 0; transform: scale(0.96); }
                        to { opacity: 1; transform: scale(1); }
                    }

                    @keyframes sl-glow-pulse {
                        0%, 100% { opacity: 0.5; transform: scale(1); }
                        50% { opacity: 1; transform: scale(1.08); }
                    }

                    @keyframes sl-shimmer {
                        100% { transform: translateX(100%); }
                    }

                    @keyframes sl-spin {
                        to { transform: rotate(360deg); }
                    }
                `}
            </style>

            {/* ═══ LANGUAGE TOGGLE ═══ */}
            <div className="sl-lang-toggle">
                <LanguageToggleButton variant="topbar" />
            </div>

            {/* ═══ HERO SECTION ═══ */}
            <div className="sl-hero">
                <div className="sl-orb-2" />

                {/* Logo */}
                <div className="sl-logo-wrap">
                    <div className="sl-logo-glow" />
                    <div className="sl-logo-box">
                        <img src={instituteLogo} alt="Institute Logo" />
                    </div>
                </div>

                {/* Title */}
                <h1 className="sl-hero-title">{t('De Facto Institute Erp')}</h1>
                <p className="sl-hero-sub">{t('Secure login for students only.')}</p>
            </div>

            {/* ═══ FORM CARD ═══ */}
            <div className="sl-card">

                {/* Error Banner */}
                {formError && (
                    <div className="sl-error" role="alert">
                        <AlertCircle size={18} className="sl-error-icon" />
                        <div>
                            <p className="sl-error-title">{formError}</p>
                            <p className="sl-error-hint">{t('Please check your credentials and try again.')}</p>
                        </div>
                    </div>
                )}

                {/* Login Form */}
                <form onSubmit={handleLogin} className="sl-form" noValidate>

                    {/* Student ID Field */}
                    <div>
                        <label htmlFor="student-roll" className="sl-field-label">
                            {t('Student ID')}
                        </label>
                        <div className={`sl-input-wrap ${shouldShowFieldError('rollNo') ? 'sl-has-error' : ''}`}>
                            <Mail size={18} className="sl-input-icon" />
                            <input
                                id="student-roll"
                                type="text"
                                value={rollNo}
                                onChange={(e) => handleFieldChange('rollNo', e.target.value)}
                                onBlur={() => setTouched((prev) => ({ ...prev, rollNo: true }))}
                                placeholder={t('Enter your student ID or email')}
                                autoComplete="username"
                                className={`sl-input ${shouldShowFieldError('rollNo') ? 'sl-input-error' : ''}`}
                            />
                        </div>
                        {shouldShowFieldError('rollNo') && (
                            <span className="sl-field-error">{fieldErrors.rollNo}</span>
                        )}
                    </div>

                    {/* Password Field */}
                    <div>
                        <label htmlFor="student-password" className="sl-field-label">
                            {t('Password')}
                        </label>
                        <div className={`sl-input-wrap ${shouldShowFieldError('password') ? 'sl-has-error' : ''}`}>
                            <Lock size={18} className="sl-input-icon" />
                            <input
                                id="student-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => handleFieldChange('password', e.target.value)}
                                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                                placeholder={t('Enter your password')}
                                autoComplete="current-password"
                                className={`sl-input sl-input-pw ${shouldShowFieldError('password') ? 'sl-input-error' : ''}`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((prev) => !prev)}
                                className="sl-eye-btn"
                                aria-label={showPassword ? t('Hide password') : t('Show password')}
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                        {shouldShowFieldError('password') && (
                            <span className="sl-field-error">{fieldErrors.password}</span>
                        )}
                    </div>

                    {/* Submit Button */}
                    <button type="submit" disabled={loading} className="sl-submit">
                        {loading ? (
                            <div className="sl-spinner" />
                        ) : (
                            <>
                                <span>{t('Secure Login Access')}</span>
                                <ArrowRight size={18} className="sl-btn-arrow" />
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="sl-footer">
                    <ShieldCheck size={14} className="sl-footer-icon" />
                    <span className="sl-footer-text">{t('Secured with 256-bit encryption')}</span>
                </div>
            </div>
        </div>
    );
};

export default StudentLogin;
