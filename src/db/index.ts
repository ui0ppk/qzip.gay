import { drizzle } from "drizzle-orm/node-postgres";
import { seed } from "drizzle-seed";

//tables
import { table_users } from "./schema/user";
import { table_files } from "./schema/files";
import { table_invkeys } from "./schema/invkeys";

import config from "../config";

const db = drizzle(`postgres://${config.db.username}:${config.db.password}@${config.db.host}:${config.db.port}/${config.db.database}`);

// await db.insert(table_users).values({
//   username: "homosexual",
//   password: "mewing!",
//   description: "meow!"
// });

export default db; 
export { 
  table_users,
  table_files
};