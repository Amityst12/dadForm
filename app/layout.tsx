import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "נספח ט׳ — הסכמת בעל הרשאה לחיפוש בחומר מחשב",
  description: 'טופס הסכמת בעל הרשאה לחיפוש בחומר מחשב — משטרת ישראל',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1e3264',
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
