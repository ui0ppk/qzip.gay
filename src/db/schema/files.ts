import { sql } from "drizzle-orm";
import { unique, integer, pgTable, varchar, uuid, timestamp, text, customType, boolean } from "drizzle-orm/pg-core";

export enum categories {
  GLOBAL = "global",
  FURRY = "furry", //ofc
  PROGRAM = "program",
  ARCHIVES = "archives",
  ART = "art",
  SPAM = "spam" // trash & stuff
}

export const table_files = pgTable("files", {
  id: uuid().defaultRandom().primaryKey(),
  name: varchar({ length: 32 }).notNull(),
  category: varchar({ length: 32 }).notNull().$type<categories>().default(categories.GLOBAL),

  size: integer().notNull().default(0),
  mime: text().notNull().default(`text/plain`),
  asset: varchar({ length: 256 }).notNull().default("files/"),
  unlisted: boolean().notNull().default(false),
  
  user: uuid().notNull(),
  
  tags: text().array().default(sql`ARRAY[]::text[]`),
  createdat: integer().default(sql`extract(epoch from now())`),
});