namespace NodeJS {
  type ProcessEnv = {
    /** .env */

    /** whether to use caching mechanisms */
    readonly CACHE: "" | "true";
    /** whether to run pipeline in private mode (get sensitive data) */
    readonly PRIVATE: "" | "true";
    /** path to save raw data to */
    readonly RAW_PATH: string;
    /** path to output formatted data to */
    readonly OUTPUT_PATH: string;
    /** path of dashboard app */
    readonly APP_PATH: string;
    /** path to print pdfs to */
    readonly PDF_PATH: string;
    /** path to google authentication (not a key itself) */
    readonly GOOGLE_APPLICATION_CREDENTIALS: string;

    /** .env.local */

    /** authentication for github */
    readonly AUTH_GITHUB: string;
    /** authentication for entrez */
    readonly AUTH_ENTREZ: string;

    /** misc */

    /** whether script is being run on github actions */
    readonly CI: string;
  };
}
