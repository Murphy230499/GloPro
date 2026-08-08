'use client';
import React from 'react';
import { Sparkles } from 'lucide-react';
import { useT } from '@/lib/i18n';

export default function AIInsightBox({ insights = [] }) {
  const t = useT();
  if (!insights || !insights.length) return null;

  return (
    <div className="bg-gradient-to-r from-blue-50/90 via-indigo-50/50 to-purple-50/80 rounded-2xl p-4 border border-blue-200/60 shadow-2xs space-y-2">
      <div className="flex items-center gap-2 text-xs font-bold text-blue-700">
        <Sparkles className="w-4 h-4 text-blue-600 animate-pulse" />
        <span>{t('reports.ai_insights_title', 'AI Automated Analysis & Insights')}</span>
      </div>

      <div className="space-y-1.5 pl-6">
        {insights.map((insight, idx) => (
          <div key={idx} className="text-xs font-medium text-slate-700 leading-relaxed flex items-start gap-2">
            <span className="text-blue-500 font-bold shrink-0">•</span>
            <span>{insight}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
