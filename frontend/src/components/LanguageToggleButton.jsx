import React from 'react';
import { Languages } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

const LanguageToggleButton = () => {
    const { language, toggleLanguage, t } = useLanguage();

    return (
        <button
            type="button"
            onClick={toggleLanguage}
            className="fixed right-4 bottom-24 md:bottom-6 z-[120] flex items-center gap-2 px-4 py-3 rounded-full bg-gray-900 text-white shadow-xl shadow-gray-900/20 border border-white/10 active:scale-[0.98] transition-transform"
            aria-label={t('Switch language')}
            title={t('Switch language')}
        >
            <Languages size={16} />
            <span className="text-[11px] font-black uppercase tracking-[0.22em]">
                {language === 'en' ? 'हिंदी' : 'English'}
            </span>
        </button>
    );
};

export default LanguageToggleButton;
