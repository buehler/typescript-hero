import { injectable } from 'inversify';

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
    
    
    
    // /**
    //  * Parses the given source into an anonymous TsFile resource.
    //  * Mainly used to parse source code of a document.
    //  * 
    //  * @param {string} source
    //  * @returns {Promise<TsFile>}
    //  * 
    //  * @memberOf TsResourceParser
    //  */
    // public async parseSource(source: string): Promise<TsFile> {
    //     return await this.parseTypescript(createSourceFile('inline.ts', source, ScriptTarget.ES2015, true));
    // }

    // /**
    //  * Parses a single file into a TsFile.
    //  * 
    //  * @param {Uri} file
    //  * @returns {Promise<TsFile>}
    //  * 
    //  * @memberOf TsResourceParser
    //  */
    // public async parseFile(file: Uri): Promise<TsFile> {
    //     let parse = await this.parseFiles([file]);
    //     if (!parse || parse.length <= 0) {
    //         throw new Error(`Could not parse file "${file.fsPath}"`);
    //     }
    //     return parse[0];
    // }

    // /**
    //  * Parses multiple files into TsFiles. Can be canceled with the token.
    //  * 
    //  * @param {Uri[]} filePathes
    //  * @param {CancellationToken} [cancellationToken]
    //  * @returns {Promise<TsFile[]>}
    //  * 
    //  * @memberOf TsResourceParser
    //  */
    // public async parseFiles(filePathes: Uri[], cancellationToken?: CancellationToken): Promise<TsFile[]> {
    //     if (cancellationToken && cancellationToken.onCancellationRequested) {
    //         this.cancelRequested();
    //         return;
    //     }

    //     try {
    //         let parsed = filePathes
    //             .map(o => createSourceFile(o.fsPath, readFileSync(o.fsPath).toString(), ScriptTarget.ES2015, true))
    //             .map(o => this.parseTypescript(o, cancellationToken));
    //         if (cancellationToken && cancellationToken.onCancellationRequested) {
    //             this.cancelRequested();
    //             return;
    //         }
    //         return parsed;
    //     } catch (e) {
    //         this.logger.error('Error happend during file parsing', { error: e });
    //     }
    // }

    // /**
    //  * Parses the typescript source into the TsFile instance. Calls .parse afterwards to
    //  * get the declarations and other information about the source.
    //  * 
    //  * @private
    //  * @param {SourceFile} source
    //  * @param {CancellationToken} [cancellationToken]
    //  * @returns {TsFile}
    //  * 
    //  * @memberOf TsResourceParser
    //  */
    // private parseTypescript(source: SourceFile, cancellationToken?: CancellationToken): TsFile {
    //     let tsFile = new TsFile(source.fileName, source.getStart(), source.getEnd());

    //     let syntaxList = source.getChildAt(0);
    //     if (cancellationToken && cancellationToken.onCancellationRequested) {
    //         this.cancelRequested();
    //         return;
    //     }
    //     this.parse(tsFile, syntaxList, cancellationToken);

    //     return tsFile;
    // }
}
