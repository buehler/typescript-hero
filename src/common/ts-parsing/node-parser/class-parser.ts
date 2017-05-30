import {
    isArrayBindingPattern,
    isConstructorDeclaration,
    isIdentifier,
    isMethodDeclaration,
    isObjectBindingPattern,
    isPropertyDeclaration
} from '../../type-guards';
import {
    ClassDeclaration as TshClass,
    ConstructorDeclaration as TshConstructor,
    DefaultDeclaration as TshDefault,
    MethodDeclaration as TshMethod,
    ParameterDeclaration as TshParameter,
    PropertyDeclaration as TshProperty
} from '../declarations';
import { Resource } from '../resources';
import { parseFunctionParts, parseMethodParams } from './function-parser';
import { parseIdentifier } from './identifier-parser';
import {
    getDefaultResourceIdentifier,
    getNodeType,
    getNodeVisibility,
    isNodeDefaultExported,
    isNodeExported
} from './parse-utilities';
import {
    ArrayBindingPattern,
    BindingElement,
    ClassDeclaration,
    ConstructorDeclaration,
    Identifier,
    Node,
    ObjectBindingPattern,
    SyntaxKind
} from 'typescript';

/**
 * Parses the identifiers of a class (usages).
 * 
 * @export
 * @param {Resource} tsResource
 * @param {Node} node
 */
export function parseClassIdentifiers(tsResource: Resource, node: Node): void {
    for (let child of node.getChildren()) {
        switch (child.kind) {
            case SyntaxKind.Identifier:
                parseIdentifier(tsResource, <Identifier>child);
                break;
            default:
                break;
        }
        parseClassIdentifiers(tsResource, child);
    }
}

/**
 * Parse information about a constructor. Contains parameters and used modifiers
 * (i.e. constructor(private name: string)).
 * 
 * @export
 * @param {TshClass} parent
 * @param {TshConstructor} ctor
 * @param {ConstructorDeclaration} node
 */
export function parseCtorParams(
    parent: TshClass,
    ctor: TshConstructor,
    node: ConstructorDeclaration
): void {
    if (!node.parameters) {
        return;
    }
    node.parameters.forEach(o => {
        if (isIdentifier(o.name)) {
            ctor.parameters.push(
                new TshParameter(
                    (o.name as Identifier).text, getNodeType(o.type), o.getStart(), o.getEnd()
                )
            );
            if (!o.modifiers) {
                return;
            }
            parent.properties.push(
                new TshProperty(
                    (o.name as Identifier).text,
                    getNodeVisibility(o),
                    getNodeType(o.type),
                    o.getStart(),
                    o.getEnd()
                )
            );
        } else if (isObjectBindingPattern(o.name) || isArrayBindingPattern(o.name)) {
            const identifiers = o.name as ObjectBindingPattern | ArrayBindingPattern,
                elements = [...identifiers.elements];
            ctor.parameters = ctor.parameters.concat(<TshParameter[]>elements.map((bind: BindingElement) => {
                if (isIdentifier(bind.name)) {
                    return new TshParameter(
                        (bind.name as Identifier).text, undefined, bind.getStart(), bind.getEnd()
                    );
                }
            }).filter(Boolean));
        }
    });
}

/**
 * Parses a class node into its declaration. Calculates the properties, constructors and methods of the class.
 * 
 * @export
 * @param {Resource} tsResource
 * @param {ClassDeclaration} node
 */
export function parseClass(tsResource: Resource, node: ClassDeclaration): void {
    const name = node.name ? node.name.text : getDefaultResourceIdentifier(tsResource),
        classDeclaration = new TshClass(name, isNodeExported(node), node.getStart(), node.getEnd());

    if (isNodeDefaultExported(node)) {
        classDeclaration.isExported = false;
        tsResource.declarations.push(new TshDefault(classDeclaration.name, tsResource));
    }

    if (node.members) {
        node.members.forEach(o => {
            if (isPropertyDeclaration(o)) {
                const actualCount = classDeclaration.properties.length;
                if (o.modifiers) {
                    classDeclaration.properties.push(
                        new TshProperty(
                            (o.name as Identifier).text,
                            getNodeVisibility(o),
                            getNodeType(o.type),
                            o.getStart(),
                            o.getEnd()
                        )
                    );
                }
                if (actualCount === classDeclaration.properties.length) {
                    classDeclaration.properties.push(
                        new TshProperty(
                            (o.name as Identifier).text,
                            getNodeVisibility(o),
                            getNodeType(o.type),
                            o.getStart(),
                            o.getEnd()
                        )
                    );
                }
                return;
            }

            if (isConstructorDeclaration(o)) {
                const ctor = new TshConstructor(classDeclaration.name, o.getStart(), o.getEnd());
                parseCtorParams(classDeclaration, ctor, o);
                classDeclaration.ctor = ctor;
                parseFunctionParts(tsResource, ctor, o);
            } else if (isMethodDeclaration(o)) {
                let method = new TshMethod(
                    (o.name as Identifier).text,
                    o.modifiers !== undefined && o.modifiers.some(m => m.kind === SyntaxKind.AbstractKeyword),
                    getNodeVisibility(o),
                    getNodeType(o.type),
                    o.getStart(),
                    o.getEnd()
                );
                method.parameters = parseMethodParams(o);
                classDeclaration.methods.push(method);
                parseFunctionParts(tsResource, method, o);
            }
        });
    }

    parseClassIdentifiers(tsResource, node);

    tsResource.declarations.push(classDeclaration);
}
