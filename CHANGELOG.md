# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]

## [0.13.0]
### Big refactoring.
The whole refactoring is part of ([#143](https://github.com/buehler/typescript-hero/issues/143))

#### Fixed
- Imports from newly added tsx files aren't seen by resolver ([#169](https://github.com/buehler/typescript-hero/pull/169))
- Imports from modules with index file as the same name as containing folder no longer double up import path (i.e. Angular)
- Files without exports are no longer added to the index

#### Added
- Setting `typescriptHero.resolver.disableImportsSorting` that disables sorting of imports during organize.

#### Changed
- Setting `pathStringDelimiter` is now called `stringQuoteStyle`. It just makes more sense.
- Whole extension is now divided to an extension part and a language-server part. (YAY PERFORMANCE!)
- Parsing is done in the server, the rest should stay in the extension part so that one can access the stuff directly.
- Changed linting to airbnb linting

## [0.12.0]
#### Added
- Added setting `typescriptHero.resolver.insertSemicolons` to make disabling of semicolon emit possible (defaults to true)

#### Changed
- Default value of `typescriptHero.resolver.ignorePatterns` does not contain node_modules anymore
- Upgraded to TS2.1.4 ([#148](https://github.com/buehler/typescript-hero/issues/148))

#### Fixed
- "Flame" - state (error) should be shown correctly when indexing
- Duplicate declarations are filtered (overloads from declarations) ([#105](https://github.com/buehler/typescript-hero/issues/105))
- Only real workspace files are filtered by the exclude pattern (node_modules and typings are parsed) ([#103](https://github.com/buehler/typescript-hero/issues/103))
- Variables are sorted to the top to reduce auto import for `console` ([#99](https://github.com/buehler/typescript-hero/issues/99))
- Extension does not crash with prototype methods (thanks @gund) ([#79](https://github.com/buehler/typescript-hero/issues/79))

## [0.11.0]
#### Added
- Classmanager that can modify classes in a document ([#127](https://github.com/buehler/typescript-hero/issues/127))
- Support for light-bulb feature in tsx files ([#128](https://github.com/buehler/typescript-hero/issues/128))
- CodeFix can now implement missing methods and properties from interfaces and abstract classes ([#114](https://github.com/buehler/typescript-hero/issues/114))

## [0.10.1]
#### Added
- Notice when a symbol cannot be found by light bulb ([#123](https://github.com/buehler/typescript-hero/issues/123))

#### Fixed
- All possible found declarations are listen in light-blub ([#123](https://github.com/buehler/typescript-hero/issues/123))
- Removed "required" user answer ([#121](https://github.com/buehler/typescript-hero/issues/121))

## [0.10.0]
#### Added
- JSDOCS!
- Code action provider (light bulb) that imports missing imports as a code fix ([#11](https://github.com/buehler/typescript-hero/issues/11))
- Add all missing imports command usable through the gui or by command ([#106](https://github.com/buehler/typescript-hero/issues/106))

#### Changed
- Documents are managed by a controller that calculates all edits first before committing the changes

#### Fixed
- Initialize extension and completion provider for typescript react (.tsx) files ([#112](https://github.com/buehler/typescript-hero/pull/112))
- Ticks for expression strings are also considered as strings in autocompletion (`)

## [0.9.0]
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

## [0.8.0]
#### Added
- Support for multiline imports ([#60](https://github.com/buehler/typescript-hero/issues/60))
- Added setting for multiline threshold
- Configurable new import location (at top of the file or at the cursor position) ([#41](https://github.com/buehler/typescript-hero/issues/41))
- Asks for alias if a specifier is already present ([#44](https://github.com/buehler/typescript-hero/issues/44))

#### Fixed
- Autocomplete does not suggest items that are already imported ([#64](https://github.com/buehler/typescript-hero/issues/64))
- Autocomplete does not suggest items of the own file ([#61](https://github.com/buehler/typescript-hero/issues/61))
- Does not generate duplicates when multiline imports are used ([#43](https://github.com/buehler/typescript-hero/issues/43))
- Multiline imports were not working with multiple imports
- Autocomplete does not add other classes from a file as well

## [0.7.1]
#### Fixed
- Code completions does show when user types ([#55](https://github.com/buehler/typescript-hero/issues/55))
- Default exports and imports are working ([#40](https://github.com/buehler/typescript-hero/issues/40))
- New created files are correctly indexed now ([#46](https://github.com/buehler/typescript-hero/issues/46))

## [0.7.0]
#### Added
- More tests! :-) ([#8](https://github.com/buehler/typescript-hero/issues/8))
- CodeCompletionProvider that autocompletes your symbols and adds the imports if necessary ([#5](https://github.com/buehler/typescript-hero/issues/5))
- Support for `*.tsx` files ([#42](https://github.com/buehler/typescript-hero/issues/42))

#### Changed
- Import under cursor does only import if it's an exact match (PR [#35](https://github.com/buehler/typescript-hero/pull/35))
- Own imports (workspace) are sorted to the top ([#37](https://github.com/buehler/typescript-hero/issues/37))
- Updated inversify to v2

#### Fixed
- On Windows, forwardslashes will be used instead of backslashes ([#19](https://github.com/buehler/typescript-hero/issues/19)) (definitly this time)
- `export xxx as yyy` does now correctly use the alias of the declaration ([#36](https://github.com/buehler/typescript-hero/issues/36))
- Build directories are ignored by default (for indexing) ([#48](https://github.com/buehler/typescript-hero/issues/48))
- Substructures import parent index.ts files correctly now ([#49](https://github.com/buehler/typescript-hero/issues/49))

## [0.6.0]
#### Added
- Command to add an import from a symbol under the current cursor ([#22](https://github.com/buehler/typescript-hero/issues/22))

#### Changed
- Complete indexing / parsing engine was rewritten
- Adding an import does not automatically organize the imports afterwards ([#22](https://github.com/buehler/typescript-hero/issues/22), [#23](https://github.com/buehler/typescript-hero/issues/23))

#### Fixed
- Exports were not recursively merged ([#25](https://github.com/buehler/typescript-hero/issues/25))
- Imports should be added with forwardslashes ([#19](https://github.com/buehler/typescript-hero/issues/19))
- Imports are vanishing when usings are PropertyAssignments ([#27](https://github.com/buehler/typescript-hero/issues/27))
- Imports are vanishing on organize imports ([#30](https://github.com/buehler/typescript-hero/issues/30))

## [0.5.4]
#### Added
- Option to insert spaces before and after the curly braces of an import statement

#### Fixed
- Duplicated module entries should be gone
- Url for "Get Started" on publish page

## [0.5.0]
#### Added
- Output channel for logging (configurable verbosity)
- Commands from the resolver extension (to the cmd gui)

#### Fixed
- Tests on travis-ci
- Typos

## [0.4.0]
#### Added
- Organize imports
- Add new imports
- Debug restarter feature
- Command palette (`ctrl+alt+g`)

#### Fixed
- Various bugs in AST parsing


[Unreleased]: https://github.com/buehler/typescript-hero/compare/v0.13.0...master
[0.13.0]: https://github.com/buehler/typescript-hero/compare/v0.12.0...v0.13.0
[0.12.0]: https://github.com/buehler/typescript-hero/compare/v0.11.0...v0.12.0
[0.11.0]: https://github.com/buehler/typescript-hero/compare/v0.10.1...v0.11.0
[0.10.1]: https://github.com/buehler/typescript-hero/compare/v0.10.0...v0.10.1
[0.10.0]: https://github.com/buehler/typescript-hero/compare/v0.9.0...v0.10.0
[0.9.0]: https://github.com/buehler/typescript-hero/compare/v0.8.0...v0.9.0
[0.8.0]: https://github.com/buehler/typescript-hero/compare/v0.7.1...v0.8.0
[0.7.1]: https://github.com/buehler/typescript-hero/compare/v0.7.0...v0.7.1
[0.7.0]: https://github.com/buehler/typescript-hero/compare/v0.6.0...v0.7.0
[0.6.0]: https://github.com/buehler/typescript-hero/compare/v0.5.4...v0.6.0
[0.5.4]: https://github.com/buehler/typescript-hero/compare/v0.5.0...v0.5.4
[0.5.0]: https://github.com/buehler/typescript-hero/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/buehler/typescript-hero/tree/v0.4.0
