import { Container as IoCContainer, interfaces } from 'inversify';
import inversifyInjectDecorators from 'inversify-inject-decorators';
import { DeclarationIndex, TypescriptCodeGenerator, TypescriptParser } from 'typescript-parser';
import { ExtensionContext, workspace } from 'vscode';

import { ExtensionConfig } from '../common/config';
import { TypescriptParserFactory } from '../common/factories/index';
import { Logger } from '../common/utilities';
import { CodeActionCreator, MissingImplementationInClassCreator, MissingImportCreator } from './code-actions';
import { BaseExtension } from './extensions/BaseExtension';
import { CodeActionExtension } from './extensions/CodeActionExtension';
import { CodeCompletionExtension } from './extensions/CodeCompletionExtension';
import { DocumentSymbolStructureExtension } from './extensions/DocumentSymbolStructureExtension';
import { ImportResolveExtension } from './extensions/ImportResolveExtension';
import { iocSymbols } from './IoCSymbols';
import { TypeScriptHero } from './TypeScriptHero';
import { VscodeLogger } from './utilities/VscodeLogger';
import { VscodeExtensionConfig } from './VscodeExtensionConfig';

const container = new IoCContainer();

container.bind(TypeScriptHero).to(TypeScriptHero).inSingletonScope();
container.bind(iocSymbols.configuration).to(VscodeExtensionConfig).inSingletonScope();
container
    .bind<DeclarationIndex>(iocSymbols.declarationIndexFactory)
    .toDynamicValue((context: interfaces.Context) => {
        const parser = context.container.get<TypescriptParserFactory>(iocSymbols.typescriptParserFactory)();
        return new DeclarationIndex(parser, workspace.rootPath || '');
    })
    .inSingletonScope();

container
    .bind<TypescriptParser>(iocSymbols.typescriptParserFactory)
    .toDynamicValue(() => {
        return new TypescriptParser();
    })
    .inSingletonScope();

container
    .bind<interfaces.Factory<TypescriptParser>>(iocSymbols.typescriptParserFactory)
    .toFactory<TypescriptParser>(() => {
        return () => new TypescriptParser();
    });

container
    .bind<interfaces.Factory<TypescriptCodeGenerator>>(iocSymbols.generatorFactory)
    .toFactory<TypescriptCodeGenerator>((context: interfaces.Context) => {
        return () => {
            const config = context.container.get<ExtensionConfig>(iocSymbols.configuration);
            return new TypescriptCodeGenerator(config.resolver.generationOptions);
        };
    });

// Extensions
container.bind<BaseExtension>(iocSymbols.extensions).to(ImportResolveExtension).inSingletonScope();
container.bind<BaseExtension>(iocSymbols.extensions).to(CodeCompletionExtension).inSingletonScope();
container.bind<BaseExtension>(iocSymbols.extensions).to(CodeActionExtension).inSingletonScope();
container.bind<BaseExtension>(iocSymbols.extensions).to(DocumentSymbolStructureExtension).inSingletonScope();

// Logging
container
    .bind<interfaces.Factory<Logger>>(iocSymbols.loggerFactory)
    .toFactory<Logger>((context: interfaces.Context) => {
        return (prefix?: string) => {
            const extContext = context.container.get<ExtensionContext>(iocSymbols.extensionContext);
            const config = context.container.get<ExtensionConfig>(iocSymbols.configuration);

            return new VscodeLogger(extContext, config, prefix);
        };
    });

// Code Action Extension (action creators)
container.bind<CodeActionCreator>(iocSymbols.codeActionCreators).to(MissingImportCreator);
container.bind<CodeActionCreator>(iocSymbols.codeActionCreators).to(MissingImplementationInClassCreator);

/**
 * Injection container. IoC baby.
 */
export const Container = container;

/**
 * IocDecorators to lazy inject stuff into properties or something. Useful when normal injection via the
 * constructor is not possible.
 */
export const IocDecorators = inversifyInjectDecorators(container);
