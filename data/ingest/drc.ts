import type { Stats } from "fs";
import { countBy, sumBy, uniqBy } from "lodash-es";
import type { Code, DCC, File } from "@/api/types/drc";
import { downloadFile, loadFile, unzip } from "@/util/file";
import { log } from "@/util/log";
import { queryMulti } from "@/util/request";
import { bytes, count, parsePath } from "@/util/string";
import { formatDate } from "./../util/string";

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

  const [dcc, file, code] = lists as [DCC, File, Code];

  /** get download path and ext */
  const getPath = (url = "", key: string) => {
    const { name, ext } = parsePath(url);
    return { path: `temp/${key}/${name}.${ext}`, ext };
  };

  /** resource data */
  const resources = {
    dcc: dcc.map((dcc) => ({
      url: dcc.link ?? "",
      date: formatDate(dcc.lastmodified),
      ...getPath(dcc.link, "dcc"),
      files: [] as Files,
    })),
    file: file.map((file) => ({
      url: file.link ?? "",
      size: Number(file.size),
      name: file.filename ?? "",
      date: formatDate(file.link?.match(/\d\d\d\d-\d\d-\d\d/)?.[0]),
      ...getPath(file.link, "file"),
      files: [] as Files,
    })),
    code: code.map((code) => ({
      url: code.link ?? "",
      type: code.type ?? "",
      name: code.name ?? "",
      date: "",
      ...getPath(code.link, "code"),
      files: [] as Files,
    })),
  };

  /** de-dupe */
  resources.dcc = uniqBy(resources.dcc, "path");
  resources.file = uniqBy(resources.file, "path");
  resources.code = uniqBy(resources.code, "path");

  logFiles(Object.values(resources).flat());

  log("Downloading resources");

  /** transform file info */
  const mapFile = ({ path, stats }: { path: string; stats: Stats }) => {
    const parts = parsePath(path);
    const dir = parts.dir.split("/").slice(4).join("/");
    const type = parts.dir.split("/")[3] ?? "";
    return {
      type,
      dir,
      name: parts.name,
      ext: parts.ext,
      size: stats.size,
      date: formatDate(stats.mtime),
    };
  };
  type Files = ReturnType<typeof mapFile>[];

  /** download assets locally and get paths to local files */
  for (const resource of [resources.dcc, resources.file]) {
    const fileResults = await queryMulti(
      resource.map(({ url, path, ext }) => async (progress) => {
        if (!["gmt", "zip"].includes(ext)) throw Error(`Skipping .${ext} file`);

        /** download file */
        const file = await downloadFile(url, path, progress);

        /** unzip and get all file paths */
        if (ext === "zip") return (await unzip(file.path)) ?? [];

        return [file];
      }),
    );

    /** add file info to resource data */
    for (const [index, files] of Object.entries(fileResults)) {
      if (files instanceof Error) continue;
      resource[Number(index)]!.files = files.map(mapFile);
    }
  }

  /** get overall file stats */
  const allFiles = Object.values(resources)
    .map((resource) => resource.map((items) => items.files))
    .flat()
    .flat();

  logFiles(allFiles);

  log(`${count(allFiles)} files`);
  log(`${bytes(sumBy(allFiles, "size"))}`);

  return resources;
};

/** log file types */
const logFiles = (files: { ext: string }[]) => {
  const counts = countBy(files, "ext");
  for (const [ext, number] of Object.entries(counts))
    log(`(${count(number)}) .${ext} files`, "secondary");
};
