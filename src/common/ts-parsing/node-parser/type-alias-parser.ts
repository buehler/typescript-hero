import { TypeAliasDeclaration as TshType } from '../declarations';
import { Resource } from '../resources';
import { isNodeExported } from './parse-utilities';
import { TypeAliasDeclaration } from 'typescript';

/**
 * Parses a type alias into the declaration.
 * 
 * @export
 * @param {Resource} resource
 * @param {TypeAliasDeclaration} node
 */
export function parseTypeAlias(resource: Resource, node: TypeAliasDeclaration): void {
    resource.declarations.push(
        new TshType(node.name.text, isNodeExported(node), node.getStart(), node.getEnd())
    );
}
