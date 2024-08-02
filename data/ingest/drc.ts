import { countBy, sortBy, uniq, uniqBy } from "lodash-es";
import type { Code, DCC, File } from "@/api/drc";
import { downloadFile, loadFile, unzip } from "@/util/file";
import { log } from "@/util/log";
import { filterErrors, queryMulti } from "@/util/request";
import { getExt, getFilename } from "@/util/string";

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
  log("Downloading DRC resource lists from...");
  for (const { url } of drcLists) log(url);

  /** download meta lists */
  const lists = await queryMulti(
    drcLists.map(({ url, filename }) => async (progress) => {
      const { path } = await downloadFile(url, filename, progress);
      return await loadFile<DCC | File | Code>(path, "tsv");
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

  log("Downloading resources");

  {
    const counts = countBy(resources, "ext");
    for (const [ext, count] of Object.entries(counts))
      log(`${count} ${ext} files`, "secondary");
  }

  /** download assets locally and get paths to local files */
  const pathResults = await queryMulti(
    resources.map(({ url, path, ext }) => async (progress) => {
      /** download file */
      const { path: downloadedPath } = await downloadFile(url, path, progress);

      /** unzip and get all file paths */
      if (ext === "zip") return (await unzip(downloadedPath)) ?? "";

      return path;
    }),
  );

  /** de-dupe, filter out errors, and flatten */
  const paths = uniq(filterErrors(pathResults).flat());

  {
    const counts = countBy(paths, getExt);
    for (const [ext, count] of Object.entries(counts))
      log(`${count} ${ext} files`, "secondary");
  }

  /** return unzipped file paths (for now) */
  return paths;
};
