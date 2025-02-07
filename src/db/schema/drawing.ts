import { sql } from "drizzle-orm";
import { unique, integer, pgTable, varchar, uuid, timestamp, text, bigint } from "drizzle-orm/pg-core";

export const table_drawing = pgTable("drawing", {
  id: uuid().defaultRandom().primaryKey(),
  img: text().notNull(),
  creator: text().notNull(),
  createdat: integer().default(sql`extract(epoch from now())`),
});