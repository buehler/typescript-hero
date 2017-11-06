import * as chai from 'chai';
import { Container } from '../../../../src/extension/IoC';
import { TypescriptParser } from 'typescript-parser';
import { iocSymbols } from '../../../../src/extension/IoCSymbols';
import { join } from 'path';
import { workspace } from 'vscode';

import { KeywordImportGroup, ImportGroupKeyword, RegexImportGroup } from '../../../../src/extension/import-grouping';
import { importGroupSortForPrecedence, importSortByFirstSpecifier } from '../../../../src/extension/utilities/utilityFunctions';

chai.should();

describe('utilityFunctions', () => {
    describe('importGroupSortForPrecedence', () => {
        it('should prioritize regexes, leaving original order untouched besides that', () => {
            const initialList = [
                new KeywordImportGroup(ImportGroupKeyword.Modules),
                new KeywordImportGroup(ImportGroupKeyword.Plains),
                new RegexImportGroup("/cool-library/"),
                new RegexImportGroup("/cooler-library/"),
                new KeywordImportGroup(ImportGroupKeyword.Workspace),
            ]
            const expectedList = initialList.slice(2, 4)
                .concat(initialList.slice(0, 2))
                .concat(initialList.slice(4))

            importGroupSortForPrecedence(initialList).should.deep.equal(expectedList,
                'Regex Import Groups should appear first (and that should be the only change)')
        });
    });

    describe('importSortByFirstSpecifier', () => {
        const parser = Container.get<TypescriptParser>(iocSymbols.typescriptParser);
        const rootPath = workspace.workspaceFolders![0].uri.fsPath;

        it('should sort according to first specifier/alias, falling back to module path', async () => {
            const file = await parser.parseFile(
                join(
                    rootPath,
                    'extension/utilities/importsForSpecifierSort.ts',
                ),
                rootPath,
            );

            const result = [...file.imports].sort(importSortByFirstSpecifier);
            result.map((i) => i.libraryName).should.deep.equal([
                './anotherFile',            // { AnotherFoobar }
                'coolEffectLib',            // 'coolEffectLib'
                './myFile',                 // { Foobar, Genero }
                'myLib',                    // ModuleFoobar
                'anotherLib',               // { AnotherModuleFoo as MuchFurtherSorted }
                './workspaceSideEffectLib', // './workspaceSideEffectLib
            ]);
        });
    });
});
