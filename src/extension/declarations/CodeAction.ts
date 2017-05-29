// import { DeclarationInfo } from '../../common/ts-parsing/declarations';
// import { ClassManager } from '../managers/ClassManager';
// import { ImportManager } from '../managers/ImportManager';
// import { TextDocument } from 'vscode';

// /**
//  * Interface for all codeactions that are generated by the typescript code action provider.
//  * 
//  * @export
//  * @interface CodeAction
//  */
// export interface CodeAction {

//     /**
//      * Executes the code action. Depending on the action, there are several actions performed.
//      * 
//      * @returns {Promise<boolean>}
//      * 
//      * @memberOf CodeAction
//      */
//     execute(): Promise<boolean>;
// }

// /**
//  * Code action that adds a missing import the the actual document.
//  * 
//  * @export
//  * @class AddImportCodeAction
//  * @implements {CodeAction}
//  */
// export class AddImportCodeAction implements CodeAction {
//     constructor(private document: TextDocument, private importToAdd: DeclarationInfo) { }

//     /**
//      * Executes the code action. Depending on the action, there are several actions performed.
//      * 
//      * @returns {Promise<boolean>}
//      * 
//      * @memberOf AddImportCodeAction
//      */
//     public async execute(): Promise<boolean> {
//         let controller = await ImportManager.create(this.document);
//         return controller.addDeclarationImport(this.importToAdd).commit();
//     }
// }

// /**
//  * Code action that adds all missing imports to the actual document, based on the non-local usages.
//  * 
//  * @export
//  * @class AddMissingImportsCodeAction
//  * @implements {CodeAction}
//  */
// export class AddMissingImportsCodeAction implements CodeAction {
//     constructor(private document: TextDocument, private resolveIndex: ResolveIndex) { }

//     /**
//      * Executes the code action. Depending on the action, there are several actions performed.
//      * 
//      * @returns {Promise<boolean>}
//      * 
//      * @memberOf AddMissingImportsCodeAction
//      */
//     public async execute(): Promise<boolean> {
//         let controller = await ImportManager.create(this.document);
//         return controller.addMissingImports(this.resolveIndex).commit();
//     }
// }

// /**
//  * Code action that does literally nothing. Is used to "communicate" with the user. E.g. if
//  * an import cannot be resolved, the lightbulb will show "cannot resolve <CLASS>".
//  * 
//  * @export
//  * @class NoopCodeAction
//  * @implements {CodeAction}
//  */
// export class NoopCodeAction implements CodeAction {
//     /**
//      * Executes the code action. Depending on the action, there are several actions performed.
//      * 
//      * @returns {Promise<boolean>}
//      * 
//      * @memberOf NoopCodeAction
//      */
//     public execute(): Promise<boolean> {
//         return Promise.resolve(true);
//     }
// }

// /**
//  * Code action that does implement missing properties and methods from interfaces or abstract classes.
//  * 
//  * @export
//  * @class ImplementPolymorphElements
//  * @implements {CodeAction}
//  */
// export class ImplementPolymorphElements implements CodeAction {
//     constructor(
//         private document: TextDocument,
//         private managedClass: string,
//         private polymorphObject: InterfaceDeclaration
//     ) { }

//     /**
//      * Executes the code action. Depending on the action, there are several actions performed.
//      * 
//      * @returns {Promise<boolean>}
//      * 
//      * @memberOf ImplementPolymorphElements
//      */
//     public async execute(): Promise<boolean> {
//         let controller = await ClassManager.create(this.document, this.managedClass);

//         for (let property of this.polymorphObject.properties.filter(o => !controller.hasProperty(o.name))) {
//             controller.addProperty(property);
//         }

//         for (let method of this.polymorphObject.methods.filter(o => !controller.hasMethod(o.name) && o.isAbstract)) {
//             controller.addMethod(method);
//         }

//         return controller.commit();
//     }
// }
