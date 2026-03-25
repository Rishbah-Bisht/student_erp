import React from 'react';
import { useSearchParams, Navigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';

import StudentDashboard from './StudentDashboard';
import StudentFees from './StudentFees';
import StudentResults from './StudentResults';
import StudentSubjects from './StudentSubjects';
import StudentProfile from './StudentProfile';
import StudentLayout from '../components/StudentLayout';

const StudentTabController = () => {
    const [searchParams] = useSearchParams();
    const { t } = useLanguage();
    const tab = searchParams.get('tab') || 'home';

    const getTabConfig = () => {
        switch (tab) {
            case 'home':
                return { title: t('Dashboard'), component: <StudentDashboard /> };
            case 'fees':
                return { title: t('Fees & Payments'), component: <StudentFees /> };
            case 'results':
                return { title: t('My Results'), component: <StudentResults /> };
            case 'subjects':
                return { title: t('My Subjects'), component: <StudentSubjects /> };
            case 'profile':
                return { title: t('My Profile'), component: <StudentProfile /> };
            default:
                return null;
        }
    };

    const config = getTabConfig();

    if (!config) {
        return <Navigate to="/student/dashboard?tab=home" replace />;
    }

    return (
        <StudentLayout title={config.title}>
            {config.component}
        </StudentLayout>
    );
};

export default StudentTabController;
