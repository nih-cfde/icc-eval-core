import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";

TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo("en-US");

/** get nice human-readable string for time elapsed since date */
export const ago = (date: Date) => timeAgo.format(date);

/** get nice human-readable string for time span */
export const span = (seconds: number) =>
  timeAgo
    .format(Date.now() - seconds * 1000)
    .replace("ago", "")
    .trim();

/** print out keys/values of object */
export const printObject = (object: object | undefined | null) =>
  Object.entries(object ?? {})
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

/** case insensitive match */
export const match = (a: string, b: string) => !!a.match(new RegExp(b, "i"));

/** format bytes */
export const bytes = (bytes: number) => {
  const units = ["B", "KB", "MB", "GB"];
  while (bytes > 1024 && units.length) {
    bytes /= 1024;
    units.shift();
  }
  return bytes.toFixed(1) + " " + units[0]!;
};
