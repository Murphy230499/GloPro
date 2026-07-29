import './globals.css';
import { CopilotProvider, CopilotDrawer } from '@/ai-copilot';

export const metadata = {
  title: 'GloPro - Salon Management System',
  description: 'Professional AI-driven salon and spa management platform',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <CopilotProvider>
          {children}
          <CopilotDrawer />
        </CopilotProvider>
      </body>
    </html>
  );
}
