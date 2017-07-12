declare module 'Module' {
    export function modFunc(): void;
}

declare namespace Namespace {
    class NotExported { }

    export enum Exported {
        MemberA,
        MemberB
    }
}
