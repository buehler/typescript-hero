/**
 * Creates a template from an expression string. The template can then be used to infuse stuff into the template.
 * 
 * @export
 * @param {string[]} strings
 * @param {...number[]} keys
 * @returns {(...values: any[]) => string}
 */
export function stringTemplate(strings: TemplateStringsArray, ...keys: number[]): (...values: any[]) => string {
    return (...values: any[]) => {
        const result = [strings[0]];

        keys.forEach((key, idx) => {
            result.push(values[key], strings[idx + 1]);
        });

        return result.join('');
    };
}
