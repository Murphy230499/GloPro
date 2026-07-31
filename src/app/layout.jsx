import './globals.css';
import { CopilotProvider, CopilotDrawer } from '@/ai-copilot';
import GlobalNotificationProvider from '@/components/GlobalNotificationProvider';

export const metadata = {
  title: 'GloPro - Salon Management System',
  description: 'Professional AI-driven salon and spa management platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <CopilotProvider>
          <GlobalNotificationProvider>
            {children}
            <CopilotDrawer />
          </GlobalNotificationProvider>
        </CopilotProvider>
      </body>
    </html>
  );
}
