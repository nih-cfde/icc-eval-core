import { countBy, sortBy } from "lodash-es";
import type { Code, DCC, Files } from "@/api/drc";
import { downloadFile, loadFile } from "@/util/file";
import { log } from "@/util/log";
import { queryMulti } from "@/util/request";
import { getExt } from "@/util/string";

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
  for (const { url } of drcLists) log(url);

  /** download meta lists */
  const results = await queryMulti(
    drcLists.map(({ url, filename }) => async (progress) => {
      const { path } = await downloadFile(url, filename, progress);
      return await loadFile<DCC | Files | Code>(path, "tsv");
    }),
  );

  const [dcc, files, code] = results as [DCC, Files, Code];

  /** assets to download */
  let assets = dcc
    .map((dcc) => ({
      type: "dcc",
      url: dcc.link ?? "",
      ext: getExt(dcc.link),
      size: 0,
    }))
    .concat(
      files.map((file) => ({
        type: "file",
        url: file.link ?? "",
        ext: getExt(file.link),
        size: Number(file.size),
      })),
    )
    .filter(({ ext }) => [".zip", ".gmt"].includes(ext));

  /** do biggest downloads last */
  assets = sortBy(assets, "size");

  log("Downloading assets");

  const counts = countBy(assets, "ext");
  for (const [ext, count] of Object.entries(counts))
    log(`${count} ${ext} files`, "secondary");

  /** download all */
  await queryMulti(
    assets.map(({ type, url }) => async (progress) => {
      const filename = url.split("/").pop()!;
      await downloadFile(url, `drc/${type}/${filename}`, progress);
      return true;
    }),
  );

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
