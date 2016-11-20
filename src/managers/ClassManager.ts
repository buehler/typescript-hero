import { ClassNotFoundError } from '../models/Errors';
import { ClassDeclaration } from '../models/TsDeclaration';
import { ExtensionConfig } from '../ExtensionConfig';
import { Injector } from '../IoC';
import { ImportProxy } from '../models/ImportProxy';
import { TsDefaultImport, TsNamedImport } from '../models/TsImport';
import { TsFile } from '../models/TsResource';
import { TsResourceParser } from '../parser/TsResourceParser';
import { ImportManager } from './ImportManager';
import { ObjectManager } from './ObjectManager';
import { TextDocument } from 'vscode';

export class ClassManager implements ObjectManager {
    private static get parser(): TsResourceParser {
        return Injector.get(TsResourceParser);
    }

    private static get config(): ExtensionConfig {
        return Injector.get(ExtensionConfig);
    }

    private constructor(
        public readonly document: TextDocument,
        public readonly parsedDocument: TsFile,
        private readonly managedClass: ClassDeclaration
    ) { }

    /**
     * Creates an instance of a ClassManager.
     * Does parse the document text first and returns a promise that
     * resolves to a ClassManager.
     * 
     * @static
     * @param {TextDocument} document The document that should be managed
     * @param {string} className The name of the class that should be managed
     * @returns {Promise<ClassManager>}
     * 
     * @memberOf ClassManager
     */
    public static async create(document: TextDocument, className: string): Promise<ClassManager> {
        let source = await ClassManager.parser.parseSource(document.getText()),
            managedClass = source.declarations.find(
                o => o.name === className && o instanceof ClassDeclaration
            ) as ClassDeclaration;
        if (!managedClass) {
            throw new ClassNotFoundError(className);
        }
        return new ClassManager(document, source, managedClass);
    }

    public async commit(): Promise<boolean> {
        return true;
    }
}
