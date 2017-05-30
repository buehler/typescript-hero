import { Resource } from '../resources';
import { Identifier, Node, SyntaxKind } from 'typescript';

const usageNotAllowedParents = [
    SyntaxKind.ImportEqualsDeclaration,
    SyntaxKind.ImportSpecifier,
    SyntaxKind.NamespaceImport,
    SyntaxKind.ClassDeclaration,
    SyntaxKind.ImportDeclaration,
    SyntaxKind.InterfaceDeclaration,
    SyntaxKind.ExportDeclaration,
    SyntaxKind.ExportSpecifier,
    SyntaxKind.ImportSpecifier,
    SyntaxKind.FunctionDeclaration,
    SyntaxKind.EnumDeclaration,
    SyntaxKind.TypeAliasDeclaration,
    SyntaxKind.MethodDeclaration
];

const usageAllowedIfLast = [
    SyntaxKind.Parameter,
    SyntaxKind.PropertyDeclaration,
    SyntaxKind.VariableDeclaration,
    SyntaxKind.ElementAccessExpression,
    SyntaxKind.BinaryExpression
];

const usagePredicates: any = [
    (o: Node) => o.parent && usageNotAllowedParents.indexOf(o.parent.kind) === -1,
    allowedIfLastIdentifier,
    allowedIfPropertyAccessFirst
];

/**
 * Predicate function to determine if the node is possible as a "usage".
 * Checks for the node identifier to be the last of the identifier list.
 * 
 * @param {Node} node
 * @returns {boolean}
 */
function allowedIfLastIdentifier(node: Node): boolean {
    if (!node.parent) {
        return false;
    }

    if (usageAllowedIfLast.indexOf(node.parent.kind) === -1) {
        return true;
    }

    let children = node.parent.getChildren().filter(o => o.kind === SyntaxKind.Identifier);
    return children.length === 1 || children.indexOf(node) === 1;
}

/**
 * Predicate function to determine if the node is possible as a "usage".
 * Checks if the identifier is on the lefthand side of a property access.
 * 
 * @param {Node} node
 * @returns {boolean}
 */
function allowedIfPropertyAccessFirst(node: Node): boolean {
    if (!node.parent) {
        return false;
    }

    if (node.parent.kind !== SyntaxKind.PropertyAccessExpression) {
        return true;
    }

    let children = node.parent.getChildren();
    return children.indexOf(node) === 0;
}

/**
 * Parses an identifier into a usage of a resource if the predicates are true.
 * 
 * @export
 * @param {Resource} resource
 * @param {Identifier} node
 */
export function parseIdentifier(resource: Resource, node: Identifier): void {
    if (node.parent && usagePredicates.every(predicate => predicate(node))) {
        if (resource.usages.indexOf(node.text) === -1) {
            resource.usages.push(node.text);
        }
    }
}
