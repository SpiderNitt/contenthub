'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';
import { CREATOR_HUB_ADDRESS, CREATOR_HUB_ABI, WALLET_ADDRESS_LENGTH } from '@/config/constants';

interface Creator {
    name: string;
    address: string;
    avatar: string;
}

export default function FeaturedCreators() {
    const [creators, setCreators] = useState<Creator[]>([]);

    useEffect(() => {
        const fetchCreators = async () => {
            try {
                const client = createPublicClient({
                    chain: baseSepolia,
                    transport: http()
                });

                // Fetch latest videos to find active creators
                // @ts-ignore
                const rawVideos: any[] = await client.readContract({
                    address: CREATOR_HUB_ADDRESS as `0x${string}`,
                    abi: CREATOR_HUB_ABI,
                    functionName: 'getLatestVideos',
                    args: [50] // Look at last 50 videos
                });

                if (!rawVideos || rawVideos.length === 0) return;

                // Extract unique uploaders
                const uniqueUploaders = Array.from(new Set(rawVideos.map((v: any) => v.uploader)));

                // Fetch names for each uploader
                const creatorsData = await Promise.all(uniqueUploaders.map(async (address: unknown) => {
                    const walletAddress = address as `0x${string}`;
                    // @ts-ignore
                    const name = await client.readContract({
                        address: CREATOR_HUB_ADDRESS as `0x${string}`,
                        abi: CREATOR_HUB_ABI,
                        functionName: 'getChannelName',
                        args: [walletAddress]
                    });

                    return {
                        name: name as string,
                        address: walletAddress,
                        // Consistent avatar generation based on address
                        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${walletAddress}`
                    };
                }));

                setCreators(creatorsData);
            } catch (error) {
                console.error("Error fetching creators:", error);
            }
        };

        fetchCreators();
    }, []);

    if (creators.length === 0) return null;

    // Duplicate list for infinite scroll effect
    const displayCreators = [...creators, ...creators, ...creators];

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
                    {displayCreators.map((creator, i) => (
                        <Link
                            key={`${creator.address}-${i}`}
                            href={`/creators/${creator.address}`}
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
