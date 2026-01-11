'use client';

import { useEffect, useState, use } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { Loader2, Lock, Play, Pause, Volume2, Maximize, User, ShieldCheck, CheckCircle, AlertCircle, Share2, Wallet } from 'lucide-react';
import Link from 'next/link';
import { createPublicClient, http, formatEther } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CREATOR_HUB_ADDRESS, CREATOR_HUB_ABI, NEXT_PUBLIC_IPFS_GATEWAY, USDC_SEPOLIA_ADDRESS, CHAIN_ID } from '@/config/constants';
import { useX402 } from '@/hooks/useX402';
import { motion, AnimatePresence } from 'framer-motion';

interface ContentData {
    id: string;
    title: string;
    description: string;
    creator: string;
    creatorAddress: string;
    type: 'video' | 'audio' | 'article';
    isPremium: boolean;
    price: string; // in wei
    videoCID: string;
    thumbnailCID: string;
    timestamp: number;
    paymentToken: string;
    isLegacy?: boolean;
}

const GATEWAY = NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.lighthouse.storage/ipfs/";

export default function ContentPage(props: { params: Promise<{ id: string }> }) {
    const params = use(props.params);
    const { getAccessToken, authenticated, login, user } = usePrivy();
    const { handlePayment, paymentState, loading: paymentLoading, error: paymentError } = useX402();

    const [loading, setLoading] = useState(true);
    const [authorized, setAuthorized] = useState(false);
    const [content, setContent] = useState<ContentData | null>(null);
    const [error, setError] = useState('');
    const [relatedContent, setRelatedContent] = useState<ContentData[]>([]);

    useEffect(() => {
        async function fetchContent() {
            try {
                const client = createPublicClient({
                    chain: baseSepolia,
                    transport: http()
                });

                const idParam = params.id;
                const isLegacy = idParam.startsWith('legacy-');

                let fetchedContent: ContentData | null = null;

                if (isLegacy) {
                    const cid = idParam.replace('legacy-', '');
                    // Heuristic: Fetch latest 50 videos and match CID
                    // @ts-ignore
                    const rawVideos: any[] = await client.readContract({
                        address: CREATOR_HUB_ADDRESS as `0x${string}`,
                        abi: CREATOR_HUB_ABI,
                        functionName: 'getLatestVideos',
                        args: [50]
                    });

                    const match = rawVideos.find((v: any) => v.videoCID === cid);
                    if (match) {
                        // Fetch Channel Name
                        let channelName = "Unknown Creator";
                        try {
                            channelName = await client.readContract({
                                address: CREATOR_HUB_ADDRESS as `0x${string}`,
                                abi: CREATOR_HUB_ABI,
                                functionName: 'getChannelName',
                                args: [match.uploader]
                            }) as string;
                        } catch (e) { }

                        fetchedContent = {
                            id: cid,
                            title: match.title,
                            description: "Legacy Showcase Video",
                            creator: channelName || "Creator",
                            creatorAddress: match.uploader,
                            type: 'video',
                            isPremium: false,
                            price: '0',
                            videoCID: match.videoCID,
                            thumbnailCID: match.thumbnailCID,
                            timestamp: Number(match.timestamp),
                            paymentToken: '0x0000000000000000000000000000000000000000',
                            isLegacy: true
                        };
                        setAuthorized(true); // Legacy is always free
                    }

                } else {
                    // Premium Content (Numeric ID)
                    const contentId = BigInt(idParam);
                    // @ts-ignore
                    const rawContent = await client.readContract({
                        address: CREATOR_HUB_ADDRESS as `0x${string}`,
                        abi: CREATOR_HUB_ABI,
                        functionName: 'contents',
                        args: [contentId]
                    }) as any; // Struct tuple

                    const [id, creator, cType, metadataURI, isFree, fullPrice, rentedPrice, paymentToken, active] = rawContent;

                    if (active) {
                        // Fetch Metadata
                        let metadata: any = {};
                        try {
                            const gatewayUrl = metadataURI.startsWith('http')
                                ? metadataURI
                                : metadataURI.startsWith('ipfs://')
                                    ? metadataURI.replace('ipfs://', GATEWAY)
                                    : `${GATEWAY}${metadataURI}`;

                            console.log('Fetching metadata:', { metadataURI, gatewayUrl });
                            const metaRes = await fetch(gatewayUrl);

                            if (!metaRes.ok) {
                                throw new Error(`Gateway returned ${metaRes.status}`);
                            }

                            const contentType = metaRes.headers.get('content-type');
                            if (contentType && contentType.includes('application/json')) {
                                metadata = await metaRes.json();
                            } else {
                                // Fallback: Try text and parse, or log error
                                const text = await metaRes.text();
                                try {
                                    metadata = JSON.parse(text);
                                } catch (e) {
                                    console.error('Failed to parse metadata JSON. Response start:', text.substring(0, 100));
                                    throw new Error('Invalid JSON metadata');
                                }
                            }
                        } catch (e) {
                            console.error("Metadata fetch error:", e);
                            // Set default/fallback metadata so the page doesn't crash completely
                            metadata = {
                                title: `Content #${id.toString()}`,
                                description: "Metadata unavailable",
                                contentType: 'video'
                            };
                        }

                        let channelName = "Unknown Creator";
                        try {
                            channelName = await client.readContract({
                                address: CREATOR_HUB_ADDRESS as `0x${string}`,
                                abi: CREATOR_HUB_ABI,
                                functionName: 'getChannelName',
                                args: [creator]
                            }) as string;
                        } catch (e) { }

                        fetchedContent = {
                            id: id.toString(),
                            title: metadata.title || "Untitled",
                            description: metadata.description || "",
                            creator: channelName || "Creator",
                            creatorAddress: creator,
                            type: metadata.contentType || 'video',
                            isPremium: !isFree,
                            price: fullPrice.toString(),
                            videoCID: metadata.video ? metadata.video.replace('ipfs://', '') : '',
                            thumbnailCID: metadata.thumbnail ? metadata.thumbnail.replace('ipfs://', '') : '',
                            timestamp: metadata.createdAt ? Math.floor(metadata.createdAt / 1000) : Math.floor(Date.now() / 1000),
                            paymentToken: paymentToken
                        };

                        if (isFree) setAuthorized(true);
                        else setAuthorized(false);
                    }
                }

                if (!fetchedContent) {
                    setError("Content not found.");
                } else {
                    setContent(fetchedContent);
                    // Fetch related content
                    fetchRelatedContent(client, fetchedContent.creatorAddress, fetchedContent.id);
                }

            } catch (e) {
                console.error(e);
                setError("Failed to load content.");
            } finally {
                setLoading(false);
            }
        }

        async function fetchRelatedContent(client: any, creatorAddress: string, currentId: string) {
            try {
                // Fetch both legacy and premium to mix
                const [rawVideos, rawContent] = await Promise.all([
                    client.readContract({
                        address: CREATOR_HUB_ADDRESS as `0x${string}`,
                        abi: CREATOR_HUB_ABI,
                        functionName: 'getLatestVideos',
                        args: [50]
                    }) as Promise<any[]>,
                    client.readContract({
                        address: CREATOR_HUB_ADDRESS as `0x${string}`,
                        abi: CREATOR_HUB_ABI,
                        functionName: 'getLatestContent',
                        args: [50]
                    }) as Promise<any[]>
                ]);

                const related: ContentData[] = [];

                // Process Legacy
                if (rawVideos) {
                    const myVideos = rawVideos.filter((v: any) => v.uploader.toLowerCase() === creatorAddress.toLowerCase() && v.videoCID !== currentId);
                    related.push(...myVideos.map((v: any) => ({
                        id: v.videoCID,
                        title: v.title,
                        description: "",
                        creator: "Creator",
                        creatorAddress: v.uploader,
                        type: 'video' as const,
                        isPremium: false,
                        price: '0',
                        videoCID: v.videoCID,
                        thumbnailCID: v.thumbnailCID,
                        timestamp: Number(v.timestamp),
                        paymentToken: '0x0',
                        isLegacy: true
                    })));
                }

                // Process Premium
                if (rawContent) {
                    const myContent = rawContent.filter((c: any) =>
                        c.creatorAddress.toLowerCase() === creatorAddress.toLowerCase() &&
                        c.active &&
                        c.id.toString() !== currentId
                    );

                    // We need metadata for titles/thumbnails
                    // Limiting to 6 for performance
                    const promises = myContent.slice(0, 6).map(async (c: any) => {
                        try {
                            const cid = c.metadataURI.replace('ipfs://', '');
                            const gatewayUrl = `${GATEWAY}${cid}`;
                            const res = await fetch(gatewayUrl);
                            const meta = await res.json();
                            return {
                                id: c.id.toString(),
                                title: meta.title || "Untitled",
                                description: meta.description || "",
                                creator: "Creator",
                                creatorAddress: c.creatorAddress,
                                type: meta.contentType || 'video',
                                isPremium: !c.isFree,
                                price: c.fullPrice.toString(),
                                videoCID: meta.video ? meta.video.replace('ipfs://', '') : '',
                                thumbnailCID: meta.thumbnail ? meta.thumbnail.replace('ipfs://', '') : '',
                                timestamp: meta.createdAt ? Math.floor(meta.createdAt / 1000) : Math.floor(Date.now() / 1000),
                                paymentToken: c.paymentToken,
                                isLegacy: false
                            } as ContentData;
                        } catch (e) { return null; }
                    });

                    const resolved = (await Promise.all(promises)).filter(Boolean) as ContentData[];
                    related.push(...resolved);
                }

                // Sort by date desc and take top 6
                setRelatedContent(related.sort((a, b) => b.timestamp - a.timestamp).slice(0, 6));

            } catch (e) {
                console.error("Failed to load related content", e);
            }
        }

        fetchContent();
    }, [params.id]);

    // Check Authorization & Watch Payment
    useEffect(() => {
        if (!content || !authenticated || !user?.wallet?.address) return;

        async function verifyAccess() {
            try {
                // If we just paid successfully, force authorize immediately
                if (paymentState === 'verifying' || paymentState === 'success') {
                    setAuthorized(true);
                    return;
                }

                const client = createPublicClient({
                    chain: baseSepolia,
                    transport: http()
                });

                const isSubscribed = await client.readContract({
                    address: CREATOR_HUB_ADDRESS as `0x${string}`,
                    abi: CREATOR_HUB_ABI,
                    functionName: 'checkSubscription',
                    args: [user?.wallet?.address as `0x${string}`, content!.creatorAddress as `0x${string}`]
                }) as boolean;

                if (isSubscribed) {
                    setAuthorized(true);
                    return;
                }

                checkAuthorization();

            } catch (e) {
                console.error("Access verification failed", e);
            }
        }

        verifyAccess();
    }, [content, authenticated, paymentState, user]);

    const checkAuthorization = async () => {
        if (!content || !authenticated) return;
        try {
            const token = await getAccessToken();
            const res = await fetch(`/api/content/${params.id}/authorize`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    creatorAddress: content.creatorAddress
                })
            });
            const data = await res.json();
            if (data.authorized) setAuthorized(true);
        } catch (e) {
            console.error("Auth check failed", e);
        }
    };

    const handleBuy = async () => {
        if (!content) return;
        try {
            await handlePayment({
                chainId: CHAIN_ID,
                tokenAddress: content.paymentToken,
                amount: content.price,
                recipient: content.creatorAddress
            });
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center space-y-4 bg-slate-950">
                <Loader2 className="animate-spin w-10 h-10 text-cyan-500" />
                <p className="text-slate-500 animate-pulse">Loading content...</p>
            </div>
        );
    }

    if (!content) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="text-center space-y-4">
                    <p className="text-red-400 text-xl">{error || "Content not found"}</p>
                    <Link href="/explore" className="text-cyan-500 hover:underline">Return Home</Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 pb-20 relative overflow-hidden">
            {/* Immersive Background */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute inset-0 bg-slate-950/80 z-10" />
                <img
                    src={`${GATEWAY}${content.thumbnailCID}`}
                    className="w-full h-[80vh] object-cover blur-3xl opacity-40"
                    alt="Background"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/80 to-transparent z-20" />
            </div>

            <div className="relative z-30 max-w-7xl mx-auto px-4 md:px-8 pt-6">

                {/* Main Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column: Player & Info */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Video Player Container */}
                        <div className="aspect-video bg-black rounded-3xl overflow-hidden relative group shadow-2xl shadow-black/50 border border-white/5 ring-1 ring-white/10">

                            {/* Unlock Animation Overlay */}
                            <AnimatePresence>
                                {!authorized && (
                                    <motion.div
                                        initial={{ opacity: 1, backdropFilter: "blur(12px)" }}
                                        exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
                                        transition={{ duration: 0.8, ease: "easeInOut" }}
                                        className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-slate-900/60 p-6 text-center"
                                    >
                                        {!authenticated ? (
                                            <div className="space-y-6 max-w-sm">
                                                <div className="w-20 h-20 rounded-full bg-slate-800/80 flex items-center justify-center mx-auto border border-white/10">
                                                    <Lock className="w-8 h-8 text-slate-400" />
                                                </div>
                                                <div className="space-y-2">
                                                    <h2 className="text-2xl font-bold text-white">Login Required</h2>
                                                    <p className="text-slate-400">Connect your wallet to access this content.</p>
                                                </div>
                                                <button onClick={login} className="w-full py-3 bg-cyan-500 rounded-xl text-slate-950 font-bold hover:bg-cyan-400 transition-all shadow-lg hover:shadow-cyan-500/20">
                                                    Connect Wallet
                                                </button>
                                            </div>
                                        ) : (
                                            <div className="space-y-8 max-w-md w-full">
                                                <div className="w-24 h-24 rounded-full bg-indigo-500/10 flex items-center justify-center mx-auto border border-indigo-500/20 shadow-[0_0_30px_-5px_rgba(99,102,241,0.3)] animate-pulse">
                                                    <ShieldCheck className="w-10 h-10 text-indigo-400" />
                                                </div>

                                                <div className="space-y-2">
                                                    <h2 className="text-3xl font-bold text-white tracking-tight">Premium Content</h2>
                                                    <p className="text-slate-300 text-lg">Purchase standard access to decrypt and view.</p>
                                                </div>

                                                <div className="bg-slate-900/80 backdrop-blur-xl p-6 rounded-2xl border border-white/10 shadow-xl space-y-4">
                                                    <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                                        <span className="text-slate-400 font-medium">One-time Purchase</span>
                                                        <div className="text-right">
                                                            <span className="block text-3xl font-black text-white">
                                                                {(Number(content.price) / 1000000).toFixed(2)} <span className="text-lg text-slate-500 font-bold">USDC</span>
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <button
                                                        onClick={handleBuy}
                                                        disabled={paymentLoading || paymentState === 'success' || paymentState === 'verifying'}
                                                        className="w-full py-4 bg-indigo-500 hover:bg-indigo-400 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-all shadow-lg shadow-indigo-500/20 flex justify-center items-center gap-2 group/btn relative overflow-hidden"
                                                    >
                                                        {paymentLoading || paymentState === 'paying' || paymentState === 'confirming' || paymentState === 'verifying' ? (
                                                            <>
                                                                <Loader2 className="w-6 h-6 animate-spin" />
                                                                <span className="capitalize">{paymentState}...</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <span>Unlock Now</span>
                                                                <ShieldCheck className="w-5 h-5 group-hover/btn:scale-110 transition-transform" />
                                                            </>
                                                        )}
                                                    </button>

                                                    {paymentError && (
                                                        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="text-red-400 text-sm bg-red-500/10 p-3 rounded-lg flex items-center gap-2">
                                                            <AlertCircle className="w-4 h-4 shrink-0" />
                                                            {paymentError.message}
                                                        </motion.div>
                                                    )}
                                                </div>

                                                <p className="text-xs text-slate-500">
                                                    Secure payment powered by Base Sepolia.
                                                </p>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* Video Element */}
                            {authorized ? (
                                <video
                                    src={`${GATEWAY}${content.videoCID}`}
                                    controls
                                    autoPlay
                                    className="w-full h-full object-contain"
                                    poster={`${GATEWAY}${content.thumbnailCID}`}
                                />
                            ) : (
                                <img
                                    src={`${GATEWAY}${content.thumbnailCID}`}
                                    className="w-full h-full object-cover opacity-50 blur-sm pointer-events-none"
                                    alt="Locked Content"
                                />
                            )}
                        </div>

                        {/* Title & Stats */}
                        <div>
                            <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                                <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight leading-tight">{content.title}</h1>

                                <div className="flex gap-2">
                                    <button className="p-3 rounded-full bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                                        <Share2 className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                                <span className={`px-2.5 py-1 rounded-md font-bold text-xs uppercase tracking-wider ${content.isPremium ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                    {content.isPremium ? 'Premium' : 'Free'}
                                </span>
                                <span className="capitalize px-2 py-0.5 rounded bg-white/5">{content.type}</span>
                                <span>{new Date(content.timestamp * 1000).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                            </div>

                            <div className="p-6 rounded-2xl bg-white/5 border border-white/5 backdrop-blur-sm">
                                <h3 className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-2">Description</h3>
                                <p className="text-slate-300 leading-relaxed whitespace-pre-wrap font-light text-lg">
                                    {content.description || "No description provided."}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Creator & Related */}
                    <div className="space-y-8">

                        {/* Creator Card */}
                        <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/5 backdrop-blur-xl shadow-xl sticky top-6">
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 p-[2px]">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-slate-950">
                                        <img
                                            src={`https://api.dicebear.com/7.x/shapes/svg?seed=${content.creatorAddress}`}
                                            alt={content.creator}
                                            className="w-full h-full object-cover"
                                        />
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs text-slate-500 uppercase font-bold tracking-wider mb-0.5">Creator</div>
                                    <div className="font-bold text-xl text-white truncate">{content.creator}</div>
                                    <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                        <Wallet className="w-3 h-3" />
                                        {content.creatorAddress.substring(0, 6)}...{content.creatorAddress.substring(content.creatorAddress.length - 4)}
                                    </div>
                                </div>
                            </div>

                            <Link
                                href={`/creators/${content.creatorAddress}`}
                                className="block w-full py-3 rounded-xl bg-white text-slate-950 font-bold text-center hover:bg-cyan-50 transition-colors shadow-lg shadow-white/5"
                            >
                                View Channel
                            </Link>
                        </div>

                        {/* More from Creator */}
                        <div>
                            <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                                <Play className="w-5 h-5 text-cyan-500" />
                                More from {content.creator.split(' ')[0]}
                            </h3>
                            <div className="space-y-4">
                                {relatedContent.map((item) => (
                                    <Link key={item.id} href={`/content/${item.isLegacy ? 'legacy-' : ''}${item.id}`} className="block group">
                                        <div className="flex gap-4 p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/5">
                                            <div className="w-32 aspect-video bg-slate-800 rounded-lg overflow-hidden relative shrink-0">
                                                <img
                                                    src={`${GATEWAY}${item.thumbnailCID}`}
                                                    className="w-full h-full object-cover transition-transform group-hover:scale-105"
                                                    alt={item.title}
                                                />
                                                {item.isPremium && (
                                                    <div className="absolute top-1 right-1 bg-black/60 backdrop-blur rounded px-1.5 py-0.5">
                                                        <Lock className="w-3 h-3 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0 py-1">
                                                <h4 className="text-white font-medium line-clamp-2 leading-snug group-hover:text-cyan-400 transition-colors">{item.title}</h4>
                                                <div className="mt-2 text-xs text-slate-500 flex items-center justify-between">
                                                    <span>{new Date(item.timestamp * 1000).toLocaleDateString()}</span>
                                                    {item.isPremium && (
                                                        <span className="text-indigo-400 font-bold">
                                                            {(Number(item.price) / 1000000).toFixed(2)}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                ))}
                                {relatedContent.length === 0 && (
                                    <div className="text-slate-500 text-sm text-center py-4">No other videos found.</div>
                                )}
                            </div>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
}
