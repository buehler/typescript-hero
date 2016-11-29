import { ExtensionConfig } from '../ExtensionConfig';
import { Injector } from '../IoC';
import { Changeable } from '../models/Changeable';
import {
    ClassNotFoundError,
    MethodDuplicated,
    MethodNotFound,
    PropertyDuplicated,
    PropertyNotFound
} from '../models/Errors';
import {
    ClassDeclaration,
    ConstructorDeclaration,
    DeclarationVisibility,
    MethodDeclaration,
    ParameterDeclaration,
    PropertyDeclaration
} from '../models/TsDeclaration';
import { TsFile } from '../models/TsResource';
import { TsResourceParser } from '../parser/TsResourceParser';
import { ObjectManager } from './ObjectManager';
import { TextDocument } from 'vscode';

export class ClassManager implements ObjectManager {
    private static get parser(): TsResourceParser {
        return Injector.get(TsResourceParser);
    }

    private static get config(): ExtensionConfig {
        return Injector.get(ExtensionConfig);
    }

    private ctor: Changeable<ConstructorDeclaration>;
    private properties: Changeable<PropertyDeclaration>[] = [];
    private methods: Changeable<MethodDeclaration>[] = [];

    private constructor(
        public readonly document: TextDocument,
        public readonly parsedDocument: TsFile,
        private readonly managedClass: ClassDeclaration
    ) {
        this.ctor = new Changeable(managedClass.ctor);
        this.properties = managedClass.properties.map(o => new Changeable(o));
        this.methods = managedClass.methods.map(o => new Changeable(o));
    }

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

    /**
     * TODO
     * 
     * @param {string} name
     * @param {PropertyVisibility} visibility
     * @param {string} type
     * @returns {this}
     * 
     * @memberOf ClassManager
     */
    /**
     * 
     * 
     * @param {string} name
     * @param {DeclarationVisibility} visibility
     * @param {string} type
     * @returns {this}
     * 
     * @memberOf ClassManager
     */
    public addProperty(
        name: string,
        visibility: DeclarationVisibility,
        type: string
    ): this {
        if (this.properties.some(o => o.object.name === name && !o.isDeleted)) {
            throw new PropertyDuplicated(name, this.managedClass.name);
        }

        let prop = new PropertyDeclaration(name, visibility, type);
        this.properties.push(new Changeable(prop, true));

        return this;
    }

    /**
     * TODO
     * 
     * @param {string} name
     * @returns {this}
     * 
     * @memberOf ClassManager
     */
    public removeProperty(name: string): this {
        if (!this.properties.some(o => o.object.name === name && !o.isDeleted)) {
            throw new PropertyNotFound(name, this.managedClass.name);
        }
        this.properties.find(o => o.object.name === name).isDeleted = true;
        return this;
    }

    /**
     * TODO
     * 
     * @param {(string | MethodDeclaration)} nameOrDeclaration
     * @param {DeclarationVisibility} [visibility]
     * @param {string} [type]
     * @param {ParameterDeclaration[]} [parameters]
     * @returns {this}
     * 
     * @memberOf ClassManager
     */
    public addMethod(
        nameOrDeclaration: string | MethodDeclaration,
        visibility?: DeclarationVisibility,
        type?: string,
        parameters?: ParameterDeclaration[]
    ): this {
        let declaration: MethodDeclaration;
        if (nameOrDeclaration instanceof MethodDeclaration) {
            if (this.methods.some(o => o.object.name === nameOrDeclaration.name && !o.isDeleted)) {
                throw new MethodDuplicated(nameOrDeclaration.name, this.managedClass.name);
            }
            declaration = nameOrDeclaration;
        } else {
            if (this.methods.some(o => o.object.name === nameOrDeclaration && !o.isDeleted)) {
                throw new MethodDeclaration(nameOrDeclaration, this.managedClass.name);
            }
        }

        this.methods.push(new Changeable(declaration, true));

        return this;
    }

    /**
     * TODO
     * 
     * @param {string} name
     * @returns {this}
     * 
     * @memberOf ClassManager
     */
    public removeMethod(name: string): this {
        if (!this.methods.some(o => o.object.name === name && !o.isDeleted)) {
            throw new MethodNotFound(name, this.managedClass.name);
        }
        this.methods.find(o => o.object.name === name).isDeleted = true;
        return this;
    }

    /**
     * TODO
     * 
     * @returns {Promise<boolean>}
     * 
     * @memberOf ClassManager
     */
    public async commit(): Promise<boolean> {
        return true;
    }
}
