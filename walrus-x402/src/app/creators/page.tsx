'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, ArrowRight, ShieldCheck } from 'lucide-react';

const MOCK_CREATORS = [
    {
        address: '0x101',
        name: 'Crypto Studios',
        bio: 'High-production documentaries about the history of crypto.',
        subscribers: 1200,
        avatar: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=2574&auto=format&fit=crop'
    },
    {
        address: '0x102',
        name: 'Degen Daily',
        bio: 'Daily alpha leaks and newsletter.',
        subscribers: 850,
        avatar: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop'
    },
    {
        address: '0x103',
        name: 'Chill Chain',
        bio: 'Lofi beats for coding.',
        subscribers: 2400,
        avatar: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?q=80&w=2670&auto=format&fit=crop'
    }
];

export default function CreatorsPage() {
    return (
        <div className="space-y-8">
            <div className="text-center space-y-4 py-12 bg-gradient-to-b from-slate-900/50 to-transparent rounded-3xl border border-white/5">
                <div className="mx-auto w-12 h-12 rounded-xl bg-cyan-500/20 flex items-center justify-center text-cyan-400 mb-4">
                    <Users className="w-6 h-6" />
                </div>
                <h1 className="text-4xl font-bold text-white">Featured Creators</h1>
                <p className="text-slate-400 max-w-xl mx-auto">
                    Support creators directly on-chain. Subscribe to access their exclusive content libraries stored on Walrus.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_CREATORS.map((creator, i) => (
                    <motion.div
                        key={creator.address}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1 }}
                    >
                        <Link href={`/creators/${creator.address}`} className="group block h-full bg-slate-900 rounded-2xl border border-white/5 hover:border-cyan-500/50 p-6 transition-all hover:-translate-y-1">
                            <div className="flex items-start justify-between mb-4">
                                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-700 group-hover:border-cyan-500 transition-colors">
                                    <img src={creator.avatar} alt={creator.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-colors">
                                    {creator.address}
                                </div>
                            </div>

                            <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                                {creator.name}
                                {i === 0 && <ShieldCheck className="w-4 h-4 text-blue-400" />}
                            </h3>
                            <p className="text-slate-400 text-sm leading-relaxed mb-6 h-12 line-clamp-2">
                                {creator.bio}
                            </p>

                            <div className="flex items-center justify-between text-sm">
                                <span className="text-slate-500">{creator.subscribers.toLocaleString()} subscribers</span>
                                <span className="flex items-center gap-1 text-cyan-500 font-medium group-hover:underline">
                                    View Profile <ArrowRight className="w-4 h-4" />
                                </span>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
