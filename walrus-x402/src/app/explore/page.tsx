'use client';

import { useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Music, FileText, Lock, Unlock, Search } from 'lucide-react';

// Mock Data
const MOCK_CONTENT = [
    {
        id: '1',
        title: 'DeFi Summer 2025 Documentary',
        creator: 'Crypto Studios',
        creatorAddress: '0x123...abc',
        type: 'video',
        tier: 'premium',
        thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2664&auto=format&fit=crop',
        duration: '45:00'
    },
    {
        id: '2',
        title: 'Alpha Leak: Base L3s',
        creator: 'Degen Daily',
        creatorAddress: '0x456...def',
        type: 'article',
        tier: 'basic',
        thumbnail: 'https://images.unsplash.com/photo-1620325867502-221cfb5faa5f?q=80&w=2657&auto=format&fit=crop',
        duration: '5 min read'
    },
    {
        id: '3',
        title: 'Lofi Beats for Coding Smart Contracts',
        creator: 'Chill Chain',
        creatorAddress: '0x789...ghi',
        type: 'audio',
        tier: 'free',
        thumbnail: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?q=80&w=2670&auto=format&fit=crop',
        duration: '1:00:00'
    }
];

export default function ExplorePage() {
    const [filter, setFilter] = useState('all');

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Explore Content</h1>
                    <p className="text-slate-400">Discover the best Web3 long-form content.</p>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                        type="text"
                        placeholder="Search creators or content..."
                        className="pl-10 pr-4 py-2 rounded-full bg-slate-900 border border-slate-800 text-sm focus:outline-none focus:border-cyan-500 w-64 md:w-80 transition-colors"
                    />
                </div>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {['all', 'video', 'audio', 'article'].map((f) => (
                    <button
                        key={f}
                        onClick={() => setFilter(f)}
                        className={`px-4 py-2 rounded-full text-sm font-medium capitalize transition-colors ${filter === f
                                ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
                            }`}
                    >
                        {f}
                    </button>
                ))}
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {MOCK_CONTENT.filter(c => filter === 'all' || c.type === filter).map((item, i) => (
                    <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                    >
                        <Link href={`/content/${item.id}`} className="group block bg-slate-900 rounded-2xl overflow-hidden border border-white/5 hover:border-cyan-500/50 transition-colors relative">
                            {/* Thumbnail */}
                            <div className="aspect-video relative overflow-hidden">
                                <img src={item.thumbnail} alt={item.title} className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500" />
                                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />

                                {/* Type Icon */}
                                <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white">
                                    {item.type === 'video' && <Play className="w-4 h-4" />}
                                    {item.type === 'audio' && <Music className="w-4 h-4" />}
                                    {item.type === 'article' && <FileText className="w-4 h-4" />}
                                </div>

                                {/* Tier Badge */}
                                <div className={`absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${item.tier === 'premium' ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20' :
                                        item.tier === 'basic' ? 'bg-blue-600 text-white' :
                                            'bg-slate-700 text-slate-200'
                                    }`}>
                                    {item.tier}
                                </div>

                                {/* Duration */}
                                <div className="absolute bottom-3 right-3 px-2 py-1 rounded bg-black/60 text-xs text-white font-mono">
                                    {item.duration}
                                </div>
                            </div>

                            {/* Info */}
                            <div className="p-5 space-y-3">
                                <h3 className="font-bold text-lg text-white leading-snug group-hover:text-cyan-400 transition-colors line-clamp-2">
                                    {item.title}
                                </h3>
                                <div className="flex items-center justify-between text-sm text-slate-400">
                                    <span className="hover:text-white transition-colors">{item.creator}</span>
                                    {item.tier !== 'free' ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3 text-emerald-500" />}
                                </div>
                            </div>
                        </Link>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
