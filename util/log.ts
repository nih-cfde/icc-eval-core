import { mkdirSync, writeFileSync } from "fs";
import chalk from "chalk";

/** indent level */
let level = 0;

/** increase log indent level */
export const indent = () => level < 5 && level++;
/** decrease log indent level */
export const deindent = () => level > 0 && level--;

/** log levels */
const levels = {
  /** general info */
  info: chalk.cyan,
  /** less important info */
  secondary: chalk.gray,
  /** success */
  success: chalk.green,
  /** needs attention */
  warn: chalk.yellow,
  /** critical error */
  error: chalk.red,
} as const;

/** log message */
export const log = (
  type: keyof typeof levels | "" = "",
  message: Parameters<typeof console.log>[0],
  manualLevel?: number,
) => {
  const indent = "  ".repeat(manualLevel ?? level);
  if (type && type in levels) console.log(levels[type](indent, message));
  else console.log(indent, message);
  if (type === "error") throw Error(message);
};

/** print horizontal divider. use as major/higher-level divider. */
export const divider = () => {
  newline();
  log("secondary", "--------------------", 0);
  newline();
};

/** print newline. use as minor/lower-level divider. */
export const newline = () => log("", "", 0);

/** save large data to log file */
export const diskLog = (data: unknown, filename?: string) => {
  const string = JSON.stringify(data, null, 2);
  filename ??= String(Date.now());
  mkdirSync("./logs", { recursive: true });
  writeFileSync(`./logs/${filename}.json`, string);
};
