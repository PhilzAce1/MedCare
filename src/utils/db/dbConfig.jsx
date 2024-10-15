import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";
const sql = neon(
  // "postgresql://zerotohero_owner:SPVe2rokvBf6@ep-bitter-shadow-a5lbwa60.us-east-2.aws.neon.tech/zerotohero?sslmode=require"
  "postgresql://ai_db_owner:cWOZ4InsfvU6@ep-fancy-art-a55m6i75.us-east-2.aws.neon.tech/ai_db?sslmode=require"
);
export const db = drizzle(sql, { schema });
