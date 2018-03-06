import { join } from 'path';
import { Position, Range, TextDocument, Uri, window, workspace } from 'vscode';

import { ImportOrganizer } from '../../../src/imports';
import ioc from '../../../src/ioc';
import iocSymbols from '../../../src/ioc-symbols';

describe('ImportAppender', () => {

  describe('import-appender-file.ts', () => {

    const rootPath = workspace.workspaceFolders![0].uri.fsPath;
    const file = Uri.file(join(rootPath, 'imports', 'import-appender-file.ts'));
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

  });

});
