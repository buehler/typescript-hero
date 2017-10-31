# TypeScript Hero

TypeScript Hero is a vscode extension that makes your life easier.
When you are coding a lot of `TypeScript` you may want vscode to automatically
include your imports.

If you search for this feature: here's the solution (and many more). Typescript hero will be extended
in the future and there are many features in the pipeline that will enhance the way you
work with typescript.

[![Travis build](https://img.shields.io/travis/buehler/typescript-hero.svg)](https://travis-ci.org/buehler/typescript-hero)
[![AppVeyor status](https://ci.appveyor.com/api/projects/status/p1vbbyh69j4s0rbh?svg=true)](https://ci.appveyor.com/project/buehler/typescript-hero)
[![Marketplace](https://vsmarketplacebadge.apphb.com/version-short/rbbit.typescript-hero.svg)](https://marketplace.visualstudio.com/items?itemName=rbbit.typescript-hero)
[![Installs](https://vsmarketplacebadge.apphb.com/installs/rbbit.typescript-hero.svg)](https://marketplace.visualstudio.com/items?itemName=rbbit.typescript-hero)
[![GitHub issues](https://img.shields.io/github/issues/buehler/typescript-hero.svg)](https://github.com/buehler/typescript-hero/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/buehler/typescript-hero.svg)](https://github.com/buehler/typescript-hero/pulls)
[![Semantic release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![Greenkeeper](https://badges.greenkeeper.io/buehler/typescript-hero.svg)](https://greenkeeper.io/)
[![License](https://img.shields.io/github/license/buehler/typescript-hero.svg)](https://github.com/buehler/typescript-hero/blob/master/LICENSE)

If you'd like to buy me a beer :-)

[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg)](https://paypal.me/rbbit)

## Features at a glance

Here is a brief list, of what TypeScript Hero is capable of (more at the end):

- Add imports of your project or libraries to your current file
- Add an import for the current name under the cursor
- Add all missing imports of a file with one command
- Intellisense that suggests symbols and automatically adds the needed imports
- "Light bulb feature" that fixes code you wrote
- Sort and organize your imports (sort and remove unused)
- Code outline view of your open TS / TSX document
- All the cool stuff for JavaScript as well! (experimental stage though, better description below.)
  - Add imports from javascript files
  - Code outline for JS / JSX files
  - Intellisense for JS / JSX files

## Commands

All commands are preceeded by `typescriptHero`.

| Command                      | Extension part  | Description                                               |
| ---------------------------- | --------------- | --------------------------------------------------------- |
| resolve.addImport            | import resolver | Shows a pick list with all recognized, importable symbols |
| resolve.addImportUnderCursor | import resolver | Imports the symbol under the cursor                       |
| resolve.addMissingImports    | import resolver | Imports all missing symbols for the actual document       |
| resolve.organizeImports      | import resolver | Removes unused imports and orders all imports             |
| resolve.rebuildCache         | import resolver | Rebuilds the whole symbol cache (or index)                |

## Keybindings

The following commands are bound by default when the extension is installed.

| Command                      | Keybinding         |
| ---------------------------- | ------------------ |
| resolve.addImport            | `ctrl+shift+i`     |
| resolve.addImportUnderCursor | `ctrl+alt+i`       |
| resolve.addMissingImports    | `ctrl+alt+shift+i` |
| resolve.organizeImports      | `ctrl+alt+o`       |

## Settings

In the following tables, all possible settings are explained. If you find any
settings that are not listed here, that means they are "beta" or "not implemented yet".

All settings are preceeded by `typescriptHero`.

### General

These settings do not have a prefix.

| Setting    | Description                                                                             |
| ---------- | --------------------------------------------------------------------------------------- |
| verbosity  | The log level that the extension writes its messages to the output channel and the file |

### Code completion

The following settings do have the prefix `codeCompletion`. So an example setting could be
`typescriptHero.codeCompletion.completionSortOrder`.

| Setting             | Description                                                                   |
| completionSortOrder | The order of import completions in suggestion list, `bottom` pushes them down |

### Import resolver

The following settings do have the prefix `resolver`. So an example setting could be
`typescriptHero.resolver.stringQuoteStyle`.

| Setting                               | Description                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| stringQuoteStyle                      | The string delimiter to use for the imports (`'` or `"`)                             |
| ignorePatterns                        | If any of these strings is part of a file path, the file is ignored                  |
| insertSpaceBeforeAndAfterImportBraces | If the extension should place spaces into import braces (`{Symbol}` vs `{ Symbol }`) |
| insertSemicolons                      | If the extension should add a semicolon to the end of a statement                    |
| multiLineWrapThreshold                | The threshold, when imports are converted into multiline imports                     |
| multiLineTrailingComma                | When multiline imports are created, `true` inserts a trailing comma to the last line |
| disableImportSorting                  | Disable sorting during organize imports action                                       |
| disableImportRemovalOnOrganize        | Disable removal unsed imports during organize imports action                         |
| importGroups                          | The groups that are used for sorting the imports (description below)                 |
| ignoreImportsForOrganize              | Imports that are never removed during organize import (e.g. react)                   |
| resolverMode                          | Which files should be considered to index for TypeScript Hero                        |
| organizeOnSave                        | Enable or disable the `organizeImports` action on a save of a document               |
| promptForSpecifiers                   | If the extension should ask the user for aliases and duplicate specifiers            |

### Code outline view

The following settings do have the prefix `codeOutline`. So an example setting could be
`typescriptHero.codeOutline.enabled`.

| Setting   | Description                                                                |
| --------- | -------------------------------------------------------------------------- |
| enabled   | Defines if the view should actually parse the opened documents             |

## Features (extended)

### Import management

TypeScript Hero can manage your imports. It is capable of:

- Import something you select from a list of all possible indexed symbols
- Import something that is beneath your current cursor position (and ask you if it's not sure which one)
- Import all missing identifiers of the current file
- Remove unused imports and sort the remaining ones by alphabet
- Do organize the imports when a document is saved
  - Note that this feature is only enabled if the vscode setting `editor.formatOnSave` is enabled as well!

#### Import groups

The import groups setting allows you to order all your imports as you may want. The settings is an array of elements.
An element can either be a string (with a certain keyword or a regex like string) or an object that contains an
identifier (with a certain keyword or a regex like string) and a sort order. The order you enter those objects / string
does matter since it is used to define the import groups.

An example (complex) could be:

```json
[
    "Plains",
    "/@angular/",
    {
        "identifier": "/Foo[1-9]Bar/",
        "order": "desc"
    },
    "Workspace",
    {
        "identifier": "Remaining",
        "order": "desc"
    }
]
```

##### Keyword imports

- `Modules` : contains all imports from modules (npm etc) `import ... from 'vscode';`
- `Plains` : contains all string only imports `import 'reflect-metadata;`
- `Workspace` : contains all local project files `import ... from '../server';`
- `Remaining` : contains all imports that are not matched by other import groups

(_hint_: The `Remaining` group is added implicitly as the last import group if not added specifically)

The default is as follows:

```json
[
    "Plains",
    "Modules",
    "Workspace"
]
```

For everybody that just wants all imports ordered in asc or desc, just overwrite the default with:

For all imports sorted asc:
```json
[]
```

For all imports sorted desc:
```json
[
    {
        "identifier": "Remaining",
        "order": "desc"
    }
]
```

##### Regex imports

The regex import group contains a regex string. Let's say you want to group all your `@angular` namespaced imports together
in one group you'd use `/@angular/` as "identifier" (either in the object when you want to change the order or just
the plain regex since default order is `asc`).

(_hint_: only the name of the library is matched against the regex)

```json
[
    "/@angular/"
]
```

The setting above would create two groups: one with all @angular imports another with all other imports.

```typescript
import {http} from '@angular/http';
import {component} from '@angular/core';

import 'reflect-metadata';
import {Server} from './server';
```

### Intellisense

Intellisense is a common IDE feature. TypeScript Hero provides you with symbols as you type your code
and does add the import to the top of the file, if you don't have already imported the symbol.

### Code fixing

The "light-bulb" feature of VSCode can provide some code-fix actions to take when you make mistakes.
TypeScript Hero offers the following fix actions:

- Detect a missing import and automatically add the import to the file
- Detect a missing import and offer to add all missing imports to the file
- Detect missing methods / properties of an interface that you implemented and implement them for you (implement interface refactoring)
- Detect missing abstract methods of an extended abstract class and implement them for you (implement abstract class refactoring)

### Code outline view

This view is below your file explorer. It displays a code outline of your actually opened typescript or typescript-react
file. If you switch your actual editor, the new file is parsed and shown. When you expand classes and imports, you'll
see what's in them. If you click on an element, the editor will jump to the location of the element.

By now, only typescript / typescript-react is supported. Maybe this will wander in it's own extension to support
more languages than those two.

### ES6 / JavaScript support

As of now, this is kind of an experimental stage. TypeScript Hero can be set into an `ES6` or `Both` mode, instead
of only `TypeScript`. With one of either modes, it will scan for javascript files in the workspace.

Right now, only files in the workspace are considered "worth", because of the immense amount of javascript files
in the `node_modules`. So if you set TSH to `ES6` it will scan all typescript declarations in the `node_modules`, and
your javascript files in the workspace. If you set it to `Both`, it will scan all typescript files and the javascript
files in the workspace (as well as the declarations).

## Known Issues

Please visit [the issue list](https://github.com/buehler/typescript-hero/issues) :-)
