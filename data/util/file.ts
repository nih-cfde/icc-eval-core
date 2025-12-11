import { spawn as nodeSpawn } from "child_process";
import { existsSync } from "fs";
import { mkdir, readFile, stat, writeFile } from "fs/promises";
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
import * as prettier from "prettier";
import { HttpRangeReader, ZipReader } from "@zip.js/zip.js";
import { log } from "@/util/log";
import { memoize } from "@/util/memoize";
import { request } from "@/util/request";
import { formatDate, midTrunc } from "@/util/string";

const { RAW_PATH, OUTPUT_PATH, CACHE } = process.env;

type Extensions = "json" | "csv" | "tsv" | "txt";

export type Filename = `${string}.${Extensions}`;

/** get file stats in standard format */
const getStats = async (path: string) => {
  const { size, mtime } = await stat(path);
  return { size, date: formatDate(mtime) };
};

export type Stats = Awaited<ReturnType<typeof getStats>>;

/** download file from url (if filename not already present) */
export const downloadFile = async (
  url: string,
  path: string,
  onProgress?: (percent: number) => void,
) => {
  /** always download to raw */
  path = `${RAW_PATH}/${path}`;

  /** create folders if needed */
  await mkdir(parse(path).dir, { recursive: true });

  /** will we be using existing/cached file */
  const cached = CACHE && existsSync(path);

  if (cached) log(`Using cache ${midTrunc(path, 40)}`, "secondary");
  else {
    /** create downloader */
    const downloader = new Downloader({
      url,
      fileName: path,
      cloneFiles: false,
      maxAttempts: 3,
      onProgress: (percentage) =>
        /** call provided progress callback */
        onProgress?.(Number(percentage) / 100),
    });

    /** trigger download */
    await downloader.download();
  }

  return { path, ...(await getStats(path)), cached };
};

/** get info of remote file without downloading */
export const liteDownloadFile = memoize(async (url: string) => {
  const response = await request(url, { method: "HEAD" }, true);
  const size = Number(response.headers.get("Content-Length"));
  const date = formatDate(response.headers.get("Last-Modified") ?? "");
  return { url, path: "", size, date };
});

/** load data from file */
export const loadFile = async <Data>(
  path: string,
  format?: Extensions,
  options?: ParseOptions,
) => {
  let contents = "";
  let data: Data | null = null;

  contents = await readFile(path, "utf-8");

  if (format === "json" || path.endsWith(".json"))
    data = parseJson<Data>(contents);
  else if (format === "csv" || path.endsWith(".csv"))
    data = parseCsv<Data>(contents, { delimiter: ",", ...options });
  else if (format === "tsv" || path.endsWith(".tsv"))
    data = parseCsv<Data>(contents, { delimiter: "\t", ...options });
  else if (format === "txt" || path.endsWith(".txt") || path.endsWith(".gmt"))
    data = contents as Data;
  else data = [] as Data;

  return { data, ...(await getStats(path)) };
};

/** get file listing of remote zip file without downloading entire file */
export const liteUnzip = memoize(
  async (url: string, onProgress?: (percent: number) => void) =>
    (
      await new ZipReader(new HttpRangeReader(url)).getEntries({
        onprogress: async (progress, total) => onProgress?.(progress / total),
      })
    ).map((entry) => ({
      url,
      path: entry.filename,
      size: entry.uncompressedSize,
      date: formatDate(entry.lastModDate),
    })),
);

// eslint-disable-next-line
type AsyncFunc = (...args: any) => Promise<unknown>;
export type Result<Func extends AsyncFunc> = Awaited<ReturnType<Func>>;

/** load existing data from output folder */
export const loadOutput = async <Data>(file: string) => {
  const path = `${OUTPUT_PATH}/${file}`;
  try {
    return (await loadFile<Data>(path)).data;
  } catch (error) {
    throw Error(`Couldn't load ${file}`);
  }
};

type Spawn = Parameters<typeof nodeSpawn>;

/** https://stackoverflow.com/questions/72862197/how-to-use-promisify-with-the-spawn-function-for-the-child-process */
export const spawn = (
  cmd: Spawn[0],
  args: Spawn[1] = [],
  options: Spawn[2] = {},
) =>
  new Promise((resolve, reject) => {
    setTimeout(
      () => reject(`Spawn process timeout ${cmd} ${args.join(" ")}`),
      60 * 1000,
    );
    const process = nodeSpawn(cmd, args, options);
    const errors: string[] = [];
    const stdout: string[] = [];
    process.stdout?.on("data", (data) => stdout.push(String(data)));
    process.on("error", (error) =>
      errors.push([cmd, ...args, error].join(" ")),
    );
    process.on("close", () =>
      errors.length ? reject(errors.join(" ")) : resolve(stdout.join("")),
    );
  });

/** save data to file */
export const saveFile = async (data: unknown, path: string) => {
  let contents: string | NodeJS.ArrayBufferView = "";

  if (path.endsWith(".json")) contents = await stringifyJson(data);
  if (path.endsWith(".csv"))
    contents = stringifyCsv([data].flat(), { delimiter: "," });
  if (path.endsWith(".tsv"))
    contents = stringifyCsv([data].flat(), { delimiter: "\t" });

  try {
    /** create folders if needed */
    await mkdir(parse(path).dir, { recursive: true });
    /** save file */
    await writeFile(path, contents);
    return true;
  } catch (error) {
    log(error, "error");
    return false;
  }
};

/** parse json */
export const parseJson = <Data>(data: string) => {
  const parsed = JSON.parse(data) as Data;
  if (isEmpty(parsed)) throw Error("No data");
  return parsed as NonNullable<Data>;
};

/** stringify json */
export const stringifyJson = (data: unknown) =>
  prettier.format(JSON.stringify(data), { parser: "json" });

/** parse csv/tsv/etc contents */
export const parseCsv = <Data>(
  contents: Buffer | string,
  options?: ParseOptions,
) => {
  const data = csvParse(contents, {
    columns: true,
    skipEmptyLines: true,
    relaxQuotes: true,
    ...options,
  }) as unknown;
  if (isEmpty(data)) throw Error("No data");
  return data as NonNullable<Data>;
};

/** stringify csv/tsv/etc contents */
export const stringifyCsv = (contents: Input, options?: StringifyOptions) =>
  stringify(contents, {
    header: true,
    ...options,
  });
