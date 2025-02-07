import { sql } from "drizzle-orm";
import { unique, integer, pgTable, varchar, uuid, timestamp, text, bigint } from "drizzle-orm/pg-core";

export const table_invkeys = pgTable("invkeys", {
  id: uuid().defaultRandom().primaryKey(),
  taken: uuid(),
  key: text().notNull().$defaultFn(() => {
    const chars = "abcdef1234567890";
    const length = 24;
    
    let final = "";
    for(let i = 0; i < length; i++) {
      const rand = Math.floor(Math.random() * chars.length);
      final += chars.charAt(rand);
    }
    return `invkey-${final}`;
  }),
  updatedat: integer().default(sql`extract(epoch from now())`),
  createdat: integer().default(sql`extract(epoch from now())`),
});