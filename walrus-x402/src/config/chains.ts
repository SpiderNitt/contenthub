/**
 * Blockchain Configuration
 */

import { baseSepolia } from 'viem/chains';
import { CHAIN_ID, USDC_SEPOLIA_ADDRESS } from './constants';

export const supportedChains = [baseSepolia] as const;

export const defaultChain = baseSepolia;

export const chainConfig = {
    [CHAIN_ID]: {
        name: 'Base Sepolia',
        chain: baseSepolia,
        nativeCurrency: {
            name: 'Ethereum',
            symbol: 'ETH',
            decimals: 18,
        },
        rpcUrls: {
            default: {
                http: ['https://sepolia.base.org'],
            },
            public: {
                http: ['https://sepolia.base.org'],
            },
        },
        blockExplorers: {
            default: {
                name: 'BaseScan',
                url: 'https://sepolia.basescan.org',
            },
        },
        contracts: {
            usdc: {
                address: USDC_SEPOLIA_ADDRESS as `0x${string}`,
                decimals: 6,
            },
        },
    },
} as const;

export function getChainConfig(chainId: number) {
    return chainConfig[chainId as keyof typeof chainConfig];
}

export function getExplorerUrl(chainId: number, txHash: string): string {
    const config = getChainConfig(chainId);
    return config ? `${config.blockExplorers.default.url}/tx/${txHash}` : '';
}
