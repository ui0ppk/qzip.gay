import { defineConfig } from "drizzle-kit";
import config from "./src/config";

export default defineConfig({
  dialect: 'postgresql',
  schema: "./src/db/schema",
  dbCredentials: {
    url: `postgres://${config.db.username}:${config.db.password}@${config.db.host}:${config.db.port}/${config.db.database}`
  }
})