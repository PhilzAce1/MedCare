export default {
  dialect: "postgresql",
  schema: "./src/utils/db/schema.ts",
  out: "./drizzle",
  dbCredentials: {
    url: "postgresql://ai_db_owner:cWOZ4InsfvU6@ep-fancy-art-a55m6i75.us-east-2.aws.neon.tech/ai_db?sslmode=require",
    connectionString:
      "postgresql://ai_db_owner:cWOZ4InsfvU6@ep-fancy-art-a55m6i75.us-east-2.aws.neon.tech/ai_db?sslmode=require",
  },
};
