import { TsNode } from './TsNode';
import { TsResource } from './TsResource';
import { CompletionItemKind } from 'vscode';

// TODO: Add types to declarations
// TODO: Add visibility to class methods

/**
 * Baseclass for all declaration objects. Contains the name of the symbol, the start and end points.
 * 
 * @export
 * @abstract
 * @class TsDeclaration
 * @extends {TsNode}
 */
export abstract class TsDeclaration extends TsNode {
    /**
     * Readonly information about the declaration kind. Returns the specific item kind of the declaration
     * for code completion.
     * 
     * @abstract
     * 
     * @memberOf TsDeclaration
     */
    public abstract readonly itemKind: CompletionItemKind;

    constructor(public name: string, start?: number, end?: number) {
        super(start, end);
    }
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

    public get itemKind(): CompletionItemKind {
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

    public get itemKind(): CompletionItemKind {
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
    public get itemKind(): CompletionItemKind {
        return CompletionItemKind.Property;
    }

    constructor(
        name: string,
        public visibility: PropertyVisibility,
        start?: number,
        end?: number
    ) {
        super(name, start, end);
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
    public get itemKind(): CompletionItemKind {
        return CompletionItemKind.Method;
    }

    constructor(name: string, start: number, end: number) {
        super(name, start, end, false);
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
    public get itemKind(): CompletionItemKind {
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
    public get itemKind(): CompletionItemKind {
        return CompletionItemKind.Constructor;
    }

    constructor(start: number, end: number) {
        super('constructor', start, end, false);
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
    public get itemKind(): CompletionItemKind {
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

    public get itemKind(): CompletionItemKind {
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
    public get itemKind(): CompletionItemKind {
        return CompletionItemKind.Variable;
    }

    constructor(name: string, start: number, end: number, isExported: boolean, public isConst: boolean) {
        super(name, start, end, isExported);
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
    public get itemKind(): CompletionItemKind {
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

    public get itemKind(): CompletionItemKind {
        return CompletionItemKind.File;
    }

    constructor(name: string, private resource: TsResource) {
        super(name, 0, 0, true);
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
    public get itemKind(): CompletionItemKind {
        return CompletionItemKind.Module;
    }
}
