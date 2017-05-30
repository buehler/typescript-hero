import {
    ArrayBindingPattern,
    ConstructorDeclaration,
    ExportDeclaration,
    ExternalModuleReference,
    FunctionDeclaration,
    Identifier,
    ImportDeclaration,
    ImportEqualsDeclaration,
    MethodDeclaration,
    MethodSignature,
    NamedExports,
    NamedImports,
    NamespaceImport,
    Node,
    ObjectBindingPattern,
    PropertyDeclaration,
    PropertySignature,
    StringLiteral,
    SyntaxKind,
} from 'typescript';

/**
 * Determines if the given node is an ImportDeclaration. 
 * 
 * @export
 * @param {Node} [node]
 * @returns {node is ImportDeclaration}
 */
export function isImportDeclaration(node?: Node): node is ImportDeclaration {
    return node !== undefined && node.kind === SyntaxKind.ImportDeclaration;
}

/**
 * Determines if the given node is an ImportEqualsDeclaration.
 * 
 * @export
 * @param {Node} [node]
 * @returns {node is ImportEqualsDeclaration}
 */
export function isImportEqualsDeclaration(node?: Node): node is ImportEqualsDeclaration {
    return node !== undefined && node.kind === SyntaxKind.ImportEqualsDeclaration;
}

/**
 * Determines if the given node is a NamespaceImport.
 * 
 * @export
 * @param {Node} [node]
 * @returns {node is NamespaceImport}
 */
export function isNamespaceImport(node?: Node): node is NamespaceImport {
    return node !== undefined && node.kind === SyntaxKind.NamespaceImport;
}

/**
 * Determines if the given node are NamedImports.
 * 
 * @export
 * @param {Node} [node]
 * @returns {node is NamedImports}
 */
export function isNamedImports(node?: Node): node is NamedImports {
    return node !== undefined && node.kind === SyntaxKind.NamedImports;
}

/**
 * Determines if the given node are NamedExports.
 * 
 * @export
 * @param {Node} [node]
 * @returns {node is NamedExports}
 */
export function isNamedExports(node?: Node): node is NamedExports {
    return node !== undefined && node.kind === SyntaxKind.NamedExports;
}

/**
 * Determines if the given node is a StringLiteral.
 * 
 * @export
 * @param {Node} [node]
 * @returns {node is StringLiteral}
 */
export function isStringLiteral(node?: Node): node is StringLiteral {
    return node !== undefined && node.kind === SyntaxKind.StringLiteral;
}

/**
 * Determines if the given node is an Identifier.
 * 
 * @export
 * @param {Node} [node]
 * @returns {node is Identifier}
 */
export function isIdentifier(node?: Node): node is Identifier {
    return node !== undefined && node.kind === SyntaxKind.Identifier;
}

/**
 * Determines if the given node is an ExternalModuleReference.
 * 
 * @export
 * @param {Node} [node]
 * @returns {node is ExternalModuleReference}
 */
export function isExternalModuleReference(node?: Node): node is ExternalModuleReference {
    return node !== undefined && node.kind === SyntaxKind.ExternalModuleReference;
}

/**
 * Determines if the given node is an ExportDeclaration.
 * 
 * @export
 * @param {Node} [node]
 * @returns {node is ExportDeclaration}
 */
export function isExportDeclaration(node?: Node): node is ExportDeclaration {
    return node !== undefined && node.kind === SyntaxKind.ExportDeclaration;
}

/**
 * Determines if the given node is an ObjectBindingPattern (i.e. let {x, y} = foo).
 * 
 * @export
 * @param {Node} [node]
 * @returns {node is ObjectBindingPattern}
 */
export function isObjectBindingPattern(node?: Node): node is ObjectBindingPattern {
    return node !== undefined && node.kind === SyntaxKind.ObjectBindingPattern;
}

/**
 * Determines if the given node is an ArrayBindingPattern (i.e. let [x, y] = foo).
 * 
 * @export
 * @param {Node} [node]
 * @returns {node is ArrayBindingPattern}
 */
export function isArrayBindingPattern(node?: Node): node is ArrayBindingPattern {
    return node !== undefined && node.kind === SyntaxKind.ArrayBindingPattern;
}

/**
 * Determines if the given node is a FunctionDeclaration.
 * 
 * @export
 * @param {Node} [node]
 * @returns {node is FunctionDeclaration}
 */
export function isFunctionDeclaration(node?: Node): node is FunctionDeclaration {
    return node !== undefined && node.kind === SyntaxKind.FunctionDeclaration;
}

/**
 * Determines if the given node is a MethodSignature.
 * 
 * @export
 * @param {Node} [node]
 * @returns {node is MethodSignature}
 */
export function isMethodSignature(node?: Node): node is MethodSignature {
    return node !== undefined && node.kind === SyntaxKind.MethodSignature;
}

/**
 * Determines if the given node is a PropertySignature.
 * 
 * @export
 * @param {Node} [node]
 * @returns {node is PropertySignature}
 */
export function isPropertySignature(node?: Node): node is PropertySignature {
    return node !== undefined && node.kind === SyntaxKind.PropertySignature;
}

/**
 * Determines if the given node is a MethodDeclaration.
 * 
 * @export
 * @param {Node} [node]
 * @returns {node is MethodDeclaration}
 */
export function isMethodDeclaration(node?: Node): node is MethodDeclaration {
    return node !== undefined && node.kind === SyntaxKind.MethodDeclaration;
}

/**
 * Determines if the given node is a PropertyDeclaration.
 * 
 * @export
 * @param {Node} [node]
 * @returns {node is PropertyDeclaration}
 */
export function isPropertyDeclaration(node?: Node): node is PropertyDeclaration {
    return node !== undefined && node.kind === SyntaxKind.PropertyDeclaration;
}

/**
 * Determines if the given node is a ConstructorDeclaration.
 * 
 * @export
 * @param {Node} [node]
 * @returns {node is ConstructorDeclaration}
 */
export function isConstructorDeclaration(node?: Node): node is ConstructorDeclaration {
    return node !== undefined && node.kind === SyntaxKind.Constructor;
}
