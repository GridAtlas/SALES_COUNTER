import type { Metadata, Viewport } from 'next';
import './globals.css';

const basePath = process.env.NODE_ENV === 'production' ? '/SALES_COUNTER' : '';

export const metadata: Metadata = {
  title: 'SALES COUNTER',
  description: '訪問営業の移動・休憩・ファネルを時刻付きで記録するタップカウンター',

  appleWebApp: {
    capable: true,
    title: 'SALES COUNTER',
    statusBarStyle: 'default',
  },
  icons: {
    icon: `${basePath}/icon-192.png`,
    apple: `${basePath}/apple-touch-icon.png`,
  },
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
      <head>
        <link rel="manifest" href={`${basePath}/manifest.webmanifest`} />
      </head>
      <body>
        <main className="app-frame flex flex-col safe-top safe-bottom">
          {children}
        </main>
      </body>
    </html>
  );
}
