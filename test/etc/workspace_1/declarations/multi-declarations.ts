export interface Interface {
  method1(): void;
  method2(str: string): number;
}

export class Class {
  public prop: string;

  public aMethod<T>(str: string): T {
    return null as T;
  }

  private bMethod(): void { }
}

export let exportedVariable = '';

export const exportedConstant = '';

export enum Enum {
  a,
  b,
  c,
}
