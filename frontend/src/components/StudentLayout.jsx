import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, User, CheckSquare, BookOpen,
    FileText, Wallet, Award, Bell, BadgeCheck,
    LogOut, Menu, X, GraduationCap
} from 'lucide-react';

const NAV_ITEMS = [
    {
        section: 'MAIN',
        items: [
            { to: '/student/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/student/profile', icon: User, label: 'My Profile' },
        ]
    },
    {
        section: 'ACADEMICS',
        items: [
            // { to: '/student/attendance', icon: CheckSquare, label: 'Attendance' },
            { to: '/student/subjects', icon: BookOpen, label: 'Subjects' },
            // { to: '/student/assignments', icon: FileText, label: 'Assignments' },
            { to: '/student/results', icon: Award, label: 'Results' },
        ]
    },
    {
        section: 'INFO',
        items: [
            { to: '/student/fees', icon: Wallet, label: 'Fees' },
            // { to: '/student/announcements', icon: Bell, label: 'Announcements' },
            // { to: '/student/id-card', icon: BadgeCheck, label: 'ID Card' },
        ]
    }
];

const StudentLayout = ({ children, title }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const [mini, setMini] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const studentInfoRaw = localStorage.getItem('studentInfo');
    const student = studentInfoRaw ? JSON.parse(studentInfoRaw) : {};

    const logout = () => {
        localStorage.removeItem('studentToken');
        localStorage.removeItem('studentInfo');
        navigate('/student/login');
    };

    // Screen resize hone par sidebar state handle karne ke liye
    useEffect(() => {
        const handleResize = () => {
            if (window.innerWidth > 768) setMobileOpen(false);
        };
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return (
        <div className={`erp-shell ${mini ? 'sidebar-mini' : ''}`}>
            {/* Mobile Overlay */}
            {mobileOpen && (
                <div
                    className="sidebar-overlay"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            {/* Sidebar */}
            <nav className={`sidebar ${mini ? 'mini' : ''} ${mobileOpen ? 'open' : ''}`}>
                <div className="sb-brand">
                    <div className="sb-logo">
                        <GraduationCap size={20} color="#fff" />
                    </div>
                    {(!mini || mobileOpen) && (
                        <div className="sb-brand-text">
                            <div className="sb-name">Student Portal</div>
                            <div className="sb-code">Roll: {student.rollNo || 'N/A'}</div>
                        </div>
                    )}
                </div>

                <div className="sb-nav">
                    {NAV_ITEMS.map(group => (
                        <div key={group.section} className="sb-group">
                            {(!mini || mobileOpen) && <div className="sb-section-label">{group.section}</div>}
                            {group.items.map(({ to, icon: Icon, label }) => (
                                <Link
                                    key={to} to={to}
                                    className={`sb-item ${location.pathname === to ? 'active' : ''}`}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <span className="sb-item-icon"><Icon size={18} /></span>
                                    {(!mini || mobileOpen) && <span className="sb-item-label">{label}</span>}
                                </Link>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="sb-footer">
                    <div className="sb-item logout-btn" onClick={logout}>
                        <span className="sb-item-icon"><LogOut size={18} /></span>
                        {(!mini || mobileOpen) && <span className="sb-item-label">Logout</span>}
                    </div>
                </div>
            </nav>

            <div className="erp-body">
                {/* Topbar */}
                <header className="topbar">
                    <div className="tb-left">
                        <button
                            className="tb-hamburger"
                            onClick={() => {
                                if (window.innerWidth <= 768) setMobileOpen(!mobileOpen);
                                else setMini(!mini);
                            }}
                        >
                            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                        </button>
                        <div className="tb-title">{title}</div>
                    </div>

                    <div className="tb-right">
                        {/* Mobile par name hide karke sirf avatar dikhayenge space bachane ke liye */}
                        <span className="tb-name-desktop">{student.name}</span>
                        <div className="tb-avatar">
                            {(student.name?.[0] || 'S').toUpperCase()}
                        </div>
                        <button className="btn-tb-logout" onClick={logout}>
                            <span className="logout-text">Sign out</span>
                            <LogOut size={16} className="logout-icon-mob" />
                        </button>
                    </div>
                </header>

                <main className="erp-main">
                    <div className="page-content">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    );
};

export default StudentLayout;