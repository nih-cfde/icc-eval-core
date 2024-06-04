import { addFundings } from "./database/fundings";
import { getFundings } from "./ingest/fundings";

const fundingNumbers = await getFundings();
await addFundings(fundingNumbers);
