import { parse } from 'path';
import { ScriptKind } from 'typescript';
import {
  ClassDeclaration,
  ConstructorDeclaration,
  Declaration,
  DefaultDeclaration,
  EnumDeclaration,
  FunctionDeclaration,
  GetterDeclaration,
  InterfaceDeclaration,
  MethodDeclaration,
  ModuleDeclaration,
  ParameterDeclaration,
  PropertyDeclaration,
  SetterDeclaration,
  TypeAliasDeclaration,
  VariableDeclaration,
} from 'typescript-parser';
import { CompletionItemKind } from 'vscode';

/**
 * Returns the item kind for a given declaration.
 *
 * @export
 * @param {Declaration} declaration
 * @returns {CompletionItemKind}
 */
export function getItemKind(declaration: Declaration): CompletionItemKind {
  switch (true) {
    case declaration instanceof ClassDeclaration:
      return CompletionItemKind.Class;
    case declaration instanceof ConstructorDeclaration:
      return CompletionItemKind.Constructor;
    case declaration instanceof DefaultDeclaration:
      return CompletionItemKind.File;
    case declaration instanceof EnumDeclaration:
      return CompletionItemKind.Enum;
    case declaration instanceof FunctionDeclaration:
      return CompletionItemKind.Function;
    case declaration instanceof InterfaceDeclaration:
      return CompletionItemKind.Interface;
    case declaration instanceof MethodDeclaration:
      return CompletionItemKind.Method;
    case declaration instanceof ModuleDeclaration:
      return CompletionItemKind.Module;
    case declaration instanceof ParameterDeclaration:
      return CompletionItemKind.Variable;
    case declaration instanceof PropertyDeclaration:
      return CompletionItemKind.Property;
    case declaration instanceof TypeAliasDeclaration:
      return CompletionItemKind.TypeParameter;
    case declaration instanceof VariableDeclaration:
      const variable = declaration as VariableDeclaration;
      return variable.isConst ?
        CompletionItemKind.Constant :
        CompletionItemKind.Variable;
    case declaration instanceof GetterDeclaration:
    case declaration instanceof SetterDeclaration:
      return CompletionItemKind.Method;
    default:
      return CompletionItemKind.Reference;
  }
}

/**
 * Calculates the scriptkind for the typescript parser based on filepath.
 *
 * @export
 * @param {string} filePath
 * @returns {ScriptKind}
 */
export function getScriptKind(filePath: string | undefined): ScriptKind {
  if (!filePath) {
    return ScriptKind.TS;
  }
  const parsed = parse(filePath);
  switch (parsed.ext) {
    case '.ts':
      return ScriptKind.TS;
    case '.tsx':
      return ScriptKind.TSX;
    case '.js':
      return ScriptKind.JS;
    case '.jsx':
      return ScriptKind.JSX;
    default:
      return ScriptKind.Unknown;
  }
}
