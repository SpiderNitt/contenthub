/**
 * Formatting Utilities
 */

/**
 * Format wallet address for display (0x1234...5678)
 */
export function formatAddress(address: string, startChars: number = 6, endChars: number = 4): string {
    if (!address || address.length < startChars + endChars) {
        return address;
    }
    return `${address.slice(0, startChars)}...${address.slice(-endChars)}`;
}

/**
 * Format USDC amount from wei-like format
 */
export function formatUsdc(amount: string | bigint, decimals: number = 6): string {
    const value = typeof amount === 'string' ? BigInt(amount) : amount;
    const divisor = BigInt(10 ** decimals);
    const whole = value / divisor;
    const remainder = value % divisor;

    if (remainder === BigInt(0)) {
        return whole.toString();
    }

    const remainderStr = remainder.toString().padStart(decimals, '0');
    const trimmed = remainderStr.replace(/0+$/, '');
    return `${whole}.${trimmed}`;
}

/**
 * Format date for display
 */
export function formatDate(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    }).format(d);
}

/**
 * Format relative time (e.g., "2 days ago")
 */
export function formatRelativeTime(date: Date | string): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffSec < 60) return 'just now';
    if (diffMin < 60) return `${diffMin} minute${diffMin > 1 ? 's' : ''} ago`;
    if (diffHour < 24) return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    if (diffDay < 7) return `${diffDay} day${diffDay > 1 ? 's' : ''} ago`;
    if (diffDay < 30) return `${Math.floor(diffDay / 7)} week${Math.floor(diffDay / 7) > 1 ? 's' : ''} ago`;
    return formatDate(d);
}

/**
 * Format number with commas
 */
export function formatNumber(num: number): string {
    return new Intl.NumberFormat('en-US').format(num);
}

/**
 * Truncate text with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;
    return text.slice(0, maxLength - 3) + '...';
}
