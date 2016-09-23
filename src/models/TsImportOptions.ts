export type TsImportOptions = {
    pathDelimiter: string,
    spaceBraces: boolean,
    multiLineWrapThreshold: number
};

export enum ImportLocation {
    TopOfFile,
    AtCursorLocation
}
