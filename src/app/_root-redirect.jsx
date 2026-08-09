'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/AuthContext';

export default function RootRedirect() {
  const { isAuthenticated, isLoadingAuth, isLoadingPublicSettings } = useAuth();
  const router = useRouter();

  const [showDebug, setShowDebug] = useState(false);
  useEffect(() => {
    if (!isLoadingAuth && !isLoadingPublicSettings) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        setShowDebug(true);
      }
    }
  }, [isAuthenticated, isLoadingAuth, isLoadingPublicSettings, router]);

  if (showDebug) {
    return (
      <div className="fixed inset-0 bg-red-900 text-white p-10 font-mono flex flex-col gap-4 overflow-auto">
        <h1 className="text-2xl font-bold">DEBUG STOP: Redirect to /login prevented</h1>
        <p>This screen appears because the app tried to send you back to /login.</p>
        <p>isAuthenticated: {String(isAuthenticated)}</p>
        <p>isLoadingAuth: {String(isLoadingAuth)}</p>
        <p>isLoadingPublicSettings: {String(isLoadingPublicSettings)}</p>
        <p>Please take a screenshot of THIS SCREEN and the CONSOLE LOGS and send them to the AI.</p>
        <button onClick={() => router.replace('/login')} className="mt-4 p-2 bg-white text-red-900 font-bold max-w-xs">
          Go to Login
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-slate-200 border-t-slate-800 rounded-full animate-spin" />
    </div>
  );
}
