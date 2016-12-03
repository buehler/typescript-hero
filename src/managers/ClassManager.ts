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
 * Sortfunction for changeable objects. Does sort the objects by visibility.
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
     * Checks if a property with the given name exists on the virtual class.
     * 
     * @param {string} name
     * @returns {boolean}
     * 
     * @memberOf ClassManager
     */
    public hasProperty(name: string): boolean {
        return this.properties.some(o => o.object.name === name && !o.isDeleted);
    }

    /**
     * Add a property to the virtual class. Creates a Changeable<T> object with the .isNew flag set to true.
     * 
     * @param {(string | PropertyDeclaration)} nameOrDeclaration
     * @param {DeclarationVisibility} [visibility]
     * @param {string} [type]
     * @returns {this}
     * 
     * @memberOf ClassManager
     */
    public addProperty(
        nameOrDeclaration: string | PropertyDeclaration,
        visibility?: DeclarationVisibility,
        type?: string
    ): this {
        let declaration: PropertyDeclaration;

        if (nameOrDeclaration instanceof PropertyDeclaration) {
            if (this.properties.some(o => o.object.name === nameOrDeclaration.name && !o.isDeleted)) {
                throw new PropertyDuplicated(nameOrDeclaration.name, this.managedClass.name);
            }
            declaration = nameOrDeclaration;
        } else {
            if (this.properties.some(o => o.object.name === nameOrDeclaration && !o.isDeleted)) {
                throw new PropertyDuplicated(nameOrDeclaration, this.managedClass.name);
            }
            declaration = new PropertyDeclaration(nameOrDeclaration, visibility, type);
        }

        this.properties.push(new Changeable(declaration, true));

        return this;
    }

    /**
     * Remove (aka set isDeleted) a property from the virtual class.
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
     * Checks if a method with the given name does exist on the virtual class.
     * 
     * @param {string} name
     * @returns {boolean}
     * 
     * @memberOf ClassManager
     */
    public hasMethod(name: string): boolean {
        return this.methods.some(o => o.object.name === name && !o.isDeleted);
    }

    /**
     * Add a method to the virtual class.
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
                throw new MethodDuplicated(nameOrDeclaration, this.managedClass.name);
            }
            declaration = new MethodDeclaration(nameOrDeclaration, type, visibility);
            declaration.parameters = parameters || [];
        }

        this.methods.push(new Changeable(declaration, true));

        return this;
    }

    /**
     * Removes a method from the virtual class.
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
     * Commits the virtual class to the given document.
     * The following steps are exectued with properties and methods:
     * - Delete properties
     * - Update changed properties (still TODO)
     * - Insert new properties
     * 
     * @returns {Promise<boolean>}
     * 
     * @memberOf ClassManager
     */
    public async commit(): Promise<boolean> {
        let edits = [
            ...this.calculatePropertyEdits(),
            ...this.calculateMethodEdits()
        ];

        let workspaceEdit = new WorkspaceEdit();
        workspaceEdit.set(this.document.uri, edits);
        return workspace.applyEdit(workspaceEdit);
    }

    /**
     * Determines if a propertydeclaration is injected by the constructor.
     * I.e. constructor(public foo: string)...
     * 
     * @private
     * @param {PropertyDeclaration} property
     * @returns {boolean}
     * 
     * @memberOf ClassManager
     */
    private isInConstructor(property: PropertyDeclaration): boolean {
        if (!this.ctor || !this.ctor.object) {
            return false;
        }

        return property.start >= this.ctor.object.start && property.end <= this.ctor.object.end;
    }

    /**
     * Calculates TextEdits for properties.
     * 
     * @private
     * @returns {TextEdit[]}
     * 
     * @memberOf ClassManager
     */
    private calculatePropertyEdits(): TextEdit[] {
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
                o => !o.isNew &&
                    !o.isDeleted &&
                    !this.isInConstructor(o.object) &&
                    o.object.visibility === property.object.visibility
            ).pop();
            let lastPosition = lastProperty ?
                this.document.positionAt(lastProperty.object.end).line + 1 :
                this.document.positionAt(this.managedClass.start).line + 1;
            edits.push(TextEdit.insert(
                new Position(lastPosition, 0),
                property.object.toTypescript({ tabSize: ClassManager.config.resolver.tabSize })
            ));
        }

        return edits;
    }

    /**
     * Calculates TextEdits for methods.
     * 
     * @private
     * @returns {TextEdit[]}
     * 
     * @memberOf ClassManager
     */
    private calculateMethodEdits(): TextEdit[] {
        let edits = [];
        for (let method of this.methods.filter(o => o.isDeleted)) {
            let endPosition = this.document.positionAt(method.object.end),
                endLine = endPosition.line;

            if (this.document.lineAt(endLine + 1).isEmptyOrWhitespace) {
                endLine++;
            }

            edits.push(TextEdit.delete(
                new Range(
                    this.document.lineAt(
                        this.document.positionAt(method.object.start).line
                    ).rangeIncludingLineBreak.start,
                    this.document.lineAt(endLine).rangeIncludingLineBreak.end,
                )
            ));
        }

        // TODO update

        for (let method of this.methods.filter(o => o.isNew).sort(sortByVisibility)) {
            let lastMethod = this.methods.filter(
                o => !o.isNew && !o.isDeleted && o.object.visibility === method.object.visibility
            ).pop();
            let lastPosition = lastMethod ?
                this.document.positionAt(lastMethod.object.end).line + 1 :
                this.document.positionAt(this.managedClass.end).line;
            edits.push(TextEdit.insert(
                new Position(lastPosition, 0),
                '\n' + method.object.toTypescript({ tabSize: ClassManager.config.resolver.tabSize })
            ));
        }

        return edits;
    }
}
