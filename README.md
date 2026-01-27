# 🎥 ContentHub

**A decentralized, premium content marketplace on Base Sepolia.**

Creators monetize video content directly through smart contracts, offering **Rentals (24h access)** and **Lifetime Access**. Content is stored on IPFS (Lighthouse/Walrus) and payments are handled in ETH/USDC.

## 📁 Project Structure

```
contenthub/
├── contracts/      # Foundry smart contracts
│   ├── src/        # Solidity source files
│   ├── test/       # Contract tests
│   └── script/     # Deployment scripts
└── frontend/       # Next.js 15 application
    ├── src/app/    # App router pages
    ├── src/components/
    └── src/hooks/
```

## ✨ Features

### For Consumers
- **Crypto Payments**: Pay with ETH or USDC on Base Sepolia
- **Flexible Access**: Rent (24h) or Buy (lifetime)
- **My Library**: Dashboard for rentals and purchases
- **Wallet Auth**: Secure login via Privy

### For Creators
- **Direct Monetization**: 100% revenue to your wallet
- **On-Chain Ownership**: Catalog registered on blockchain
- **Decentralized Storage**: IPFS via Lighthouse/Walrus

## 🛠️ Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, Tailwind CSS v4, Framer Motion |
| Contracts | Foundry, Solidity ^0.8.30 |
| Auth | Privy |
| Storage | Lighthouse (IPFS) |
| Network | Base Sepolia |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- Foundry (`curl -L https://foundry.paradigm.xyz | bash`)
- Web3 Wallet with Base Sepolia ETH

### Contracts

```bash
cd contracts
forge install
forge test
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## ⛓️ Deployed Contracts

| Contract | Address (Base Sepolia) |
|----------|------------------------|
| CreatorHub | `0xc567c6112720d8190caa4e93086cd36e2ae01d37` |
| USDC (Testnet) | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |

## 📄 License

MIT
