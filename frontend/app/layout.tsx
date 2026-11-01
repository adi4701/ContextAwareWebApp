import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AdaptationProvider from '../components/AdaptationProvider';
import ThemeWrapper from '../components/ThemeWrapper';

const inter = Inter({ subsets: ['latin'] });

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#2563eb',
};

export const metadata: Metadata = {
  title: 'ContextUI — Adaptive Task Manager Driven by Machine Learning',
  description: 'An adaptive web application that observes behavioral interaction patterns in real time to reshape layout density, typography, and controls.',
  keywords: ['Adaptive UI', 'Machine Learning', 'Random Forest', 'Telemetry', 'Task Manager', 'Context-Aware'],
  authors: [{ name: 'ContextUI Team' }],
  openGraph: {
    title: 'ContextUI — Adaptive Task Manager Driven by Machine Learning',
    description: 'An adaptive web application that observes behavioral interaction patterns in real time to reshape layout density, typography, and controls.',
    type: 'website',
    locale: 'en_US',
    siteName: 'ContextUI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ContextUI — Adaptive Task Manager Driven by Machine Learning',
    description: 'Real-time UI adaptation driven by behavioral interaction telemetry and Random Forest machine learning.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} min-h-screen antialiased bg-slate-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100`}>
        <AdaptationProvider>
          <ThemeWrapper>
            {children}
          </ThemeWrapper>
        </AdaptationProvider>
      </body>
    </html>
  );
}
