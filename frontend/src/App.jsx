import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy, useEffect, useState } from 'react';
import { useAppPresence } from './hooks/useAppPresence';
import { isNativeShell } from './services/nativeAuth';

import { Component } from 'react';

class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null };
    }
    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }
    componentDidCatch(error, errorInfo) {
        console.error("ErrorBoundary caught an error:", error, errorInfo);
    }
    render() {
        if (this.state.hasError) {
            let errorMsg = 'An unknown error occurred';
            try {
                errorMsg = this.state.error ? String(this.state.error.message || this.state.error) : 'Unknown error';
            } catch (e) {
                errorMsg = 'Error object cannot be stringified';
            }

            return (
                <div style={{ padding: '20px', color: 'red', background: '#fee', border: '2px solid red', borderRadius: '8px', margin: '20px', fontFamily: 'sans-serif' }}>
                    <h2 style={{ margin: '0 0 10px 0' }}>App Load Error</h2>
                    <p>The application encountered a problem. This is often caused by an outdated server cache (Vite 504 error).</p>
                    
                    <div style={{ background: '#000', color: '#0f0', padding: '15px', borderRadius: '4px', margin: '15px 0', fontSize: '14px' }}>
                        <p style={{ margin: '0 0 5px 0', color: '#aaa' }}>To fix this, run this command in your terminal:</p>
                        <code>npm run dev -- --force</code>
                    </div>

                    <p style={{ fontWeight: 'bold' }}>Technical Details:</p>
                    <pre style={{ whiteSpace: 'pre-wrap', background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #ddd', fontSize: '12px' }}>{errorMsg}</pre>
                    
                    <div style={{ marginTop: '20px', display: 'flex', gap: '10px' }}>
                        <button onClick={() => window.location.reload()} style={{ padding: '8px 16px', cursor: 'pointer', borderRadius: '4px', border: '1px solid #ccc' }}>Reload Page</button>
                        <button onClick={() => { localStorage.clear(); window.location.href='/'; }} style={{ padding: '8px 16px', background: '#444', color: '#fff', border: 'none', cursor: 'pointer', borderRadius: '4px' }}>Reset App</button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

const StudentLogin = lazy(() => import('./pages/StudentLogin'));
const StudentDashboard = lazy(() => import('./pages/StudentDashboard'));
const StudentFees = lazy(() => import('./pages/StudentFees'));
const StudentResults = lazy(() => import('./pages/StudentResults'));
const StudentProfile = lazy(() => import('./pages/StudentProfile'));
const SubjectDetail = lazy(() => import('./pages/SubjectDetail'));
const StudentSetup = lazy(() => import('./pages/StudentSetup'));
const StudentSubjects = lazy(() => import('./pages/StudentSubjects'));
const ContactSupport = lazy(() => import('./pages/ContactSupport'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const StudentSettings = lazy(() => import('./pages/StudentSettings'));

const StudentAttendance = lazy(() => import('./pages/StudentAttendance'));
const SubjectAttendanceDetail = lazy(() => import('./pages/SubjectAttendanceDetail'));

const getStoredStudentRoute = () => {
    const token = localStorage.getItem('studentToken');
    if (!token) return '/student/login';

    try {
        const studentInfo = localStorage.getItem('studentInfo');
        if (!studentInfo) return '/student/dashboard';
        const student = JSON.parse(studentInfo);
        const needsSetup = student?.needsSetup !== undefined
            ? student.needsSetup
            : (student?.isFirstLogin || !student?.profileImage);

        return needsSetup ? '/student/setup' : '/student/dashboard';
    } catch {
        return '/student/dashboard';
    }
};

function App() {
    useAppPresence();

    useEffect(() => {
        const webUrl = import.meta.env.VITE_STUDENT_WEB_URL;
        if (isNativeShell() && localStorage.getItem('studentToken') && webUrl) {
            try {
                const targetOrigin = new URL(webUrl).origin;
                if (window.location.origin !== targetOrigin) {
                    window.location.assign(webUrl);
                }
            } catch (e) {
                console.error('Invalid VITE_STUDENT_WEB_URL:', webUrl);
            }
        }
    }, []);

    return (
        <Router>
            <ErrorBoundary>
                <Suspense fallback={<div className="p-8 text-center text-slate-500">Loading...</div>}>
                    <Routes>
                        <Route path="/" element={<Navigate to={getStoredStudentRoute()} replace />} />
                        <Route path="/student/login" element={
                            localStorage.getItem('studentToken') 
                                ? <Navigate to={getStoredStudentRoute()} replace /> 
                                : <StudentLogin />
                        } />
                        <Route path="/student/setup" element={<StudentSetup />} />
                        <Route path="/student/dashboard" element={<StudentDashboard />} />
                        <Route path="/student/profile" element={<StudentProfile />} />
                        <Route path="/student/subjects" element={<StudentSubjects />} />
                        <Route path="/student/attendance" element={<StudentAttendance />} />
                        <Route path="/student/attendance/:subjectId" element={<SubjectAttendanceDetail />} />
                        <Route path="/student/fees" element={<StudentFees />} />
                        <Route path="/student/results" element={<StudentResults />} />
                        <Route path="/student/results/subject/:subjectName" element={<SubjectDetail />} />
                        <Route path="/student/support" element={<ContactSupport />} />
                        <Route path="/student/leaderboard" element={<Leaderboard />} />
                        <Route path="/student/settings" element={<StudentSettings />} />
                    </Routes>
                </Suspense>
            </ErrorBoundary>
        </Router>
    );
}

export default App;
