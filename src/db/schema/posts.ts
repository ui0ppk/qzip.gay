import { sql } from "drizzle-orm";
import { unique, integer, pgTable, varchar, uuid, timestamp, text, customType, boolean } from "drizzle-orm/pg-core";

export const table_posts = pgTable("posts", {
  id: uuid().defaultRandom().primaryKey(),
  text: varchar({ length: 250 }).notNull(),

  replying_to: uuid(),
  
  user: uuid().notNull(),
  
  tags: text().array().default(sql`ARRAY[]::text[]`),
  createdat: integer().default(sql`extract(epoch from now())`),
});