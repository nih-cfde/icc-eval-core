import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from "fs";
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
import Downloader from "nodejs-file-downloader";
import { log } from "@/util/log";

const { RAW_PATH, NOCACHE } = process.env;

type Extensions = "json" | "csv" | "tsv";

export type Filename = `${string}.${Extensions}`;

/** make fresh folder */
export const clearFolder = (path: string) => {
  rmSync(path, { force: true, recursive: true });
  mkdirSync(path, { recursive: true });
};

/** download file from url (if filename not already present) */
export const downloadFile = async (
  url: string,
  filename: string,
  onProgress?: (percent: number) => void,
) => {
  const path = `${RAW_PATH}/${filename}`;
  if (existsSync(path)) log("Using cache", "secondary");
  await new Downloader({
    url,
    fileName: path,
    skipExistingFileName: !NOCACHE,
    cloneFiles: false,
    maxAttempts: 3,
    onProgress: (percentage) => onProgress?.(Number(percentage)),
  }).download();
  return path;
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
    const parsed = JSON.parse(data) as Data;
    if (isEmpty(parsed)) throw Error("No data");
    return parsed as NonNullable<Data>;
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
    const data = csvParse(contents, {
      columns: true,
      skipEmptyLines: true,
      relaxQuotes: true,
      ...options,
    }) as unknown;
    if (isEmpty(data)) throw Error("No data");
    return data as NonNullable<Data>;
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
