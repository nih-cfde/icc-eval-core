import { countBy, sumBy } from "lodash-es";
import type { Code, DCC, File } from "@/api/types/drc";
import {
  downloadFile,
  liteDownloadFile,
  liteUnzip,
  loadFile,
} from "@/util/file";
import type { Stats } from "@/util/file";
import { log } from "@/util/log";
import { queryMulti } from "@/util/request";
import { bytes, count, formatDate, splitPath } from "@/util/string";

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

  /** resource data */
  const resources = {
    dcc: dcc.map((dcc) => ({
      url: dcc.link ?? "",
      ...splitPath(dcc.link ?? ""),
      date: formatDate(dcc.lastmodified),
      files: [] as Files,
    })),
    file: file.map((file) => ({
      url: file.link ?? "",
      ...splitPath(file.link ?? ""),
      size: Number(file.size),
      name: file.filename ?? "",
      date: formatDate(file.link?.match(/\d\d\d\d-\d\d-\d\d/)?.[0]),
      files: [] as Files,
    })),
    code: code.map((code) => ({
      url: code.link ?? "",
      ...splitPath(code.link ?? ""),
      type: code.type ?? "",
      name: code.name ?? "",
      date: "",
      files: [] as Files,
    })),
  };

  for (const [ext, number] of Object.entries(
    countBy(Object.values(resources).flat(), "ext"),
  ))
    log(`(${count(number)}) .${ext} files`, "secondary");

  /** transform file info */
  const mapFile = ({
    url,
    path,
    size,
    date,
  }: { url: string; path: string } & Stats) => ({
    url: splitPath(url),
    path: splitPath(path),
    size,
    date,
  });
  type Files = ReturnType<typeof mapFile>[];

  /** download assets locally and get paths to local files */
  for (const [key, resource] of Object.entries(resources)) {
    /** skip code, since nothing to download/check */
    if (key === "code") continue;

    log(`Downloading DRC "${key}" resources`);

    const fileResults = await queryMulti(
      resource.map(({ url, ext }) => async (progress) => {
        if (!ext) throw Error(`Skipping file with no extension`);

        /** get files inside zip */
        if (ext === "zip") return await liteUnzip(url, progress);

        /** download file and get file info */
        return [await liteDownloadFile(url)];
      }),
      `drc-${key}.json`,
    );

    /** add file info to resource data */
    for (const [index, files] of Object.entries(fileResults))
      if (!(files instanceof Error))
        resource[Number(index)]!.files = files.map(mapFile);
  }

  /** get overall file stats */
  const allFiles = Object.values(resources)
    .map((resource) => resource.map((items) => items.files))
    .flat()
    .flat();

  for (const [ext, number] of Object.entries(countBy(allFiles, "path.ext")))
    log(`(${count(number)}) .${ext} files`, "secondary");
  log(`> ${count(allFiles)} files uncompressed`);
  log(`> ${bytes(sumBy(allFiles, "size"))} uncompressed`);

  return resources;
};
