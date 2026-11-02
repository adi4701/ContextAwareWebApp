import type { Metadata, Viewport } from 'next';
import { Space_Grotesk, Plus_Jakarta_Sans, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import AdaptationProvider from '../components/AdaptationProvider';
import ThemeWrapper from '../components/ThemeWrapper';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#070709',
};

export const metadata: Metadata = {
  title: 'ContextUI — Adaptive Intelligence & Kinetic Workspace',
  description: 'An architectural, context-aware interface powered by real-time behavioral ML. Dynamic layout, typography, and controls that respond seamlessly to user cognition.',
  keywords: ['Adaptive UI', 'Machine Learning', 'Random Forest', 'Telemetry', 'Context-Aware', 'XAI'],
  authors: [{ name: 'ContextUI Team' }],
  openGraph: {
    title: 'ContextUI — Adaptive Intelligence & Kinetic Workspace',
    description: 'An architectural, context-aware interface powered by real-time behavioral ML.',
    type: 'website',
    locale: 'en_US',
    siteName: 'ContextUI',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'ContextUI — Adaptive Intelligence & Kinetic Workspace',
    description: 'Real-time UI adaptation driven by behavioral telemetry and explainable machine learning.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={`${spaceGrotesk.variable} ${plusJakarta.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen antialiased bg-[#FAF9F6] dark:bg-[#070709] text-zinc-900 dark:text-zinc-100 font-sans selection:bg-emerald-500/20 selection:text-emerald-700 dark:selection:text-emerald-300">
        <AdaptationProvider>
          <ThemeWrapper>
            {children}
          </ThemeWrapper>
        </AdaptationProvider>
      </body>
    </html>
  );
}
