'use client';

import { useState, use } from 'react';
import { notFound } from 'next/navigation';
import { motion } from 'framer-motion';
import { Shield, Lock, Play, Star } from 'lucide-react';
import SubscriptionModal from '@/components/SubscriptionModal';
import Link from 'next/link';
import { usePrivy } from '@privy-io/react-auth';

// Mock Data (Ideally fetched based on params.address)
const CREATOR_DATA = {
    name: 'Crypto Studios',
    bio: 'Documenting the decentralized revolution.',
    avatar: 'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?q=80&w=2574&auto=format&fit=crop',
    cover: 'https://images.unsplash.com/photo-1639322537228-ad71c429d243?q=80&w=2664&auto=format&fit=crop',
    stats: { subscribers: '1.2k', videos: 45, articles: 12 },
    plans: [
        { id: 'basic', tierId: 1, name: 'Basic Tier', price: '5.00', period: 'month', features: ['Access to articles', 'Weekly newsletter'] },
        { id: 'premium', tierId: 2, name: 'Premium Tier', price: '15.00', period: 'month', features: ['All Basic features', 'Full video library', 'Early access', 'Community Discord'] }
    ],
    content: [
        { id: '1', title: 'The Merge: Untold Stories', type: 'video', tier: 2, thumbnail: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2664&auto=format&fit=crop', date: '2 days ago' },
        { id: '2', title: 'Layer 3 Thesis', type: 'article', tier: 1, thumbnail: 'https://images.unsplash.com/photo-1620325867502-221cfb5faa5f?q=80&w=2657&auto=format&fit=crop', date: '1 week ago' },
        { id: '3', title: 'Public Roadmap', type: 'article', tier: 0, thumbnail: 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2670&auto=format&fit=crop', date: '2 weeks ago' }
    ]
};

export default function CreatorProfile(props: { params: Promise<{ address: string }> }) {
    const params = use(props.params);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const { authenticated } = usePrivy();

    // Mock checking subscription status
    // const { data: subscription } = useSubscription(params.address) ...
    const [userTier, setUserTier] = useState(0); // 0 = Free

    const handleSubscriptionSuccess = (tierId: number) => {
        console.log("Subscription successful! Upgrading to tier:", tierId);
        setUserTier(tierId);
    };

    return (
        <div className="min-h-screen">
            {/* Cover */}
            <div className="h-64 md:h-80 w-full relative overflow-hidden rounded-b-3xl">
                <img src={CREATOR_DATA.cover} alt="Cover" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 to-transparent" />
            </div>

            <div className="relative px-4 md:px-8 -mt-20">
                {/* Profile Header */}
                <div className="flex flex-col md:flex-row items-end md:items-center gap-6 mb-12">
                    <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl border-4 border-slate-950 overflow-hidden shadow-2xl">
                        <img src={CREATOR_DATA.avatar} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1 space-y-2 mb-2">
                        <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-2">
                            {CREATOR_DATA.name}
                            <Shield className="w-6 h-6 text-blue-500 fill-blue-500/20" />
                        </h1>
                        <p className="text-slate-400 max-w-lg">{CREATOR_DATA.bio}</p>
                        <div className="flex gap-6 pt-2">
                            {Object.entries(CREATOR_DATA.stats).map(([k, v]) => (
                                <div key={k}>
                                    <span className="block text-xl font-bold text-white leading-none">{v}</span>
                                    <span className="text-xs text-slate-500 uppercase tracking-wider">{k}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 w-full md:w-auto mt-4 md:mt-0">
                        <button className="flex-1 md:flex-none px-6 py-3 rounded-full bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors">
                            Follow
                        </button>
                        {/* Share Button etc. */}
                    </div>
                </div>

                {/* Plans Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16 max-w-4xl mx-auto">
                    {CREATOR_DATA.plans.map((plan) => (
                        <div
                            key={plan.id}
                            className={`p-6 rounded-2xl border ${userTier >= plan.tierId
                                ? 'bg-emerald-500/10 border-emerald-500/50'
                                : 'bg-slate-900 border-white/5 hover:border-cyan-500/30'
                                } transition-colors relative group`}
                        >
                            {userTier >= plan.tierId && (
                                <div className="absolute top-4 right-4 px-2 py-1 bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase rounded">
                                    Active
                                </div>
                            )}
                            <h3 className="text-xl font-bold text-white mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-1 mb-4">
                                <span className="text-3xl font-bold text-white">${plan.price}</span>
                                <span className="text-slate-500">/{plan.period}</span>
                            </div>
                            <ul className="space-y-2 mb-6 text-sm text-slate-300">
                                {plan.features.map(f => (
                                    <li key={f} className="flex items-center gap-2">
                                        <Star className="w-4 h-4 text-cyan-500" /> {f}
                                    </li>
                                ))}
                            </ul>

                            {userTier < plan.tierId && (
                                <button
                                    onClick={() => {
                                        // Ensure valid address for demo
                                        const addr = params.address.length === 42 ? params.address : '0x742d35Cc6634C0532925a3b844Bc454e4438f44e';
                                        setSelectedPlan({ ...plan, creatorAddress: addr });
                                    }}
                                    className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-lg shadow-cyan-500/20"
                                >
                                    Subscribe
                                </button>
                            )}
                        </div>
                    ))}
                </div>

                {/* Content Grid */}
                <h2 className="text-2xl font-bold text-white mb-6">Recent Content</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pb-20">
                    {CREATOR_DATA.content.map((item) => {
                        const locked = userTier < item.tier;
                        return (
                            <div key={item.id} className="group relative rounded-2xl overflow-hidden bg-slate-900 border border-white/5">
                                <div className="aspect-video relative">
                                    <img
                                        src={item.thumbnail}
                                        className={`w-full h-full object-cover transition-all duration-500 ${locked ? 'blur-sm grayscale opacity-50' : 'group-hover:scale-105'}`}
                                        alt={item.title}
                                    />
                                    {locked && (
                                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                                            <Lock className="w-8 h-8 text-white/70" />
                                        </div>
                                    )}
                                    {!locked && (
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/30">
                                            <Play className="w-10 h-10 text-white fill-white" />
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <h4 className="font-bold text-white line-clamp-1">{item.title}</h4>
                                        {item.tier > 0 && <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-300">{item.tier === 2 ? 'PREMIUM' : 'BASIC'}</span>}
                                    </div>
                                    <div className="flex justify-between items-center text-xs text-slate-500">
                                        <span>{item.type}</span>
                                        <span>{item.date}</span>
                                    </div>
                                    {locked ? (
                                        <button
                                            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} // Scroll to plans
                                            className="mt-4 w-full py-2 rounded-lg bg-slate-800 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
                                        >
                                            Unlock requires {item.tier === 2 ? 'Premium' : 'Basic'}
                                        </button>
                                    ) : (
                                        <Link
                                            href={`/content/${item.id}`}
                                            className="mt-4 block w-full py-2 rounded-lg bg-white/10 text-center text-white text-sm font-medium hover:bg-white/20 transition-colors"
                                        >
                                            View Content
                                        </Link>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {selectedPlan && (
                <SubscriptionModal
                    isOpen={!!selectedPlan}
                    onClose={() => setSelectedPlan(null)}
                    plan={selectedPlan}
                    onSuccess={handleSubscriptionSuccess}
                />
            )}
        </div>
    );
}
