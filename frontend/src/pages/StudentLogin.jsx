import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, User, Lock } from 'lucide-react';
import api from '../services/api';

const StudentLogin = () => {
    const [rollNo, setRollNo] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await api.post('/student/login', { rollNo, password });
            if (response.data.success) {
                localStorage.setItem('studentToken', response.data.token);
                localStorage.setItem('studentInfo', JSON.stringify(response.data.student));
                navigate('/student/dashboard');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-wrap">
            <div className="login-card">
                <div className="login-logo">
                    🎓
                </div>
                <h2 className="login-title">Student Portal</h2>
                <p className="login-sub">Sign in to your account</p>

                {error && (
                    <div className="alert alert-error">
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleLogin}>
                    <div className="lf">
                        <label>Roll Number</label>
                        <div className="lf-wrap">
                            <div className="lf-icon-l"><User size={20} /></div>
                            <input
                                type="text"
                                value={rollNo}
                                onChange={(e) => setRollNo(e.target.value)}
                                placeholder="Enter your roll number"
                                required
                            />
                        </div>
                    </div>

                    <div className="lf">
                        <label>Password</label>
                        <div className="lf-wrap">
                            <div className="lf-icon-l"><Lock size={20} /></div>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-login"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <div className="spin"><LogIn size={20} /></div>
                                Signing In...
                            </span>
                        ) : (
                            <span className="flex items-center gap-2">
                                Sign In
                                <LogIn size={20} />
                            </span>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default StudentLogin;
