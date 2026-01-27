import { createPublicClient, http } from 'viem';
import { baseSepolia } from 'viem/chains';

const TX_HASH = '0x709008fff982090320b8567b2b10500e60eaf081878fecee65c6461a88e36e5a';

async function main() {
    const client = createPublicClient({
        chain: baseSepolia,
        transport: http()
    });

    console.log(`Checking transaction: ${TX_HASH} on Base Sepolia`);

    try {
        const tx = await client.getTransaction({
            hash: TX_HASH
        });

        console.log('\n--- Transaction Details ---');
        console.log(`Hash: ${tx.hash}`);
        console.log(`From: ${tx.from}`);
        console.log(`To: ${tx.to}`);
        console.log(`Value: ${tx.value.toString()} wei`);
        console.log(`Data: ${tx.input}`);
        console.log(`Block Number: ${tx.blockNumber}`);

        const receipt = await client.getTransactionReceipt({ hash: TX_HASH });
        console.log(`Status: ${receipt.status}`);

    } catch (error) {
        console.error('Error fetching transaction:', error);
    }
}

main();
