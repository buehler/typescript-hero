import * as chai from 'chai';
import {TsResolveFileParser} from '../../src/parser/TsResolveFileParser';
import * as vscode from 'vscode';
import * as path from 'path';
import * as typescript from 'typescript';

chai.should();

describe('TsResolveFileParser', () => {

    let parser: TsResolveFileParser;
    
    beforeEach(() => {
        parser = new TsResolveFileParser();
    });

    describe('Local typescript files', () => {

        describe('Imports', () => {

            const file = path.join(__dirname, '../../../test/etc/resolveFileParser/importsOnly.ts');

            it('should parse string import correctly', () => {
                let parsed = parser.parseFile(file);
                console.log(parsed);
            });

            it('should parse named import correctly');

            it('should parse named import with aliased specifier correctly');

            it('should parse namespace import correctly');

            it('should parse external module import correctly');

        });

        describe('Exports', () => {



        });

        describe('Usages', () => {



        });

        describe('Full file', () => {



        });

    });

});
