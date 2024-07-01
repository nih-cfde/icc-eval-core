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
  /** default level */
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

type Message = Parameters<typeof console.log>[0];

/** log message */
export const log = (
  message: Message,
  type: keyof typeof levels | "" = "",
  manualLevel?: number,
) => {
  const indent = "  ".repeat(manualLevel ?? level);
  const color = type && type in levels ? levels[type] : levels.info;
  console.log(color(indent, message));
  if (type === "error") throw Error(message);
};

/** print horizontal divider. use as major/higher-level divider. */
export const divider = () => {
  newline();
  log("--------------------", "secondary", 0);
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

/** progress bar */
export const progress = (message: Message, key: string, obj: object) => {
  const chars = 10;
  const index =
    (Array.isArray(obj) ? Number(key) : Object.keys(obj).indexOf(key)) + 1;
  const length = Array.isArray(obj) ? obj.length : Object.keys(obj).length;
  const percent = index / length;
  const bar = "▓".repeat(chars * percent) + "░".repeat(chars * (1 - percent));
  log(`${message} ${bar} (${index} of ${length})`);
};
