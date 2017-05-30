/**
 * Returns the visibility string for a given enum value.
 * 
 * @param {DeclarationVisibility} [visibility]
 * @returns {string}
 */
export function getVisibilityText(visibility?: DeclarationVisibility): string {
    switch (visibility) {
        case DeclarationVisibility.Private:
            return 'private';
        case DeclarationVisibility.Public:
            return 'public';
        case DeclarationVisibility.Protected:
            return 'protected';
        default:
            return '';
    }
}

/**
 * Visibility of a class or interface property, as well as a method.
 * 
 * @export
 * @enum {number}
 */
export const enum DeclarationVisibility {
    Private,
    Protected,
    Public,
}
