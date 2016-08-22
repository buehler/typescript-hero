import 'reflect-metadata';
import {TsResourceParser} from './parser/TsResourceParser';
import {join} from 'path';

let parser = new TsResourceParser(() => {
    return <any>{
        info: () => {},
        warning: () => {},
        error: () => {}
    };
});

const file = join(process.cwd(), '.test/resourceParser/enum.ts');

parser.parseFile(<any>{ fsPath: file })
    .then(parsed => {
        console.log(parsed);
        process.exit(0);
    });
