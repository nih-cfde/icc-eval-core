import { parse } from "path";
import { countBy, groupBy, sumBy, uniqBy } from "lodash-es";
import type { Code, DCC, File } from "@/api/types/drc";
import { downloadFile, loadFile, unzip } from "@/util/file";
import { log } from "@/util/log";
import { filterErrors, queryMulti } from "@/util/request";
import { bytes, count, urlToPath } from "@/util/string";

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

  /** split full path into parts */
  const getParts = (path: string) => {
    const { dir, name, ext } = parse(urlToPath(path));
    return { dir, name, ext: ext.replace(/^\./, "") };
  };

  /** resources to download */
  let resources = dcc
    /** "dcc" type */
    .map((dcc) => ({
      url: dcc.link ?? "",
      type: "dcc",
      size: 0,
    }))
    /** "file" type */
    .concat(
      file.map((file) => ({
        url: file.link ?? "",
        type: "file",
        size: Number(file.size),
      })),
    )
    .map(({ type, ...resource }) => {
      /** split url into parts */
      const { name, ext } = getParts(resource.url);
      return {
        ...resource,
        /** set path to download to */
        path: `temp/${type}/${name}.${ext}`,
        ext,
      };
    })
    /** only download certain file extensions */
    .filter(({ ext }) => ["zip", "gmt"].includes(ext));

  /** de-dupe */
  resources = uniqBy(resources, "path");

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
  const files = uniqBy(filterErrors(fileResults).flat(), "path").map((file) => {
    const parts = getParts(file.path);
    const dir = parts.dir.split("/").slice(4).join("/");
    const type = parts.dir.split("/")[3] ?? "";
    return { ...file, type, dir, name: parts.name, ext: parts.ext };
  });

  logFiles(files);

  log(`${count(files)} files`);
  log(`${bytes(sumBy(files, "size"))}`);

  /** return unzipped files (for now) */
  return groupBy(files, "type");
};

/** log file types */
const logFiles = (files: { ext: string }[]) => {
  const counts = countBy(files, "ext");
  for (const [ext, number] of Object.entries(counts))
    log(`(${count(number)}) .${ext} files`, "secondary");
};
