import { browser } from ".";

export const getFundingOpportunities = async () => {
  await browser(async (page) => {
    await page.goto(
      "https://commonfund.nih.gov/dataecosystem/FundingOpportunities"
    );
    const opportunityDocuments = await Promise.all(
      Array.from(
        await page
          .locator(":text('archived funding opportunities') + ul > li > a")
          .all()
      ).map(async (link) => await link.getAttribute("href"))
    );
    console.log(opportunityDocuments);
  });
};
