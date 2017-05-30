import { isArrayBindingPattern, isIdentifier, isObjectBindingPattern } from '../../type-guards';
import {
    ConstructorDeclaration as TshConstructor,
    DefaultDeclaration as TshDefault,
    FunctionDeclaration as TshFunction,
    MethodDeclaration as TshMethod,
    ParameterDeclaration as TshParameter,
} from '../declarations';
import { Resource } from '../resources';
import { parseIdentifier } from './identifier-parser';
import { getDefaultResourceIdentifier, getNodeType, isNodeDefaultExported, isNodeExported } from './parse-utilities';
import { parseVariable } from './variable-parser';
import {
    ArrayBindingPattern,
    BindingElement,
    FunctionDeclaration,
    Identifier,
    MethodDeclaration,
    MethodSignature,
    Node,
    ObjectBindingPattern,
    ParameterDeclaration,
    SyntaxKind,
    VariableStatement,
} from 'typescript';

/**
 * Parse the parts of a function. All functions / methods contain various information about used variables
 * and parameters.
 * 
 * @export
 * @param {Resource} resource
 * @param {(TshConstructor | TshMethod | TshFunction)} parent
 * @param {Node} node
 */
export function parseFunctionParts(
    resource: Resource,
    parent: TshConstructor | TshMethod | TshFunction,
    node: Node,
): void {
    for (const child of node.getChildren()) {
        switch (child.kind) {
            case SyntaxKind.Identifier:
                parseIdentifier(resource, <Identifier>child);
                break;
            case SyntaxKind.VariableStatement:
                parseVariable(parent, <VariableStatement>child);
                break;
            default:
                break;
        }
        parseFunctionParts(resource, parent, child);
    }
}

/**
 * Parse method parameters. 
 * 
 * @export
 * @param {(FunctionDeclaration | MethodDeclaration | MethodSignature)} node
 * @returns {TshParameter[]}
 */
export function parseMethodParams(
    node: FunctionDeclaration | MethodDeclaration | MethodSignature,
): TshParameter[] {
    return node.parameters.reduce(
        (all: TshParameter[], cur: ParameterDeclaration) => {
            let params = all;
            if (isIdentifier(cur.name)) {
                params.push(new TshParameter(
                    (cur.name as Identifier).text, getNodeType(cur.type), cur.getStart(), cur.getEnd(),
                ));
            } else if (isObjectBindingPattern(cur.name) || isArrayBindingPattern(cur.name)) {
                const identifiers = cur.name as ObjectBindingPattern | ArrayBindingPattern;
                const elements = [...identifiers.elements];

                params = params.concat(<TshParameter[]>elements.map((o: BindingElement) => {
                    if (isIdentifier(o.name)) {
                        return new TshParameter(
                            (o.name as Identifier).text, undefined, o.getStart(), o.getEnd(),
                        );
                    }
                }).filter(Boolean));
            }
            return params;
        },
        [],
    );
}

/**
 * Parses a function into its declaration.
 * Parses the functions sub information like parameters and variables.
 * 
 * @export
 * @param {Resource} resource
 * @param {FunctionDeclaration} node
 */
export function parseFunction(resource: Resource, node: FunctionDeclaration): void {
    const name = node.name ? node.name.text : getDefaultResourceIdentifier(resource);
    const func = new TshFunction(
        name, isNodeExported(node), getNodeType(node.type), node.getStart(), node.getEnd(),
    );
    if (isNodeDefaultExported(node)) {
        func.isExported = false;
        resource.declarations.push(new TshDefault(func.name, resource));
    }
    func.parameters = parseMethodParams(node);
    resource.declarations.push(func);
    parseFunctionParts(resource, func, node);
}
