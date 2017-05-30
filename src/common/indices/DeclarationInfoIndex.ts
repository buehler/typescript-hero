import { DeclarationInfo } from '../ts-parsing/declarations';

/**
 * Type for the reverse index of all declarations
 */
export type DeclarationInfoIndex = { [declaration: string]: DeclarationInfo[] };
