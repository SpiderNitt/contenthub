'use client';

import { useEffect, useState, use } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Loader2, Lock, Play, Pause, Volume2, Maximize } from 'lucide-react';
import Link from 'next/link';

export default function ContentPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const { getAccessToken, authenticated } = usePrivy();
    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [mediaUrl, setMediaUrl] = useState<string | null>(null);
    const [error, setError] = useState('');
    const [metadata, setMetadata] = useState<any>(null);

    useEffect(() => {
        async function init() {
            if (!authenticated) {
                setLoading(false);
                return;
            }

            try {
                const token = await getAccessToken();
                // 1. Authorize
                const res = await fetch(`/api/content/${params.id}/authorize`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (res.status === 403 || res.status === 401) {
                    setAuthorized(false);
                    setLoading(false);
                    return;
                }

                const data = await res.json();
                if (data.authorized && data.fetchInstruction) {
                    setAuthorized(true);
                    // 2. Fetch Blob
                    // Conceptual: fetch from Walrus Aggregator using instruction
                    // const blobRes = await fetch(`https://walrus-aggregator.com/${data.fetchInstruction.blobId}?sig=${data.fetchInstruction.signature}`);
                    // const blob = await blobRes.blob();
                    // const url = URL.createObjectURL(blob);

                    // MOCK: Since we don't have a real Walrus upload, we use a dummy video URL if authorized.
                    setMediaUrl("https://media.w3.org/2010/05/sintel/trailer_hd.mp4");
                } else {
                    setAuthorized(false);
                }
            } catch (e) {
                console.error(e);
                setError("Failed to load content.");
            } finally {
                setLoading(false);
            }
        }

        init();
    }, [authenticated, params.id, getAccessToken]);

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-cyan-500" /></div>;
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8">
            {/* Player Container */}
            <div className="aspect-video bg-black rounded-3xl overflow-hidden relative group shadow-2xl shadow-cyan-900/10">
                {!authenticated ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-center p-6">
                        <Lock className="w-16 h-16 text-slate-700 mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Login Required</h2>
                        <p className="text-slate-400 mb-6">Connect your wallet to access this content.</p>
                    </div>
                ) : !authorized ? (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/90 text-center p-6">
                        <Lock className="w-16 h-16 text-cyan-500/50 mb-4" />
                        <h2 className="text-2xl font-bold text-white mb-2">Premium Content</h2>
                        <p className="text-slate-400 mb-6">You need an active subscription to watch this.</p>
                        <Link href="/creators" className="px-6 py-3 rounded-full bg-cyan-500 text-slate-900 font-bold hover:bg-cyan-400 transition-colors">
                            View Creator Plans
                        </Link>
                    </div>
                ) : mediaUrl ? (
                    <video
                        src={mediaUrl}
                        controls
                        autoPlay
                        className="w-full h-full object-contain"
                        poster="https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?q=80&w=2670&auto=format&fit=crop"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-red-400">
                        {error || "Error loading media."}
                    </div>
                )}
            </div>

            {/* Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-2 space-y-4">
                    <h1 className="text-3xl font-bold text-white">DeFi Summer 2025 Documentary</h1>
                    <div className="flex items-center gap-4 text-sm text-slate-400">
                        <span className="px-2 py-1 rounded bg-slate-800 text-cyan-500 font-bold text-xs uppercase">Premium</span>
                        <span>45 min</span>
                        <span>Released 2 days ago</span>
                    </div>
                    <p className="text-slate-300 leading-relaxed">
                        An exclusive look into the resurgence of decentralized finance protocols on Base. Interviews with top founders and on-chain analysis.
                    </p>
                </div>

                <div className="space-y-6">
                    <div className="p-6 rounded-2xl bg-slate-900 border border-white/5">
                        <h3 className="font-bold text-white mb-4">Creator</h3>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-12 h-12 rounded-full bg-slate-800" />
                            <div>
                                <div className="font-bold text-white">Crypto Studios</div>
                                <div className="text-xs text-slate-500">1.2k subscribers</div>
                            </div>
                        </div>
                        <button className="w-full py-2 rounded-lg bg-slate-800 text-white font-medium hover:bg-slate-700 transition-colors">
                            View Profile
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
