import { AllExport, AssignedExport, NamedExport } from '../exports';
import { ImportSymbol } from '../imports';
import { Resource } from '../resources';
import { isExportDeclaration, isNamedExports, isStringLiteral } from '../TypeGuards';
import { ExportAssignment, ExportDeclaration, Identifier, StringLiteral } from 'typescript';

/**
 * Parses an export node into the declaration.
 * 
 * @export
 * @param {Resource} resource
 * @param {(ExportDeclaration | ExportAssignment)} node
 */
export function parseExport(resource: Resource, node: ExportDeclaration | ExportAssignment): void {
    if (isExportDeclaration(node)) {
        let tsExport = node as ExportDeclaration;
        if (!isStringLiteral(tsExport.moduleSpecifier)) {
            return;
        }
        if (tsExport.getText().indexOf('*') > -1) {
            resource.exports.push(
                new AllExport(
                    node.getStart(), node.getEnd(), (tsExport.moduleSpecifier as StringLiteral).text
                )
            );
        } else if (tsExport.exportClause && isNamedExports(tsExport.exportClause)) {
            let lib = tsExport.moduleSpecifier as StringLiteral,
                ex = new NamedExport(node.getStart(), node.getEnd(), lib.text);
            ex.specifiers = tsExport.exportClause.elements.map(
                o => o.propertyName && o.name ?
                    new ImportSymbol(o.propertyName.text, o.name.text) :
                    new ImportSymbol(o.name.text)
            );

            resource.exports.push(ex);
        }
    } else {
        let literal = node.expression as Identifier;
        if (node.isExportEquals) {
            resource.exports.push(new AssignedExport(node.getStart(), node.getEnd(), literal.text, resource));
        } else {
            // TODO
            // let name = (literal && literal.text) ? literal.text : getDefaultResourceIdentifier(resource);
            // resource.declarations.push(new DefaultDeclaration(name, resource));
        }
    }
}
