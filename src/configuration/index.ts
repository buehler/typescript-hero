import { inject, injectable } from 'inversify';
import { Observable, Subject } from 'rxjs';
import { ExtensionContext, workspace } from 'vscode';

import iocSymbols from '../ioc-symbols';
import DocumentOutlineConfig from './document-outline-config';

const sectionKey = 'typescriptHero';

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

  public parseableLanguages(): string[] {
    return [
      'typescript',
      'typescriptreact',
      'javascript',
      'javascriptreact',
    ];
  }

  public verbosity(): 'error' | 'warn' | 'info' | 'debug' {
    const verbosity = workspace.getConfiguration(sectionKey).get<'error' | 'warn' | 'info' | 'debug'>('verbosity', 'warn');
    if (['error', 'warn', 'info', 'debug'].indexOf(verbosity) < 0) {
      return 'warn';
    }
    return verbosity;
  }
}
