import {TsResolveFileParser} from './src/parser/TsResolveFileParser';
import path = require('path');

const file = path.join(__dirname, '../demo.d.ts');

let a = new TsResolveFileParser().parseFile(file);

console.log(a);
console.log(a.nonLocalUsages);
process.exit(0);
