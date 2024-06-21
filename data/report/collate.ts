import { writeFileSync } from "fs";
import { kebabCase } from "lodash-es";
import { deindent, indent, log, progress } from "@/util/log";

const { DATA_PATH } = process.env;

/** collate data from db for dashboard reports */
export const collateData = async (data: Record<string, Promise<unknown>>) => {
  log("Collating data");
  indent();

  /** output collated data */
  for (const [key, value] of Object.entries(data)) {
    const path = `${DATA_PATH}/${kebabCase(key)}.json`;
    progress(`Exporting ${path}`, key, data);
    writeFileSync(path, JSON.stringify(await value, null, 2));
  }

  deindent();
};
