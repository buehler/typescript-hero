import { ResolveExtension } from '../../src/extensions/ResolveExtension';
import { Injector } from '../../src/IoC';
import * as chai from 'chai';
import { join } from 'path';
import * as vscode from 'vscode';
import { given } from 'mocha-testdata';

chai.should();

describe('ImportProxy', () => {

    describe('constructor()', () => {

        it('should create a descendent of a TsNamedImport');

        it('should use the values of a given TsNamedImport');

        it('should duplicate the specifiers of a TsNamedImport');

        it('should add a default alias from a TsDefaultImport');

    });

    describe('addSpecifier()', () => {

        it('should add a specifier to the list');

        it('should not add a specifier if it already exists');

    });

    describe('clone()', () => {

        it('should clone the whole ImportProxy element');

    });

    describe('isEqual()', () => {

        it('should return true if another proxy is equal');

        given([1, 2], [1, 2]).it('should return false if another proxy is not equal', (p1, p2) => {

        });

    });

    describe('toImport()', () => {

        it('should generate a TsDefaultImport when no specifiers are provided');

        it('should generate a normal TsNamedImport when no default import is provided');

        it('should generate a TsNamedImport with default import');

    });

});
