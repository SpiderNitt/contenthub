# Walrus x402 Content Hub

A decentralized content marketplace where creators can upload, monetize, and share videos, articles, and audio content. Built on the Base Sepolia testnet, Walrus x402 leverages blockchain technology for secure payments and decentralized storage (Lighthouse/IPFS).

## 🚀 Key Features

*   **Decentralized Storage:** All content (videos, thumbnails, etc.) is stored on IPFS via Lighthouse, ensuring censorship resistance and permanence.
*   **Flexible Monetization:** Creators can set "Rent" (time-limited) or "Buy" (lifetime access) prices for their content.
*   **Crypto Payments:** Native integration with USDC on Base Sepolia for seamless and low-cost transactions.
*   **Wallet Authentication:** Secure login using Privy with support for various wallets (MetaMask, Coinbase Wallet, etc.).
*   **Creator Profiles:** Dedicated pages for creators to showcase their portfolio and build an audience.
*   **Paywall Protection:** Content is securely gated; access is only granted after verifying on-chain payments.

## 🛠️ Technical Stack

*   **Frontend:** Next.js 15 (React 19), Tailwind CSS v4, Framer Motion
*   **Authentication:** Privy (`@privy-io/react-auth`)
*   **Blockchain:** Viem, Wagmi
*   **Storage:** Lighthouse SDK (IPFS)
*   **Network:** Base Sepolia Testnet

## 🏁 Getting Started

### Prerequisites

*   Node.js v18+
*   npm or yarn
*   A Base Sepolia Testnet Wallet (with ETH for gas)

### Installation

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/walrus-x402.git
    cd walrus-x402
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Environment Variables:**
    Create a `.env` file in the root directory and add the following keys:
    ```env
    NEXT_PUBLIC_PRIVY_APP_ID=your_privy_app_id
    NEXT_PUBLIC_LIGHTHOUSE_API_KEY=your_lighthouse_api_key
    ```

4.  **Run the development server:**
    ```bash
    npm run dev
    ```

5.  Open [http://localhost:3000](http://localhost:3000) with your browser.

## ⛓️ Smart Contracts

The application interacts with contracts on **Base Sepolia (Chain ID: 84532)**.

*   **CreatorHub Protocol:** `0x56759064e48366772a0254b504c740f4726ade47`
*   **USDC (Testnet):** `0x036CbD53842c5426634e7929541eC2318f3dCF7e`

## 💸 USCD Faucet & Setup

Since this runs on Base Sepolia, you will need testnet USDC.
1.  **Get ETH:** [Base Sepolia Faucet](https://www.alchemy.com/faucets/base-sepolia)
2.  **Get USDC:** [Circle Faucet](https://faucet.circle.com/)
3.  **Add Token:** If "USDC" shows as "Unknown" in your wallet, look for the **"Don't see USDC? Add to Wallet"** button on the payment overlay to automatically import it.

## 🤝 Contributing

Contributions are welcome! Please fork the repo and create a pull request with your improvements.

## 📄 License

This project is licensed under the MIT License.
