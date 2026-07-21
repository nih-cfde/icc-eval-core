import { uniq } from "lodash-es";
import { downloadFile, loadFile } from "@/util/file";
import { log } from "@/util/log";
import { memoize } from "@/util/memoize";
import { count } from "@/util/string";

const { MANUAL_PATH } = process.env;

/** google spreadsheet */
const spreadsheet =
  "https://docs.google.com/spreadsheets/d/1klXsMhLYCb3E5SKYDutWFCRymLfR-RtbNyKafz3lVw4/export?format=csv";

/** for each core project, get list of users who are allowed to access it */
export const getUsers = memoize(async () => {
  log(`Getting user map from ${spreadsheet}`);

  const { path: mapFile } = await downloadFile(
    spreadsheet,
    `${MANUAL_PATH}/users.csv`,
  );

  /** parse table */
  const { data } = await loadFile<string[][]>(mapFile, "csv", {
    columns: false,
  });

  /** drop header row */
  data.shift();

  /** map of users to projects */
  const map: Record<string, string[]> = {};

  log(`Reading ${count(data)} rows`);

  for (let [coreProjectName, coreProjectId = "", ...users] of data) {
    log(`${coreProjectId} (${coreProjectName})`, "secondary", 1);
    if (coreProjectId === "All") coreProjectId = "*";
    for (const user of users) {
      /** extract orcid digits from field w/ possibly other contents */
      let [, userName, userId] =
        user.match(
          /(.*?)([0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4}-[0-9a-zA-Z]{4})/s,
        ) ?? [];
      if (!userName || !userId) continue;
      userName = userName.trim().replace(/\s+/g, " ");

      /** add to map */
      map[userId] ??= [];
      const list = map[userId];
      if (!list) continue;
      if (list?.includes(coreProjectId)) continue;
      list.push(coreProjectId);
      log(`${userId} (${userName})`, "secondary", 2);
    }
  }

  log(`${count(map)} core projects`, "success");
  log(`${count(uniq(Object.values(map).flat()))} users`, "success");

  return map;
});
