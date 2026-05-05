namespace NodeJS {
  type ProcessEnv = {
    /** .env */

    /** path to manual input data */
    readonly MANUAL_PATH: string;
    /** path to download raw data to */
    readonly RAW_PATH: string;
    /** path to output formatted data to */
    readonly OUTPUT_PATH: string;

    /** .env.local */

    /** authentication for github */
    readonly AUTH_GITHUB: string;
    /** authentication for entrez */
    readonly AUTH_ENTREZ: string;
  };
}
