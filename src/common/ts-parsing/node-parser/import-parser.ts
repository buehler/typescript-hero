import { DefaultImport, ExternalModuleImport, NamedImport, NamespaceImport, StringImport } from '../imports';
import { Resource } from '../resources';
import {
    isExternalModuleReference,
    isImportDeclaration,
    isNamedImports,
    isNamespaceImport,
    isStringLiteral
} from '../TypeGuards';
import {
    ExternalModuleReference,
    Identifier,
    ImportDeclaration,
    ImportEqualsDeclaration,
    NamedImports,
    NamespaceImport as TsNamespaceImport,
    StringLiteral
} from 'typescript';

/**
 * Parses an import node into the declaration.
 * 
 * @export
 * @param {TsResource} tsResource
 * @param {(ImportDeclaration | ImportEqualsDeclaration)} node
 */
export function parseImport(resource: Resource, node: ImportDeclaration | ImportEqualsDeclaration): void {
    if (isImportDeclaration(node)) {
        if (node.importClause && isNamespaceImport(node.importClause.namedBindings)) {
            let lib = node.moduleSpecifier as StringLiteral,
                alias = (node.importClause.namedBindings as TsNamespaceImport).name as Identifier;
            resource.imports.push(new NamespaceImport(lib.text, alias.text, node.getStart(), node.getEnd()));
        } else if (node.importClause && isNamedImports(node.importClause.namedBindings)) {
            let lib = node.moduleSpecifier as StringLiteral,
                bindings = node.importClause.namedBindings as NamedImports,
                tsImport = new NamedImport(lib.text, node.getStart(), node.getEnd());
            tsImport.specifiers = bindings.elements.map(
                o => o.propertyName && o.name ?
                    new TsResolveSpecifier(o.propertyName.text, o.name.text) :
                    new TsResolveSpecifier(o.name.text)
            );

            resource.imports.push(tsImport);
        } else if (node.importClause && node.importClause.name) {
            let lib = node.moduleSpecifier as StringLiteral,
                alias = node.importClause.name;
            resource.imports.push(new DefaultImport(lib.text, alias.text, node.getStart(), node.getEnd()));
        } else if (node.moduleSpecifier && isStringLiteral(node.moduleSpecifier)) {
            let lib = node.moduleSpecifier as StringLiteral;
            resource.imports.push(new StringImport(lib.text, node.getStart(), node.getEnd()));
        }
    } else if (isExternalModuleReference(node.moduleReference)) {
        let alias = node.name,
            lib = (node.moduleReference as ExternalModuleReference).expression as Identifier;
        resource.imports.push(new ExternalModuleImport(lib.text, alias.text, node.getStart(), node.getEnd()));
    }
}
