import { inject, injectable } from 'inversify';
import { Observable, Subject } from 'rxjs';
import { ExtensionContext, workspace } from 'vscode';

import iocSymbols from '../ioc-symbols';
import DocumentOutlineConfig from './document-outline-config';

@injectable()
export default class Configuration {
  public readonly codeOutline: DocumentOutlineConfig = new DocumentOutlineConfig();

  private readonly _configurationChanged: Subject<void> = new Subject();

  public get configurationChanged(): Observable<void> {
    return this._configurationChanged;
  }

  constructor(
    @inject(iocSymbols.extensionContext) context: ExtensionContext,
  ) {
    context.subscriptions.push(
      workspace.onDidChangeConfiguration(() => this._configurationChanged.next()),
    );
  }
}
