import { countBy, sortBy, sumBy, uniqBy } from "lodash-es";
import type { Code, DCC, File } from "@/api/drc";
import { downloadFile, loadFile, unzip } from "@/util/file";
import { log } from "@/util/log";
import { filterErrors, queryMulti } from "@/util/request";
import { bytes, count, getExt, getFilename } from "@/util/string";

/** DRC top-level lists */
const drcLists = [
  {
    url: "https://cfde-drc.s3.amazonaws.com/database/files/current_dcc_assets.tsv",
    filename: "drc-dcc.tsv",
  },
  {
    url: "https://cfde-drc.s3.amazonaws.com/database/files/current_file_assets.tsv",
    filename: "drc-file.tsv",
  },
  {
    url: "https://cfde-drc.s3.amazonaws.com/database/files/current_code_assets.tsv",
    filename: "drc-code.tsv",
  },
] as const;

/** get info from DRC assets */
export const getDrc = async () => {
  log("Downloading DRC resource lists from...");
  for (const { url } of drcLists) log(url);

  /** download meta lists */
  const lists = await queryMulti(
    drcLists.map(({ url, filename }) => async (progress) => {
      const { path } = await downloadFile(url, filename, progress);
      const { data } = await loadFile<DCC | File | Code>(path, "tsv");
      return data;
    }),
  );

  const [dcc, file] = lists as [DCC, File, Code];

  /** resources to download */
  let resources = dcc
    .map((dcc) => ({
      url: dcc.link ?? "",
      path: `temp/dcc/${getFilename(dcc.link)}`,
      ext: getExt(dcc.link),
      size: 0,
    }))
    .concat(
      file.map((file) => ({
        url: file.link ?? "",
        path: `temp/file/${getFilename(file.link)}`,
        ext: getExt(file.link),
        size: Number(file.size),
      })),
    )
    .filter(({ ext }) => ["zip", "gmt"].includes(ext));

  /** de-dupe */
  resources = uniqBy(resources, "path");

  /** do biggest downloads last */
  resources = sortBy(resources, "size");

  logFiles(resources);

  log("Downloading resources");

  /** download assets locally and get paths to local files */
  const fileResults = await queryMulti(
    resources.map(({ url, path, ext }) => async (progress) => {
      /** download file */
      const file = await downloadFile(url, path, progress);

      /** unzip and get all file paths */
      if (ext === "zip") return (await unzip(file.path)) ?? [];

      return file;
    }),
  );

  /** de-dupe, filter out errors, and flatten */
  const files = uniqBy(filterErrors(fileResults).flat(), "path").map(
    (file) => ({ ...file, ext: getExt(file.path) }),
  );

  logFiles(files);

  log(`${count(files)} files`);
  log(`${bytes(sumBy(files, "size"))}`);

  /** return unzipped files (for now) */
  return files;
};

/** log file types */
const logFiles = (files: { path: string }[]) => {
  const counts = countBy(files, "ext");
  for (const [ext, number] of Object.entries(counts))
    log(`(${count(number)}) .${ext} files`, "secondary");
};
