export function JSXFunction() {
    return (
        <div>
            <ThisIsBig />
        </div>
    );
}

export class JSXClass {
    render() {
        return (
            <JSXFunction />
        );
    }
}
