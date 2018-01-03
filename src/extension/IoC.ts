import { Container as IoCContainer, interfaces } from 'inversify';
import inversifyInjectDecorators from 'inversify-inject-decorators';
import { TypescriptCodeGenerator, TypescriptParser } from 'typescript-parser';
import { ExtensionContext, Uri } from 'vscode';

import { ExtensionConfig } from '../common/config';
import { ConfigFactory } from '../common/factories';
import { CodeActionCreator, MissingImplementationInClassCreator, MissingImportCreator } from './code-actions';
import { VscodeExtensionConfig } from './config/VscodeExtensionConfig';
import { BaseExtension } from './extensions/BaseExtension';
import { CodeActionExtension } from './extensions/CodeActionExtension';
import { CodeCompletionExtension } from './extensions/CodeCompletionExtension';
import { DocumentSymbolStructureExtension } from './extensions/DocumentSymbolStructureExtension';
import { ImportResolveExtension } from './extensions/ImportResolveExtension';
import { OrganizeImportsOnSaveExtension } from './extensions/OrganizeImportsOnSaveExtension';
import { iocSymbols } from './IoCSymbols';
import { TypeScriptHero } from './TypeScriptHero';
import { DeclarationIndexMapper } from './utilities/DeclarationIndexMapper';
import winstonLogger, { Logger } from './utilities/winstonLogger';

const container = new IoCContainer();

container.bind(TypeScriptHero).to(TypeScriptHero).inSingletonScope();

container.bind<DeclarationIndexMapper>(iocSymbols.declarationIndexMapper).to(DeclarationIndexMapper).inSingletonScope();

container
    .bind<TypescriptParser>(iocSymbols.typescriptParser)
    .toConstantValue(new TypescriptParser());

container
    .bind<interfaces.Factory<TypescriptCodeGenerator>>(iocSymbols.generatorFactory)
    .toFactory<TypescriptCodeGenerator>((context: interfaces.Context) => {
        return (resource: Uri | null) => {
            const configFactory = context.container.get<ConfigFactory>(iocSymbols.configuration);
            return new TypescriptCodeGenerator(configFactory(resource).resolver.generationOptions);
        };
    });

container
    .bind<interfaces.Factory<ExtensionConfig>>(iocSymbols.configuration)
    .toFactory<VscodeExtensionConfig>(() => (resource?: Uri) => new VscodeExtensionConfig(resource));

// Extensions
container.bind<BaseExtension>(iocSymbols.extensions).to(ImportResolveExtension).inSingletonScope();
container.bind<BaseExtension>(iocSymbols.extensions).to(CodeCompletionExtension).inSingletonScope();
container.bind<BaseExtension>(iocSymbols.extensions).to(DocumentSymbolStructureExtension).inSingletonScope();
container.bind<BaseExtension>(iocSymbols.extensions).to(CodeActionExtension).inSingletonScope();
container.bind<BaseExtension>(iocSymbols.extensions).to(OrganizeImportsOnSaveExtension).inSingletonScope();

// Logging
container
    .bind<Logger>(iocSymbols.logger)
    .toDynamicValue((context: interfaces.Context) => {
        const extContext = context.container.get<ExtensionContext>(iocSymbols.extensionContext);
        const config = context.container.get<ConfigFactory>(iocSymbols.configuration)(null);
        return winstonLogger(config.verbosity, extContext);
    })
    .inSingletonScope();

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
