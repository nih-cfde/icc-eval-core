import { test } from "./database";
import { getFundingOpportunities } from "./ingest/funding-opportunities";

// test();

await getFundingOpportunities();
