/** DRC asset lists */

import type { Code, DCC, Files } from "@/api/drc";
import { downloadFile, loadFile } from "@/util/file";
import { deindent, indent, log } from "@/util/log";
import { queryMulti } from "@/util/request";

/** DRC top-level lists */
const drcLists = [
  {
    url: "https://cfde-drc.s3.amazonaws.com/database/files/current_dcc_assets.tsv",
    filename: "drc-dcc.tsv",
  },
  {
    url: "https://cfde-drc.s3.amazonaws.com/database/files/current_file_assets.tsv",
    filename: "drc-files.tsv",
  },
  {
    url: "https://cfde-drc.s3.amazonaws.com/database/files/current_code_assets.tsv",
    filename: "drc-code.tsv",
  },
] as const;

/** get info from DRC assets */
export const getDrc = async () => {
  log("Downloading DRC lists from...");
  indent();
  for (const { url } of drcLists) log(url);
  deindent();

  /** download meta lists */
  const results = await queryMulti(
    drcLists.map(({ url, filename }) => async (progress) => {
      const path = await downloadFile(url, filename, progress);
      return await loadFile<DCC | Files | Code>(path, "tsv");
    }),
  );

  const [dcc, files, code] = results as [DCC, Files, Code];

  /** transform data into desired format, with fallbacks */
  return {
    dcc: dcc.map((dcc) => ({
      link: dcc.link,
      modified: new Date(dcc.lastmodified ?? "").toISOString(),
      created: new Date(dcc.created ?? "").toISOString(),
    })),
    files: files.map((file) => ({
      type: file.filetype ?? "",
      filename: file.filename ?? "",
      link: file.link ?? "",
      size: Number(file.size) || 0,
    })),
    code: code.map((code) => ({
      type: code.type ?? "",
      name: code.name ?? "",
      link: code.link ?? "",
      description: code.description ?? "",
      api: code.smartAPIURL ?? "",
    })),
  };
};
