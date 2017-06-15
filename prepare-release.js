#!/usr/bin/env node

const fs = require('fs'),
    exec = require('child_process').execSync;

if (!process.argv || process.argv.length < 3) {
    throw new Error('missing argument (ver nr)');
}

const versionNumber = process.argv[2];

console.log('Create release branch');

exec(`git checkout -b release/${versionNumber}`);

console.log(`Update changelog`);

let changelog = fs.readFileSync('./CHANGELOG.md', 'utf-8');
changelog = changelog.replace(/## \[Unreleased\]/, `## [Unreleased]\n\n## [${versionNumber}]`);
changelog = changelog.replace(/\[Unreleased\]\:.*v(.*)\.\.\.master/, `[Unreleased]: https://github.com/buehler/typescript-hero/compare/v${versionNumber}...master
[${versionNumber}]: https://github.com/buehler/typescript-hero/compare/v$1...v${versionNumber}`);

fs.writeFileSync('./CHANGELOG.md', changelog, { encoding: 'utf-8' });

console.log('Commit changelog');

exec('git add CHANGELOG.md');
exec(`git commit -m "Update changelog to v${versionNumber}"`);

console.log('Update package.json version');

exec(`npm --no-git-tag-version version ${versionNumber}`);
exec('git add package.json');
exec('git add package-lock.json');
exec(`git commit -m "Update package.json to v${versionNumber}"`);
