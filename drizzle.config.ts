import type { Config } from "drizzle-kit";

export default {
  schema: "./database/schema.ts",
  out: "./database/migrations",
  dialect: "sqlite",
  dbCredentials: {
    url: "./database/local.db",
  },
  verbose: true,
} satisfies Config;
