export function isString(str: any): str is string {
    return str.constructor === String;
}

export function isNumber(str: any): str is number {
    return str.constructor === Number;
}
