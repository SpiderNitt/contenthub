'use client';

import { usePrivy } from '@privy-io/react-auth';
import { motion } from 'framer-motion';
import { Play, FileText, Lock, Shield } from 'lucide-react';
import Link from 'next/link';

// Mock Library Data (matching the Creator Profile data)
const MOCK_LIBRARY = [
    {
        id: '1',
        title: 'The Merge: Untold Stories',
        type: 'video',
        creator: 'Crypto Studios',
        thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2664&auto=format&fit=crop',
        date: '2 days ago'
    },
    {
        id: '2',
        title: 'Layer 3 Thesis',
        type: 'article',
        creator: 'Crypto Studios',
        thumbnail: 'https://images.unsplash.com/photo-1620325867502-221cfb5faa5f?q=80&w=2657&auto=format&fit=crop',
        date: '1 week ago'
    }
];

export default function LibraryPage() {
    const { ready, authenticated, user } = usePrivy();

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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_LIBRARY.map((item, i) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-white/5 hover:border-cyan-500/30 transition-colors"
                    >
                        <div className="aspect-video relative">
                            <img
                                src={item.thumbnail}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                alt={item.title}
                            />
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                                <Play className="w-10 h-10 text-white fill-white" />
                            </div>
                            <div className="absolute top-3 left-3 px-2 py-1 bg-black/60 backdrop-blur-md rounded text-xs font-bold text-white flex items-center gap-1">
                                {item.type === 'video' ? <Play className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                                {item.type.toUpperCase()}
                            </div>
                        </div>
                        <div className="p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <Shield className="w-4 h-4 text-cyan-500" />
                                <span className="text-xs font-bold text-slate-400">{item.creator}</span>
                            </div>
                            <h3 className="text-lg font-bold text-white mb-4 line-clamp-1">{item.title}</h3>

                            <Link
                                href={`/content/${item.id}`}
                                className="block w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-center text-white text-sm font-bold transition-colors"
                            >
                                Watch Now
                            </Link>
                        </div>
                    </motion.div>
                ))}
            </div>

            {MOCK_LIBRARY.length === 0 && (
                <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl">
                    <p className="text-slate-400 mb-4">You haven't subscribed to any creators yet.</p>
                    <Link href="/explore" className="text-cyan-400 hover:underline">Explore Creators</Link>
                </div>
            )}
        </div>
    );
}
