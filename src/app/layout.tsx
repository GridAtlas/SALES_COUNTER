import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'SALES COUNTER',
  description: '訪問営業の移動・休憩・ファネルを時刻付きで記録するタップカウンター',
};

export const viewport: Viewport = {
  themeColor: '#f8fafc',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>
        <main className="max-w-md mx-auto min-h-dvh flex flex-col safe-top safe-bottom">
          {children}
        </main>
      </body>
    </html>
  );
}
