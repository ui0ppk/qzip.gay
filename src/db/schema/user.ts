import { sql } from "drizzle-orm";
import { unique, integer, pgTable, varchar, uuid, timestamp, text, bigint } from "drizzle-orm/pg-core";

enum roles {
  normal,
  mod,
  admin,
  owner,
}

export const table_users = pgTable("users", {
  id: uuid().defaultRandom().primaryKey(),
  username: varchar({ length: 21 }).unique().notNull(),
  password: varchar().notNull(),
  avatar: text().notNull().default("/assets/img/anon.png"),
  token: text().notNull().$defaultFn(() => {
    const chars = "abcdef1234567890";
    const length = 48;
    
    let final = "";
    for(let i = 0; i < length; i++) {
      const rand = Math.floor(Math.random() * chars.length);
      final += chars.charAt(rand);
    }
    return `${final}`;
  }),
  description: varchar({ length: 250 }),
  boops: bigint({ mode: 'number' }).notNull().default(0),

  roles: integer().notNull().$type<roles>().default(roles.normal),
  createdat: integer().default(sql`extract(epoch from now())`),
});