import {TsResolveFileParser} from './src/parser/TsResolveFileParser';
import path = require('path');

var util = require('util');
const file = path.join(__dirname, '../demo.d.ts');

let a = new TsResolveFileParser().parseFile(file);

console.log(util.inspect(a, false, null));
process.exit(0);
