import 'reflect-metadata';
import {TsResourceParser} from './parser/TsResourceParser';
import {join} from 'path';
import {inspect} from 'util';

let parser = new TsResourceParser(() => {
    return <any>{
        info: () => {},
        warning: () => {},
        error: () => {}
    };
});

const file = join(process.cwd(), '.test/resourceParser/interface.ts');

parser.parseFile(<any>{ fsPath: file })
    .then(parsed => {
        console.log(inspect(parsed, false, null));
        process.exit(0);
    });
