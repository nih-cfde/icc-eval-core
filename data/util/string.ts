import { parse } from "path";
import { isValid } from "date-fns";
import { size } from "lodash-es";

/** (lodash's capitalize forces later characters to lower case) */
export const capitalize = (string: string) =>
  string.substring(0, 1).toUpperCase() + string.substring(1);

/** get "size" of value and format as string */
export const count = (value: unknown) => {
  if (typeof value === "number") return value.toLocaleString();
  if (typeof value === "object" && value !== null)
    return size(value).toLocaleString();
  return String(value);
};

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
export const formatDate = (date?: ConstructorParameters<typeof Date>[0]) => {
  if (!date) return "";
  const _date = new Date(date);
  if (isValid(_date)) return _date.toISOString();
  return "";
};

/** split full url or path into parts */
export const splitPath = (path: string) => {
  let dir = "";
  let name = "";
  let ext = "";

  try {
    /** parse as url */
    const { origin, pathname, search, hash } = new URL(path);
    const parsed = parse(decodeURI(pathname));
    dir = decodeURI(
      [origin, parsed.dir, search, hash].filter(Boolean).join(""),
    );
    name = parsed.name;
    ext = parsed.ext;
  } catch (error) {
    /** parse as path */
    const parsed = parse(path);
    dir = parsed.dir;
    name = parsed.name;
    ext = parsed.ext;
  }

  /** remove dot from extension */
  ext = ext.replace(/^\./, "");

  /** if missing/invalid extension, consider a folder and remove file props */
  if (!ext || ext.match(/[^A-Za-z0-9]/)) {
    dir += [name, ext].filter(Boolean).join(".");
    name = "";
    ext = "";
  }

  /** remove leading/trailing slashes */
  dir = dir.replace(/^\//, "").replace(/\/$/, "");

  return { dir, name, ext };
};
