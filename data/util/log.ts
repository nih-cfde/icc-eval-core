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
  if (["string", "number", "boolean"].includes(typeof message))
    console.log("  ".repeat(indent) + color(icon, message));
  else console.log(message);
  if (level === "error") throw Error(message);
};

/** print horizontal divider. use as major/higher-level divider. */
export const divider = (message: Message) => {
  const hr = "------------------------------------------------------------";
  log(hr, "secondary");
  log(message, "primary");
  log(hr, "secondary");
};

/** timer timestamps */
const timers: Record<string, number> = {};

/** log start timestamp */
export const timeStart = (label = "default") => {
  const now = Date.now();
  timers[label] = now;
  log(`${label} timer started, ${formatTimestamp(now)}`, "secondary", 1);
};

/** log end timestamp */
export const timeEnd = (label = "default") => {
  const start = timers[label];
  if (!start) return;
  const now = Date.now();
  const took = now - start;
  timers[label] = 0;
  log(
    `${label} timer ended, ${formatTimestamp(now)}, took ${formatDuration(took)}`,
    "secondary",
    1,
  );
};

/** format timestamp */
export const formatTimestamp = (timestamp: number) =>
  new Date(timestamp).toLocaleString();

/** format duration in ms to minutes and seconds */
export const formatDuration = (ms: number) => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}m ${seconds}s`;
};
