'use client';

import { useEffect, useState } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import Link from 'next/link';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CREATOR_HUB_ADDRESS, CREATOR_HUB_ABI, NEXT_PUBLIC_IPFS_GATEWAY } from '@/config/constants';
import { Loader2, Play, Lock, Clock } from 'lucide-react';

const GATEWAY = NEXT_PUBLIC_IPFS_GATEWAY || "https://gateway.lighthouse.storage/ipfs/";

interface ContentItem {
    id: string;
    title: string;
    description: string;
    thumbnailCID: string;
    creatorAddress: string;
    type: string;
    timestamp: number;
    expiry?: number; // Rental expiry
    isRental: boolean;
}

export default function LibraryPage() {
    const { ready, authenticated, user } = usePrivy();
    const [loading, setLoading] = useState(true);
    const [libraryContent, setLibraryContent] = useState<ContentItem[]>([]);

    useEffect(() => {
        if (!ready || !authenticated || !user?.wallet?.address) return;

        async function fetchLibrary() {
            try {
                setLoading(true);
                const client = createPublicClient({
                    chain: baseSepolia,
                    transport: http()
                });

                // 1. Fetch available content (Limit 50 for MVP)
                // @ts-ignore
                const rawContent: any[] = await client.readContract({
                    address: CREATOR_HUB_ADDRESS as `0x${string}`,
                    abi: CREATOR_HUB_ABI,
                    functionName: 'getLatestContent',
                    args: [50]
                });

                const myItems: ContentItem[] = [];

                // 2. Check Access for each item
                // This is parallelized for speed
                const checks = rawContent.map(async (c: any) => {
                    if (!c.active) return null;

                    try {
                        const contentId = c.id;
                        const creator = c.creatorAddress;

                        // Check Rental & Subscription in parallel
                        const [isRented, isSubscribed] = await Promise.all([
                            client.readContract({
                                address: CREATOR_HUB_ADDRESS as `0x${string}`,
                                abi: CREATOR_HUB_ABI,
                                functionName: 'checkRental',
                                args: [user?.wallet?.address as `0x${string}`, BigInt(contentId)]
                            }),
                            client.readContract({
                                address: CREATOR_HUB_ADDRESS as `0x${string}`,
                                abi: CREATOR_HUB_ABI,
                                functionName: 'checkSubscription',
                                args: [user?.wallet?.address as `0x${string}`, creator]
                            })
                        ]);

                        if (isRented || isSubscribed) {
                            // Fetch Metadata if access confirmed
                            try {
                                const cid = c.metadataURI.replace('ipfs://', '');
                                const res = await fetch(`${GATEWAY}${cid}`);
                                const meta = await res.json();

                                // Get Rental Expiry if rented
                                let expiryTimestamp = 0;
                                if (isRented) {
                                    const rentalExpiry = await client.readContract({
                                        address: CREATOR_HUB_ADDRESS as `0x${string}`,
                                        abi: CREATOR_HUB_ABI,
                                        functionName: 'rentals',
                                        args: [user?.wallet?.address as `0x${string}`, BigInt(contentId)]
                                    });
                                    expiryTimestamp = Number(rentalExpiry);
                                }

                                return {
                                    id: c.id.toString(),
                                    title: meta.title || "Untitled",
                                    description: meta.description || "",
                                    thumbnailCID: meta.thumbnail ? meta.thumbnail.replace('ipfs://', '') : '',
                                    creatorAddress: c.creatorAddress,
                                    type: meta.contentType || 'video',
                                    timestamp: meta.createdAt || Date.now(),
                                    expiry: expiryTimestamp,
                                    isRental: isRented as boolean
                                } as ContentItem;
                            } catch (e) {
                                console.error("Metadata error", e);
                                return null;
                            }
                        }
                    } catch (e) {
                        return null;
                    }
                    return null;
                });

                const results = await Promise.all(checks);
                const founded = results.filter(Boolean) as ContentItem[];

                // Sort by recent access/expiry? Let's simply sort by ID descending
                setLibraryContent(founded.sort((a, b) => Number(b.id) - Number(a.id)));

            } catch (error) {
                console.error("Library fetch error:", error);
            } finally {
                setLoading(false);
            }
        }

        fetchLibrary();
    }, [ready, authenticated, user]);

    if (!ready) return null;

    if (!authenticated) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-950">
                <div className="text-center space-y-4">
                    <h1 className="text-2xl font-bold text-white">Please Connect Wallet</h1>
                    <p className="text-slate-400">You need to sign in to view your library.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen pt-24 px-6 md:px-12 bg-slate-950">
            <header className="mb-12">
                <h1 className="text-3xl font-bold text-white mb-2">My Library</h1>
                <p className="text-slate-400">Your rented videos and subscribed content.</p>
            </header>

            {loading ? (
                <div className="flex justify-center py-20">
                    <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
                </div>
            ) : libraryContent.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {libraryContent.map((item) => (
                        <Link href={`/content/${item.id}`} key={item.id} className="group">
                            <div className="bg-slate-900 rounded-2xl overflow-hidden border border-white/5 hover:border-cyan-500/50 transition-all hover:shadow-[0_0_20px_-5px_rgba(34,211,238,0.2)]">
                                <div className="aspect-video bg-slate-800 relative overflow-hidden">
                                    {item.thumbnailCID ? (
                                        <img
                                            src={`${GATEWAY}${item.thumbnailCID}`}
                                            alt={item.title}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                                            <Play className="w-12 h-12" />
                                        </div>
                                    )}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                        <div className="w-12 h-12 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
                                            <Play className="w-5 h-5 fill-current" />
                                        </div>
                                    </div>
                                    {item.isRental && item.expiry && (
                                        <div className="absolute bottom-2 right-2 bg-black/80 backdrop-blur text-xs font-bold px-2 py-1 rounde-md text-amber-400 border border-amber-500/30 flex items-center gap-1 rounded">
                                            <Clock className="w-3 h-3" />
                                            {item.expiry > Date.now() / 1000
                                                ? `${Math.ceil((item.expiry - Date.now() / 1000) / 3600)}h left`
                                                : "Expired"}
                                        </div>
                                    )}
                                </div>
                                <div className="p-4">
                                    <h3 className="font-bold text-white truncate mb-1">{item.title}</h3>
                                    <p className="text-xs text-slate-400 flex items-center gap-1">
                                        {item.isRental ? 'Rented' : 'Subscribed'}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 border border-dashed border-slate-800 rounded-3xl bg-slate-900/30">
                    <p className="text-slate-400 mb-4">You haven't unlocked any content yet.</p>
                    <Link href="/explore" className="inline-block px-6 py-3 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-[0_0_20px_-5px_rgba(34,211,238,0.4)]">
                        Explore Creators
                    </Link>
                </div>
            )}
        </div>
    );
}
