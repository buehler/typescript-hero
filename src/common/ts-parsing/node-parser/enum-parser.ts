import { isNodeExported } from './parse-utilities';
import { Resource } from '../resources';
import { EnumDeclaration } from 'typescript';
import { EnumDeclaration as TshEnum } from '../declarations';

/**
 * Parses an enum node into the declaration.
 * 
 * @export
 * @param {resource} resource
 * @param {EnumDeclaration} node
 */
export function parseEnum(resource: Resource, node: EnumDeclaration): void {
    const declaration = new TshEnum(
        node.name.text, isNodeExported(node), node.getStart(), node.getEnd(),
    );
    declaration.members = node.members.map(o => o.name.getText());
    resource.declarations.push(declaration);
}
