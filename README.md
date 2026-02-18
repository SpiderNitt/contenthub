# ContentHub

A decentralized content marketplace on Base Sepolia where creators upload encrypted videos and viewers pay with USDC to access them.

Creators register channels, set subscription/rental/purchase prices in USDC, and upload content encrypted via Lighthouse. Viewers pay through the x402 protocol (HTTP 402 challenge-response) to subscribe, rent (24h), or buy (lifetime) access. Only paid viewers can decrypt and watch premium content.

## How It Works

1. **Creator registers** a channel on-chain via the `CreatorHub` contract
2. **Creator uploads** content — premium content is encrypted client-side with Lighthouse, free content goes directly to IPFS
3. **Viewer requests** access — API returns HTTP 402 with USDC payment metadata
4. **Viewer pays** — frontend approves USDC and calls the contract (subscribe/rent/buy)
5. **Viewer proves payment** — sends `X-PAYMENT: <txHash>` header, server verifies on-chain
6. **Viewer decrypts** — Lighthouse token-gated decryption unlocks the content

All payments use ERC-20 `transferFrom` (USDC on Base Sepolia). No native ETH payments.

## Project Structure

```
contenthub/
├── contracts/                    # Foundry smart contracts
│   ├── src/CreatorHub.sol        # Main contract (channels, content, payments)
│   ├── test/CreatorHub.t.sol     # 20 tests with MockUSDC
│   └── script/DeployHub.s.sol    # Deployment script
└── frontend/                     # Next.js 15 application
    ├── src/app/
    │   ├── api/x402/             # x402 payment endpoints (subscribe, content)
    │   ├── api/upload/           # Upload routes (key, proxy)
    │   ├── api/content/          # Content authorization
    │   ├── upload/               # Creator upload page
    │   ├── content/[id]/         # Viewer page (pay, decrypt, watch)
    │   ├── creators/[address]/   # Creator profile (subscribe)
    │   ├── dashboard/            # Creator dashboard
    │   └── explore/              # Browse content
    ├── src/hooks/
    │   ├── useX402.ts            # x402 payment hook (approve, call, prove)
    │   └── useSubscription.ts    # Subscription status check
    ├── src/lib/
    │   ├── auth.ts               # Privy auth + wallet ownership verification
    │   ├── lighthouse.ts         # Encrypted upload + token-gated decryption
    │   └── subscription.ts       # On-chain access checks
    └── src/config/
        ├── constants.ts          # Contract address, USDC config, ABI
        └── CreatorHub.json       # Contract ABI
```

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, Tailwind CSS v4, Framer Motion |
| Contracts | Foundry, Solidity ^0.8.30 |
| Payments | x402 protocol, USDC (ERC-20) |
| Auth | Privy (wallet ownership verification) |
| Storage | Lighthouse (IPFS, encrypted uploads) |
| Network | Base Sepolia (Chain ID 84532) |

## Quick Start

### Prerequisites

- Node.js 18+
- Foundry (`curl -L https://foundry.paradigm.xyz | bash`)
- Wallet with Base Sepolia ETH and USDC

### Contracts

```bash
cd contracts
forge install
forge test
```

To deploy:

```bash
PRIVATE_KEY=<key> USDC_TOKEN=0x036CbD53842c5426634e7929541eC2318f3dCF7e \
  forge script script/DeployHub.s.sol --rpc-url https://sepolia.base.org --broadcast
```

### Frontend

```bash
cd frontend
cp .env.example .env.local  # Configure Privy + Lighthouse keys
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Environment Variables

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_PRIVY_APP_ID` | Privy application ID |
| `PRIVY_APP_SECRET` | Privy server-side secret |
| `NEXT_PUBLIC_LIGHTHOUSE_API_KEY` | Lighthouse API key for uploads |
| `NEXT_PUBLIC_IPFS_GATEWAY` | IPFS gateway URL |

## Deployed Contracts

| Contract | Address (Base Sepolia) |
|----------|------------------------|
| CreatorHub | [`0xCfd96d36B8A493478903cdCB971052A786E4ff40`](https://sepolia.basescan.org/address/0xCfd96d36B8A493478903cdCB971052A786E4ff40) |
| USDC (Testnet) | [`0x036CbD53842c5426634e7929541eC2318f3dCF7e`](https://sepolia.basescan.org/address/0x036CbD53842c5426634e7929541eC2318f3dCF7e) |

## x402 Payment Flow

```
Client                          Server                         Chain
  |                                |                              |
  |-- POST /api/x402/content ---->|                              |
  |<-- 402 + USDC metadata -------|                              |
  |                                |                              |
  |-- approve(USDC, amount) ----->|                              |-->
  |-- rentContent(id) ----------->|                              |-->
  |                                |                              |
  |-- POST + X-PAYMENT: txHash -->|                              |
  |                                |-- verify on-chain ---------->|
  |<-- 200 + decryption access ---|                              |
```

## License

MIT
