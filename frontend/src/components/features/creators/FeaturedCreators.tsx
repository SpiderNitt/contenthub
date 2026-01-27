'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';

const creators = [
    { name: 'Crypto Studios', avatar: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?auto=format&fit=crop&w=100&q=80' },
    { name: 'DeFi Daily', avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80' },
    { name: 'Alpha Leaks', avatar: 'https://images.unsplash.com/photo-1627161683077-e34782c24d81?auto=format&fit=crop&w=100&q=80' },
    { name: 'Chain Gaming', avatar: 'https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=100&q=80' },
    { name: 'L2 Beat', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=100&q=80' },
    { name: 'Solana Sensei', avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=100&q=80' },
];

export default function FeaturedCreators() {
    return (
        <section className="space-y-8 overflow-hidden">
            <div className="text-center">
                <h3 className="text-sm font-bold text-cyan-500 uppercase tracking-widest mb-2">Top Creators</h3>
            </div>

            <div className="relative">
                <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-slate-950 to-transparent z-10" />
                <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-950 to-transparent z-10" />

                <motion.div
                    className="flex gap-8 w-max"
                    animate={{ x: "-50%" }}
                    transition={{
                        duration: 40,
                        repeat: Infinity,
                        ease: "linear"
                    }}
                >
                    {[...creators, ...creators, ...creators].map((creator, i) => (
                        <Link
                            key={i}
                            href={`/creators/${i}`}
                            className="flex items-center gap-3 p-2 pr-6 rounded-full bg-slate-900/50 border border-white/5 hover:border-cyan-500/30 transition-colors group"
                        >
                            <img
                                src={creator.avatar}
                                alt={creator.name}
                                className="w-10 h-10 rounded-full object-cover group-hover:scale-110 transition-transform"
                            />
                            <span className="font-bold text-slate-300 group-hover:text-white transition-colors whitespace-nowrap">
                                {creator.name}
                            </span>
                        </Link>
                    ))}
                </motion.div>
            </div>
        </section>
    );
}
