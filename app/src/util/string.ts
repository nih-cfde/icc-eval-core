import { isValid } from "date-fns";
import TimeAgo from "javascript-time-ago";
import en from "javascript-time-ago/locale/en";
import { truncate } from "lodash";

/** format arbitrary value as string based on detected type */
export const format = <Type>(
  cell: Type,
  compact = false,
  options?: Type extends number | Array<unknown> | object
    ? Intl.NumberFormatOptions
    : Type extends Date
      ? Intl.DateTimeFormatOptions
      : undefined,
): string => {
  /** if number */
  if (typeof cell === "number") {
    if (Number.isNaN(cell)) return "-";
    if (!Number.isFinite(cell)) return cell > 0 ? "∞" : "-∞";
    return cell.toLocaleString(undefined, {
      notation: compact ? "compact" : "standard",
      ...options,
    });
  }
  /** if true/false */
  if (typeof cell === "boolean") return cell ? "Yes" : "No";
  /** if '' | null | undefined */
  if (!cell) return "-";
  /** if array */
  if (Array.isArray(cell))
    /** use length */
    return format(cell.length, compact);
  /** date */
  if (cell instanceof Date) {
    if (!isValid(cell)) return "-";
    return `${cell.toLocaleString(undefined, {
      dateStyle: compact ? "short" : "medium",
      ...options,
    })} (${ago(cell)} ago)`;
  }
  /** if object */
  if (typeof cell === "object")
    /** use number of keys */
    return format(Object.keys(cell).length, compact);
  /** if string */
  if (typeof cell === "string")
    /** shorten */
    return truncate(cell, { length: 100 });
  return "-";
};

/** init time ago library */
TimeAgo.addDefaultLocale(en);
const timeAgo = new TimeAgo("en-US");

/** get nice human-readable string for time elapsed since date */
export const ago = (date: Date) => timeAgo.format(date, "mini");

/** get nice human-readable string for time span */
export const span = (seconds: number) =>
  seconds === 0 ? "-" : timeAgo.format(Date.now() - seconds * 1000, "mini");

/** print out keys/values of object */
export const printObject = (object: object | undefined | null) =>
  Object.entries(object ?? {})
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");

/** case insensitive match */
export const match = (a: string, b: string) =>
  a.toLowerCase() === b.toLowerCase();

/** format bytes */
export const bytes = (bytes: number) => {
  const units = ["B", "KB", "MB", "GB"];
  while (bytes > 1024 && units.length) {
    bytes /= 1024;
    units.shift();
  }
  return bytes.toFixed(1) + " " + units[0]!;
};
