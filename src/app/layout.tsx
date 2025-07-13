import type { Metadata } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
});

const spaceGrotesk = Space_Grotesk({ 
  subsets: ['latin'],
  variable: '--font-space-grotesk',
});

export const metadata: Metadata = {
  title: 'Borg-Tools | One-Click CV Generator for Developers',
  description: 'Generate professional CVs from your GitHub profile in seconds. AI-powered, ATS-optimized, with Neon Tech on Black design.',
  keywords: ['CV generator', 'GitHub', 'developer resume', 'AI', 'portfolio'],
  authors: [{ name: 'Borg-Tools' }],
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL,
    title: 'Borg-Tools | One-Click CV Generator for Developers',
    description: 'Generate professional CVs from your GitHub profile in seconds.',
    siteName: 'Borg-Tools',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Borg-Tools | One-Click CV Generator for Developers',
    description: 'Generate professional CVs from your GitHub profile in seconds.',
  },
  viewport: 'width=device-width, initial-scale=1',
  robots: 'index, follow',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${spaceGrotesk.variable}`}>
      <body className="bg-background text-text antialiased">
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}