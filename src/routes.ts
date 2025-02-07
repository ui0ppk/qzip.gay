import express, { type Express, type Request, type Response } from "express";
import config from "./config";
import path from "path";
import root_path from "./utils/root_path";
import twig from "./utils/twig.ts";
import api_v1_routes from "./routes/api/v1/";
import front_routes from "./routes/front.ts";

import { queryParser as query_parser} from "express-query-parser";
import async_handler from "express-async-handler";
import cookie_parser from "cookie-parser";
import logs from "./utils/log.ts";
import colors from "./utils/colors.ts";
import express_extension from "./utils/express-extend.ts";
import db, { table_users } from "./db/index.ts";
import { sql } from "drizzle-orm";

const app = express();

app.use(cookie_parser());
app.set('trust proxy', config.behind_proxy)
app.set("views", path.join(root_path, config.views.folder));
app.set("view engine", twig);
app.set("twig options", {
  allowAsync: true,
  autoescape: false, // retarded
  strict_variables: false,
});
app.use(express.urlencoded({
    extended: false,
    limit: "10mb"
}));
app.use(express.json({ limit: "100mb" }));
app.use(
  query_parser({
    parseNull: true,
    parseUndefined: true,
    parseBoolean: true,
    parseNumber: true
  })
)

app.use(express_extension);

app.use(async_handler(async (req, res, next) => {
  app.disable("x-powered-by");
  res.set("X-Powered-By", "PHP/5.6.40"); // get fucking trolled

  let user_agent = req.get('user-agent')?.toString() ?? "";
  logs.request(
    req.method.toString(), 
    req.originalUrl.toString(), 
    req.ip?.toString() ?? "0.0.0.0", 
    user_agent
  );
  next();
}));
app.use("/", express.static(path.join(root_path, "public")));
const core_dot_js_gen = (async () => {
  const file = Bun.file(path.join(root_path, "public", "assets", "js", "core-raw.js"));
  const data = await file.text();

  return data
    .replaceAll(`@{version}`, `${config.version}`)
    .replaceAll(`@{sitename}`, `${config.site.name}`)
    .replaceAll(`@{retards}`, `${["aspherrx"].join(", ")}`) // this is a joke
});
let core_dot_js = await core_dot_js_gen();
app.get("/assets/js/core.js", async_handler(async (req, res, next) => {
  res.set(`content-type`, `application/javascript; charset=UTF-8`);
  if(config.debug) core_dot_js = await core_dot_js_gen();
  res.send(core_dot_js);
}));
app.use(async_handler(async (req, res, next) => {
  res.locals.req = req;
  res.locals.res = res;
  res.locals.config = config;

  const token = req.cookies.token;
  if(token) {
    const cuser_query = db.select().from(table_users).where(sql`token = ${token}`)
    const users = (await cuser_query);
    if(users.length > 0) {
      res.locals.cuser = users[0];
    } else {
      res.locals.cuser = {};
    }
  } else {
    res.locals.cuser = {};
  }

  next();
}));

app.use(front_routes);
app.use("/api/v1", api_v1_routes);
app.all("*", async_handler(async (req, res) => {
  res.status(404).render("error.twig");
}));

app.use((err: any, req: any, res: any, next: any) => {
  try {
    logs.custom(err.stack.replace(err.name + ": ", ""), colors.red(`(${req.path}) error: ` +err.name));
    if(config.debug) {
      let error = err.stack;
      return res.set("content-type", "text/plain").status(500).send(error);
    }
  } catch(e) {
    console.error(err);
  }
});

export default app;