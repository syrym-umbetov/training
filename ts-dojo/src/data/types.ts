import type { Flags } from '../monaco/setup.ts';

export type Variant = {
  id: string;
  label: string;
  code: string;
  /** Shown after the learner reveals the answer. */
  verdict: string;
  /**
   * Error codes this snippet must produce, asserted by the lesson test suite —
   * so a verdict can never drift away from what the compiler actually says.
   * An empty array means "must compile clean".
   */
  expect: number[];
};

export type Experiment = {
  id: string;
  title: string;
  /** What to predict before running it. */
  question: string;
  variants: Variant[];
  takeaway: string;
};

export type Check =
  | { kind: 'noErrors' }
  | { kind: 'errorCodes'; codes: number[] }
  | { kind: 'forbid'; pattern: string; message: string }
  | { kind: 'require'; pattern: string; message: string };

export type Task = {
  id: string;
  title: string;
  brief: string;
  constraints: string[];
  starter: string;
  /** Codes the untouched starter must produce, so a task can't start green. */
  starterExpect: number[];
  checks: Check[];
  hints: string[];
  solution: string;
};

export type Lesson = {
  slug: string;
  block: number;
  order: number;
  title: string;
  shortTitle: string;
  summary: string;
  theory: string[];
  docs: { label: string; href: string }[];
  flags?: Partial<Flags>;
  experiments: Experiment[];
  tasks: Task[];
};
