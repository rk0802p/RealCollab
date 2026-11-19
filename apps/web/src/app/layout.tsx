import type { Metadata } from 'next';
import { Nunito, JetBrains_Mono } from 'next/font/google';
import './globals.css';

const nunito = Nunito({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  variable: '--font-nunito',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'RealCollab — Real-Time Collaborative Workspace',
  description: 'Multiplayer rich-text workspace with Yjs CRDTs, live cursors, and comments.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${nunito.variable} ${jetbrainsMono.variable}`}>
      <body className="bg-canvas text-ink-1 min-h-screen antialiased selection:bg-primary/25">
        {children}
      </body>
    </html>
  );
}
