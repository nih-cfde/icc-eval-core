import {
  AnalyticsAdminServiceClient,
  type protos,
} from "@google-analytics/admin";

// import { BetaAnalyticsDataClient } from "@google-analytics/data";

type Property = protos.google.analytics.admin.v1alpha.IAccountSummary;

const adminClient = new AnalyticsAdminServiceClient();
// const dataClient = new BetaAnalyticsDataClient();

/** list all properties we have access to */
export const getProperties = async () => {
  const properties: Property[] = [];
  for await (const accountSummary of adminClient.listAccountSummariesAsync())
    for (const propertySummary of accountSummary.propertySummaries ?? [])
      properties.push(propertySummary);
  return properties;
};
