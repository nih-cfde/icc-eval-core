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
import { isEmpty } from "lodash-es";
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
    log(error, "warn");
    return null;
  }
  if (format === "json" || path.endsWith(".json"))
    return parseJson<Data>(contents);
  if (format === "csv" || path.endsWith(".csv"))
    return parseCsv<Data>(contents, { delimiter: ",", ...options });
  if (format === "tsv" || path.endsWith(".tsv"))
    return parseCsv<Data>(contents, { delimiter: "\t", ...options });

  return null;
};

/** save data to file */
export const saveFile = (
  data: unknown,
  path: string,
  format?: Extensions,
  options?: StringifyOptions,
) => {
  let contents: string | NodeJS.ArrayBufferView = "";

  if (format === "json" || path.endsWith(".json"))
    contents = stringifyJson(data);
  if (format === "csv" || path.endsWith(".csv"))
    contents = stringifyCsv([data].flat(), { delimiter: ",", ...options });
  if (format === "tsv" || path.endsWith(".tsv"))
    contents = stringifyCsv([data].flat(), { delimiter: "\t", ...options });

  try {
    mkdirSync(parse(path).dir, { recursive: true });
    writeFileSync(path, contents);
    return true;
  } catch (error) {
    log(error, "error");
    return false;
  }
};

/** safe-parse json */
export const parseJson = <Data>(data: string) => {
  try {
    const result = JSON.parse(data);
    if (isEmpty(result)) throw Error("No data");
    return result as Data;
  } catch (error) {
    log(error, "warn");
    return null;
  }
};

/** stringify json */
export const stringifyJson = (data: unknown) => JSON.stringify(data, null, 2);

/** parse csv/tsv/etc contents */
export const parseCsv = <Data>(
  contents: Buffer | string,
  options?: ParseOptions,
) => {
  try {
    const result = csvParse(contents, {
      columns: true,
      skipEmptyLines: true,
      relaxQuotes: true,
      ...options,
    });
    if (isEmpty(result)) throw Error("No data");
    return result as Data;
  } catch (error) {
    log(error, "warn");
    return null;
  }
};

/** stringify csv/tsv/etc contents */
export const stringifyCsv = (contents: Input, options?: StringifyOptions) =>
  stringify(contents, {
    header: true,
    ...options,
  });
