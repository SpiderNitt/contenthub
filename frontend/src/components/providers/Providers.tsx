'use client';

import { PrivyProvider } from '@privy-io/react-auth';
import { baseSepolia } from 'viem/chains';
import { WagmiProvider, createConfig } from '@privy-io/wagmi';
import { http } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

const wagmiConfig = createConfig({
    chains: [baseSepolia],
    transports: {
        [baseSepolia.id]: http(),
    },
});

export default function Providers({ children }: { children: React.ReactNode }) {
    const envId = process.env.NEXT_PUBLIC_PRIVY_APP_ID;
    const appId = (envId && envId.length > 6) ? envId : 'clpispdty00ycl80fpueukbhl';

    return (
        <PrivyProvider
            appId={appId || ''}
            config={{
                appearance: {
                    theme: 'dark',
                    accentColor: '#22d3ee', // Cyan-400
                    showWalletLoginFirst: true,
                },
                loginMethods: ['wallet', 'email'],
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: 'users-without-wallets',
                    },
                },
                defaultChain: baseSepolia,
                supportedChains: [baseSepolia]
            }}
        >
            <QueryClientProvider client={queryClient}>
                <WagmiProvider config={wagmiConfig}>
                    {children}
                </WagmiProvider>
            </QueryClientProvider>
        </PrivyProvider>
    );
}
