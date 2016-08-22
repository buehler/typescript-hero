import {ArrayBindingPattern, ExportDeclaration, ExternalModuleReference, FunctionDeclaration, Identifier, ImportDeclaration, ImportEqualsDeclaration, NamedExports, NamedImports, NamespaceImport, Node, ObjectBindingPattern, StringLiteral, SyntaxKind} from 'typescript';

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

export function isNamedExports(node: Node): node is NamedExports {
    return node && node.kind === SyntaxKind.NamedExports;
}

export function isStringLiteral(node: Node): node is StringLiteral {
    return node && node.kind === SyntaxKind.StringLiteral;
}

export function isIdentifier(node: Node): node is Identifier {
    return node && node.kind === SyntaxKind.Identifier;
}

export function isExternalModuleReference(node: Node): node is ExternalModuleReference {
    return node && node.kind === SyntaxKind.ExternalModuleReference;
}

export function isExportDeclaration(node: Node): node is ExportDeclaration {
    return node && node.kind === SyntaxKind.ExportDeclaration;
}

export function isObjectBindingPattern(node: Node): node is ObjectBindingPattern {
    return node && node.kind === SyntaxKind.ObjectBindingPattern;
}

export function isArrayBindingPattern(node: Node): node is ArrayBindingPattern {
    return node && node.kind === SyntaxKind.ArrayBindingPattern;
}

export function isFunctionDeclaration(node: Node): node is FunctionDeclaration {
    return node && node.kind === SyntaxKind.FunctionDeclaration;
}
