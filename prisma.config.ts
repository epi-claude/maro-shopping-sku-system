import "dotenv/config";
import { defineConfig } from "prisma/config";

// Get DATABASE_URL from environment, required at runtime
const databaseUrl = process.env.DATABASE_URL;

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  engine: "classic",
  ...(databaseUrl && {
    datasource: {
      url: databaseUrl,
    },
  }),
});
