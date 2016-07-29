import * as inversify from 'inversify';
import * as vscode from 'vscode';
import {ResolveCache} from '../caches/ResolveCache';

@inversify.injectable()
export class ResolveExtension {
    constructor( @inversify.inject('context') context: vscode.ExtensionContext, private cache: ResolveCache) {
        console.log('ResolveExtension instantiated');
    }

    
}
