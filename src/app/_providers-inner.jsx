'use client';

import { Toaster } from '@/components/ui/toaster';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import { AuthProvider } from '@/lib/AuthContext';
import { BranchProvider } from '@/lib/BranchContext';
import { LanguageProvider } from '@/lib/i18n';

export default function ProvidersInner({ children }) {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <LanguageProvider>
          <BranchProvider>
            {children}
            <Toaster />
          </BranchProvider>
        </LanguageProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}
