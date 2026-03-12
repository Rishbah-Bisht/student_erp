import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, User, Trophy, BookOpen,
    FileText, Wallet, Award, Bell, BadgeCheck,
    LogOut, Menu, X, GraduationCap, ShieldAlert
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

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
            { to: '/student/subjects', icon: BookOpen, label: 'Subjects' },
            { to: '/student/attendance', icon: BadgeCheck, label: 'Attendance' },
            { to: '/student/results', icon: Award, label: 'Results' },
            { to: '/student/leaderboard', icon: Trophy, label: 'Leaderboard' },
        ]
    },
    {
        section: 'INFO',
        items: [
            { to: '/student/fees', icon: Wallet, label: 'Fees' },
            { to: '/student/support', icon: ShieldAlert, label: 'Contact & Support' },
        ]
    }
];

const MOBILE_NAV_ITEMS = [
    { to: '/student/dashboard', match: '/student/dashboard', icon: LayoutDashboard, label: 'Home' },
    { to: '/student/subjects', match: '/student/subjects', icon: BookOpen, label: 'Subjects' },
    { to: '/student/attendance', match: '/student/attendance', icon: BadgeCheck, label: 'Attend' },
    { to: '/student/results', match: '/student/results', icon: Award, label: 'Results' },
    { to: '/student/fees', match: '/student/fees', icon: Wallet, label: 'Fees' }
];

const StudentLayout = ({ children, title }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useLanguage();
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

    const isActiveRoute = (match) => location.pathname === match || location.pathname.startsWith(`${match}/`);

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
                            <div className="sb-name">{t('Student Portal')}</div>
                            <div className="sb-code">{t('Roll')}: {student.rollNo || 'N/A'}</div>
                        </div>
                    )}
                </div>

                <div className="sb-nav">
                    {NAV_ITEMS.map(group => (
                        <div key={group.section} className="sb-group">
                            {(!mini || mobileOpen) && <div className="sb-section-label">{t(group.section)}</div>}
                            {group.items.map(({ to, icon: Icon, label }) => (
                                <Link
                                    key={to} to={to}
                                    className={`sb-item ${location.pathname === to ? 'active' : ''}`}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <span className="sb-item-icon"><Icon size={18} /></span>
                                    {(!mini || mobileOpen) && <span className="sb-item-label">{t(label)}</span>}
                                </Link>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="sb-footer">
                    <div
                        className="sb-item logout-btn text-rose-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        onClick={logout}
                    >
                        <span className="sb-item-icon text-rose-500">
                            <LogOut size={18} />
                        </span>
                        {(!mini || mobileOpen) && (
                            <span className="sb-item-label text-rose-500 font-bold">{t('Logout')}</span>
                        )}
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
                        <div className="tb-title">{t(title)}</div>
                    </div>

                    <div className="tb-right">
                        {/* Mobile par name hide karke sirf avatar dikhayenge space bachane ke liye */}
                        <span className="tb-name-desktop">{student.name}</span>
                        <div className="tb-avatar">
                            {(student.name?.[0] || 'S').toUpperCase()}
                        </div>
                        {/* <button className="btn-tb-logout" onClick={logout}>
                            <span className="logout-text">Sign out</span>
                            <LogOut size={16} className="logout-icon-mob" />
                        </button> */}
                    </div>
                </header>

                <main className="erp-main">
                    <div className="page-content px-0 md:px-0">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            <nav className="mobile-nav" aria-label="Primary">
                <div className="mobile-nav-inner">
                    {MOBILE_NAV_ITEMS.map(({ to, match, icon: Icon, label }) => (
                        <Link
                            key={to}
                            to={to}
                            className={`mobile-nav-item ${isActiveRoute(match) ? 'active' : ''}`}
                        >
                            <Icon size={18} />
                            <span>{t(label)}</span>
                            <span className="nav-dot" />
                        </Link>
                    ))}
                </div>
            </nav>
        </div>
    );
};

export default StudentLayout;
