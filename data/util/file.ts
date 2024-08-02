import { spawn as nodeSpawn } from "child_process";
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from "fs";
import { readdir } from "fs/promises";
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
import { midTrunc } from "@/util/string";

const { RAW_PATH, NOCACHE } = process.env;

type Extensions = "json" | "csv" | "tsv" | "txt";

export type Filename = `${string}.${Extensions}`;

/** make fresh folder */
export const clearFolder = (path: string) => {
  rmSync(path, { force: true, recursive: true });
  mkdirSync(path, { recursive: true });
};

/** download file from url (if filename not already present) */
export const downloadFile = async (
  url: string,
  path: string,
  onProgress?: (percent: number) => void,
) => {
  /** always download to raw */
  path = `${RAW_PATH}/${path}`;

  /** create folders if needed */
  mkdirSync(parse(path).dir, { recursive: true });

  /** will we be using existing/cached file */
  const cached = !NOCACHE && existsSync(path);

  if (cached) log(`Using cache ${midTrunc(path, 40)}`, "secondary");

  const downloader = new Downloader({
    url,
    fileName: path,
    skipExistingFileName: !NOCACHE,
    cloneFiles: false,
    maxAttempts: 3,
    onProgress: (percentage) => {
      /** call provided progress callback */
      !cached && onProgress?.(Number(percentage) / 100);
    },
  });

  /** trigger download */
  await downloader.download();

  return { path, cached, stats: statSync(path) };
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
  if (format === "txt" || path.endsWith(".txt") || path.endsWith(".gmt"))
    return contents as Data;

  return null;
};

/** extract zip file contents */
export const unzip = async (filename: string) => {
  const { dir, name } = parse(filename);
  /** folder to output zip file contents to */
  const output = `${dir}/${name}`;
  /** unzip command */
  const [cmd, ...args] = ["unzip", filename, "-d", output];
  try {
    /** if output folder already has contents, return file paths */
    if (existsSync(output)) return await readdir(output, { recursive: true });
    /** clear folder to avoid unzip halting */
    clearFolder(output);
    /** run unzip */
    await spawn(cmd!, args);
    /** return file paths */
    return await readdir(output, { recursive: true });
  } catch (error) {
    log(`unzip(${filename}): ${error}`, "warn");
    /** clear folder to not end up with partial contents */
    clearFolder(output);
    return null;
  }
};

type Spawn = Parameters<typeof nodeSpawn>;

/** https://stackoverflow.com/questions/72862197/how-to-use-promisify-with-the-spawn-function-for-the-child-process */
const spawn = (cmd: Spawn[0], args: Spawn[1] = [], options: Spawn[2] = {}) =>
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
    /** create folders if needed */
    mkdirSync(parse(path).dir, { recursive: true });
    /** save file */
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
    log(`parseJson(): ${error}`, "warn");
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
    log(`parseCsv(): ${error}`, "warn");
    return null;
  }
};

/** stringify csv/tsv/etc contents */
export const stringifyCsv = (contents: Input, options?: StringifyOptions) =>
  stringify(contents, {
    header: true,
    ...options,
  });
