import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString =
  process.env.DATABASE_URL ??
  "postgresql://build:build@ep-build.us-east-2.aws.neon.tech/neondb";

export const db = drizzle(neon(connectionString), { schema });
