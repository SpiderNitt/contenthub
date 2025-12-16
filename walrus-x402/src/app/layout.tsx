import type { Metadata } from 'next';
import { Outfit } from 'next/font/google';
import './globals.css';
import Providers from '@/components/Providers';
import Navbar from '@/components/Navbar';

const font = Outfit({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Walrus x402 Content Hub',
  description: 'Decentralized Content Subscription Marketplace',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${font.className} bg-slate-950 text-slate-100 min-h-screen selection:bg-cyan-500/30`}>
        <Providers>
          <Navbar />
          <main className="pt-24 pb-20 px-4 md:px-6 max-w-7xl mx-auto space-y-12">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}
