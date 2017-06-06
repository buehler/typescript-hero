import { platform } from 'os';

/**
 * Returns a normalized version of the a path uri. Removes a "file://" or "file:///" prefix and removes semicolons.
 * 
 * @export
 * @param {string} uri 
 * @returns {string} 
 */
export function normalizePathUri(uri: string): string {
    const decoded = decodeURIComponent(uri);

    if (platform() === 'win32') {
        return decoded.replace('file:///', '');
    }
    return decoded.replace('file://', '');
}
