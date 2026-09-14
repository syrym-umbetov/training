// Внешний "стенд" для страницы про конвейер dispatch → middleware → reducer.
// Как и ActionLog, живёт вне Redux, чтобы наблюдение за конвейером
// само не порождало новых экшенов внутри этого же конвейера.

export type PipelineStage = 'dispatch' | 'logger' | 'thunk' | 'reducer' | 'state';

export interface PipelineFrame {
  stage: PipelineStage;
  note: string;
  /** false — значит на этой стадии экшен дальше не пошёл (например, thunk съел функцию). */
  passed: boolean;
}

let frames: PipelineFrame[] = [];
let running = false;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

export const pipeline = {
  subscribe(l: () => void) {
    listeners.add(l);
    return () => listeners.delete(l);
  },
  getFrames: () => frames,
  isRunning: () => running,
  reset() {
    frames = [];
    running = false;
    emit();
  },
  async play(script: PipelineFrame[], stepMs = 650) {
    running = true;
    frames = [];
    emit();
    for (const frame of script) {
      frames = [...frames, frame];
      emit();
      await new Promise((r) => setTimeout(r, stepMs));
      // Если экшен на этой стадии не прошёл дальше — обрываем анимацию.
      if (!frame.passed) break;
    }
    running = false;
    emit();
  },
};
