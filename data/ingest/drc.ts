/** DRC asset lists */

import type { Code, DCC, Files } from "@/api/drc";
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
  const { result: dcc, error: dccError } = await query(async () => {
    const path = await download(dccUrl);
    return await loadFile<DCC[]>(path, "tsv");
  }, "drc-dcc.tsv");
  log("Getting DRC file list");
  const { result: files, error: filesError } = await query(async () => {
    const path = await download(filesUrl);
    return await loadFile<Files[]>(path, "tsv");
  }, "drc-files.tsv");
  log("Getting DRC code list");
  const { result: code, error: codeError } = await query(async () => {
    const path = await download(codeUrl);
    return await loadFile<Code[]>(path, "tsv");
  }, "drc-code.tsv");

  if (dcc?.length)
    log(
      `Got ${dcc.length.toLocaleString()} DCCs`,
      dcc?.length ? "success" : "error",
    );
  if (files?.length)
    log(
      `Got ${files.length.toLocaleString()} files`,
      files?.length ? "success" : "error",
    );
  if (code?.length)
    log(
      `Got ${code.length.toLocaleString()} code`,
      code?.length ? "success" : "error",
    );
  if (dccError || filesError || codeError)
    log("Problem getting DRC assets", "error");

  return { dcc, files, code };
};
