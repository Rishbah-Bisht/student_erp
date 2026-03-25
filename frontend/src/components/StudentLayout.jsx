import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard, User, Trophy, BookOpen,
    FileText, Wallet, Award, Bell,
    LogOut, Menu, X, GraduationCap, ShieldAlert,
    Settings, ArrowLeft, Sparkles
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import LanguageToggleButton from './LanguageToggleButton';
import { isNativeShell, triggerNativeLogout } from '../services/nativeAuth';
const NAV_ITEMS = [
    {
        section: 'MAIN',
        items: [
            { to: '/student/dashboard?tab=home', match: 'home', icon: LayoutDashboard, label: 'Dashboard' },
            { to: '/student/profile', match: 'profile', icon: User, label: 'My Profile' },

        ]
    },
    {
        section: 'ACADEMICS',
        items: [
            { to: '/student/dashboard?tab=subjects', match: 'subjects', icon: BookOpen, label: 'Subjects' },
            { to: '/student/dashboard?tab=results', match: 'results', icon: Award, label: 'Results' },
            { to: '/student/leaderboard', match: '/student/leaderboard', icon: Trophy, label: 'Leaderboard' },
        ]
    },
    {
        section: 'INFO',
        items: [
            { to: '/student/dashboard?tab=fees', match: 'fees', icon: Wallet, label: 'Fees' },
            { to: '/student/support', match: '/student/support', icon: ShieldAlert, label: 'Contact & Support' },
            { to: '/student/settings', match: '/student/settings', icon: Settings, label: 'Settings' },
        ]
    }
];

const MOBILE_NAV_ITEMS = [
    { to: '/student/dashboard?tab=home', match: 'home', icon: LayoutDashboard, label: 'Home' },
    { to: '/student/dashboard?tab=subjects', match: 'subjects', icon: BookOpen, label: 'Subjects' },
    { to: '/student/dashboard?tab=results', match: 'results', icon: Award, label: 'Results' },
    { to: '/student/dashboard?tab=fees', match: 'fees', icon: Wallet, label: 'Fees' },
    { to: '/student/profile', match: 'profile', icon: User, label: 'My Profile' }
];

const StudentLayout = ({ children, title, backUrl, useHistoryBack = false, hideMobileNav = false }) => {
    const location = useLocation();
    const navigate = useNavigate();
    const { t } = useLanguage();
    const [mini, setMini] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const studentInfoRaw = localStorage.getItem('studentInfo');
    const student = studentInfoRaw ? JSON.parse(studentInfoRaw) : {};

    const logout = () => {
        if (isNativeShell()) {
            triggerNativeLogout('user-logout');
            return;
        }

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

    const searchParams = new URLSearchParams(location.search);
    const currentTab = searchParams.get('tab') || 'home';

    const isActiveRoute = (match) => {
        if (!match) return false;
        if (match.startsWith('/')) {
            return location.pathname === match || location.pathname.startsWith(`${match}/`);
        }
        return location.pathname === '/student/dashboard' && currentTab === match;
    };

    const handleBack = () => {
        if (useHistoryBack && window.history.length > 1) {
            navigate(-1);
            return;
        }

        if (backUrl) {
            navigate(backUrl);
            return;
        }

        navigate('/student/dashboard?tab=home');
    };

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
                    <div className="sb-logo" aria-hidden="true">
                        <Sparkles size={16} />
                    </div>

                    {(!mini || mobileOpen) && (
                        <div className="sb-brand-text">
                            <div className="sb-name">{t('Institute')}</div>
                            <div className="sb-code">Student ERP System</div>
                            <div className="sb-code">{t('Roll')}: {student.rollNo || 'N/A'}</div>
                        </div>
                    )}
                </div>

                <div className="sb-nav">
                    {NAV_ITEMS.map(group => (
                        <div key={group.section} className="sb-group">
                            {(!mini || mobileOpen) && (
                                <div className="sb-section-label-wrap">
                                    <span className="sb-section-dot" />
                                    <div className="sb-section-label">{t(group.section)}</div>
                                </div>
                            )}
                            {group.items.map((item) => (
                                <Link
                                    key={item.to} to={item.to}
                                    className={`sb-item ${isActiveRoute(item.match) ? 'active' : ''}`}
                                    onClick={() => setMobileOpen(false)}
                                >
                                    <span className="sb-item-icon"><item.icon size={17} /></span>
                                    {(!mini || mobileOpen) && <span className="sb-item-label">{t(item.label)}</span>}
                                </Link>
                            ))}
                        </div>
                    ))}
                </div>

                <div className="sb-footer">
                    <div
                        className="sb-item logout-btn text-rose-600 hover:text-rose-700 hover:bg-rose-50 transition-colors"
                        onClick={logout}
                    >
                        <span className="sb-item-icon text-rose-600">
                            <LogOut size={18} />
                        </span>
                        {(!mini || mobileOpen) && (
                            <span className="sb-item-label text-rose-600 font-bold">{t('Logout')}</span>
                        )}
                    </div>
                </div>
            </nav>

            <div className="erp-body">
                {/* Topbar */}
                <header className="topbar">
                    <div className="tb-left">
                        {backUrl ? (
                            <button
                                className="tb-hamburger"
                                onClick={handleBack}
                            >
                                <ArrowLeft size={20} />
                            </button>
                        ) : (
                            <button
                                className="tb-hamburger"
                                onClick={() => {
                                    if (window.innerWidth <= 768) setMobileOpen(!mobileOpen);
                                    else setMini(!mini);
                                }}
                            >
                                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
                            </button>
                        )}
                        <div className="tb-title">{t(title)}</div>
                    </div>

                    <div className="tb-right">
                        <LanguageToggleButton variant="topbar" />
                        <span className="tb-name-desktop tb-greeting">
                            {t('Hi')}, <strong>{student.name?.split(' ')[0] || 'Student'}</strong>
                        </span>
                        <div className="tb-avatar" onClick={() => navigate('/student/profile')}>
                            {student.profileImage ? (
                                <img src={student.profileImage} alt={student.name || 'Student'} />
                            ) : (
                                (student.name?.[0] || 'S').toUpperCase()
                            )}
                        </div>
                    </div>
                </header>

                <main className="erp-main">
                    <div className="page-content px-0 md:px-0">
                        {children}
                    </div>
                </main>
            </div>

            {/* Mobile Bottom Navigation */}
            {!hideMobileNav && (
                <nav
                    className="fixed bottom-[max(0.5rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 w-[95%] max-w-lg z-[150] md:hidden"
                    aria-label="Primary"
                >
                    <div className="relative overflow-hidden rounded-[28px] border border-blue-200/70 bg-white/90 px-2 py-1.5 backdrop-blur-2xl shadow-[0_16px_42px_rgba(30,64,175,0.22)]">
                        <div className="pointer-events-none absolute inset-x-10 -top-10 h-16 rounded-full bg-gradient-to-r from-blue-200/70 via-blue-300/65 to-indigo-300/65 blur-2xl" />
                        <div
                            className="relative grid items-center gap-1"
                            style={{ gridTemplateColumns: `repeat(${MOBILE_NAV_ITEMS.length}, minmax(0, 1fr))` }}
                        >
                        {MOBILE_NAV_ITEMS.map(({ to, match, icon: Icon, label }) => {
                            const active = isActiveRoute(match);

                            return (
                                <Link
                                    key={to}
                                    to={to}
                                    className={`relative flex flex-col items-center justify-center py-1 px-1 min-w-[56px] transition-colors duration-300 z-10 no-underline rounded-2xl ${active ? 'text-blue-700' : 'text-slate-400 hover:text-blue-600'
                                        }`}
                                >
                                    {/* Active Magic Background */}
                                    {active && (
                                        <motion.div
                                            layoutId="activePill"
                                            className="absolute inset-0 rounded-2xl bg-gradient-to-b from-blue-50 to-blue-100/70 -z-10"
                                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                        />
                                    )}

                                    {/* Icon Animation */}
                                    <motion.div
                                        className={`flex h-7 w-7 items-center justify-center rounded-xl ${active ? 'bg-white shadow-sm shadow-blue-100' : ''}`}
                                        animate={{ scale: active ? 1.08 : 1, y: active ? -1 : 0 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                                    >
                                        <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                                    </motion.div>

                                    {/* Label */}
                                    <span className={`text-[9px] font-bold mt-0.5 tracking-wide transition-opacity duration-300 ${active ? 'opacity-100' : 'opacity-75'
                                        }`}>
                                        {t(label)}
                                    </span>

                                    {/* Bottom Dot Indicator */}
                                    {active && (
                                        <motion.div
                                            layoutId="activeDot"
                                            className="absolute -bottom-1 h-1 w-5 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.55)]"
                                            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                                        />
                                    )}
                                </Link>
                            );
                        })}
                        </div>
                    </div>
                </nav>
            )}
        </div>
    );
};

export default StudentLayout;
