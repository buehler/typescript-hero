import 'reflect-metadata';
import {
    ClassDeclaration,
    DefaultDeclaration,
    EnumDeclaration,
    FunctionDeclaration,
    InterfaceDeclaration,
    DeclarationVisibility,
    TypeAliasDeclaration,
    VariableDeclaration
} from '../../src/models/TsDeclaration';
import { TsAllFromExport, TsAssignedExport, TsNamedFromExport } from '../../src/models/TsExport';
import {
    TsDefaultImport,
    TsExternalModuleImport,
    TsNamedImport,
    TsNamespaceImport,
    TsStringImport
} from '../../src/models/TsImport';
import { TsModule, TsNamespace, TsResource } from '../../src/models/TsResource';
import { TsResourceParser } from '../../src/parser/TsResourceParser';
import * as chai from 'chai';
import { join } from 'path';
import * as vscode from 'vscode';

let should = chai.should();

describe('TsResourceParser', () => {

    let parser: TsResourceParser,
        parsed: TsResource;

    beforeEach(() => {
        parser = new TsResourceParser(() => {
            return <any>{
                info: () => { },
                error: () => { },
                warning: () => { }
            };
        });
    });

    

});
