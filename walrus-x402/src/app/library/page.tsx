'use client';

import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';

export default function LibraryPage() {
    const { ready, authenticated } = usePrivy();

    if (!ready) return null;

    if (!authenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-white">Please Connect Wallet</h1>
                    <p className="text-slate-400">You need to sign in to view your library.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 px-6 md:px-12">
            <header className="mb-12">
                <h1 className="text-3xl font-bold text-white mb-2">My Library</h1>
                <p className="text-slate-400">Content you've unlocked from your subscriptions.</p>
            </header>

            <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                <p className="text-slate-400 mb-4">You haven't subscribed to any creators yet.</p>
                <Link href="/explore" className="inline-block px-6 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-[0_0_20px_-5px_rgba(34,211,238,0.4)]">
                    Explore Creators
                </Link>
            </div>
        </div>
    );
}
