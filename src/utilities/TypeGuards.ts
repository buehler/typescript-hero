import {ImportDeclaration, ExternalModuleReference, ImportEqualsDeclaration, NamedImports, NamespaceImport, Node, StringLiteral, SyntaxKind} from 'typescript';

export function isImportDeclaration(node: Node): node is ImportDeclaration {
    return node && node.kind === SyntaxKind.ImportDeclaration;
}

export function isImportEqualsDeclaration(node: Node): node is ImportEqualsDeclaration {
    return node && node.kind === SyntaxKind.ImportEqualsDeclaration;
}

export function isNamespaceImport(node: Node): node is NamespaceImport {
    return node && node.kind === SyntaxKind.NamespaceImport;
}

export function isNamedImports(node: Node): node is NamedImports {
    return node && node.kind === SyntaxKind.NamedImports;
}

export function isStringLiteral(node: Node): node is StringLiteral {
    return node && node.kind === SyntaxKind.StringLiteral;
}

export function isExternalModuleReference(node: Node): node is ExternalModuleReference {
    return node && node.kind === SyntaxKind.ExternalModuleReference;
}
