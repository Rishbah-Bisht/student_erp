import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import StudentLogin from './pages/StudentLogin';
import StudentDashboard from './pages/StudentDashboard';
import StudentFees from './pages/StudentFees';

import StudentResults from './pages/StudentResults';
import StudentProfile from './pages/StudentProfile';
import SubjectDetail from './pages/SubjectDetail';

function App() {
    return (
        <Router>
            <Routes>
                <Route path="/" element={<Navigate to="/student/login" replace />} />
                <Route path="/student/login" element={<StudentLogin />} />
                <Route path="/student/dashboard" element={<StudentDashboard />} />
                <Route path="/student/profile" element={<StudentProfile />} />
                <Route path="/student/fees" element={<StudentFees />} />
                <Route path="/student/results" element={<StudentResults />} />
                <Route path="/student/results/subject/:subjectName" element={<SubjectDetail />} />
            </Routes>
        </Router>
    );
}

export default App;
