import {TsResolveFileParser} from './src/parser/TsResolveFileParser';
import path = require('path');

const file = path.join(__dirname, '../test.ts');

let a = new TsResolveFileParser().parseFile(file);

console.log(a);
process.exit(0);
