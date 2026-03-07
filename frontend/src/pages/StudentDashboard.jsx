import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import StudentLayout from '../components/StudentLayout';
import { User, Hash, BookOpen, Calendar, Wallet } from 'lucide-react';

const api = axios.create({ baseURL: 'http://localhost:5005' });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('studentToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

const StudentDashboard = () => {
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('studentToken');
    if (!token) {
      navigate('/student/login');
      return;
    }

    api.get('/api/student/me')
      .then(res => {
        if (res.data.success) {
          setStudent(res.data.student);
        } else {
          localStorage.removeItem('studentToken');
          navigate('/student/login');
        }
      })
      .catch(err => {
        if (err.response?.status === 401) {
          localStorage.removeItem('studentToken');
          navigate('/student/login');
        } else {
          setError('Failed to load dashboard data.');
        }
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  if (loading) {
    return (
      <StudentLayout title="Dashboard">
        <div className="loader-wrap">
          <div className="spinner" />
          <p>Loading dashboard…</p>
        </div>
      </StudentLayout>
    );
  }

  if (!student) return null;

  // Pending fees = Base Fees + Registration Fee - Fees Paid
  const pendingFees = (student.fees || 0) + (student.registrationFee || 0) - (student.feesPaid || 0);
  const totalFees = (student.fees || 0) + (student.registrationFee || 0);
  const attendancePct = student.attendance?.percentage || 0;

  // Dynamic Attendance Theme
  const getAttendanceTheme = (pct) => {
    if (pct >= 75) return { cls: 'ic-green', text: '#16a34a' }; // text-green-600
    if (pct >= 60) return { cls: 'ic-orange', text: '#ca8a04' }; // text-yellow-600
    return { cls: 'ic-red', text: '#dc2626' }; // text-red-600
  };
  const attTheme = getAttendanceTheme(attendancePct);

  // Dynamic Fees Theme
  const feeTheme = pendingFees === 0
    ? { cls: 'ic-green', text: '#16a34a', sub: 'All Fees Paid' }
    : { cls: 'ic-red', text: '#dc2626', sub: `₹${pendingFees.toLocaleString()} Pending` };

  const stats = [
    { label: 'Student Name', value: student.name, sub: 'Enrolled Account', icon: User, cls: 'ic-blue', valueColor: '' },
    { label: 'Roll Number', value: student.rollNo, sub: 'Unique ID', icon: Hash, cls: 'ic-indigo', valueColor: '' },
    { label: 'Class / Batch', value: student.className || student.batchName || 'N/A', sub: 'Assigned Cohort', icon: BookOpen, cls: 'ic-orange', valueColor: '' },
    { label: 'Attendance', value: `${attendancePct}%`, sub: 'Overall Attendance', icon: Calendar, cls: attTheme.cls, valueColor: attTheme.text },
    { label: 'Pending Fees', value: `₹${pendingFees.toLocaleString()}`, sub: `₹${(student.feesPaid || 0).toLocaleString()} Paid`, icon: Wallet, cls: feeTheme.cls, valueColor: feeTheme.text }
  ];

  return (
    <StudentLayout title="Dashboard">
      <div className="page-hdr" style={{ marginBottom: 20 }}>
        <h1>Student Dashboard</h1>
        <p style={{ fontSize: '0.9rem', opacity: 0.8 }}>
          Welcome back, <strong>{student.name}</strong>!
        </p>
      </div>

      {error && <div className="alert alert-error" style={{ marginBottom: 20 }}>⚠ {error}</div>}

      {/* Stats Grid - Made fully responsive for small screens */}
      <div className="stats-grid" 
        style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', 
          gap: '16px',
          marginBottom: '24px'
        }}
      >
        {stats.map((s, idx) => {
          const Icon = s.icon;
          return (
            <div className="stat-card" key={idx} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div className={`stat-icon ${s.cls}`}>
                <Icon size={22} />
              </div>
              <div>
                <div className="stat-label">{s.label}</div>
                <div className="stat-value" style={{ fontSize: '1.4rem', fontWeight: '700', color: s.valueColor || 'inherit' }}>{s.value}</div>
                <div className="stat-sub">{s.sub}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Panels Section: Responsive Grid Fixed for tiny mobile screens */}
      <div className="panel-container"
        style={{
          display: 'grid',
          // Changed 300px to min(100%, 280px) so it doesn't overflow on screens smaller than 300px
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', 
          gap: '20px'
        }}
      >
        {/* Notice Board */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, color: 'var(--erp-primary)', marginBottom: 16 }}>
            📢 Recent Announcements
          </div>
          <div className="empty" style={{ minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
            <div className="empty-icon" style={{ fontSize: '2rem' }}>🔔</div>
            <p>No new announcements.</p>
          </div>
        </div>

        {/* Assignments */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontWeight: 700, color: 'var(--erp-primary)', marginBottom: 16 }}>
            📝 Pending Assignments
          </div>
          {student.assignments?.pending > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ padding: 16, border: '1px solid var(--erp-border)', borderRadius: 8, background: 'var(--erp-bg2)' }}>
                <div style={{ fontWeight: 600 }}>Complete Math Worksheet</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--erp-error)', marginTop: 4 }}>Due Tomorrow</div>
              </div>
            </div>
          ) : (
            <div className="empty" style={{ minHeight: 150, display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center' }}>
              <div className="empty-icon" style={{ fontSize: '2rem' }}>✅</div>
              <p>You're all caught up!</p>
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentDashboard;