# TypeScript Hero

TypeScript Hero is a vscode extension that makes your live easier.
When you are coding a lot of `TypeScript` you may want vscode to automatically
include your imports.

If you search for this feature: here's the solution (and many more). Typescript hero will be extended
in the future and there are many features in the pipeline that will enhance the way you
work with typescript.

## Features at a glance

Here is a brief list, of what TypeScript Hero is capable of:

- Add imports of your project or libraries to your current file
- Add an import for the current name under the cursor
- Intellisense that suggests symbols and automatically adds the needed imports
- Sort and organize your imports (sort and remove unused)
- Restart your debug session when your code changes

##### Some badges :-)

[![Travis](https://img.shields.io/travis/buehler/typescript-hero.svg)](https://travis-ci.org/buehler/typescript-hero)
[![Marketplace](http://vsmarketplacebadge.apphb.com/version-short/rbbit.typescript-hero.svg)](https://marketplace.visualstudio.com/items?itemName=rbbit.typescript-hero)
[![Installs](http://vsmarketplacebadge.apphb.com/installs/rbbit.typescript-hero.svg)](https://marketplace.visualstudio.com/items?itemName=rbbit.typescript-hero)
[![GitHub issues](https://img.shields.io/github/issues/buehler/typescript-hero.svg)](https://github.com/buehler/typescript-hero/issues)
[![GitHub pull requests](https://img.shields.io/github/issues-pr/buehler/typescript-hero.svg)](https://github.com/buehler/typescript-hero/pulls)
[![license](https://img.shields.io/github/license/buehler/typescript-hero.svg)](https://github.com/buehler/typescript-hero)

## Commands

All commands are preceeded by `typescriptHero`.

| Command                      | Extension part  | Description                                               |
| ---------------------------- | --------------- | --------------------------------------------------------- |
| showCmdGui                   | general         | Shows a small gui with all awailable internal commands    |
| resolve.addImport            | import resolver | Shows a pick list with all recognized, importable symbols |
| resolve.addImportUnderCursor | import resolver | Imports the symbol under the cursor                       |
| resolve.organizeImports      | import resolver | Removes unused imports and orders all imports             |
| resolve.rebuildCache         | import resolver | Rebuilds the whole symbol cache (or index)                |
| restartDebugger.toggle       | debug restarter | Toggles the active state of the debug restarter           |

## Keybindings

The following commands are bound by default when the extension is installed.

| Command                      | Keybinding         |
| ---------------------------- | ------------------ |
| showCmdGui                   | `ctrl+alt+g`       |
| resolve.addImport            | `ctrl+alt+i`       |
| resolve.addImportUnderCursor | `ctrl+alt+shift+i` |
| resolve.organizeImports      | `ctrl+alt+o`       |

## Settings

In the following tables, all possible settings are explained. If you find any
settings that are not listed here, that means they are "beta" or "not implemented yet".

All settings are preceeded by `typescriptHero`.

### General

These settings do not have a prefix.

| Setting   | Description                                                                |
| --------- | -------------------------------------------------------------------------- |
| verbosity | The log level that the extension writes its messages to the output channel |

### Import resolver

The following settings do have the prefix `resolver`. So an example setting could be
`typescriptHero.resolver.pathStringDelimiter`.

| Setting                               | Description                                                                          |
| ------------------------------------- | ------------------------------------------------------------------------------------ |
| pathStringDelimiter                   | The string delimiter to use for the imports                                          |
| ignorePatterns                        | If any of these strings is part of a file path, the file is ignored                  |
| insertSpaceBeforeAndAfterImportBraces | If the extension should place spaces into import braces (`{Symbol}` vs `{ Symbol }`) |
| multiLineWrapThreshold                | The threshold, when imports are converted into multiline imports                     |
| newImportLocation                     | The location of new imports (at the top of the file, or at the cursor location)      |

### Debug session restarter

The following settings do have the prefix `restartDebugger`. So an example setting could be
`typescriptHero.restartDebugger.watchFolders`.

| Setting      | Description                                                 |
| ------------ | ----------------------------------------------------------- |
| watchFolders | Which output folders should be watched to trigger a restart |
| active       | If true, the debug restart is activated on startup          |

## Known Issues

Please visit [the issue list](https://github.com/buehler/typescript-hero/issues) :-)

## Release Notes

This section will cover the newest release, for the rest of the changelog,
please visit the [CHANGELOG](https://github.com/buehler/typescript-hero/blob/master/CHANGELOG.md)

### 0.9.0
#### Added
- Typescript symbols know their positions (resources, declarations, imports, exports)
- Statusbar item for the state of the debug restarter ([#85](https://github.com/buehler/typescript-hero/issues/85))
- Import a default export does suggest a name ([#71](https://github.com/buehler/typescript-hero/issues/71))
- Support for `@types` style definitions of TS2.0 ([#77](https://github.com/buehler/typescript-hero/issues/77))

#### Changed
- Upgrade to TS2.0 ([#88](https://github.com/buehler/typescript-hero/issues/88))
- Default value of `typescriptHero.resolver.insertSpaceBeforeAndAfterImportBraces` is `true` now

#### Fixed
- New imports will be below `"use strict"` if it's the first line ([#73](https://github.com/buehler/typescript-hero/issues/73))
- Multiline imports respect `editor.tabSize` ([#74](https://github.com/buehler/typescript-hero/issues/74))
- Reload index when configuration of the ignore patterns changed ([#75](https://github.com/buehler/typescript-hero/issues/75))
- Autocomplete filters local file usages ([#69](https://github.com/buehler/typescript-hero/issues/69))
- Default exports do not break extension anymore ([#79](https://github.com/buehler/typescript-hero/issues/79))
- Node pathes are correctly split ([#76](https://github.com/buehler/typescript-hero/issues/76))
- Exports from root index.ts are not empty
