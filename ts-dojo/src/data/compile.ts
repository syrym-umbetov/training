import ts from 'typescript';
import { join } from 'node:path';

/** Mirrors the compiler options the browser playground applies. */
export const LESSON_OPTIONS: ts.CompilerOptions = {
  target: ts.ScriptTarget.ESNext,
  lib: ['lib.esnext.full.d.ts'],
  module: ts.ModuleKind.ESNext,
  moduleResolution: ts.ModuleResolutionKind.Node10,
  moduleDetection: ts.ModuleDetectionKind.Force,
  jsx: ts.JsxEmit.ReactJSX,
  noEmit: true,
  skipLibCheck: true,
  verbatimModuleSyntax: true,
  strict: true,
  strictNullChecks: true,
  strictFunctionTypes: true,
  noImplicitAny: true,
  noUncheckedIndexedAccess: true,
  exactOptionalPropertyTypes: true,
};

// Inside the project directory, so `react` and friends resolve from node_modules
// exactly as they do for the app itself.
const FILE = join(process.cwd(), 'lesson.tsx');

/**
 * Type-checks a snippet in memory and returns the error codes it produced,
 * in source order. This is the same compiler the page runs, so a lesson that
 * passes here cannot claim something the page contradicts.
 */
export function check(code: string, options: ts.CompilerOptions = LESSON_OPTIONS): number[] {
  const source = ts.createSourceFile(FILE, code, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
  const host = ts.createCompilerHost(options, true);
  const originalGetSource = host.getSourceFile.bind(host);

  host.getSourceFile = (name, languageVersion, onError, shouldCreate) =>
    name === FILE ? source : originalGetSource(name, languageVersion, onError, shouldCreate);
  host.fileExists = (name) => name === FILE || ts.sys.fileExists(name);
  host.readFile = (name) => (name === FILE ? code : ts.sys.readFile(name));
  host.writeFile = () => undefined;

  const program = ts.createProgram([FILE], options, host);
  return [
    ...program.getSyntacticDiagnostics(source),
    ...program.getSemanticDiagnostics(source),
  ]
    .sort((a, b) => (a.start ?? 0) - (b.start ?? 0))
    .map((d) => d.code);
}

export function describeDiagnostics(code: string): string[] {
  const source = ts.createSourceFile(FILE, code, ts.ScriptTarget.ESNext, true, ts.ScriptKind.TSX);
  const host = ts.createCompilerHost(LESSON_OPTIONS, true);
  const originalGetSource = host.getSourceFile.bind(host);
  host.getSourceFile = (name, lv, onError, shouldCreate) =>
    name === FILE ? source : originalGetSource(name, lv, onError, shouldCreate);
  host.fileExists = (name) => name === FILE || ts.sys.fileExists(name);
  host.readFile = (name) => (name === FILE ? code : ts.sys.readFile(name));
  host.writeFile = () => undefined;

  const program = ts.createProgram([FILE], LESSON_OPTIONS, host);
  return [...program.getSyntacticDiagnostics(source), ...program.getSemanticDiagnostics(source)].map(
    (d) => {
      const { line } = source.getLineAndCharacterOfPosition(d.start ?? 0);
      return `${line + 1}: TS${d.code} ${ts.flattenDiagnosticMessageText(d.messageText, ' ')}`;
    },
  );
}
