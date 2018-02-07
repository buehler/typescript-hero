// import { expect } from 'chai';
// import { ClassDeclaration, TypescriptParser } from 'typescript-parser';
// import { ExtensionContext } from 'vscode';

// import DeclarationStructureTreeItem from '../../../src/code-outline/declaration-structure-tree-item';
// import Configuration from '../../../src/configuration';
// import ioc from '../../../src/ioc';
// import iocSymbols from '../../../src/ioc-symbols';
// import { Logger } from '../../../src/utilities/logger';

// describe('CodeOutline', () => {

//   let context: ExtensionContext;
//   let logger: Logger;
//   let config: Configuration;
//   let parser: TypescriptParser;

//   beforeEach(() => {
//     context = ioc.get<ExtensionContext>(iocSymbols.extensionContext);
//     logger = ioc.get<Logger>(iocSymbols.logger);
//     config = ioc.get<Configuration>(iocSymbols.configuration);
//     parser = ioc.get<TypescriptParser>(iocSymbols.parser);
//   });

//   it('should create a tree item', () => {
//     const declaration = new ClassDeclaration('class', true, 0, 100);
//     const item = new DeclarationStructureTreeItem(declaration, context);

//     expect(item).to.exist;
//   });

// });
