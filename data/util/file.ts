import { mkdirSync, rmSync, writeFileSync } from "fs";

/** save json data to file */
export const saveJson = (data: unknown, path: string, filename: string) =>
  writeFileSync(`${path}/${filename}.json`, JSON.stringify(data));

/** make fresh folder */
export const clearFolder = (path: string) => {
  rmSync(path, { force: true, recursive: true });
  mkdirSync(path, { recursive: true });
};
