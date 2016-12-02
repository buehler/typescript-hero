function function1(param1): string {
    let var1 = 'foobar';
    return 'foobar';
}

export function function2(param1: string, { objParam1, objParam2 }, [arrParam1, arrParam2]): void {
    const constVar1 = 'foobar';
}

function withoutReturnType() {
    return '';
}

function typeGuard(str: any): str is number {
    return str.constructor === Number;
}
