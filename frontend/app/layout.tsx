import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import AdaptationProvider from '../components/AdaptationProvider';
import ThemeWrapper from '../components/ThemeWrapper';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Context-Aware App',
  description: 'Real-time ML UI adaptation based on live user behavioral telemetry',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AdaptationProvider>
          <ThemeWrapper>
            {children}
          </ThemeWrapper>
        </AdaptationProvider>
      </body>
    </html>
  );
}
