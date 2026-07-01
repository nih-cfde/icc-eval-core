import { eachDayOfInterval, format, max, min } from "date-fns";
import { orderBy, sumBy, uniq, uniqBy, upperFirst } from "lodash-es";
import {
  getCoreProject,
  getEvents,
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
import { settled } from "@/util/misc";
import { count } from "@/util/string";

/** get google analytics data */
export const getAnalytics = async () => {
  log("Getting Google Analytics properties");

  /** get list of properties */
  let properties = await getProperties();

  /** de-dupe */
  properties = uniqBy(properties, (property) => property.property);

  properties.forEach(({ property, displayName }) =>
    log(`${property} ${displayName}`, "secondary", 1),
  );

  log(`Getting Google Analytics data for ${count(properties)} properties`);

  /** get salient data about each property */
  const [analytics, errors] = await settled(
    properties,
    async ({ property, displayName }) => {
      const coreProject = await getCoreProject(property);
      log(`${displayName} - Over time`, "secondary", 1);
      const overTime = await getOverTime(property);
      log(`${displayName} - Top continents`, "secondary", 1);
      const topContinents = await getTopContinents(property);
      log(`${displayName} - Top countries`, "secondary", 1);
      const topCountries = await getTopCountries(property);
      log(`${displayName} - Top regions`, "secondary", 1);
      const topRegions = await getTopRegions(property);
      log(`${displayName} - Top cities`, "secondary", 1);
      const topCities = await getTopCities(property);
      log(`${displayName} - Top languages`, "secondary", 1);
      const topLanguages = await getTopLanguages(property);
      log(`${displayName} - Top devices`, "secondary", 1);
      const topDevices = await getTopDevices(property);
      log(`${displayName} - Top OSes`, "secondary", 1);
      const topOSes = await getTopOSes(property);
      log(`${displayName} - Page views`, "secondary", 1);
      const pageViews = await getEvents(property);

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
        pageViews,
      };
    },
  );

  errors.forEach((error, index) => {
    log(properties[index]);
    log(error, "warn", 1);
  });

  if (errors.length) log(`${count(errors)} errors`, "error");

  /** map "over time" data */
  const mapOverTime = (reports: Awaited<ReturnType<typeof getOverTime>>) => {
    /** extract salient props */
    const report = reports[0];
    const { metricHeaders, rows } = report ?? {};

    if (!report || !metricHeaders || !rows)
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

  /** map "top dimension" data */
  const mapTop = (reports: Awaited<ReturnType<typeof getTopRegions>>) =>
    Object.fromEntries(
      reports.map((report) => [
        `by${upperFirst(report.metricHeaders?.[0]?.name ?? "")}`,
        Object.fromEntries(
          report.rows?.map((row) => [
            row.dimensionValues?.[0]?.value ?? "",
            Number(row.metricValues?.[0]?.value) || 0,
          ]) ?? [],
        ),
      ]) ?? [],
    );

  /** map event data */
  const mapEvents = (reports: Awaited<ReturnType<typeof getEvents>>) => {
    /** separate reports */
    const [activeUsers, newUsers, returningUsers] = reports;

    if (!activeUsers || !newUsers || !returningUsers)
      throw Error("No analytics report response");

    const mapReport = (report: Awaited<ReturnType<typeof getEvents>>[0]) => {
      /** breakdown of event counts by page */
      const events: { total: number } & Record<string, number> = { total: 0 };

      /** for each page */
      for (const row of report?.rows ?? []) {
        const page = row.dimensionValues?.[0]?.value ?? "";
        /** count events */
        const count = parseInt(row.metricValues?.[0]?.value ?? "0");
        events[page] = count;
        events.total += count;
      }

      /** sort highest counts first */
      const sorted = Object.fromEntries(
        orderBy(Object.entries(events), ([, count]) => count, "desc"),
      );

      return sorted;
    };

    return {
      byActiveUsers: mapReport(activeUsers),
      byNewUsers: mapReport(newUsers),
      byReturningUsers: mapReport(returningUsers),
    };
  };

  /** transform data into desired format, with fallbacks */
  const transformedAnalytics = analytics.map(
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
      pageViews,
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
      pageViews: mapEvents(pageViews),
    }),
  );

  log(`${count(transformedAnalytics)} analytics`, "success");

  return transformedAnalytics;
};

/** aggregate various stats for all analytics */
export const getAnalyticsOverview = async (
  analytics: Awaited<ReturnType<typeof getAnalytics>>,
) => {
  const allDates = analytics
    .map(({ overTime }) =>
      Object.values(overTime)
        .map((dates) => Object.keys(dates))
        .flat(),
    )
    .flat();
  const dates = eachDayOfInterval({
    start: min(allDates),
    end: max(allDates),
  }).map((date) => format(date, "yyyy-MM-dd"));

  const metrics = [
    "activeUsers",
    "newUsers",
    "returningUsers",
    "engagedSessions",
  ] as const;
  const overTime = Object.fromEntries(
    metrics.map((metric) => {
      const datesTotaled = Object.fromEntries(
        dates.map((date) => {
          const total = sumBy(
            analytics,
            (analytic) => analytic.overTime[metric][date] ?? 0,
          );
          return [date, total];
        }),
      );
      return [metric, datesTotaled];
    }),
  );

  const topFields = [
    "topContinents",
    "topCountries",
    "topRegions",
    "topCities",
    "topLanguages",
    "topDevices",
    "topOSes",
  ] as const;
  const topMetrics = [
    "byActiveUsers",
    "byNewUsers",
    "byReturningUsers",
    "byEngagedSessions",
  ] as const;
  const tops = Object.fromEntries(
    topFields.map((field) => {
      const fieldTotaled = Object.fromEntries(
        topMetrics.map((metric) => {
          const keys = uniq(
            analytics
              .map((analytic) => Object.keys(analytic[field][metric] ?? {}))
              .flat(),
          );
          const metricTotaled = Object.fromEntries(
            keys.map((key) => {
              const total = sumBy(
                analytics,
                (analytic) => analytic[field][metric]?.[key] ?? 0,
              );
              return [key, total];
            }),
          );
          return [metric, metricTotaled];
        }),
      );
      return [field, fieldTotaled];
    }),
  );

  return {
    overTime,
    ...tops,
  };
};

export type Analytics = Awaited<ReturnType<typeof getAnalytics>>[number];

export type AnalyticsOverview = Awaited<
  ReturnType<typeof getAnalyticsOverview>
>;
