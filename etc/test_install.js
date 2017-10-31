const { existsSync } = require('fs');
const { join } = require('path');

if (existsSync(join(__dirname, '..', 'node_modules', 'vscode', 'bin', 'install'))) {
    process.exit(0);
    return;
}
process.exit(1);
