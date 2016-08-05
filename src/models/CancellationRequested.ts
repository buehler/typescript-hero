export class CancellationRequested extends Error {
    constructor() {
        super();
        this.message = '';
        this.stack = '';
        this.name = '';
    }
}
