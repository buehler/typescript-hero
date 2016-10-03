export type TsImportOptions = {
    pathDelimiter: string,
    spaceBraces: boolean,
    multiLineWrapThreshold: number,
    tabSize: number
};

export enum ImportLocation {
    TopOfFile,
    AtCursorLocation
}
