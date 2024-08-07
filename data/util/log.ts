import chalk from "chalk";
import { clamp } from "lodash-es";
import { count } from "@/util/string";

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

/** whether most recent log was an in-place or new line */
let prevInPlace = false;

/** print message to console */
export const log = (
  message: Message,
  level: keyof typeof levels | "" = "",
  inPlace = false,
  manualIndent?: number,
): string => {
  message = format(message, level);
  const indent = getIndent(manualIndent);
  if (inPlace) {
    process.stdout.clearLine(0);
    process.stdout.cursorTo(0);
    process.stdout.write(indent + message);
    prevInPlace = true;
  } else {
    if (prevInPlace) console.log();
    console.log(indent + message);
    prevInPlace = false;
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

/** progress/state of task. log level (success/error/etc) or percent complete. */
type Progress = Level | number;

/** progress bar */
export const progress = (
  /** total number of entries to make and track */
  length: number,
) => {
  /** current state of progresses */
  const state: Progress[] = Array(length).fill("");

  /** print progress */
  const print = () => {
    /** single */
    if (length === 1) {
      const progress = state[0]!;
      if (typeof progress === "number")
        log(longBar(progress), "secondary", true);
      else log("", progress);
    }

    /** multi */
    if (length > 1) {
      const successes = state.filter((state) => state === "success");
      const errors = state.filter((state) => state === "error");
      const left = state.filter(
        (state) => state !== "success" && state !== "error",
      );
      const progresses = state.filter((state) => typeof state === "number");
      log(
        [
          successes.length &&
            format(count(successes) + " successes", "success"),
          errors.length && format(count(errors) + " errors", "error"),
          left.length && format(count(left) + " left", "start"),
          progresses.map(charBar).join(""),
        ]
          .filter(Boolean)
          .join(" "),
        "",
        true,
      );
    }
  };

  /** update progress of particular entry */
  const set = (index: number, progress: Progress) => {
    state[index] = progress;
    print();
  };

  return set;
};

/** get single char to indicate progress of many items */
const charBar = (percent: number) => {
  if (Number.isNaN(percent)) return spinner();
  const chars = "▁▂▃▄▅▆▇█";
  const index = Math.round(percent * (chars.length - 1));
  return chars.charAt(clamp(index, 0, chars.length));
};

/** get long bar to indicate progress of single item */
const longBar = (percent: number) => {
  if (Number.isNaN(percent)) return spinner();
  const length = 10;
  percent = clamp(percent, 0, 1);
  return "▓".repeat(length * percent) + "░".repeat(length * (1 - percent));
};

/** indeterminate spinner */
const spinner = () => {
  const chars = "◐◓◑◒";
  const percent = ((2 * performance.now()) / 1000) % 1;
  const index = Math.round(percent * (chars.length - 1));
  return chars.charAt(clamp(index, 0, chars.length));
};
