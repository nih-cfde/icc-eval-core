import { eachDayOfInterval, format, max, min } from "date-fns";
import { orderBy, sumBy, uniq, uniqBy } from "lodash-es";
import {
  getCoreProject,
  getDimension,
  getEvents,
  getOverTime,
  getProperties,
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
      log(`${displayName} - Continents`, "secondary", 1);
      const continents = await getDimension(property, "continent");
      log(`${displayName} - Countries`, "secondary", 1);
      const countries = await getDimension(property, "country");
      log(`${displayName} - Regions`, "secondary", 1);
      const regions = await getDimension(property, "region");
      log(`${displayName} - Cities`, "secondary", 1);
      const cities = await getDimension(property, "city");
      log(`${displayName} - Languages`, "secondary", 1);
      const languages = await getDimension(property, "language");
      log(`${displayName} - Devices`, "secondary", 1);
      const devices = await getDimension(property, "deviceCategory");
      log(`${displayName} - Operating systems`, "secondary", 1);
      const operatingSystems = await getDimension(property, "operatingSystem");
      log(`${displayName} - Page views`, "secondary", 1);
      const pageViews = await getEvents(property, "page_view");

      return {
        property,
        propertyName: displayName,
        coreProject,
        overTime,
        continents,
        countries,
        regions,
        cities,
        languages,
        devices,
        operatingSystems,
        pageViews,
      };
    },
  );

  errors.forEach((error, index) => {
    log(properties[index]);
    log(error, "warn", 1);
  });

  if (errors.length) log(`${count(errors)} errors`, "error");

  /** map time data */
  const mapOverTime = (reports: Awaited<ReturnType<typeof getOverTime>>) => {
    /** separate reports */
    const [activeUsers, newUsers, returningUsers, engagedSessions] = reports;

    if (!activeUsers || !newUsers || !returningUsers || !engagedSessions)
      throw Error("No analytics report response");

    /** transform one report */
    const mapReport = (report: Awaited<ReturnType<typeof getOverTime>>[0]) =>
      Object.fromEntries(
        report.rows
          ?.map((row) => [
            /** date */
            (row.dimensionValues?.[0]?.value ?? "").replace(
              /(\d\d\d\d)(\d\d)(\d\d)/,
              "$1-$2-$3",
            ),
            /** value */
            Number(row.metricValues?.[0]?.value ?? ""),
          ])
          .filter(([, value]) => value) ?? [],
      );

    return {
      activeUsers: mapReport(activeUsers),
      newUsers: mapReport(newUsers),
      returningUsers: mapReport(returningUsers),
      engagedSessions: mapReport(engagedSessions),
    };
  };

  /** map dimension data */
  const mapDimension = (reports: Awaited<ReturnType<typeof getDimension>>) => {
    /** separate reports */
    const [activeUsers, newUsers, returningUsers, engagedSessions] = reports;

    if (!activeUsers || !newUsers || !returningUsers || !engagedSessions)
      throw Error("No analytics report response");

    /** transform one report */
    const mapReport = (report: Awaited<ReturnType<typeof getDimension>>[0]) =>
      Object.fromEntries(
        report.rows?.map((row) => [
          row.dimensionValues?.[0]?.value ?? "",
          Number(row.metricValues?.[0]?.value) || 0,
        ]) ?? [],
      );

    return {
      activeUsers: mapReport(activeUsers),
      newUsers: mapReport(newUsers),
      returningUsers: mapReport(returningUsers),
      engagedSessions: mapReport(engagedSessions),
    };
  };

  /** map event data */
  const mapEvents = (reports: Awaited<ReturnType<typeof getEvents>>) => {
    /** separate reports */
    const [activeUsers, newUsers, returningUsers] = reports;

    if (!activeUsers || !newUsers || !returningUsers)
      throw Error("No analytics report response");

    /** transform one report */
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
      activeUsers: mapReport(activeUsers),
      newUsers: mapReport(newUsers),
      returningUsers: mapReport(returningUsers),
    };
  };

  /** transform data into desired format, with fallbacks */
  const transformedAnalytics = analytics.map(
    ({
      property,
      propertyName,
      coreProject,
      overTime,
      continents,
      countries,
      regions,
      cities,
      languages,
      devices,
      operatingSystems,
      pageViews,
    }) => ({
      property,
      propertyName: propertyName ?? "",
      coreProject: coreProject ?? "",
      overTime: mapOverTime(overTime),
      continents: mapDimension(continents),
      countries: mapDimension(countries),
      regions: mapDimension(regions),
      cities: mapDimension(cities),
      languages: mapDimension(languages),
      devices: mapDimension(devices),
      operatingSystems: mapDimension(operatingSystems),
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

  const overTime = Object.fromEntries(
    (
      ["activeUsers", "newUsers", "returningUsers", "engagedSessions"] as const
    ).map((metric) => {
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

  const tops = Object.fromEntries(
    (
      [
        "continents",
        "countries",
        "regions",
        "cities",
        "languages",
        "devices",
        "operatingSystems",
      ] as const
    ).map((field) => {
      const fieldTotaled = Object.fromEntries(
        (
          [
            "activeUsers",
            "newUsers",
            "returningUsers",
            "engagedSessions",
          ] as const
        ).map((metric) => {
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
