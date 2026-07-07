import React, { useState } from 'react';
import { Check } from 'lucide-react';
import { useT } from '@/lib/i18n';

const LANGUAGES = [
  { code: 'vi', flag: '🇻🇳', name: 'Tiếng Việt' },
  { code: 'en', flag: '🇬🇧', name: 'English' },
  { code: 'zh', flag: '🇨🇳', name: '中文' },
  { code: 'ko', flag: '🇰🇷', name: '한국어' },
  { code: 'ja', flag: '🇯🇵', name: '日本語' },
];

export default function LanguageSwitcher() {
  const { lang, setLang } = useT();
  const [open, setOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === lang) || LANGUAGES[0];

  return (
    <div className="relative">
      <button onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1 px-1.5 py-1.5 rounded-xl hover:bg-slate-100 transition-colors">
        <span className="text-xl leading-none">{current.flag}</span>
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 mt-2 w-44 bg-white rounded-2xl border border-slate-100 shadow-xl py-1 z-50">
            {LANGUAGES.map((l) => (
              <button key={l.code} onClick={() => { setLang(l.code); setOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-slate-50">
                <span className="flex items-center gap-2">
                  <span className="text-lg">{l.flag}</span>
                  <span className={lang === l.code ? 'font-semibold text-slate-800' : 'text-slate-500'}>{l.name}</span>
                </span>
                {lang === l.code && <Check className="w-4 h-4 text-pink-500" />}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}