import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Genesis AI - In The Beginning...',
  description: 'A primordial ai presence emerging from the digital void',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
