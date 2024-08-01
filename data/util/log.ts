import chalk from "chalk";
import { clamp } from "lodash-es";

/** indent level */
let indentCount = 1;

/** increase log indent level */
export const indent = () => indentCount < 5 && indentCount++;
/** decrease log indent level */
export const deindent = () => indentCount > 1 && indentCount--;

/** log levels */
export const levels = {
  /** default level */
  "": { color: chalk, icon: "" },
  /** important info */
  primary: { color: chalk.magenta, icon: "" },
  /** less important info */
  secondary: { color: chalk.gray, icon: "" },
  /** starting some process */
  start: { color: chalk.gray, icon: "⋯" },
  /** success */
  success: { color: chalk.green, icon: "✓" },
  /** needs attention */
  warn: { color: chalk.yellow, icon: "⚠" },
  /** critical error */
  error: { color: chalk.red, icon: "✗" },
} as const;

export type Level = keyof typeof levels;

type Message = Parameters<typeof console.log>[0];

/** get indent string */
export const getIndent = (manualIndent?: number) =>
  "  ".repeat(manualIndent ?? indentCount);

/** format message with color and icon */
export const format = (
  message: Message,
  level: keyof typeof levels | "" = "",
): string => {
  const { color, icon } = levels[level];
  message = (icon + " " + message).trim();
  return color(message);
};

/** print message to console */
export const log = (
  message: Message,
  level: keyof typeof levels | "" = "",
  update = false,
  manualIndent?: number,
): string => {
  message = format(message, level);
  const indent = getIndent(manualIndent);
  if (update) {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(indent + message);
  } else {
    console.log(indent + message);
  }
  if (level === "error") throw Error(message);
  return message;
};

/** print horizontal divider. use as major/higher-level divider. */
export const divider = (message: Message) => {
  const hr = "------------------------------------------------------------";
  log(hr, "secondary", false, 0);
  log(message, "primary", false, 0);
  log(hr, "secondary", false, 0);
};

/** print newline. use as minor/lower-level divider. */
export const newline = () => log("", "", false, 0);

/**
 * progress/state of task. log level type (success/error/etc) or percent
 * complete.
 */
type Progress = Level | number;

/** progress bar for single task, simple percentage */
export const progress = () => {
  /** derive functionality from multi progress bar */
  const { set, done } = progressMulti(1, multiCharBar);
  return {
    set: (progress: Progress) => set(0, progress),
    done,
  };
};

/** progress bar for multiple tasks */
export const progressMulti = (
  /** total number of entries to make and track */
  length: number,
  bar: (percent: number) => string = singleCharBar,
) => {
  /**
   * current state of progresses. log level type (success/error/etc) or percent
   * complete.
   */
  const state: Progress[] = Array(length).fill("");
  /** update progress of particular entry */
  const set = (index: number, progress: Progress) => {
    state[index] = progress;
    if (!Number.isNaN(progress))
      log(
        state
          .map((progress) =>
            typeof progress === "number"
              ? format(bar(progress), "secondary")
              : format("", progress),
          )
          .join(""),
        "",
        true,
      );
  };
  /** return funcs to allow calling from outside */
  return { set, done: newline };
};

/** get single char to indicate progress percent */
const singleCharBar = (percent: number) => {
  const chars = "▁▂▃▄▅▆▇█";
  const index = Math.round(percent * (chars.length - 1));
  return chars.charAt(clamp(index, 0, chars.length));
};

/** get multi-char bar to indicate progress percent */
const multiCharBar = (percent: number) => {
  const length = 10;
  percent = clamp(percent, 0, 1);
  return "▓".repeat(length * percent) + "░".repeat(length * (1 - percent));
};
