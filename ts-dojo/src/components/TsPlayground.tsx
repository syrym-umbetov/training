import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyFlags,
  editor as monacoEditor,
  getDiagnostics,
  getTypeAt,
  Uri,
  type Diag,
  type Flags,
} from '../monaco/setup.ts';
import { DiagnosticsPanel } from './DiagnosticsPanel.tsx';

type Props = {
  fileName: string;
  code: string;
  onCodeChange: (next: string) => void;
  flags: Flags;
  onDiagnostics?: (diags: Diag[]) => void;
  height?: number;
};

export function TsPlayground({
  fileName,
  code,
  onCodeChange,
  flags,
  onDiagnostics,
  height = 320,
}: Props) {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const editorRef = useRef<monacoEditor.IStandaloneCodeEditor | null>(null);
  const modelRef = useRef<monacoEditor.ITextModel | null>(null);
  const timerRef = useRef<number | null>(null);
  const changeRef = useRef(onCodeChange);
  changeRef.current = onCodeChange;

  const [diags, setDiags] = useState<Diag[]>([]);
  const [probe, setProbe] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const model = modelRef.current;
    if (!model || model.isDisposed()) return;
    const next = await getDiagnostics(model);
    setDiags(next);
    onDiagnostics?.(next);
  }, [onDiagnostics]);

  const scheduleRefresh = useCallback(() => {
    if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    timerRef.current = window.setTimeout(() => void refresh(), 350);
  }, [refresh]);

  // Create the editor once; the model URI has to be unique per playground so
  // each one is its own file for the language service.
  useEffect(() => {
    const host = hostRef.current;
    if (!host) return;

    const uri = Uri.parse(fileName);
    const model =
      monacoEditor.getModel(uri) ?? monacoEditor.createModel(code, 'typescript', uri);
    modelRef.current = model;

    const instance = monacoEditor.create(host, {
      model,
      theme: 'vs-dark',
      fontSize: 13.5,
      fontFamily:
        'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
      minimap: { enabled: false },
      scrollBeyondLastLine: false,
      renderLineHighlight: 'gutter',
      tabSize: 2,
      padding: { top: 12, bottom: 12 },
      smoothScrolling: true,
      automaticLayout: true,
      fixedOverflowWidgets: true,
    });
    editorRef.current = instance;

    const onChange = model.onDidChangeContent(() => {
      changeRef.current(model.getValue());
    });

    const onCursor = instance.onDidChangeCursorPosition((e) => {
      void getTypeAt(model, e.position).then(setProbe);
    });

    // The cursor starts at 1:1, so nothing fires until it moves — seed it once.
    void getTypeAt(model, instance.getPosition() ?? { lineNumber: 1, column: 1 }).then(setProbe);
    void refresh();

    return () => {
      onChange.dispose();
      onCursor.dispose();
      instance.dispose();
      model.dispose();
      editorRef.current = null;
      modelRef.current = null;
    };
    // fileName identifies the playground; code is the initial value only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fileName]);

  // Reset button and variant switching push a new value in from the outside.
  useEffect(() => {
    const model = modelRef.current;
    if (model && !model.isDisposed() && model.getValue() !== code) {
      model.setValue(code);
    }
  }, [code]);

  // Compiler options are global to the service, so re-apply and re-check.
  useEffect(() => {
    applyFlags(flags);
    scheduleRefresh();
  }, [flags, scheduleRefresh]);

  useEffect(() => {
    scheduleRefresh();
  }, [code, scheduleRefresh]);

  useEffect(
    () => () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const jumpTo = (d: Diag) => {
    const instance = editorRef.current;
    if (!instance) return;
    instance.revealLineInCenter(d.line);
    instance.setPosition({ lineNumber: d.line, column: d.column });
    instance.focus();
  };

  return (
    <div className="playground">
      <div ref={hostRef} className="playground__editor" style={{ height }} />

      <div className="probe">
        <span className="probe__label">тип под курсором</span>
        <code className="probe__value">{probe ?? 'поставь курсор на любое имя'}</code>
      </div>

      <DiagnosticsPanel diags={diags} onJump={jumpTo} />
    </div>
  );
}
