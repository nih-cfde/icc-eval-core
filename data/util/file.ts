import { mkdirSync, rmSync, writeFileSync } from "fs";
import { readFile } from "fs/promises";

/** save json data to file */
export const saveJson = (data: unknown, path: string, filename: string) => {
  mkdirSync(path, { recursive: true });
  writeFileSync(`${path}/${filename}.json`, JSON.stringify(data, null, 2));
};

/** load json data from file */
export const loadJson = async <Data>(path: string, filename: string) => {
  try {
    return JSON.parse(
      await readFile(`${path}/${filename}.json`, "utf-8"),
    ) as Data;
  } catch (error) {
    error;
    return null;
  }
};

/** make fresh folder */
export const clearFolder = (path: string) => {
  rmSync(path, { force: true, recursive: true });
  mkdirSync(path, { recursive: true });
};
