import lighthouse from '@lighthouse-web3/sdk';
import kavach from '@lighthouse-web3/kavach';

/**
 * Lighthouse Storage Client
 * Handles file uploads to IPFS via Lighthouse
 */

export interface UploadResult {
    success: boolean;
    cid?: string;
    error?: string;
}

interface EthereumProvider {
    request(args: { method: string; params?: readonly unknown[] }): Promise<unknown>;
}

interface LighthouseAuthMessage {
    message: string;
}

interface LighthouseUploadEntry {
    Hash?: string;
    hash?: string;
    cid?: string;
}

interface LighthouseEncryptedUploadResponse {
    data?: LighthouseUploadEntry[];
}

/**
 * Upload a file to Lighthouse/IPFS
 * @param file - File to upload
 * @param apiKey - Lighthouse API key
 * @returns Upload result with CID
 */
export async function uploadToLighthouse(
    file: File,
    apiKey: string
): Promise<UploadResult> {
    try {
        if (!apiKey) {
            throw new Error('Lighthouse API key is required');
        }

        // Upload file to Lighthouse
        const output = await lighthouse.upload([file], apiKey);

        if (!output || !output.data || !output.data.Hash) {
            throw new Error('Upload failed - no CID returned');
        }

        return {
            success: true,
            cid: output.data.Hash
        };
    } catch (error) {
        console.error('Lighthouse upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
}

export async function getLighthouseAuthMessage(publicKey: string): Promise<LighthouseAuthMessage> {
    return lighthouse.getAuthMessage(publicKey).catch(() => kavach.getAuthMessage(publicKey));
}

export async function signLighthouseAuthMessage(
    provider: EthereumProvider,
    walletAddress: string
): Promise<string> {
    const authMessage = await getLighthouseAuthMessage(walletAddress);
    const signed = await provider.request({
        method: 'personal_sign',
        params: [authMessage.message, walletAddress]
    });

    if (typeof signed !== 'string' || signed.length === 0) {
        throw new Error('Failed to sign Lighthouse auth message');
    }

    return signed;
}

export function extractLighthouseCid(output: LighthouseEncryptedUploadResponse): string {
    const cid = output?.data?.[0]?.Hash ?? output?.data?.[0]?.hash ?? output?.data?.[0]?.cid;
    if (!cid) {
        throw new Error('Upload failed - no CID returned');
    }
    return cid;
}

export async function uploadEncryptedToLighthouse(
    file: File,
    apiKey: string,
    walletAddress: string,
    signedMessage: string
): Promise<string> {
    const output = await lighthouse.uploadEncrypted(file, apiKey, walletAddress, signedMessage);
    return extractLighthouseCid(output as LighthouseEncryptedUploadResponse);
}

export async function fetchLighthouseEncryptionKey(
    cid: string,
    walletAddress: string,
    signedMessage: string
): Promise<string> {
    const response = await lighthouse.fetchEncryptionKey(cid, walletAddress, signedMessage);
    const key = response?.data?.key;

    if (!key) {
        throw new Error('Failed to fetch Lighthouse encryption key');
    }

    return key;
}

export async function decryptLighthouseFile(cid: string, encryptionKey: string): Promise<Blob> {
    const output = await lighthouse.decryptFile(cid, encryptionKey);
    if (!(output instanceof Blob)) {
        throw new Error('Invalid decrypted file output');
    }
    return output;
}

/**
 * Upload multiple files (video + thumbnail) to Lighthouse
 * @param videoFile - Video file
 * @param thumbnailFile - Thumbnail image file
 * @param apiKey - Lighthouse API key
 * @returns Object with both CIDs
 */
export async function uploadVideoWithThumbnail(
    videoFile: File,
    thumbnailFile: File,
    apiKey: string
): Promise<{
    success: boolean;
    videoCID?: string;
    thumbnailCID?: string;
    error?: string;
}> {
    try {
        // Upload video
        const videoResult = await uploadToLighthouse(videoFile, apiKey);
        if (!videoResult.success) {
            throw new Error(`Video upload failed: ${videoResult.error}`);
        }

        // Upload thumbnail
        const thumbnailResult = await uploadToLighthouse(thumbnailFile, apiKey);
        if (!thumbnailResult.success) {
            throw new Error(`Thumbnail upload failed: ${thumbnailResult.error}`);
        }

        return {
            success: true,
            videoCID: videoResult.cid,
            thumbnailCID: thumbnailResult.cid
        };
    } catch (error) {
        console.error('Upload error:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Upload failed'
        };
    }
}

/**
 * Get the gateway URL for a CID
 * @param cid - IPFS CID
 * @returns Full gateway URL
 */
export function getLighthouseUrl(cid: string): string {
    return `https://gateway.lighthouse.storage/ipfs/${cid}`;
}
