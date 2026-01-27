'use client';

import { useState, use, useEffect } from 'react';
import { Shield, Lock, Play, CheckCircle, Upload, Wallet, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { usePrivy, useWallets } from '@privy-io/react-auth';
import { useSubscription } from '@/hooks/useSubscription';
import { useX402 } from '@/hooks/useX402';
import { createPublicClient, createWalletClient, custom, formatEther, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CREATOR_HUB_ADDRESS, CREATOR_HUB_ABI, NEXT_PUBLIC_IPFS_GATEWAY } from '@/config/constants';
import { motion } from 'framer-motion';

const GATEWAY = NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.lighthouse.storage/ipfs/";

interface ContentItem {
    id: string;
    title: string;
    thumbnail: string;
    type: 'video' | 'audio' | 'article';
    premium: boolean;
    date: string;
    price?: string;
    isLegacy?: boolean;
}

export default function CreatorProfile(props: { params: Promise<{ address: string }> }) {
    const params = use(props.params);
    const { authenticated, user } = usePrivy();
    const { wallets } = useWallets();
    const { isSubscribed, isLoading: subLoading, refresh } = useSubscription(params.address);

    const [creatorName, setCreatorName] = useState('');
    const [subscriptionPrice, setSubscriptionPrice] = useState<bigint>(0n);
    const [isRegistered, setIsRegistered] = useState(false);
    const [isSubscribing, setIsSubscribing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [creatorContent, setCreatorContent] = useState<ContentItem[]>([]);

    const isOwner = user?.wallet?.address?.toLowerCase() === params.address.toLowerCase();
    const avatar = `https://api.dicebear.com/7.x/shapes/svg?seed=${params.address}`;

    // Fetch Creator Details & Content from Chain
    useEffect(() => {
        const fetchData = async () => {
            const client = createPublicClient({
                chain: baseSepolia,
                transport: http()
            });

            try {
                // 1. Fetch Profile
                const profileData = await client.readContract({
                    address: CREATOR_HUB_ADDRESS as `0x${string}`,
                    abi: CREATOR_HUB_ABI,
                    functionName: 'cret',
                    args: [params.address as `0x${string}`]
                }) as [string, string, boolean, bigint, bigint, bigint];

                const [name, wallet, registered, price] = profileData;
                if (registered) {
                    setCreatorName(name);
                    setIsRegistered(true);
                    setSubscriptionPrice(price);
                } else {
                    setCreatorName("Unknown Creator");
                    setLoading(false);
                    return; // Stop if not registered
                }

                // 2. Fetch Content (Client-side filtering for MVP)
                // In production, an Indexer or specific Contract View is needed
                const [rawVideos, rawContent] = await Promise.all([
                    client.readContract({
                        address: CREATOR_HUB_ADDRESS as `0x${string}`,
                        abi: CREATOR_HUB_ABI,
                        functionName: 'getLatestVideos',
                        args: [50] // Check last 50 legacy videos
                    }) as Promise<any[]>,
                    client.readContract({
                        address: CREATOR_HUB_ADDRESS as `0x${string}`,
                        abi: CREATOR_HUB_ABI,
                        functionName: 'getLatestContent',
                        args: [50] // Check last 50 premium items
                    }) as Promise<any[]>
                ]);

                const filteredItems: ContentItem[] = [];

                // Process Legacy Videos
                if (rawVideos) {
                    const myVideos = rawVideos.filter((v: any) => v.uploader.toLowerCase() === params.address.toLowerCase());
                    filteredItems.push(...myVideos.map((v: any) => ({
                        id: v.videoCID,
                        title: v.title,
                        thumbnail: `${GATEWAY}${v.thumbnailCID}`,
                        type: 'video' as const,
                        premium: false,
                        date: new Date(Number(v.timestamp) * 1000).toLocaleDateString(),
                        isLegacy: true
                    })));
                }

                // Process Premium Content
                if (rawContent) {
                    const myContent = rawContent.filter((c: any) => c.creatorAddress.toLowerCase() === params.address.toLowerCase() && c.active);

                    // Fetch metadata for premium items
                    const contentPromises = myContent.map(async (c: any) => {
                        try {
                            // Construct metadata URL safely (handles raw CID or ipfs:// prefix)
                            const cid = c.metadataURI.replace('ipfs://', '');
                            const metadataUrl = `${GATEWAY}${cid}`;

                            const res = await fetch(metadataUrl);
                            const meta = await res.json();
                            return {
                                id: c.id.toString(),
                                title: meta.title || "Untitled",
                                thumbnail: meta.thumbnail ? meta.thumbnail.replace('ipfs://', GATEWAY) : '',
                                type: meta.contentType || 'video',
                                premium: !c.isFree,
                                date: new Date(meta.createdAt || Date.now()).toLocaleDateString(),
                                price: c.fullPrice.toString()
                            } as ContentItem;
                        } catch (e) {
                            console.error("Failed to load metadata", e);
                            return null;
                        }
                    });

                    const resolvedContent = (await Promise.all(contentPromises)).filter(Boolean) as ContentItem[];
                    filteredItems.push(...resolvedContent);
                }

                setCreatorContent(filteredItems);
            } catch (error) {
                console.error("Error fetching data:", error);
                setCreatorName("Error loading");
            } finally {
                setLoading(false);
            }
        };

        if (params.address) fetchData();
    }, [params.address]);

    const { handlePayment, paymentState, loading: paymentLoading } = useX402();

    const handleSubscribe = async () => {
        if (!authenticated || !wallets.length) {
            alert("Please connect your wallet first.");
            return;
        }

        setIsSubscribing(true);
        try {
            // Direct Payment to Creator using useX402
            // Currently subscriptions are priced in ETH (NATIVE) based on contract 'price'
            // We read the price from the chain but send it directly to the creator

            const txHash = await handlePayment({
                chainId: baseSepolia.id,
                tokenAddress: '0x0000000000000000000000000000000000000000', // Native ETH
                amount: subscriptionPrice.toString(),
                recipient: params.address, // Direct to Creator
                paymentParameter: {
                    minerOf: params.address // Metadata for subscription intent
                }
            });

            console.log("Subscription tx:", txHash);

            // Save Proof to Local Storage
            if (txHash && user?.wallet?.address) {
                const storageKey = `subscriptions_${user.wallet.address}`;
                const currentSubs = JSON.parse(localStorage.getItem(storageKey) || '{}');

                currentSubs[params.address.toLowerCase()] = {
                    hash: txHash,
                    timestamp: Date.now()
                };

                localStorage.setItem(storageKey, JSON.stringify(currentSubs));
                console.log("[Subscription] Saved proof locally:", txHash);
            }

            alert("Subscription activated!");

            // Immediate refresh
            refresh();
            setIsSubscribing(false);

        } catch (error) {
            console.error("Subscription failed:", error);
            // alert("Subscription failed. See console for details.");
            setIsSubscribing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
                <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
                <p className="text-slate-400 animate-pulse">Fetching on-chain data...</p>
            </div>
        );
    }

    if (!isRegistered && creatorName !== 'Loading...') {
        return (
            <div className="min-h-screen flex items-center justify-center text-slate-500">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-white">Creator Not Found</h1>
                    <p>The address {params.address} is not registered as a creator.</p>
                    <Link href="/creators" className="inline-block text-cyan-500 hover:text-cyan-400">
                        &larr; Back to Creators
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pb-20 bg-slate-950">
            {/* Immersive Header */}
            <div className="relative h-80 w-full overflow-hidden">
                {/* Dynamic Blurred Background */}
                <div className="absolute inset-0 bg-slate-900">
                    <img src={avatar} alt="Blur Base" className="w-full h-full object-cover opacity-30 blur-3xl scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
                </div>

                <div className="relative h-full max-w-7xl mx-auto px-4 md:px-8 flex flex-col justify-end pb-8">
                    <div className="flex flex-col md:flex-row items-end gap-8">
                        {/* Avatar - Floating effect */}
                        <div className="w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-slate-950 shadow-2xl overflow-hidden bg-slate-900 group">
                            <img src={avatar} alt="Avatar" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                        </div>

                        <div className="flex-1 mb-2">
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
                                    {creatorName}
                                </h1>
                                <Shield className="w-8 h-8 text-cyan-400 fill-cyan-400/20" />
                            </div>
                            <div className="flex items-center gap-4 text-slate-400 text-sm font-medium">
                                <span className="flex items-center gap-1 bg-slate-900/50 px-3 py-1 rounded-full border border-white/5">
                                    <Wallet className="w-3 h-3" />
                                    {params.address.slice(0, 6)}...{params.address.slice(-4)}
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="text-white font-bold">{creatorContent.length}</span> Uploads
                                </span>
                            </div>
                        </div>

                        {/* Action Card */}
                        <div className="mb-2">
                            {isOwner ? (
                                <Link
                                    href="/upload"
                                    className="px-8 py-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 flex items-center gap-2 transition-all hover:scale-105 active:scale-95"
                                >
                                    <Upload className="w-5 h-5" />
                                    Upload New Content
                                </Link>
                            ) : (
                                <div className="flex items-center gap-4">
                                    {isSubscribed ? (
                                        <div className="px-6 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold flex items-center gap-2">
                                            <CheckCircle className="w-5 h-5" />
                                            Subscribed
                                        </div>
                                    ) : (
                                        <button
                                            onClick={handleSubscribe}
                                            disabled={isSubscribing || subLoading}
                                            className="px-8 py-4 rounded-xl bg-white text-slate-950 font-bold hover:bg-slate-200 transition-all flex items-col gap-1 disabled:opacity-50"
                                        >
                                            <span>Subscribe</span>
                                            <span className="text-xs font-normal opacity-60 ml-1">
                                                for {formatEther(subscriptionPrice)} ETH
                                            </span>
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 md:px-8 mt-12">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                        <Play className="w-5 h-5 text-cyan-500" />
                        Latest Content
                    </h2>
                </div>

                {creatorContent.length === 0 ? (
                    <div className="py-20 text-center border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                        <p className="text-slate-500">No content published yet.</p>
                        {isOwner && (
                            <Link href="/upload" className="text-cyan-500 hover:underline mt-2 inline-block">
                                Upload your first video
                            </Link>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {creatorContent.map((item, i) => {
                            const locked = item.premium && !isSubscribed && !isOwner;

                            return (
                                <motion.div
                                    key={item.id}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: i * 0.05 }}
                                    className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-cyan-500/30 transition-all hover:shadow-2xl hover:shadow-cyan-900/20"
                                >
                                    <div className="aspect-video relative overflow-hidden bg-slate-800">
                                        <img
                                            src={item.thumbnail}
                                            alt={item.title}
                                            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${locked ? 'blur-md opacity-50' : ''}`}
                                            onError={(e) => { (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1626544827763-d516dce335ca?q=80&w=1000'; }}
                                        />

                                        <div className="absolute top-3 right-3 flex gap-2">
                                            {item.premium && (
                                                <span className="px-2 py-1 bg-amber-500 text-black text-xs font-bold uppercase tracking-wider rounded">
                                                    Premium
                                                </span>
                                            )}
                                        </div>

                                        <div className="absolute bottom-3 right-3 px-2 py-1 bg-black/60 backdrop-blur rounded text-xs text-white font-mono">
                                            {item.type.toUpperCase()}
                                        </div>

                                        {locked && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
                                                <Lock className="w-10 h-10 text-slate-300 mb-2" />
                                                <span className="text-slate-300 font-bold text-sm">Subscriber Only</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="p-5">
                                        <h3 className="font-bold text-lg text-white mb-2 line-clamp-1 group-hover:text-cyan-400 transition-colors">
                                            {item.title}
                                        </h3>
                                        <div className="flex items-center justify-between text-sm text-slate-500">
                                            <span>{item.date}</span>
                                            {item.premium && (
                                                <span className="flex items-center gap-1 text-indigo-400">
                                                    <Lock className="w-3 h-3" />
                                                    {item.price ? (Number(item.price) / 1000000).toFixed(2) : ''} USDC
                                                </span>
                                            )}
                                        </div>

                                        <div className="mt-4">
                                            {locked ? (
                                                <button
                                                    onClick={handleSubscribe}
                                                    className="w-full py-2.5 rounded-lg bg-slate-800 text-slate-400 font-medium hover:bg-slate-700 transition-colors"
                                                >
                                                    Subscribe to View
                                                </button>
                                            ) : (
                                                <Link
                                                    href={`/content/${item.isLegacy ? 'legacy-' : ''}${item.id}`}
                                                    className="block w-full py-2.5 rounded-lg bg-white/5 border border-white/5 text-center text-white font-medium hover:bg-white/10 transition-colors"
                                                >
                                                    View Content
                                                </Link>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
