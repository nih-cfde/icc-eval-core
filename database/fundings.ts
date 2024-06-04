import { type Funding, fundingNumbers } from "./schema";
import { db } from ".";

export const addFundings = async (numbers: Funding[]) => {
  for (const number of numbers) {
    await db
      .insert(fundingNumbers)
      .values(number)
      .onConflictDoUpdate({ target: fundingNumbers.id, set: number });
  }
};
