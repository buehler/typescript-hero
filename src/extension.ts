import { ExtensionContext } from 'vscode';

export async function activate(context: ExtensionContext): Promise<void> {
  console.log('yay', context);
}
