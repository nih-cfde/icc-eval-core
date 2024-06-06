import { addOpportunities } from "./database/opportunities";
import { getOpportunities } from "./ingest/opportunities";

const opportunityNumbers = await getOpportunities();
await addOpportunities(opportunityNumbers);
