import 'reflect-metadata';

import { DefaultImport, GENERATORS, NamedImport, SymbolSpecifier, TypescriptCodeGenerator } from 'typescript-parser';
import { Disposable, ExtensionContext } from 'vscode';

import { KeywordImportGroup, RegexImportGroup, RemainImportGroup } from './import-grouping';
import { Container } from './IoC';
import { iocSymbols } from './IoCSymbols';
import { ImportProxy } from './proxy-objects/ImportProxy';
import { TypeScriptHero } from './TypeScriptHero';

let extension: Disposable;

function extendGenerator(generator: TypescriptCodeGenerator): void {
    function simpleGenerator(generatable: any): string {
        const group = generatable as KeywordImportGroup;
        if (!group.imports.length) {
            return '';
        }
        return group.sortedImports
            .map(imp => generator.generate(imp))
            .join('\n') + '\n';
    }

    GENERATORS[KeywordImportGroup.name] = simpleGenerator;
    GENERATORS[RegexImportGroup.name] = simpleGenerator;
    GENERATORS[RemainImportGroup.name] = simpleGenerator;
    GENERATORS[ImportProxy.name] = (proxy: ImportProxy) => {
        if (proxy.specifiers.length <= 0 && (proxy.defaultAlias || proxy.defaultPurposal)) {
            return generator.generate(
                new DefaultImport(
                    proxy.libraryName, (proxy.defaultAlias || proxy.defaultPurposal)!, proxy.start, proxy.end,
                ),
            );
        }
        if (proxy.defaultAlias) {
            proxy.specifiers.push(new SymbolSpecifier('default', proxy.defaultAlias));
        }
        const named = new NamedImport(
            proxy.libraryName, proxy.start, proxy.end,
        );
        named.specifiers = proxy.specifiers;
        return generator.generate(named);
    };
}

/**
 * Activates TypeScript Hero
 * 
 * @export
 * @param {ExtensionContext} context
 */
export async function activate(context: ExtensionContext): Promise<void> {
    if (Container.isBound(iocSymbols.extensionContext)) {
        Container.unbind(iocSymbols.extensionContext);
    }
    Container.bind<ExtensionContext>(iocSymbols.extensionContext).toConstantValue(context);
    extendGenerator(Container.get<() => TypescriptCodeGenerator>(iocSymbols.generatorFactory)());
    extension = Container.get(TypeScriptHero);
}

/**
 * Deactivates TypeScript Hero
 * 
 * @export
 */
export function deactivate(): void {
    extension.dispose();
}
