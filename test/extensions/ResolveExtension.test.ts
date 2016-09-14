import * as chai from 'chai';

chai.should();

describe('ResolveExtension', () => {

    describe('addImportToDocument', () => {

        it('shoud write a module / namespace import correctly');

        it('shoud write a named import correctly');

        it('shoud update a named import correcty');

        it('shoud use the correct relative path');

        it('shoud only use forward slashes');

        it('shoud use ./ for same directory files');

        it('shoud remove /index from ../index.ts files');

    });

    describe('organizeImports', () => {

        it('shoud remove unused imports');

        it('shoud order string imports to the top');

        it('shoud order libraries by name');

        it('shoud order specifiers by name');

    });

});
