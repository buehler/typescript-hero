import { TsNode } from './TsNode';
import { TsResource } from './TsResource';
import { CompletionItemKind } from 'vscode';

/**
 * Baseclass for all declaration objects. Contains the name of the symbol, the start and end points.
 * 
 * @export
 * @abstract
 * @class TsDeclaration
 * @extends {TsNode}
 */
export abstract class TsDeclaration extends TsNode {
    constructor(public name: string, start: number, end: number) {
        super(start, end);
    }

    public abstract getItemKind(): CompletionItemKind;
}

/**
 * Exportable declaration base (e.g. functions, classes)
 * Contains a boolean flag that indicates if the object is exported.
 * 
 * @export
 * @abstract
 * @class TsExportableDeclaration
 * @extends {TsDeclaration}
 */
export abstract class TsExportableDeclaration extends TsDeclaration {
    constructor(name: string, start: number, end: number, public isExported: boolean) {
        super(name, start, end);
    }
}

/**
 * Callable declaration like a constructor, a method or a function.
 * 
 * @export
 * @abstract
 * @class TsExportableCallableDeclaration
 * @extends {TsExportableDeclaration}
 */
export abstract class TsExportableCallableDeclaration extends TsExportableDeclaration {
    public parameters: ParameterDeclaration[] = [];
    public variables: VariableDeclaration[] = [];
}

/**
 * Interface declaration that contains defined properties and methods.
 * 
 * @export
 * @class InterfaceDeclaration
 * @extends {TsExportableDeclaration}
 */
export class InterfaceDeclaration extends TsExportableDeclaration {
    public properties: PropertyDeclaration[] = [];
    public methods: MethodDeclaration[] = [];

    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Interface;
    }
}

/**
 * Class declaration that contains methods, properties and a constructor
 * 
 * @export
 * @class ClassDeclaration
 * @extends {InterfaceDeclaration}
 */
export class ClassDeclaration extends InterfaceDeclaration {
    public ctor: ConstructorDeclaration;

    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Class;
    }
}

/**
 * Visibility of a class or interface property.
 * 
 * @export
 * @enum {number}
 */
export const enum PropertyVisibility {
    Private,
    Public,
    Protected
}

/**
 * Property declaration that contains its visibility.
 * 
 * @export
 * @class PropertyDeclaration
 * @extends {TsDeclaration}
 */
export class PropertyDeclaration extends TsDeclaration {
    constructor(name: string, start: number, end: number, public visibility: PropertyVisibility) {
        super(name, start, end);
    }

    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Property;
    }
}

/**
 * Method declaration. A method is contained in an interface or a class.
 * Contains information abount the method itself.
 * 
 * @export
 * @class MethodDeclaration
 * @extends {TsExportableCallableDeclaration}
 */
export class MethodDeclaration extends TsExportableCallableDeclaration {
    constructor(name: string, start: number, end: number) {
        super(name, start, end, false);
    }

    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Method;
    }
}

/**
 * Function declaration. Like the MethodDeclaration it contains the base info about the function
 * and additional stuff.
 * 
 * @export
 * @class FunctionDeclaration
 * @extends {TsExportableCallableDeclaration}
 */
export class FunctionDeclaration extends TsExportableCallableDeclaration {
    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Function;
    }
}

/**
 * Constructor declaration that is contained in a class.
 * 
 * @export
 * @class ConstructorDeclaration
 * @extends {TsExportableCallableDeclaration}
 */
export class ConstructorDeclaration extends TsExportableCallableDeclaration {
    constructor(start: number, end: number) {
        super('constructor', start, end, false);
    }

    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Constructor;
    }
}

/**
 * Alias declaration that can be exported. Is used to defined types.
 * (e.g. type Foobar = { name: string };)
 * 
 * @export
 * @class TypeAliasDeclaration
 * @extends {TsExportableDeclaration}
 */
export class TypeAliasDeclaration extends TsExportableDeclaration {
    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Keyword;
    }
}

/**
 * Enum declaration.
 * 
 * @export
 * @class EnumDeclaration
 * @extends {TsExportableDeclaration}
 */
export class EnumDeclaration extends TsExportableDeclaration {
    public members: string[] = [];

    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Value;
    }
}

/**
 * Variable declaration. Is contained in a method or function, or can be exported.
 * 
 * @export
 * @class VariableDeclaration
 * @extends {TsExportableDeclaration}
 */
export class VariableDeclaration extends TsExportableDeclaration {
    constructor(name: string, start: number, end: number, isExported: boolean, public isConst: boolean) {
        super(name, start, end, isExported);
    }

    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Variable;
    }
}

/**
 * Parameter declaration. Is contained in a method or function delaration since a parameter can not be exported
 * by itself.
 * 
 * @export
 * @class ParameterDeclaration
 * @extends {TsDeclaration}
 */
export class ParameterDeclaration extends TsDeclaration {
    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Variable;
    }
}

/**
 * Default declaration. Is used when a file exports something as its default.
 * Primary use is to ask the user about a name for the default export.
 * Is kind of an abstract declaration since there is no real declaration.
 * 
 * @export
 * @class DefaultDeclaration
 * @extends {TsExportableDeclaration}
 */
export class DefaultDeclaration extends TsExportableDeclaration {
    private exported: TsDeclaration;

    public get exportedDeclaration(): TsDeclaration {
        if (!this.exported) {
            this.exported = this.resource.declarations.find(o => o.name === this.name);
        }

        return this.exported;
    }

    constructor(name: string, private resource: TsResource) {
        super(name, 0, 0, true);
    }

    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.File;
    }
}

/**
 * Module (namespace) declaration. Does export a whole module or namespace that is mainly used by
 * external declaration files.
 * 
 * @export
 * @class ModuleDeclaration
 * @extends {TsDeclaration}
 */
export class ModuleDeclaration extends TsDeclaration {
    public getItemKind(): CompletionItemKind {
        return CompletionItemKind.Module;
    }
}
