/**
 * Returns a normalized version of the a path uri. Removes a "file://" or "file:///" prefix and removes semicolons.
 * 
 * @export
 * @param {string} uri 
 * @returns {string} 
 */
export function normalizePathUri(uri: string): string {
    return decodeURIComponent(uri)
        .replace('file:///', '')
        .replace('file://', '');
}
