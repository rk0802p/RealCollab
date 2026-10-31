import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="en" className="dark">
      <body className="bg-background text-slate-100 min-h-screen antialiased selection:bg-brand-600/30">
        {children}
      </body>
    </html>
  );
}
