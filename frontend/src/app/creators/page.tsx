'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Users, ArrowRight, ShieldCheck, Upload, Wallet } from 'lucide-react';
import { useCreators } from '@/hooks/useCreators';
import { formatUnits } from 'viem';
import { USDC_DECIMALS } from '@/config/constants';

export default function CreatorsPage() {
    const { creators, isLoading } = useCreators();

    return (
        <div className="space-y-12">
            {/* Header / CTA Section */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-8 p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/20 to-slate-900 border border-white/5">
                <div className="space-y-4 max-w-2xl text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold uppercase tracking-wider">
                        <Users className="w-4 h-4" />
                        <span>Community</span>
                    </div>
                    <h1 className="text-4xl font-bold text-white">Featured Creators</h1>
                    <p className="text-slate-400 text-lg">
                        Discover and support the best content creators on the decentralized web.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                        href="/upload"
                        className="px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-[0_0_20px_-5px_rgba(34,211,238,0.4)] flex items-center justify-center gap-2"
                    >
                        <Upload className="w-5 h-5" />
                        Become a Creator
                    </Link>
                </div>
            </div>

            {/* Creators Grid */}
            {isLoading ? (
                <div className="text-center py-20 text-slate-500">Loading creators...</div>
            ) : creators && creators.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {creators.map((creator, i) => (
                        <motion.div
                            key={creator.wallet}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.1 }}
                        >
                            <Link href={`/creators/${creator.wallet}`} className="group block h-full bg-slate-900/50 backdrop-blur rounded-2xl border border-white/5 hover:border-cyan-500/50 p-6 transition-all hover:-translate-y-1">
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-slate-700 group-hover:border-cyan-500 transition-colors bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white text-2xl font-bold">
                                        {creator.name.charAt(0).toUpperCase()}
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-xs font-mono text-slate-400 group-hover:text-cyan-400 group-hover:border-cyan-500/30 transition-colors flex items-center gap-1">
                                        <Wallet className="w-3 h-3" />
                                        {creator.wallet.slice(0, 6)}...{creator.wallet.slice(-4)}
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-white mb-2 group-hover:text-cyan-400 transition-colors flex items-center gap-2">
                                    {creator.name}
                                    <ShieldCheck className="w-4 h-4 text-blue-400" />
                                </h3>

                                <div className="flex items-center gap-2 mb-6">
                                    <div className="bg-slate-800/50 px-3 py-1 rounded-lg border border-white/5 text-xs text-slate-300">
                                        Sub: {formatUnits(creator.subscriptionPrice, USDC_DECIMALS)} USDC
                                    </div>
                                </div>

                                <div className="flex items-center justify-between text-sm pt-4 border-t border-white/5">
                                    <span className="text-slate-500">View Content</span>
                                    <span className="flex items-center gap-1 text-cyan-500 font-medium group-hover:translate-x-1 transition-transform">
                                        Visit Channel <ArrowRight className="w-4 h-4" />
                                    </span>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 text-slate-500">No creators found. Be the first to join!</div>
            )}
        </div>
    );
}
