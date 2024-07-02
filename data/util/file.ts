import { mkdirSync, writeFileSync } from "fs";

/** save json data to file */
export const saveJson = (data: unknown, filename: string) => {
  const string = JSON.stringify(data, null, 2);
  const { DATA_PATH = "" } = process.env;
  writeFileSync(`${DATA_PATH}/${filename}.json`, string);
};
