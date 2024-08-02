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

/** get url extension, without dot (for paths, use path module) */
export const getExt = (url?: string) =>
  url?.match(/\.([0-9a-z]+)$/i)?.[1] ?? "???";

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
