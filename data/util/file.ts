import { mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
import { parse } from "path";
import {
  parse as csvParse,
  type Options as ParseOptions,
} from "csv-parse/sync";
import {
  stringify,
  type Input,
  type Options as StringifyOptions,
} from "csv-stringify/sync";
import { log } from "@/util/log";

type Extensions = "json" | "csv" | "tsv";

export type Filename = `${string}.${Extensions}`;

/** make fresh folder */
export const clearFolder = (path: string) => {
  rmSync(path, { force: true, recursive: true });
  mkdirSync(path, { recursive: true });
};

/** load data from file */
export const loadFile = <Data>(
  path: string,
  format?: Extensions,
  options?: ParseOptions,
) => {
  let contents = "";
  try {
    contents = readFileSync(path, "utf-8");
  } catch (error) {
    return null;
  }
  if (format === "json" || path.endsWith(".json"))
    return parseJson<Data>(contents);
  if (format === "csv" || path.endsWith(".csv"))
    return parseCsv<Data>(contents, options);
  return null;
};

/** save data to file */
export const saveFile = (data: unknown, path: string, format?: Extensions) => {
  let contents: string | NodeJS.ArrayBufferView = "";

  if (format === "json" || path.endsWith(".json"))
    contents = stringifyJson(data);
  if (format === "csv" || path.endsWith(".csv"))
    contents = stringifyCsv([data].flat());

  try {
    mkdirSync(parse(path).dir, { recursive: true });
    writeFileSync(path, contents);
  } catch (error) {
    log(`Couldn't save ${path}`, "error");
  }
};

/** safe-parse json */
export const parseJson = <Data>(data: string) => {
  try {
    return JSON.parse(data) as Data;
  } catch (error) {
    return null;
  }
};

/** stringify json */
export const stringifyJson = (data: unknown) => JSON.stringify(data, null, 2);

/** parse csv/tsv/etc contents */
export const parseCsv = <Result>(
  contents: Buffer | string,
  options?: ParseOptions,
) =>
  csvParse(contents, {
    columns: true,
    skipEmptyLines: true,
    relaxQuotes: true,
    cast: (value, context) => {
      if (context.header) return value;
      const asNumber = Number(value.replaceAll(",", "."));
      if (Number.isNaN(asNumber)) return value;
      else return asNumber;
    },
    ...options,
  }) as Result;

const cast = (value: unknown) => String(value);

/** stringify csv/tsv/etc contents */
export const stringifyCsv = (contents: Input, options?: StringifyOptions) =>
  stringify(contents, { cast: { number: cast }, ...options });
