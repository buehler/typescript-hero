import { Import } from './Import';

/**
 * Base interface for resources. All resources share the same properties.
 * Resources are files, namespaces or modules.
 * 
 * @export
 * @interface Resource
 */
export interface Resource {
    imports: Import[];
    // declarations: TsDeclaration[];
    // exports: TsExport[];
    // resources: TsResource[];
    // usages: string[];
}
