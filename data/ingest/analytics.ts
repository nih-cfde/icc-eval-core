import { capitalize, uniqBy } from "lodash-es";
import {
  getProject,
  getProperties,
  getTopCities,
  getTopContinents,
  getTopCountries,
  getTopDevices,
  getTopLanguages,
  getTopOSes,
  getTopRegions,
} from "@/api/google-analytics";
import { log } from "@/util/log";
import { filterErrors, query, queryMulti } from "@/util/request";

/** get google analytics data */
export const getAnalytics = async () => {
  log("Getting Google Analytics properties");

  /** get list of properties */
  let properties = await query(
    getProperties,
    "google-analytics-properties.json",
  );

  /** de-dupe */
  properties = uniqBy(properties, "property");

  /** get salient data about each property */
  const data = await queryMulti(
    properties.map(({ property }) => async (progress) => {
      const project = await getProject(property);
      progress(0.3);
      const topRegions = await getTopRegions(property);
      progress(0.4);
      const topContinents = await getTopContinents(property);
      progress(0.5);
      const topCountries = await getTopCountries(property);
      progress(0.6);
      const topCities = await getTopCities(property);
      progress(0.7);
      const topLanguages = await getTopLanguages(property);
      progress(0.8);
      const topDevices = await getTopDevices(property);
      progress(0.9);
      const topOSes = await getTopOSes(property);

      return {
        property,
        project,
        topRegions,
        topContinents,
        topCountries,
        topCities,
        topLanguages,
        topDevices,
        topOSes,
      };
    }),
    "google-analytics-data.json",
  );

  type TopValue = Awaited<ReturnType<typeof getTopRegions>>;

  /** map "top dimension" data */
  const mapTop = (top: TopValue) => {
    const report = top.reports?.[0] ?? {};
    const metric = report.metricHeaders?.[0]?.name ?? "";
    return {
      [`by${capitalize(metric)}`]: Object.fromEntries(
        report.rows?.map((row) => [
          row.dimensionValues?.[0]?.value ?? "",
          Number(row.metricValues?.[0]?.value) || 0,
        ]) ?? [],
      ),
    };
  };

  /** transform data into desired format, with fallbacks */
  const transformedData = filterErrors(data).map(
    ({
      property,
      project,
      topRegions,
      topContinents,
      topCountries,
      topCities,
      topLanguages,
      topDevices,
      topOSes,
    }) => ({
      property,
      project,
      topRegions: mapTop(topRegions),
      topContinents: mapTop(topContinents),
      topCountries: mapTop(topCountries),
      topCities: mapTop(topCities),
      topLanguages: mapTop(topLanguages),
      topDevices: mapTop(topDevices),
      topOSes: mapTop(topOSes),
    }),
  );

  return transformedData;
};
