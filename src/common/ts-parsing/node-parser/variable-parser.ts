import { isCallableDeclaration } from '../../type-guards';
import { CallableDeclaration, VariableDeclaration } from '../declarations';
import { Resource } from '../resources';
import { getNodeType, isNodeExported } from './parse-utilities';
import { SyntaxKind, VariableStatement } from 'typescript';

/**
 * Parse a variable. Information such as "is the variable const" are calculated here.
 * 
 * @export
 * @param {(Resource | CallableDeclaration)} parent
 * @param {VariableStatement} node
 */
export function parseVariable(parent: Resource | CallableDeclaration, node: VariableStatement): void {
    const isConst = node.declarationList.getChildren().some(o => o.kind === SyntaxKind.ConstKeyword);
    if (node.declarationList && node.declarationList.declarations) {
        node.declarationList.declarations.forEach((o) => {
            const declaration = new VariableDeclaration(
                o.name.getText(),
                isConst,
                isNodeExported(node),
                getNodeType(o.type),
                node.getStart(),
                node.getEnd(),
            );
            if (isCallableDeclaration(parent)) {
                parent.variables.push(declaration);
            } else {
                parent.declarations.push(declaration);
            }
        });
    }
}
