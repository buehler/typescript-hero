export function stringTemplate(strings: string[], ...keys: number[]): (...values: any[]) => string {
    return (...values: any[]) => {
        let result = [strings[0]];

        keys.forEach(function (key, idx) {
            result.push(values[key], strings[idx + 1]);
        });

        return result.join('');
    };
}
