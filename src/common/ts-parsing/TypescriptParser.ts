import { parseEnum, parseExport, parseImport } from './node-parser';
import { File, Resource } from './resources';
import { readFileSync } from 'fs';
import { injectable } from 'inversify';
import {
    createSourceFile,
    EnumDeclaration,
    ExportAssignment,
    ExportDeclaration,
    ImportDeclaration,
    ImportEqualsDeclaration,
    Node,
    ScriptTarget,
    SourceFile,
    SyntaxKind
} from 'typescript';

/**
 * Magic.happens('here');
 * This class is the parser of the whole extension. It uses the typescript compiler to parse a file or given
 * source code into the token stream and therefore into the AST of the source. Afterwards an array of
 * resources is generated and returned.
 * 
 * @export
 * @class TypescriptParser
 */
@injectable()
export class TypescriptParser {
    /**
     * Parses the given source into an anonymous File resource.
     * Mainly used to parse source code of a document.
     * 
     * @param {string} source
     * @returns {Promise<File>}
     * 
     * @memberOf TsResourceParser
     */
    public async parseSource(source: string): Promise<File> {
        return await this.parseTypescript(createSourceFile('inline.ts', source, ScriptTarget.ES2015, true), '/');
    }

    /**
     * Parses a single file into a parsed file.
     * 
     * @param {string} filePath
     * @param {string} rootPath
     * @returns {Promise<File>}
     * 
     * @memberOf TsResourceParser
     */
    public async parseFile(filePath: string, rootPath: string): Promise<File> {
        let parse = await this.parseFiles([filePath], rootPath);
        return parse[0];
    }

    /**
     * Parses multiple files into parsed files.
     * 
     * @param {string[]} filePathes
     * @param {string} rootPath
     * @returns {Promise<File[]>}
     * 
     * @memberOf TsResourceParser
     */
    public async parseFiles(filePathes: string[], rootPath: string): Promise<File[]> {
        return filePathes
            .map(o => createSourceFile(o, readFileSync(o).toString(), ScriptTarget.ES2015, true))
            .map(o => this.parseTypescript(o, rootPath));
    }

    /**
     * Parses the typescript source into the file instance. Calls .parse afterwards to
     * get the declarations and other information about the source.
     * 
     * @private
     * @param {SourceFile} source
     * @param {string} rootPath
     * @returns {TsFile}
     * 
     * @memberOf TsResourceParser
     */
    private parseTypescript(source: SourceFile, rootPath: string): File {
        const file = new File(source.fileName, rootPath, source.getStart(), source.getEnd());
        const syntaxList = source.getChildAt(0);
        
        this.parse(file, syntaxList);

        return file;
    }

    /**
     * Recursive function that runs through the AST of a source and parses the nodes.
     * Creates the class / function / etc declarations and instanciates a new module / namespace
     * resource if needed.
     * 
     * @private
     * @param {Resource} resource
     * @param {Node} node
     * 
     * @memberOf TsResourceParser
     */
    private parse(resource: Resource, node: Node): void {
        for (let child of node.getChildren()) {
            switch (child.kind) {
                case SyntaxKind.ImportDeclaration:
                case SyntaxKind.ImportEqualsDeclaration:
                    parseImport(resource, <ImportDeclaration | ImportEqualsDeclaration>child);
                    break;
                case SyntaxKind.ExportDeclaration:
                case SyntaxKind.ExportAssignment:
                    parseExport(resource, <ExportAssignment | ExportDeclaration>child);
                    break;
                case SyntaxKind.EnumDeclaration:
                    parseEnum(resource, <EnumDeclaration>child);
                    break;
                // case SyntaxKind.TypeAliasDeclaration:
                //     this.parseTypeAlias(tsResource, <TypeAliasDeclaration>child);
                //     break;
                // case SyntaxKind.FunctionDeclaration:
                //     this.parseFunction(tsResource, <FunctionDeclaration>child);
                //     continue;
                // case SyntaxKind.VariableStatement:
                //     this.parseVariable(tsResource, <VariableStatement>child);
                //     break;
                // case SyntaxKind.InterfaceDeclaration:
                //     this.parseInterface(tsResource, <InterfaceDeclaration>child);
                //     break;
                // case SyntaxKind.ClassDeclaration:
                //     this.parseClass(tsResource, <ClassDeclaration>child);
                //     continue;
                // case SyntaxKind.Identifier:
                //     this.parseIdentifier(tsResource, <Identifier>child);
                //     break;
                // case SyntaxKind.ModuleDeclaration:
                //     let resource = this.parseModule(tsResource, <ModuleDeclaration>child);
                //     this.parse(resource, child, cancellationToken);
                //     continue;
                default:
                    break;
            }
            this.parse(resource, child);
        }
    }
}
