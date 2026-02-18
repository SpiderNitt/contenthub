'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Play, Music, FileText, Lock, Unlock, Search, Loader2 } from 'lucide-react';
import { createPublicClient, formatUnits, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CREATOR_HUB_ADDRESS, CREATOR_HUB_ABI, NEXT_PUBLIC_IPFS_GATEWAY, USDC_DECIMALS } from '@/config/constants';

// Data Interface
interface VideoContent {
    id: string;
    title: string;
    description?: string;
    creator: string;
    creatorAddress: string;
    type: 'video' | 'audio' | 'article';
    tier: 'premium' | 'basic' | 'free';
    thumbnail: string;
    duration: string;
    videoCID?: string; // Legacy
    metadataURI?: string; // Premium
    price?: string;
    isLegacy: boolean;
}

const GATEWAY = NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.lighthouse.storage/ipfs/";

export default function ExplorePage() {
    const [filter, setFilter] = useState('all');
    const [items, setItems] = useState<VideoContent[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const client = createPublicClient({
                    chain: baseSepolia,
                    transport: http()
                });

                // Parallel fetch: Latest Videos (Legacy) & Latest Content (Premium)
                const [rawVideos, rawContent] = await Promise.all([
                    client.readContract({
                        address: CREATOR_HUB_ADDRESS as `0x${string}`,
                        abi: CREATOR_HUB_ABI,
                        functionName: 'getLatestVideos',
                        args: [20]
                    }) as Promise<any[]>,
                    client.readContract({
                        address: CREATOR_HUB_ADDRESS as `0x${string}`,
                        abi: CREATOR_HUB_ABI,
                        functionName: 'getLatestContent',
                        args: [20]
                    }) as Promise<any[]>
                ]);

                // console.log("Videos:", rawVideos);
                // console.log("Content:", rawContent);

                const formattedItems: VideoContent[] = [];

                // 1. Process Legacy Videos
                if (rawVideos && rawVideos.length > 0) {
                    for (const v of rawVideos) {
                        // Fetch channel name (optimistic or separate request could be batched)
                        let channelName = "Unknown Creator";
                        try {
                            channelName = await client.readContract({
                                address: CREATOR_HUB_ADDRESS as `0x${string}`,
                                abi: CREATOR_HUB_ABI,
                                functionName: 'getChannelName',
                                args: [v.uploader]
                            }) as string;
                        } catch (e) { }

                        formattedItems.push({
                            id: v.videoCID, // Use CID as ID for legacy
                            title: v.title,
                            creator: channelName || "Creator",
                            creatorAddress: v.uploader,
                            type: 'video',
                            tier: 'free',
                            thumbnail: `${GATEWAY}${v.thumbnailCID}`,
                            duration: new Date(Number(v.timestamp) * 1000).toLocaleDateString(),
                            videoCID: v.videoCID,
                            isLegacy: true
                        });
                    }
                }

                // 2. Process Premium Content
                if (rawContent && rawContent.length > 0) {
                    // Fetch metadata for all valid content
                    const contentPromises = rawContent.map(async (c: any) => {
                        if (!c.active) return null;

                        try {
                            // Construct metadata URL safely (handles raw CID or ipfs:// prefix)
                            const cid = c.metadataURI.replace('ipfs://', '');
                            const metadataUrl = `${GATEWAY}${cid}`;

                            const res = await fetch(metadataUrl);
                            const metadata = await res.json();

                            let channelName = "Unknown Creator";
                            try {
                                channelName = await client.readContract({
                                    address: CREATOR_HUB_ADDRESS as `0x${string}`,
                                    abi: CREATOR_HUB_ABI,
                                    functionName: 'getChannelName',
                                    args: [c.creatorAddress]
                                }) as string;
                            } catch (e) { }

                            return {
                                id: c.id.toString(),
                                title: metadata.title || "Untitled",
                                description: metadata.description,
                                creator: channelName || "Creator",
                                creatorAddress: c.creatorAddress,
                                type: metadata.contentType || 'video',
                                tier: c.isFree ? 'free' : 'premium',
                                thumbnail: metadata.thumbnail ? metadata.thumbnail.replace('ipfs://', GATEWAY) : '',
                                duration: new Date(metadata.createdAt || Date.now()).toLocaleDateString(),
                                metadataURI: c.metadataURI,
                                price: c.fullPrice.toString(),
                                isLegacy: false
                            } as VideoContent;
                        } catch (err) {
                            console.error("Failed to load metadata for content", c.id, err);
                            return null;
                        }
                    });

                    const processedContent = (await Promise.all(contentPromises)).filter(Boolean) as VideoContent[];
                    formattedItems.push(...processedContent);
                }

                setItems(formattedItems);
            } catch (error) {
                console.error("Error fetching items:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

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
            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                </div>
            ) : items.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                    No content found. Be the first to upload!
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {items.filter(c => filter === 'all' || c.type === filter).map((item, i) => (
                        <motion.div
                            key={`${item.isLegacy ? 'leg' : 'prem'}-${item.id}`}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.05 }}
                        >
                            <Link href={`/content/${item.isLegacy ? 'legacy-' : ''}${item.id}`} className="group block bg-slate-900 rounded-2xl overflow-hidden border border-white/5 hover:border-cyan-500/50 transition-colors relative h-full flex flex-col">
                                {/* Thumbnail */}
                                <div className="aspect-video relative overflow-hidden bg-slate-800 flex-shrink-0">
                                    <img
                                        src={item.thumbnail}
                                        alt={item.title}
                                        className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                                        onError={(e) => {
                                            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?q=80&w=2664';
                                        }}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />

                                    {/* Type Icon */}
                                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white">
                                        {item.type === 'video' && <Play className="w-4 h-4" />}
                                        {item.type === 'audio' && <Music className="w-4 h-4" />}
                                        {item.type === 'article' && <FileText className="w-4 h-4" />}
                                    </div>

                                    {/* Tier Badge */}
                                    <div className={`absolute top-3 left-3 px-2 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${item.tier === 'premium' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/20' :
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
                                <div className="p-5 space-y-3 flex-grow flex flex-col justify-between">
                                    <div>
                                        <h3 className="font-bold text-lg text-white leading-snug group-hover:text-cyan-400 transition-colors line-clamp-2">
                                            {item.title}
                                        </h3>
                                        {item.description && <p className="text-slate-400 text-sm mt-2 line-clamp-2">{item.description}</p>}
                                    </div>
                                    <div className="flex items-center justify-between text-sm text-slate-400 pt-4 border-t border-white/5">
                                        <span className="hover:text-white transition-colors truncate max-w-[60%]">{item.creator}</span>
                                        {item.tier !== 'free' ?
                                            <div className="flex items-center gap-1 text-indigo-400">
                                                <Lock className="w-3 h-3" />
                                                <span className="font-mono font-bold">{item.price ? formatUnits(BigInt(item.price), USDC_DECIMALS) : ''} USDC</span>
                                            </div>
                                            : <div className="flex items-center gap-1 text-emerald-400"><Unlock className="w-3 h-3" /> Free</div>
                                        }
                                    </div>
                                </div>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            )}
        </div>
    );
}
