import * as chai from 'chai';

chai.should();

describe('ResolveQuickPickProvider', () => {

    it('shoud show all possible declarations');

    it('shoud order own files before typings / node modules');

    it('shoud order the declarations by name');

    it('shoud filter already imported named symbols');

    it('shoud filter already imported modules / namespaces');

    it('shoud filter already imported default imports');

    it('shoud resolve to 0 items for non found symbol');

    it('shoud find a declaration for a symbol');

    it('shoud possibly find multiple declarations for a symbol');

});
