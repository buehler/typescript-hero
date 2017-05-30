import {
    isExternalModuleReference,
    isImportDeclaration,
    isNamedImports,
    isNamespaceImport,
    isStringLiteral,
} from '../../type-guards';
import { DefaultImport, ExternalModuleImport, NamedImport, NamespaceImport, StringImport } from '../imports';
import { Resource } from '../resources';
import { SymbolSpecifier } from '../SymbolSpecifier';
import {
    ExternalModuleReference,
    Identifier,
    ImportDeclaration,
    ImportEqualsDeclaration,
    NamedImports,
    NamespaceImport as TsNamespaceImport,
    StringLiteral,
} from 'typescript';

/**
 * Parses an import node into the declaration.
 * 
 * @export
 * @param {Resource} resource
 * @param {(ImportDeclaration | ImportEqualsDeclaration)} node
 */
export function parseImport(resource: Resource, node: ImportDeclaration | ImportEqualsDeclaration): void {
    if (isImportDeclaration(node)) {
        if (node.importClause && isNamespaceImport(node.importClause.namedBindings)) {
            const lib = node.moduleSpecifier as StringLiteral;
            const alias = (node.importClause.namedBindings as TsNamespaceImport).name as Identifier;

            resource.imports.push(new NamespaceImport(lib.text, alias.text, node.getStart(), node.getEnd()));
        } else if (node.importClause && isNamedImports(node.importClause.namedBindings)) {
            const lib = node.moduleSpecifier as StringLiteral;
            const bindings = node.importClause.namedBindings as NamedImports;
            const tsImport = new NamedImport(lib.text, node.getStart(), node.getEnd());

            tsImport.specifiers = bindings.elements.map(
                o => o.propertyName && o.name ?
                    new SymbolSpecifier(o.propertyName.text, o.name.text) :
                    new SymbolSpecifier(o.name.text),
            );

            resource.imports.push(tsImport);
        } else if (node.importClause && node.importClause.name) {
            const lib = node.moduleSpecifier as StringLiteral;
            const alias = node.importClause.name;

            resource.imports.push(new DefaultImport(lib.text, alias.text, node.getStart(), node.getEnd()));
        } else if (node.moduleSpecifier && isStringLiteral(node.moduleSpecifier)) {
            const lib = node.moduleSpecifier as StringLiteral;
            resource.imports.push(new StringImport(lib.text, node.getStart(), node.getEnd()));
        }
    } else if (isExternalModuleReference(node.moduleReference)) {
        const alias = node.name;
        const lib = (node.moduleReference as ExternalModuleReference).expression as Identifier;

        resource.imports.push(new ExternalModuleImport(lib.text, alias.text, node.getStart(), node.getEnd()));
    }
}
