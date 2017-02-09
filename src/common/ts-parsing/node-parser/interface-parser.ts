import { isMethodSignature, isPropertySignature } from '../../type-guards';
import {
    DeclarationVisibility,
    DefaultDeclaration,
    InterfaceDeclaration as TshInterface,
    MethodDeclaration,
    PropertyDeclaration
} from '../declarations';
import { Resource } from '../resources';
import { parseMethodParams } from './function-parser';
import { getDefaultResourceIdentifier, getNodeType, isNodeDefaultExported, isNodeExported } from './parse-utilities';
import { Identifier, InterfaceDeclaration } from 'typescript';

/**
 * Parses an interface node into its declaration.
 * Calculates the property and method defintions of the interface as well.
 * 
 * @export
 * @param {Resource} resource
 * @param {InterfaceDeclaration} node
 */
export function parseInterface(resource: Resource, node: InterfaceDeclaration): void {
    const name = node.name ? node.name.text : getDefaultResourceIdentifier(resource),
        interfaceDeclaration = new TshInterface(
            name, isNodeExported(node), node.getStart(), node.getEnd()
        );

    if (isNodeDefaultExported(node)) {
        interfaceDeclaration.isExported = false;
        resource.declarations.push(new DefaultDeclaration(interfaceDeclaration.name, resource));
    }

    if (node.members) {
        node.members.forEach(o => {
            if (isPropertySignature(o)) {
                interfaceDeclaration.properties.push(
                    new PropertyDeclaration(
                        (o.name as Identifier).text,
                        DeclarationVisibility.Public,
                        getNodeType(o.type),
                        o.getStart(),
                        o.getEnd()
                    )
                );
            } else if (isMethodSignature(o)) {
                let method = new MethodDeclaration(
                    (o.name as Identifier).text,
                    true,
                    DeclarationVisibility.Public,
                    getNodeType(o.type),
                    o.getStart(),
                    o.getEnd()
                );
                method.parameters = parseMethodParams(o);
                interfaceDeclaration.methods.push(method);
            }
        });
    }
    resource.declarations.push(interfaceDeclaration);
}
