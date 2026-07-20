import './globals.css';

export const metadata = {
  title: 'GloPro - Salon Management',
  description: 'Professional salon and spa management system',
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        {children}
      </body>
    </html>
  );
}
