export function isString(str: any): str is string {
    return str.constructor === String;
}
