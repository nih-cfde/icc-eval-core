import chalk from "chalk";

/** log levels */
const levels = {
  /** default level */
  "": { color: chalk, icon: "" },
  /** important info */
  primary: { color: chalk.magenta, icon: "" },
  /** less important info */
  secondary: { color: chalk.gray, icon: "" },
  /** success */
  success: { color: chalk.green, icon: "✓" },
  /** needs attention */
  warn: { color: chalk.yellow, icon: "⚠" },
  /** critical error */
  error: { color: chalk.red, icon: "✗" },
} as const;

type Message = Parameters<typeof console.log>[0];

/** log message with level and indent */
export const log = (
  message: Message,
  level: keyof typeof levels = "",
  indent = 0,
) => {
  const { color, icon } = levels[level];
  console.log("  ".repeat(indent) + color(icon, message));
  if (level === "error") throw Error(message);
};

/** print horizontal divider. use as major/higher-level divider. */
export const divider = (message: Message) => {
  const hr = "------------------------------------------------------------";
  log(hr, "secondary");
  log(message, "primary");
  log(hr, "secondary");
};

/** singleton start timestamp */
let start = 0;

/** log start timestamp */
export const timeStart = () => {
  const now = Date.now();
  start = now;
  log(`Timer started ${now}`, "secondary");
};

/** log end timestamp */
export const timeEnd = () => {
  const now = Date.now();
  const took = now - start;
  start = 0;
  log(`Timer ended ${now}, took ${formatTime(took)}ms`, "secondary");
};

/** format ms to minutes and seconds */
const formatTime = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m${seconds}s`;
};
