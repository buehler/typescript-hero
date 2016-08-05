# Typescript Hero

`typescript hero` is a vscode extension that makes your live easier.
When you are coding a lot of `TypeScript` you may want vscode to automatically
include your imports.

If you search for this feature: here's the solution. Typescript hero will be extended
in the future and there are many features in the pipeline that will enhance the way you
work with typescript.

## Features

- Open a command list to see all commands of typescript hero [`ctrl+alt+g`]
- Add imports of your project or libraries to your current file [`ctrl+alt+i`]
- Sort and organize your imports (sort and remove unused) [`ctrl+alt+o`]
- Restart your debug session when your code changes

## Extension Settings

### Input organizer

- `typescriptHero.resolver.pathStringDelimiter`: The string delimiter to use for the imports

### Debug session restarter

- `typescriptHero.restartDebugger.watchFolders`: Which output folders should be watched to trigger a restart
- `typescriptHero.restartDebugger.active`: Is the automatical debug restarter active at startup 

## Known Issues

- Some module declarations from typings files can be duplicated

## Release Notes

This section will cover the newest release, for the rest of the changelog,
please visit the [CHANGELOG.md](CHANGELOG.md)

### 0.4.0

#### Added
- Organize imports
- Add new imports
- Debug restarter feature
- Command palette (`ctrl+alt+g`)

#### Fixed
- Various bugs in AST parsing