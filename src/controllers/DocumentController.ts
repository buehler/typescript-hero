import { TsFile } from '../models/TsResource';
import { InjectorDecorators } from '../IoC';
import { TsResourceParser } from '../parser/TsResourceParser';
import { TextDocument } from 'vscode';

export class DocumentController {
    @InjectorDecorators.lazyInject(TsResourceParser)
    private static parser: TsResourceParser;

    private constructor(private readonly document: TextDocument, private parsedDocument: TsFile) { }

    public static async create(document: TextDocument): Promise<DocumentController> {
        let source = await DocumentController.parser.parseSource(document.getText());
        return new DocumentController(document, source);
    }
}
