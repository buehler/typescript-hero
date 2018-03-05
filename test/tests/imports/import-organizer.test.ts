import { join } from 'path';
import { Position, Range, TextDocument, Uri, window, workspace } from 'vscode';

import { ImportOrganizer } from '../../../src/imports';
import ioc from '../../../src/ioc';
import iocSymbols from '../../../src/ioc-symbols';
import { expect } from '../setup';

describe('ImportOrganizer', () => {

  describe('import-organizer-file.ts', () => {

    const rootPath = workspace.workspaceFolders![0].uri.fsPath;
    const file = Uri.file(join(rootPath, 'imports', 'import-organizer-file.ts'));
    let document: TextDocument;
    let extension: any;

    before(async () => {
      document = await workspace.openTextDocument(file);
      await window.showTextDocument(document);

      extension = new ImportOrganizer(
        ioc.get(iocSymbols.extensionContext),
        ioc.get(iocSymbols.logger),
        ioc.get(iocSymbols.configuration),
        ioc.get(iocSymbols.importManager),
      );
    });

    afterEach(async () => {
      await window.activeTextEditor!.edit((builder) => {
        builder.delete(new Range(
          new Position(0, 0),
          document.lineAt(document.lineCount - 1).rangeIncludingLineBreak.end,
        ));
      });
    });

    it('should not remove directly exported imports', async () => {
      await window.activeTextEditor!.edit((builder) => {
        builder.insert(
          new Position(0, 0),
          `import * as Foobar from './lol';
import * as Barbaz from './foo';

export { Foobar, Barbaz }
`,
        );
      });

      expect(window.activeTextEditor!.document.getText()).to.matchSnapshot();
      await extension.organizeImports();
      expect(window.activeTextEditor!.document.getText()).to.matchSnapshot();
    });

    it('should not remove directly exported default imports', async () => {
      await window.activeTextEditor!.edit((builder) => {
        builder.insert(
          new Position(0, 0),
          `import Barbaz from './foo';

export { Barbaz }
`,
        );
      });

      expect(window.activeTextEditor!.document.getText()).to.matchSnapshot();
      await extension.organizeImports();
      expect(window.activeTextEditor!.document.getText()).to.matchSnapshot();
    });

    it('should not remove default exported default imports', async () => {
      await window.activeTextEditor!.edit((builder) => {
        builder.insert(
          new Position(0, 0),
          `import Barbaz from './foo';

export default Barbaz;
`,
        );
      });

      expect(window.activeTextEditor!.document.getText()).to.matchSnapshot();
      await extension.organizeImports();
      expect(window.activeTextEditor!.document.getText()).to.matchSnapshot();
    });

  });

});
