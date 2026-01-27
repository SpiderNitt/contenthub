'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { useWalletClient, useReadContract, usePublicClient } from 'wagmi';
import { Upload, X, Image as ImageIcon, Video, Loader2, Coins, UserPlus } from 'lucide-react';
import { CREATOR_HUB_ADDRESS, CREATOR_HUB_ABI, LIGHTHOUSE_API_KEY, USDC_SEPOLIA_ADDRESS } from '@/config/constants';
import lighthouse from '@lighthouse-web3/sdk';
import { parseUnits } from 'viem';
import * as Tabs from '@radix-ui/react-tabs';
import { useRouter } from 'next/navigation';

export default function UploadPage() {
    const { authenticated, login, user } = usePrivy();
    const { data: walletClient } = useWalletClient();
    const publicClient = usePublicClient();
    const router = useRouter();

    const [activeTab, setActiveTab] = useState('showcase'); // 'showcase' | 'premium'

    const [file, setFile] = useState<File | null>(null);
    const [thumbnail, setThumbnail] = useState<File | null>(null);
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [rentPrice, setRentPrice] = useState('');

    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState('');

    // Registration State
    const [channelName, setChannelName] = useState('');
    const [subPrice, setSubPrice] = useState('');
    const [registering, setRegistering] = useState(false);

    // Check if user is a creator
    const { data: creatorData, refetch: refetchCreator } = useReadContract({
        address: CREATOR_HUB_ADDRESS as `0x${string}`,
        abi: CREATOR_HUB_ABI,
        functionName: 'cret',
        args: user?.wallet?.address ? [user.wallet.address as `0x${string}`] : undefined,
        query: {
        }
    });

    // Debug: Validate Lighthouse API Key
    useEffect(() => {
        const validateKey = async () => {
            if (!LIGHTHOUSE_API_KEY) return;
            try {
                console.log('Validating Lighthouse Key:', LIGHTHOUSE_API_KEY.substring(0, 6) + '...');
                const balance = await lighthouse.getBalance(LIGHTHOUSE_API_KEY);
                console.log('Lighthouse Key Valid. Balance:', balance);
            } catch (e) {
                console.error('Lighthouse Key Validation Failed:', e);
            }
        };
        validateKey();
    }, []);

    const isRegistered = creatorData ? (creatorData as any)[2] : false; // creatorData returns tuple: [name, wallet, isRegistered, subPrice]

    const handleRegister = async () => {
        if (!channelName || !walletClient) return;
        try {
            setRegistering(true);
            const address = walletClient.account.address;

            // 1. Register Channel
            const hash = await walletClient.writeContract({
                address: CREATOR_HUB_ADDRESS as `0x${string}`,
                abi: CREATOR_HUB_ABI,
                functionName: 'registerChannel',
                args: [channelName],
                account: address
            });

            if (publicClient) {
                await publicClient.waitForTransactionReceipt({ hash });
            }

            // 2. Set Price (if provided)
            if (subPrice && parseFloat(subPrice) > 0) {
                const priceWei = parseUnits(subPrice, 18); // ETH uses 18 decimals
                const hash2 = await walletClient.writeContract({
                    address: CREATOR_HUB_ADDRESS as `0x${string}`,
                    abi: CREATOR_HUB_ABI,
                    functionName: 'setSubscriptionPrice',
                    args: [priceWei],
                    account: address
                });

                if (publicClient) {
                    await publicClient.waitForTransactionReceipt({ hash: hash2 });
                }
            }


            alert('Channel registered successfully!');
            refetchCreator();
            setRegistering(false);
        } catch (error) {
            console.error('Registration failed:', error);
            alert('Registration failed.');
            setRegistering(false);
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: 'video' | 'image') => {
        if (e.target.files && e.target.files[0]) {
            if (type === 'video') setFile(e.target.files[0]);
            else setThumbnail(e.target.files[0]);
        }
    };

    const uploadToLighthouse = async (file: File) => {
        const output = await lighthouse.upload(
            [file],
            LIGHTHOUSE_API_KEY,
            undefined,
            (progressData: any) => {
                let percentage = 0;
                if (progressData?.total && progressData?.uploaded) {
                    percentage = Math.round((progressData.uploaded / progressData.total) * 100);
                } else if (progressData?.progress) {
                    percentage = Math.round(progressData.progress); // Assuming 0-100 based on SDK behavior
                }
                setProgress(`Uploading ${file.type.split('/')[0]}: ${percentage}%`);
            }
        );
        return output.data.Hash;
    };

    const handleUpload = async () => {
        if (!file || !thumbnail || !title || !walletClient) return;

        if (!LIGHTHOUSE_API_KEY) {
            alert('Lighthouse API Key is missing. Please add NEXT_PUBLIC_LIGHTHOUSE_API_KEY to your .env file.');
            console.error('Missing LIGHTHOUSE_API_KEY');
            return;
        }

        console.log('Using Lighthouse API Key:', {
            length: LIGHTHOUSE_API_KEY.length,
            prefix: LIGHTHOUSE_API_KEY.substring(0, 4) + '...'
        });

        try {
            setUploading(true);
            setProgress('Starting upload...');

            // 1. Upload assets to IPFS
            const videoCID = await uploadToLighthouse(file);
            const thumbnailCID = await uploadToLighthouse(thumbnail);

            const address = walletClient.account.address;

            if (activeTab === 'showcase') {
                // Legacy Showcase Upload
                setProgress('Confirming transaction...');
                await walletClient.writeContract({
                    address: CREATOR_HUB_ADDRESS as `0x${string}`,
                    abi: CREATOR_HUB_ABI,
                    functionName: 'uploadVideo',
                    args: [title, videoCID, thumbnailCID],
                    account: address
                });
            } else {
                // Premium Content Upload
                setProgress('Uploading metadata...');

                // Create Metadata JSON
                const metadata = {
                    title,
                    description,
                    video: `ipfs://${videoCID}`,
                    thumbnail: `ipfs://${thumbnailCID}`,
                    contentType: 'video',
                    createdAt: Date.now()
                };

                const metadataBlob = new Blob([JSON.stringify(metadata)], { type: 'application/json' });
                const metadataFile = new File([metadataBlob], 'metadata.json');
                const metadataCID = await uploadToLighthouse(metadataFile);

                setProgress('Confirming transaction...');

                // Calculate prices (approximate for now, assuming 6 decimals for USDC)
                const fullPriceBigInt = price ? parseUnits(price, 6) : BigInt(0);
                const rentPriceBigInt = rentPrice ? parseUnits(rentPrice, 6) : BigInt(0);

                await walletClient.writeContract({
                    address: CREATOR_HUB_ADDRESS as `0x${string}`,
                    abi: CREATOR_HUB_ABI,
                    functionName: 'createContent',
                    args: [
                        0, // ContentType.VIDEO
                        metadataCID, // metadataURI (CID)
                        false, // isFree (Premium content is not free by default here)
                        fullPriceBigInt, // fullPrice
                        rentPriceBigInt, // rentedPrice
                        USDC_SEPOLIA_ADDRESS // paymentToken
                    ],
                    account: address
                });
            }

            setProgress('Success! Processing...');
            // Reset form
            setFile(null);
            setThumbnail(null);
            setTitle('');
            setDescription('');
            setPrice('');
            setRentPrice('');
            setUploading(false);
            alert('Content uploaded successfully!');

        } catch (error: any) {
            console.error('Upload failed:', error);
            alert(`Upload failed: ${error?.message || error}. See console for details.`);
            setUploading(false);
        }
    };

    if (!authenticated) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-6 text-center">
                <h1 className="text-3xl font-bold font-heading">Connect to Start Creating</h1>
                <button
                    onClick={login}
                    className="px-8 py-4 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all shadow-[0_0_20px_-5px_rgba(34,211,238,0.4)]"
                >
                    Connect Wallet
                </button>
            </div>
        );
    }

    // Show Registration Screen if not registered
    if (!isRegistered) {
        return (
            <div className="max-w-xl mx-auto py-12 px-4">
                <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm text-center space-y-8">
                    <div className="w-20 h-20 bg-cyan-500/10 rounded-full flex items-center justify-center mx-auto">
                        <UserPlus className="w-10 h-10 text-cyan-400" />
                    </div>

                    <div className="space-y-2">
                        <h1 className="text-3xl font-bold text-white">Create Your Channel</h1>
                        <p className="text-slate-400">Register on-chain to start publishing and earning.</p>
                    </div>

                    <div className="space-y-5 text-left">
                        <div>
                            <label className="text-sm font-medium text-slate-300 ml-1 mb-1 block">Channel Name</label>
                            <input
                                type="text"
                                placeholder="e.g. My Awesome Channel"
                                value={channelName}
                                onChange={(e) => setChannelName(e.target.value)}
                                className="w-full px-5 py-4 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium text-slate-300 ml-1 mb-1 block">Monthly Subscription (ETH) <span className="text-slate-500 text-xs font-normal">(Optional)</span></label>
                            <div className="relative">
                                <Coins className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                                <input
                                    type="number"
                                    placeholder="0.01"
                                    value={subPrice}
                                    onChange={(e) => setSubPrice(e.target.value)}
                                    className="w-full pl-12 pr-5 py-4 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                                />
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={handleRegister}
                        disabled={registering || !channelName}
                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${registering || !channelName
                            ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_-5px_rgba(34,211,238,0.4)]'
                            }`}
                    >
                        {registering ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                Registering...
                            </>
                        ) : 'Create Channel'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-2xl mx-auto py-12 px-4">
            <div className="mb-8 text-center space-y-2">
                <h1 className="text-3xl font-bold text-white">Upload Content</h1>
                <p className="text-slate-400">Share your creativity with the world.</p>
            </div>

            <div className="bg-slate-900/50 border border-white/5 rounded-3xl p-8 backdrop-blur-sm">
                <Tabs.Root value={activeTab} onValueChange={setActiveTab} className="mb-8">
                    <Tabs.List className="flex p-1 bg-slate-950/50 rounded-xl mb-6">
                        <Tabs.Trigger
                            value="showcase"
                            className="flex-1 py-3 text-sm font-medium rounded-lg data-[state=active]:bg-cyan-500 data-[state=active]:text-slate-950 text-slate-400 transition-all hover:text-white"
                        >
                            Free Showcase
                        </Tabs.Trigger>
                        <Tabs.Trigger
                            value="premium"
                            className="flex-1 py-3 text-sm font-medium rounded-lg data-[state=active]:bg-indigo-500 data-[state=active]:text-white text-slate-400 transition-all hover:text-white"
                        >
                            Premium Content
                        </Tabs.Trigger>
                    </Tabs.List>
                </Tabs.Root>

                <div className="space-y-6">
                    {/* File Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className={`aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${file ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                            }`}>
                            <input
                                type="file"
                                accept="video/*"
                                onChange={(e) => handleFileSelect(e, 'video')}
                                className="hidden"
                                id="video-upload"
                            />
                            <label htmlFor="video-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                                {file ? (
                                    <>
                                        <Video className="w-8 h-8 text-cyan-400 mb-2" />
                                        <span className="text-xs text-cyan-300 truncate max-w-[80%]">{file.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                        <span className="text-sm text-slate-400">Select Video</span>
                                    </>
                                )}
                            </label>
                        </div>

                        <div className={`aspect-video rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all ${thumbnail ? 'border-purple-500/50 bg-purple-500/10' : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                            }`}>
                            <input
                                type="file"
                                accept="image/*"
                                onChange={(e) => handleFileSelect(e, 'image')}
                                className="hidden"
                                id="thumb-upload"
                            />
                            <label htmlFor="thumb-upload" className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                                {thumbnail ? (
                                    <>
                                        <ImageIcon className="w-8 h-8 text-purple-400 mb-2" />
                                        <span className="text-xs text-purple-300 truncate max-w-[80%]">{thumbnail.name}</span>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                        <span className="text-sm text-slate-400">Select Cover</span>
                                    </>
                                )}
                            </label>
                        </div>
                    </div>

                    {/* Metadata Fields */}
                    <div className="space-y-4">
                        <input
                            type="text"
                            placeholder="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 transition-colors"
                        />

                        {activeTab === 'premium' && (
                            <textarea
                                placeholder="Description (Optional)"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-5 py-3 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50 transition-colors h-24 resize-none"
                            />
                        )}
                    </div>

                    {/* Premium Pricing Inputs */}
                    {activeTab === 'premium' && (
                        <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/20">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-indigo-300 ml-1">Buy Price (USDC)</label>
                                <div className="relative">
                                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={price}
                                        onChange={(e) => setPrice(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-indigo-300 ml-1">Rent Price (USDC)</label>
                                <div className="relative">
                                    <Coins className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={rentPrice}
                                        onChange={(e) => setRentPrice(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-950 border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500/50"
                                    />
                                </div>
                            </div>
                            <p className="col-span-2 text-xs text-center text-slate-500">
                                Content is encrypted and token-gated automatically.
                            </p>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        onClick={handleUpload}
                        disabled={uploading || !file || !thumbnail || !title}
                        className={`w-full py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all ${uploading
                            ? 'bg-slate-800 text-slate-400 cursor-not-allowed'
                            : activeTab === 'showcase'
                                ? 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-[0_0_20px_-5px_rgba(34,211,238,0.4)]'
                                : 'bg-indigo-500 hover:bg-indigo-400 text-white shadow-[0_0_20px_-5px_rgba(99,102,241,0.4)]'
                            }`}
                    >
                        {uploading ? (
                            <>
                                <Loader2 className="w-5 h-5 animate-spin" />
                                {progress || 'Uploading...'}
                            </>
                        ) : (
                            <>
                                {activeTab === 'showcase' ? 'Upload to Showcase' : 'Mint Premium Asset'}
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
