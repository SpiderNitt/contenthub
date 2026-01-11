# Environment Variables Template

Copy this file to `.env.local` and fill in the values.

## Authentication (Privy)
**Required for wallet connection and user authentication.**
- Get these from the [Privy Dashboard](https://dashboard.privy.io/).
```bash
NEXT_PUBLIC_PRIVY_APP_ID=
PRIVY_APP_SECRET=
```

## Storage (Lighthouse)
**Required for uploading files to IPFS/Filecoin.**
- Get API Key from [Lighthouse](https://lighthouse.storage/).
```bash
NEXT_PUBLIC_LIGHTHOUSE_API_KEY=
```

## Security
**Required for signing access tokens for premium content.**
- Generate a random 32-byte hex string (e.g., `openssl rand -hex 32`).
```bash
CONTENT_SIGNING_SECRET=
```

## Blockchain (Base Sepolia)
**Required for smart contract deployment and server-side interactions.**
- Get an RPC URL from [Alchemy](https://www.alchemy.com/) or another provider.
```bash
BASE_SEPOLIA_RPC_URL=
```

## Optional Configuration
**Contract Verification:**
- Initial API Key for BaseScan.
```bash
ETHERSCAN_API_KEY=
```

**CORS:**
- Comma-separated list of allowed origins.
```bash
ALLOWED_ORIGINS=http://localhost:3000
```
