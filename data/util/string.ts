import { parse } from "path";
import { size } from "lodash-es";

/** get "size" of value and format as string */
export const count = (value: unknown) => {
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "object" && value !== null)
    return size(value).toLocaleString();
  return String(value);
};

/** format bytes */
export const bytes = (bytes: number) => {
  const units = ["B", "KB", "MB", "GB"];
  while (bytes > 1024 && units.length) {
    bytes /= 1024;
    units.shift();
  }
  return bytes.toFixed(1) + " " + units[0]!;
};

/** if url, convert to file path (by removing origin) */
export const urlToPath = (url: string) => {
  try {
    return new URL(url).pathname.replace(/^\//, "");
  } catch (error) {
    return url;
  }
};

/** truncate string from middle */
export const midTrunc = (string: string, limit: number) => {
  const join = " ... ";
  limit -= join.length;
  const reduce = string.length - limit;
  if (reduce <= 0) return string;
  const start = Math.ceil(string.length / 2 - reduce / 2);
  const end = Math.ceil(string.length / 2 + reduce / 2);
  return string.slice(0, start) + join + string.slice(end);
};

/** format date as iso string */
export const formatDate = (date?: ConstructorParameters<typeof Date>[0]) =>
  date ? new Date(date).toISOString() : "";

/** split full path into parts */
export const parsePath = (path: string) => {
  const { dir, name, ext } = parse(urlToPath(path));
  return { dir, name, ext: ext.replace(/^\./, "") };
};
