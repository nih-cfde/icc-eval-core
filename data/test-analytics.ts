import { uniqBy } from "lodash-es";
import {
  getCoreProject,
  getOverTime,
  getProperties,
} from "@/api/google-analytics";
import { query, queryMulti } from "@/util/request";

let properties = await query(getProperties, "google-analytics-properties.json");

properties = uniqBy(properties, "property");

await queryMulti(
  properties.map(({ property, displayName }) => async () => {
    const coreProject = await getCoreProject(property);
    const overTime = await getOverTime(property);

    return {
      property,
      propertyName: displayName,
      coreProject,
      overTime,
    };
  }),
  "google-analytics-data.json",
);
