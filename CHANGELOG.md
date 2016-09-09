# Change Log
All notable changes to this project will be documented in this file.
This project adheres to [Semantic Versioning](http://semver.org/).

## [Unreleased]
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

### [0.4.0]
#### Added
- Organize imports
- Add new imports
- Debug restarter feature
- Command palette (`ctrl+alt+g`)

#### Fixed
- Various bugs in AST parsing


[Unreleased]: https://github.com/buehler/typescript-hero/compare/v0.5.4...master
[0.5.4]: https://github.com/buehler/typescript-hero/compare/v0.5.0...v0.5.4
[0.5.0]: https://github.com/buehler/typescript-hero/compare/v0.4.0...v0.5.0
[0.4.0]: https://github.com/buehler/typescript-hero/tree/v0.4.0
