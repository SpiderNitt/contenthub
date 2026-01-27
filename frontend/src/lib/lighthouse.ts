import lighthouse from '@lighthouse-web3/sdk';

/**
 * Lighthouse Storage Client
 * Handles file uploads to IPFS via Lighthouse
 */

export interface UploadResult {
    success: boolean;
    cid?: string;
    error?: string;
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
