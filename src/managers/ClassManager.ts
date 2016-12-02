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
import { Position, Range, TextDocument, TextEdit, workspace, WorkspaceEdit } from 'vscode';

type VisibleObject = { visibility?: DeclarationVisibility };

/**
 * TODO
 * 
 * @param {Changeable<VisibleObject>} o1
 * @param {Changeable<VisibleObject>} o2
 * @returns {number}
 */
function sortByVisibility(o1: Changeable<VisibleObject>, o2: Changeable<VisibleObject>): number {
    let left = o1.object.visibility,
        right = o2.object.visibility;

    if ((left === undefined && right === undefined) || (left === right)) {
        return 0;
    }
    if (left !== undefined && right === undefined) {
        return -1;
    }
    if (left === undefined && right !== undefined) {
        return 1;
    }

    return right - left;
}

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
        let property = this.properties.find(o => o.object.name === name);
        property.isDeleted = true;
        if (property.isNew) {
            this.properties.splice(this.properties.indexOf(property), 1);
        }
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
            declaration = new MethodDeclaration(nameOrDeclaration, type, visibility);
            declaration.parameters = parameters || [];
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
        let method = this.methods.find(o => o.object.name === name);
        method.isDeleted = true;
        if (method.isNew) {
            this.methods.splice(this.methods.indexOf(method), 1);
        }
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
        /*
            for each properties, then for each methods
            delete,
            update,
            insert
        
            insert reihenfolge: public, protected, private
            static?
        */

        let edits = [];

        for (let property of this.properties.filter(o => o.isDeleted)) {
            edits.push(TextEdit.delete(
                new Range(
                    this.document.lineAt(
                        this.document.positionAt(property.object.start).line
                    ).rangeIncludingLineBreak.start,
                    this.document.lineAt(
                        this.document.positionAt(property.object.end).line
                    ).rangeIncludingLineBreak.end,
                )
            ));
        }

        // TODO update

        for (let property of this.properties.filter(o => o.isNew).sort(sortByVisibility)) {
            let lastProperty = this.properties.filter(
                o => !o.isNew && o.object.visibility === property.object.visibility
            ).pop();
            let lastPosition = lastProperty ?
                this.document.positionAt(lastProperty.object.end).line + 1 :
                this.document.positionAt(this.managedClass.start).line + 1;
            edits.push(TextEdit.insert(
                new Position(lastPosition, 0),
                property.object.toTypescript({ tabSize: ClassManager.config.resolver.tabSize })
            ));
        }

        let workspaceEdit = new WorkspaceEdit();
        workspaceEdit.set(this.document.uri, edits);
        return workspace.applyEdit(workspaceEdit);
    }
}
