import { spawn as nodeSpawn } from "child_process";
import { existsSync, type Stats } from "fs";
import { mkdir, readdir, readFile, rm, stat, writeFile } from "fs/promises";
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
export const clearFolder = async (path: string) => {
  await rm(path, { force: true, recursive: true });
  await mkdir(path, { recursive: true });
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
  await mkdir(parse(path).dir, { recursive: true });

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

  return { path, stats: await stat(path) };
};

/** load data from file */
export const loadFile = async <Data>(
  path: string,
  format?: Extensions,
  options?: ParseOptions,
) => {
  let contents = "";
  let data: Data | null = null;
  let stats: Stats | null = null;

  contents = await readFile(path, "utf-8");
  stats = await stat(path);

  if (format === "json" || path.endsWith(".json"))
    data = parseJson<Data>(contents);
  if (format === "csv" || path.endsWith(".csv"))
    data = parseCsv<Data>(contents, { delimiter: ",", ...options });
  if (format === "tsv" || path.endsWith(".tsv"))
    data = parseCsv<Data>(contents, { delimiter: "\t", ...options });
  if (format === "txt" || path.endsWith(".txt") || path.endsWith(".gmt"))
    data = contents as Data;

  return { data, stats };
};

/** extract zip file contents */
export const unzip = async (filename: string) => {
  const { dir, name } = parse(filename);
  /** folder to output zip file contents to */
  const output = `${dir}/${name}`;
  /** unzip command */
  const [cmd, ...args] = ["unzip", filename, "-d", output];
  try {
    /** if not already unzipped */
    if (!existsSync(output)) {
      /** clear folder to avoid unzip halting */
      await clearFolder(output);
      /** run unzip */
      await spawn(cmd!, args);
    }
    /** return file paths and stats */
    return Promise.all(
      (await readdir(output, { recursive: true }))
        .map((path) => `${output}/${path}`)
        .map(async (path) => ({
          path,
          stats: await stat(path),
        })),
    );
  } catch (error) {
    /** clear folder to not end up with partial contents */
    await clearFolder(output);
    throw error;
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
export const saveFile = async (
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
export const stringifyJson = (data: unknown) => JSON.stringify(data, null, 2);

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
