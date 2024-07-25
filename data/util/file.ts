import { mkdirSync, rmSync, writeFileSync } from "fs";
import { readFile } from "fs/promises";
import { parse, type Options as ParseOptions } from "csv-parse/sync";
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
export const loadFile = async <Data>(path: string, filename: Filename) => {
  let contents = "";
  try {
    contents = await readFile(`${path}/${filename}`, "utf-8");
  } catch (error) {
    return null;
  }
  if (filename.endsWith(".json")) return parseJson<Data>(contents);
  if (filename.endsWith(".csv")) return parseCsv<Data>(contents);
  return null;
};

/** save data to file */
export const saveFile = (data: unknown, path: string, filename: Filename) => {
  let contents: string | NodeJS.ArrayBufferView = "";

  if (filename.endsWith(".json")) contents = stringifyJson(data);
  if (filename.endsWith(".csv")) contents = stringifyCsv([data].flat());

  try {
    mkdirSync(path, { recursive: true });
    writeFileSync(`${path}/${filename}`, contents);
  } catch (error) {
    log(`Couldn't save ${path}/${filename}`, "error");
  }
};

/** safe-parse json */
export const parseJson = async <Data>(data: string) => {
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
  parse(contents, {
    columns: true,
    skipEmptyLines: true,
    relaxQuotes: true,
    cast: (value) => {
      const asNumber = Number(value.replace(",", "."));
      if (Number.isNaN(asNumber)) return value;
      else return asNumber;
    },
    ...options,
  }) as Result;

/** stringify csv/tsv/etc contents */
export const stringifyCsv = (contents: Input, options?: StringifyOptions) =>
  stringify(contents, options);
