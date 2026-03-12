import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowRight } from 'lucide-react';
import api from '../services/api';
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
            errors.rollNo = t('Roll number or email is required.');
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
                setFormError(t('Invalid roll number or password. Please try again.'));
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
        <div className="login-modern">
            <div className="login-card-modern">
                <div className="login-icon-modern" aria-hidden="true">
                    <ShieldCheck size={26} />
                </div>
                <h1>{t('Student Access')}</h1>
                <p>{t('Secure login for students only.')}</p>

                {formError && (
                    <div className="login-error" role="alert" aria-live="polite">
                        <p>{formError}</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="login-form-modern">
                    <div className={`login-field-modern ${shouldShowFieldError('rollNo') ? 'error' : ''}`}>
                        <label htmlFor="student-roll">{t('Student ID')}</label>
                        <div className="login-input-modern">
                            <Mail size={16} className="login-input-icon" />
                            <input
                                id="student-roll"
                                type="text"
                                value={rollNo}
                                onChange={(e) => handleFieldChange('rollNo', e.target.value)}
                                onBlur={() => setTouched((prev) => ({ ...prev, rollNo: true }))}
                                placeholder={t('Student ID')}
                                autoComplete="off"
                                aria-invalid={!!shouldShowFieldError('rollNo')}
                                aria-describedby={shouldShowFieldError('rollNo') ? 'student-roll-error' : undefined}
                                required
                            />
                        </div>
                        {shouldShowFieldError('rollNo') && (
                            <span id="student-roll-error" className="login-field-message">{fieldErrors.rollNo}</span>
                        )}
                    </div>

                    <div className={`login-field-modern ${shouldShowFieldError('password') ? 'error' : ''}`}>
                        <label htmlFor="student-password">{t('Password')}</label>
                        <div className="login-input-modern">
                            <Lock size={16} className="login-input-icon" />
                            <input
                                id="student-password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => handleFieldChange('password', e.target.value)}
                                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
                                placeholder={t('Enter your password')}
                                autoComplete="current-password"
                                aria-invalid={!!shouldShowFieldError('password')}
                                aria-describedby={shouldShowFieldError('password') ? 'student-password-error' : undefined}
                                required
                            />
                            <button
                                type="button"
                                className="login-eye-modern"
                                onClick={() => setShowPassword((prev) => !prev)}
                                aria-label={showPassword ? t('Hide password') : t('Show password')}
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                        {shouldShowFieldError('password') && (
                            <span id="student-password-error" className="login-field-message">{fieldErrors.password}</span>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="login-submit-modern"
                        aria-busy={loading}
                    >
                        {loading ? t('Signing In...') : t('Secure Login Access')}
                        <ArrowRight size={18} />
                    </button>
                </form>

                
            </div>
        </div>
    );
};

export default StudentLogin;
