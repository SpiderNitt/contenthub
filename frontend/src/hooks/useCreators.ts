import { useReadContract } from 'wagmi';
import { CREATOR_HUB_ADDRESS, CREATOR_HUB_ABI } from '@/config/constants';

export interface Creator {
    name: string;
    wallet: string;
    isRegistered: boolean;
    subscriptionPrice: bigint;
    subscriberCount: bigint;
    totalEarnings: bigint;
}

export function useCreators() {
    const { data: rawCreators, isLoading, error } = useReadContract({
        address: CREATOR_HUB_ADDRESS as `0x${string}`,
        abi: CREATOR_HUB_ABI,
        functionName: 'getAllCreators',
    });

    // Map the raw array (tuples) to objects
    // Note: viem returns objects for named structs in arrays, but tuples for single return values sometimes.
    // We use ?? to handle both object properties (preferred) and tuple indices (fallback).
    const creators: Creator[] | undefined = (rawCreators as any[])?.map((c: any) => ({
        name: c.name ?? c[0],
        wallet: c.wallet ?? c[1],
        isRegistered: c.isRegistered ?? c[2],
        subscriptionPrice: c.subscriptionPrice ?? c[3],
        subscriberCount: c.subscriberCount ?? c[4],
        totalEarnings: c.totalEarnings ?? c[5]
    }));

    return {
        creators,
        isLoading,
        error
    };
}

export function useCreator(address: string) {
    const { data: rawCreator, isLoading, error } = useReadContract({
        address: CREATOR_HUB_ADDRESS as `0x${string}`,
        abi: CREATOR_HUB_ABI,
        functionName: 'cret',
        args: [address as `0x${string}`],
    });

    let creator: Creator | undefined;
    if (rawCreator) {
        const c = rawCreator as any;
        creator = {
            name: c[0],
            wallet: c[1],
            isRegistered: c[2],
            subscriptionPrice: c[3],
            subscriberCount: c[4],
            totalEarnings: c[5]
        };
    }

    return {
        creator,
        isLoading,
        error
    };
}
