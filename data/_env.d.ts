/* eslint-disable */
namespace NodeJS {
  type ProcessEnv = {
    // .env
    readonly RAW_PATH: string;
    readonly OUTPUT_PATH: string;
    readonly APP_PATH: string;
    readonly PDF_PATH: string;
    readonly CACHE: "" | "true";
    readonly GOOGLE_APPLICATION_CREDENTIALS: string;

    // .env.local
    readonly AUTH_GITHUB: string;
  };
}
