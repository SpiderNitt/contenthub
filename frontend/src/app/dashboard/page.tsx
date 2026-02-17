"use client";

import { useState, useEffect } from 'react';
import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CREATOR_HUB_ADDRESS, CREATOR_HUB_ABI, NEXT_PUBLIC_IPFS_GATEWAY } from '@/config/constants';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Loader2, Users, DollarSign, Video, Settings, Upload } from 'lucide-react';
import { formatEther, parseEther } from 'viem';

// Helper to format currency
const formatCurrency = (amount: bigint) => {
    return parseFloat(formatEther(amount)).toFixed(4);
};

export default function DashboardPage() {
    const { address, isConnected } = useAccount();
    const [isClient, setIsClient] = useState(false);
    const [newPrice, setNewPrice] = useState('');

    // Initial client-side check
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Fetch Creator Details
    const { data: creatorData, isLoading: isLoadingCreator, refetch: refetchCreator } = useReadContract({
        address: CREATOR_HUB_ADDRESS,
        abi: CREATOR_HUB_ABI,
        functionName: 'creators',
        args: [address],
        query: {
            enabled: !!address,
        }
    });

    // Fetch All Content to filter for my content
    // Note: ideally we'd have a contract function for "getMyContent", but filtering works for now
    const { data: allContent, isLoading: isLoadingContent } = useReadContract({
        address: CREATOR_HUB_ADDRESS,
        abi: CREATOR_HUB_ABI,
        functionName: 'getLatestContent',
        args: [BigInt(100)], // Fetch last 100 items
    });

    const { writeContract, data: hash } = useWriteContract();
    const { isLoading: isUpdating, isSuccess: isUpdateSuccess } = useWaitForTransactionReceipt({ hash });

    useEffect(() => {
        if (isUpdateSuccess) {
            setNewPrice('');
            refetchCreator();
        }
    }, [isUpdateSuccess, refetchCreator]);

    // Handle Price Update
    const handleUpdatePrice = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPrice) return;

        try {
            writeContract({
                address: CREATOR_HUB_ADDRESS,
                abi: CREATOR_HUB_ABI,
                functionName: 'setSubscriptionPrice',
                args: [parseEther(newPrice)]
            });
        } catch (error) {
            console.error("Error updating price:", error);
        }
    };

    if (!isClient) return null;

    if (!isConnected) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-white mb-4">Connect Wallet</h1>
                    <p className="text-slate-400">Please connect your wallet to access the dashboard.</p>
                </div>
            </div>
        );
    }

    if (isLoadingCreator) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                <Loader2 className="w-10 h-10 text-cyan-400 animate-spin" />
            </div>
        );
    }

    // Check if registered
    // creatorData array: [name, wallet, isRegistered, subscriptionPrice, subscriberCount, totalEarnings]
    const isRegistered = creatorData ? (creatorData as any)[2] : false;

    if (!isRegistered) {
        return (
            <div className="min-h-screen pt-24 px-6 flex items-center justify-center">
                <div className="text-center md:max-w-md mx-auto p-10 border border-dashed border-slate-800 rounded-3xl bg-slate-900/50">
                    <h1 className="text-3xl font-bold text-white mb-4">Become a Creator</h1>
                    <p className="text-slate-400 mb-8">Register your profile to start uploading content and earning from subscriptions.</p>
                    <Link href="/upload" className="inline-block px-8 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold hover:opacity-90 transition-opacity">
                        Register Now
                    </Link>
                </div>
            </div>
        );
    }

    const name = (creatorData as any)[0];
    const subscriptionPrice = (creatorData as any)[3];
    const subscriberCount = (creatorData as any)[4];
    const totalEarnings = (creatorData as any)[5];

    // Filter My Content
    const myContent = allContent
        ? (allContent as any[]).filter((c: any) => c.creatorAddress === address)
        : [];

    return (
        <div className="min-h-screen pt-24 pb-20 px-6 md:px-12 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-6">
                <div>
                    <h1 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 mb-2">
                        Creator Dashboard
                    </h1>
                    <p className="text-slate-400 text-lg">Welcome back, <span className="text-white font-semibold">{name}</span></p>
                </div>
                <Link
                    href="/upload"
                    className="flex items-center gap-2 px-6 py-3 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 hover:bg-cyan-500/20 transition-all font-bold"
                >
                    <Upload size={18} />
                    <span>Upload Content</span>
                </Link>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {/* Earnings */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-green-500/20 flex items-center justify-center text-green-400">
                            <DollarSign size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-300">Total Earnings</h3>
                    </div>
                    <p className="text-4xl font-black text-white">{formatCurrency(totalEarnings)} <span className="text-lg text-slate-500 font-medium">ETH</span></p>
                </motion.div>

                {/* Subscribers */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <Users size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-300">Subscribers</h3>
                    </div>
                    <p className="text-4xl font-black text-white">{subscriberCount.toString()}</p>
                </motion.div>

                {/* Content Count */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="p-6 rounded-3xl bg-slate-900/50 border border-slate-800 backdrop-blur-sm"
                >
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                            <Video size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-slate-300">Total Content</h3>
                    </div>
                    <p className="text-4xl font-black text-white">{myContent.length}</p>
                </motion.div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Settings Column */}
                <div className="lg:col-span-1">
                    <div className="p-8 rounded-3xl bg-slate-900/30 border border-slate-800">
                        <div className="flex items-center gap-3 mb-6">
                            <Settings className="text-cyan-400" />
                            <h2 className="text-xl font-bold text-white">Subscription Settings</h2>
                        </div>

                        <div className="mb-6">
                            <label className="block text-slate-400 text-sm font-bold mb-2">Current Monthly Price</label>
                            <div className="text-2xl font-bold text-white mb-1">{formatCurrency(subscriptionPrice)} ETH</div>
                            <p className="text-xs text-slate-500">Approx. ${(parseFloat(formatEther(subscriptionPrice)) * 2500).toFixed(2)} USD</p>
                        </div>

                        <form onSubmit={handleUpdatePrice}>
                            <div className="mb-4">
                                <label className="block text-slate-400 text-sm font-bold mb-2">Update Price (ETH)</label>
                                <input
                                    type="number"
                                    step="0.0001"
                                    placeholder="0.001"
                                    value={newPrice}
                                    onChange={(e) => setNewPrice(e.target.value)}
                                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors"
                                />
                            </div>
                            <button
                                type="submit"
                                disabled={isUpdating || !newPrice}
                                className="w-full py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isUpdating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Update Price'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* Content Column */}
                <div className="lg:col-span-2">
                    <div className="p-8 rounded-3xl bg-slate-900/30 border border-slate-800 min-h-[400px]">
                        <h2 className="text-xl font-bold text-white mb-6">Your Content</h2>

                        {isLoadingContent ? (
                            <div className="flex justify-center p-12">
                                <Loader2 className="w-8 h-8 text-slate-600 animate-spin" />
                            </div>
                        ) : myContent.length > 0 ? (
                            <div className="space-y-4">
                                {myContent.map((item: any) => (
                                    <div key={item.id.toString()} className="flex items-center gap-4 p-4 rounded-2xl bg-black/40 border border-slate-800/50 hover:border-cyan-500/30 transition-colors">
                                        <div className="w-12 h-12 rounded-xl bg-slate-800/50 flex-shrink-0 flex items-center justify-center">
                                            <Video size={20} className="text-slate-500" />
                                        </div>
                                        <div className="flex-grow">
                                            <h3 className="text-white font-bold truncate">Content #{item.id.toString()}</h3>
                                            <p className="text-xs text-slate-500">{item.isFree ? 'Free' : 'Premium'}</p>
                                        </div>
                                        <Link href={`/creators/${address}`} className="text-sm font-bold text-cyan-400 hover:underline">
                                            View
                                        </Link>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-20">
                                <p className="text-slate-500 mb-4">You haven't uploaded any content yet.</p>
                                <Link href="/upload" className="text-cyan-400 hover:text-cyan-300 font-bold">
                                    Upload First Video
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
