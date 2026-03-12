import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Suspense, lazy } from 'react';
import { useAppPresence } from './hooks/useAppPresence';
import LanguageToggleButton from './components/LanguageToggleButton';

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

const StudentAttendance = lazy(() => import('./pages/StudentAttendance'));
const SubjectAttendanceDetail = lazy(() => import('./pages/SubjectAttendanceDetail'));

const getStoredStudentRoute = () => {
    const token = localStorage.getItem('studentToken');
    if (!token) return '/student/login';

    try {
        const student = JSON.parse(localStorage.getItem('studentInfo') || '{}');
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

    return (
        <Router>
            <Suspense fallback={null}>
                <LanguageToggleButton />
                <Routes>
                    <Route path="/" element={<Navigate to={getStoredStudentRoute()} replace />} />
                    <Route path="/student/login" element={<StudentLogin />} />
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
                </Routes>
            </Suspense>
        </Router>
    );
}

export default App;
