"use client";
import { useTranslation } from 'react-i18next';
import { useRouter } from 'next/navigation';

const languages = [
  { code: 'en', label: 'English', dir: 'ltr' },
  { code: 'ar', label: 'العربية', dir: 'rtl' },
];

export function Header({ userRole, onMenuClick }: { userRole?: string; onMenuClick?: () => void }) {
  const { i18n, t } = useTranslation();
  const router = useRouter();

  const handleLanguageChange = (lng: string) => {
    i18n.changeLanguage(lng);
    if (typeof window !== 'undefined') {
      document.documentElement.lang = lng;
      document.documentElement.dir = lng === 'ar' ? 'rtl' : 'ltr';
    }
    // Optionally reload to SSR new language
    // router.refresh();
  };

  return (
    <header className="flex items-center justify-between p-4 border-b bg-white dark:bg-gray-900">
      <div className="flex items-center gap-2">
        {onMenuClick && (
          <button onClick={onMenuClick} className="mr-2 p-2">☰</button>
        )}
        <span className="font-bold text-lg">{t('dashboard')}</span>
      </div>
      <div className="flex items-center gap-4">
        <select
          value={i18n.language}
          onChange={e => handleLanguageChange(e.target.value)}
          className="border rounded px-2 py-1"
          aria-label={t('language')}
        >
          {languages.map(lang => (
            <option key={lang.code} value={lang.code}>
              {t(lang.code === 'en' ? 'english' : 'arabic')}
            </option>
          ))}
        </select>
      </div>
    </header>
  );
}
