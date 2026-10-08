import { createHash } from "crypto";
import { kebabCase } from "lodash-es";
import { downloadFile, loadFile } from "@/util/file";
import { log } from "@/util/log";
import { memoize } from "@/util/memoize";
import { count, formatDate } from "@/util/string";

const { MANUAL_PATH } = process.env;

/** google spreadsheet */
const spreadsheet =
  "https://docs.google.com/spreadsheets/d/1uYt3DBp-PFNTGpBE8r1fssrFnECZ8G13yK1pstT-sgg/export?format=csv";

/** get list of events */
export const getEvents = memoize(async () => {
  log(`Getting events from ${spreadsheet}`);

  const { path: mapFile } = await downloadFile(
    spreadsheet,
    `${MANUAL_PATH}/events.csv`,
  );

  /** parse table */
  const { data } = await loadFile<Record<string, string>[]>(mapFile, "csv", {
    columns: true,
  });

  type Event = {
    status: string;
    edit: string;
    calendarId: string;
    timestamp: string;
    emailAddress: string;
    title: string;
    description: string;
    organizer: string;
    involved: string;
    length: string;
    start: string;
    end: string;
    link: string;
    format: string;
    location: string;
    purpose: string;
    tags: string;
    attendanceOutcome: number;
    engagementOutcome: string;
    awarenessOutcome: string;
    resourcesOutcome: string;
    timingOutcome: string;
    platformOutcome: string;
    conclusion: string;
  };

  /** column names */
  const columns = {
    status: { obfuscate: false },
    edit: { obfuscate: true },
    calendarId: { obfuscate: true },
    timestamp: { obfuscate: false, cast: "date" },
    emailAddress: { obfuscate: true },
    title: { obfuscate: false },
    description: { obfuscate: false },
    organizer: { obfuscate: false },
    involved: { obfuscate: false },
    length: { obfuscate: false },
    start: { obfuscate: false, cast: "date" },
    end: { obfuscate: false, cast: "date" },
    link: { obfuscate: true },
    format: { obfuscate: false },
    location: { obfuscate: false },
    purpose: { obfuscate: false },
    tags: { obfuscate: false },
    attendanceOutcome: { obfuscate: false, cast: "number" },
    engagementOutcome: { obfuscate: true },
    awarenessOutcome: { obfuscate: true },
    resourcesOutcome: { obfuscate: true },
    timingOutcome: { obfuscate: true },
    platformOutcome: { obfuscate: true },
    conclusion: { obfuscate: true },
  } satisfies {
    [Key in keyof Event]: { obfuscate: boolean } & (Event[Key] extends number
      ? { cast: "number" }
      : { cast?: "date" });
  };

  /** list of events */
  const events: Event[] = [];

  log(`Reading ${count(data)} rows`);

  for (const [index, row] of Object.entries(data)) {
    log(`Row ${index + 1}`, "secondary", 1);

    const event: Event = Object.fromEntries(
      Object.entries(columns).map(([name, { obfuscate, ...options }]) => {
        /** find matching column name/key in raw data */
        const key = Object.keys(row).find(
          (key) => kebabCase(key) === kebabCase(name),
        );
        if (!key) throw Error(`Column ${name} not found in row ${index + 1}`);

        let value: string | number = row[key as keyof typeof row]!;

        /** cast types */
        if ("cast" in options) {
          if (options.cast === "number") value = Number(value) || 0;
          else if (options.cast === "date") value = formatDate(value);
        }

        /** trim */
        if (typeof value === "string") value = value.trim();

        /** privatize but still allow seeing unique values */
        if (
          obfuscate &&
          typeof value === "string" &&
          /** allow us to see things like blank/dash/na directly */
          /** assume short things like this can't be sensitive info */
          value.length > 4
        )
          value = createHash("md5").update(value).digest("hex");

        return [name, value];
      }),
    ) as Event;

    events.push(event);
  }

  log(`${count(events)} events`, "success");

  return events;
});
