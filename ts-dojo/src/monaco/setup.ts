import './editor-core.ts';
import 'monaco-editor/languages/definitions/typescript/register.js';
import { editor, Uri } from 'monaco-editor/editor/editor.api.js';
import * as typescript from 'monaco-editor/languages/features/typescript/register.js';
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker';
import TsWorker from 'monaco-editor/languages/features/typescript/ts.worker.js?worker';

type WorkerEnv = { MonacoEnvironment?: { getWorker(id: string, label: string): Worker } };

(self as unknown as WorkerEnv).MonacoEnvironment = {
  getWorker(_id, label) {
    if (label === 'typescript' || label === 'javascript') return new TsWorker();
    return new EditorWorker();
  },
};

/** The exact TypeScript the language service in this page runs — not a lookalike. */
export const TS_VERSION: string = typescript.typescriptVersion;

/** The tsconfig switches a lesson lets you flip at runtime. */
export type FlagName =
  | 'strict'
  | 'strictNullChecks'
  | 'strictFunctionTypes'
  | 'noImplicitAny'
  | 'noUncheckedIndexedAccess'
  | 'exactOptionalPropertyTypes';

export type Flags = Record<FlagName, boolean>;

export const DEFAULT_FLAGS: Flags = {
  strict: true,
  strictNullChecks: true,
  strictFunctionTypes: true,
  noImplicitAny: true,
  noUncheckedIndexedAccess: true,
  exactOptionalPropertyTypes: true,
};

export const FLAG_DOCS: Record<FlagName, string> = {
  strict: 'Включает всю семью strict* разом. Выключи — и половина ошибок урока исчезнет.',
  strictNullChecks: 'null и undefined перестают быть членами каждого типа.',
  strictFunctionTypes: 'Контравариантная проверка параметров функций. Методы объектов не покрывает.',
  noImplicitAny: 'Запрещает выведенный any там, где тип вывести не удалось.',
  noUncheckedIndexedAccess: 'arr[0] и dict[key] получают | undefined. Индексы становятся честными.',
  exactOptionalPropertyTypes: '{ a?: number } перестаёт принимать { a: undefined }.',
};

/** ts.ModuleDetectionKind.Force — monaco's enums don't expose it, the option does. */
const MODULE_DETECTION_FORCE = 3;

export function applyFlags(flags: Flags): void {
  typescript.typescriptDefaults.setCompilerOptions({
    target: typescript.ScriptTarget.ESNext,
    lib: ['esnext.full'],
    module: typescript.ModuleKind.ESNext,
    moduleResolution: typescript.ModuleResolutionKind.NodeJs,
    // Every playground is its own file. Without this they are global scripts
    // and a `class Celsius` in one lesson collides with the same name in another.
    moduleDetection: MODULE_DETECTION_FORCE,
    allowNonTsExtensions: true,
    noEmit: true,
    skipLibCheck: true,
    verbatimModuleSyntax: true,
    ...flags,
  });
}

/**
 * The TS mode registers itself lazily, the first time a typescript model shows
 * up, so the very first call can land before it exists. Wait it out.
 */
async function tsWorkerFactory(): Promise<(...uris: Uri[]) => Promise<TsClient>> {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      return (await typescript.getTypeScriptWorker()) as (...uris: Uri[]) => Promise<TsClient>;
    } catch {
      await new Promise((resolve) => window.setTimeout(resolve, 50));
    }
  }
  throw new Error('TypeScript language service never registered');
}

type TsClient = {
  getSemanticDiagnostics(uri: string): Promise<typescript.Diagnostic[]>;
  getSyntacticDiagnostics(uri: string): Promise<typescript.Diagnostic[]>;
  getQuickInfoAtPosition(uri: string, offset: number): Promise<unknown>;
};

export type Diag = {
  code: number;
  message: string;
  line: number;
  column: number;
  category: 'error' | 'warning' | 'suggestion' | 'message';
};

type ChainLike = { messageText: string | ChainLike; next?: ChainLike[] };

function flattenMessage(text: string | ChainLike, depth = 0): string {
  if (typeof text === 'string') return text;
  const head = '  '.repeat(depth) + flattenMessage(text.messageText);
  const rest = (text.next ?? []).map((n) => flattenMessage(n, depth + 1));
  return [head, ...rest].join('\n');
}

const CATEGORY: Record<number, Diag['category']> = {
  0: 'warning',
  1: 'error',
  2: 'suggestion',
  3: 'message',
};

/** Every diagnostic the real language service produced, in 1-based editor positions. */
export async function getDiagnostics(model: editor.ITextModel): Promise<Diag[]> {
  const getWorker = await tsWorkerFactory();
  const client = await getWorker(model.uri);
  const uri = model.uri.toString();

  const [semantic, syntactic] = await Promise.all([
    client.getSemanticDiagnostics(uri),
    client.getSyntacticDiagnostics(uri),
  ]);

  return [...syntactic, ...semantic]
    .map((d): Diag => {
      const start = model.getPositionAt(d.start ?? 0);
      return {
        code: d.code,
        message: flattenMessage(d.messageText as string | ChainLike),
        line: start.lineNumber,
        column: start.column,
        category: CATEGORY[d.category] ?? 'error',
      };
    })
    .sort((a, b) => a.line - b.line || a.column - b.column);
}

/** The type TypeScript infers at a position — the hover text, as a plain string. */
export async function getTypeAt(
  model: editor.ITextModel,
  position: { lineNumber: number; column: number },
): Promise<string | null> {
  const getWorker = await tsWorkerFactory();
  const client = await getWorker(model.uri);
  const info = (await client.getQuickInfoAtPosition(
    model.uri.toString(),
    model.getOffsetAt(position),
  )) as { displayParts?: { text: string }[] } | undefined;
  if (!info) return null;

  const parts = info.displayParts ?? [];
  const text = parts.map((p) => p.text).join('');
  return text.length > 0 ? text : null;
}

export { editor, Uri };
