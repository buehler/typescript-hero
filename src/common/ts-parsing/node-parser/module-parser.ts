import { Module, Namespace, Resource } from '../resources';
import { Identifier, ModuleDeclaration, NodeFlags } from 'typescript';

/**
 * Parse a module to its declaration. Create a new namespace or module declaration and return it to
 * be used as the new "container".
 * 
 * @export
 * @param {Resource} resource
 * @param {ModuleDeclaration} node
 * @returns {Resource}
 */
export function parseModule(resource: Resource, node: ModuleDeclaration): Resource {
    const newResource = (node.flags & NodeFlags.Namespace) === NodeFlags.Namespace ?
        new Namespace((node.name as Identifier).text, node.getStart(), node.getEnd()) :
        new Module((node.name as Identifier).text, node.getStart(), node.getEnd());
    resource.resources.push(newResource);
    return newResource;
}
