import { uniq, uniqBy } from "lodash-es";
import {
  getCoreProject,
  getOverTime,
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
import { capitalize } from "@/util/string";

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

  log("Getting Google Analytics data");

  /** get salient data about each property */
  const data = await queryMulti(
    properties.map(({ property, displayName }) => async (progress, label) => {
      label(`${property} ${displayName}`);

      const coreProject = await getCoreProject(property);
      progress(0.1);
      const overTime = await getOverTime(property);
      progress(0.4);
      const topContinents = await getTopContinents(property);
      progress(0.5);
      const topCountries = await getTopCountries(property);
      progress(0.5);
      const topRegions = await getTopRegions(property);
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
        propertyName: displayName,
        coreProject,
        overTime,
        topContinents,
        topCountries,
        topRegions,
        topCities,
        topLanguages,
        topDevices,
        topOSes,
      };
    }),
    "google-analytics-data.json",
  );

  /** map "top dimension" data */
  const mapTop = (reports: Awaited<ReturnType<typeof getTopRegions>>) =>
    Object.fromEntries(
      reports.map((report) => [
        `by${capitalize(report.metricHeaders?.[0]?.name ?? "")}`,
        Object.fromEntries(
          report.rows?.map((row) => [
            row.dimensionValues?.[0]?.value ?? "",
            Number(row.metricValues?.[0]?.value) || 0,
          ]) ?? [],
        ),
      ]) ?? [],
    );

  /** map "over time" data */
  const mapOverTime = (report: Awaited<ReturnType<typeof getOverTime>>) => {
    /** extract salient props */
    const { result } = report;
    const { metricHeaders, rows } = result ?? {};

    if (!result || !metricHeaders || !rows)
      throw Error("No analytics report response");

    /** get uniq list of metric keys */
    const metricKeys = uniq(
      metricHeaders.map((header) => header.name ?? "").flat(),
    );

    return Object.fromEntries(
      metricKeys.map((metric, index) => [
        metric,
        Object.fromEntries(
          rows
            .map((row) => [
              /** date */
              (row.dimensionValues?.[0]?.value ?? "").replace(
                /(\d\d\d\d)(\d\d)(\d\d)/,
                "$1-$2-$3",
              ),
              /** value */
              Number(row.metricValues?.[index]?.value ?? ""),
            ])
            .filter(([, value]) => value),
        ),
      ]),
    );
  };

  /** transform data into desired format, with fallbacks */
  const transformedData = filterErrors(data).map(
    ({
      property,
      propertyName,
      coreProject,
      overTime,
      topContinents,
      topCountries,
      topRegions,
      topCities,
      topLanguages,
      topDevices,
      topOSes,
    }) => ({
      property,
      propertyName: propertyName ?? "",
      coreProject: coreProject ?? "",
      overTime: mapOverTime(overTime),
      topContinents: mapTop(topContinents),
      topCountries: mapTop(topCountries),
      topRegions: mapTop(topRegions),
      topCities: mapTop(topCities),
      topLanguages: mapTop(topLanguages),
      topDevices: mapTop(topDevices),
      topOSes: mapTop(topOSes),
    }),
  );

  return transformedData;
};
