import chalk from "chalk";

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

/** progress bar for simple % */
export const progress = (message: Message, percent: number) => {
  const chars = 10;
  const bar = "▓".repeat(chars * percent) + "░".repeat(chars * (1 - percent));
  log(`${message} ${bar}`);
};

/** status bar for start/success/error */
export const status = (length: number) => {
  const bar: Level[] = Array(length).fill("start");
  const set = (index: number, status: (typeof bar)[number]) => {
    bar[index] = status;
    print();
  };
  const print = () =>
    log(bar.map((status) => format("", status)).join(""), "", true);
  print();
  const done = newline;
  return { set, done };
};
