/** DRC asset lists */

import { download } from "@/util/browser";
import { loadFile } from "@/util/file";
import { log } from "@/util/log";
import { query } from "@/util/request";

/** data coordination centers */
const dccUrl =
  "https://cfde-drc.s3.amazonaws.com/database/files/current_dcc_assets.tsv";
/** files */
const filesUrl =
  "https://cfde-drc.s3.amazonaws.com/database/files/current_file_assets.tsv";
/** code */
const codeUrl =
  "https://cfde-drc.s3.amazonaws.com/database/files/current_code_assets.tsv";

/** get info from DRC assets */
export const getDrc = async () => {
  log("Getting DRC data coordination center list");
  const { result: dcc } = await query(async () => {
    const path = await download(dccUrl);
    console.log(path);
    return await loadFile<string>(path, "tsv");
  }, "drc-dcc.tsv");
  log("Getting DRC file list");
  const { result: files } = await query(async () => {
    const path = await download(filesUrl);
    console.log(path);
    return await loadFile(path, "tsv");
  }, "drc-files.tsv");
  log("Getting DRC code list");
  const { result: code } = await query(async () => {
    const path = await download(codeUrl);
    console.log(path);
    return await loadFile(path, "tsv");
  }, "drc-code.tsv");

  return { dcc, files, code };
};

console.log(await getDrc());
