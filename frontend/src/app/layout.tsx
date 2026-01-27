import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';
import Navbar from '@/components/Navbar';

const font = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'ContentHub x402',
  description: 'Decentralized Content Subscription Marketplace',
  icons: {
    icon: '/icon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${font.className} bg-slate-950 text-slate-100 min-h-screen`} suppressHydrationWarning>
        <Providers>
          <>
            <Navbar />
            <main className="pt-24 pb-20 px-4 md:px-6 max-w-7xl mx-auto space-y-12">
              {children}
            </main>
          </>
        </Providers>
      </body>
    </html>
  );
}
