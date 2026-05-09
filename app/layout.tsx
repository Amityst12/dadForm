import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: "נספח ט׳ — הסכמת בעל הרשאה לחיפוש בחומר מחשב",
  description: 'טופס הסכמת בעל הרשאה לחיפוש בחומר מחשב — משטרת ישראל',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
