import { inject, injectable } from 'inversify';
import { MultiLineImportRule, TypescriptGenerationOptions } from 'typescript-parser';
import { Event, EventEmitter, ExtensionContext, Uri, window, workspace } from 'vscode';

import iocSymbols from '../ioc-symbols';
import { CodeCompletionConfig } from './code-completion-config';
import DocumentOutlineConfig from './document-outline-config';
import ImportsConfig from './imports-config';
import IndexConfig from './index-config';

const sectionKey = 'typescriptHero';

@injectable()
export default class Configuration {
  public readonly codeOutline: DocumentOutlineConfig = new DocumentOutlineConfig();
  public readonly codeCompletion: CodeCompletionConfig = new CodeCompletionConfig();
  public readonly imports: ImportsConfig = new ImportsConfig();
  public readonly index: IndexConfig = new IndexConfig();

  private readonly _configurationChanged: EventEmitter<void> = new EventEmitter();

  public get configurationChanged(): Event<void> {
    return this._configurationChanged.event;
  }

  constructor(
    @inject(iocSymbols.extensionContext) context: ExtensionContext,
  ) {
    context.subscriptions.push(
      workspace.onDidChangeConfiguration(() => this._configurationChanged.fire()),
    );
    context.subscriptions.push(this._configurationChanged);
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

  public typescriptGeneratorOptions(resource: Uri): TypescriptGenerationOptions {
    return {
      eol: this.imports.insertSemicolons(resource) ? ';' : '',
      insertSpaces: true,
      multiLineTrailingComma: this.imports.multiLineTrailingComma(resource),
      multiLineWrapThreshold: this.imports.multiLineWrapThreshold(resource),
      spaceBraces: this.imports.insertSpaceBeforeAndAfterImportBraces(resource),
      stringQuoteStyle: this.imports.stringQuoteStyle(resource),
      tabSize: window.activeTextEditor && window.activeTextEditor.options.tabSize ?
        (window.activeTextEditor.options.tabSize as any) * 1 :
        workspace.getConfiguration('editor', resource).get('tabSize', 4),
      wrapMethod: MultiLineImportRule.oneImportPerLineOnlyAfterThreshold,
    };
  }
}
