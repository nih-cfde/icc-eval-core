import chalk from "chalk";

/** indent level */
let indentCount = 1;

/** increase log indent level */
export const indent = () => indentCount < 5 && indentCount++;
/** decrease log indent level */
export const deindent = () => indentCount > 1 && indentCount--;

/** log levels */
const levels = {
  /** default level */
  default: { color: chalk.cyan, icon: "" },
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

type Message = Parameters<typeof console.log>[0];

/** log message */
export const log = (
  message: Message,
  level: keyof typeof levels | "" = "",
  manualIndent?: number,
) => {
  const indent = "    ".repeat(manualIndent ?? indentCount);
  const { color, icon } =
    level && level in levels ? levels[level] : levels.default;
  if (icon) message = icon + " " + message;
  console.log(color(indent, message));
  if (level === "error") throw Error(message);
  return message;
};

/** print horizontal divider. use as major/higher-level divider. */
export const divider = (message: Message) => {
  const hr = "------------------------------------------------------------";
  log(hr, "secondary", 0);
  log(message, "primary", 0);
  log(hr, "secondary", 0);
};

/** print newline. use as minor/lower-level divider. */
export const newline = () => log("", "", 0);

/** progress bar */
export const progress = (message: Message, percent: number) => {
  const chars = 10;
  const bar = "▓".repeat(chars * percent) + "░".repeat(chars * (1 - percent));
  log(`${message} ${bar}`);
};
