import chalk from "chalk";

/** indent level */
let level = 0;
export const indent = () => level < 5 && level++;
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
};

/** print horizontal divider */
export const divider = () => log("secondary", "--------------------", 0);

/** print newline */
export const newline = () => log("", "", 0);
