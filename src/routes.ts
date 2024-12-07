import express, { type Express, type Request, type Response } from "express";
import config from "./config";
import path from "path";
import root_path from "./utils/root_path";
import twig from "./utils/twig.ts";
import api_v1_routes from "./routes/api/v1.ts";
import front_routes from "./routes/front.ts";

import { queryParser as query_parser} from "express-query-parser";
import async_handler from "express-async-handler";
import cookie_parser from "cookie-parser";
import body_parser from "body-parser";
import logs from "./utils/log.ts";
import colors from "./utils/colors.ts";

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
    limit: "25mb"
}));
app.use(body_parser.json());
app.use(
  query_parser({
    parseNull: true,
    parseUndefined: true,
    parseBoolean: true,
    parseNumber: true
  })
)

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
app.use("/", express.static(path.join(__dirname, "../public/")));
app.use(async_handler(async (req, res, next) => {
  res.locals.req = req;
  res.locals.res = res;
  res.locals.config = config;
  res.locals.x_spa = (Boolean(req.headers["x-spa"]) === true);

  next();
}));

app.use(front_routes);
app.use("/api/v1", api_v1_routes);
app.get("*", async_handler(async (req, res) => {
  if(req.path.startsWith("/assets")) {
    res.status(403).render("error.twig");
  } else {
    res.status(404).render("error.twig");
  }
}));

app.use((err: any, req: any, res: any, next: any) => {
  try {
    logs.custom(err.stack.replace(err.name + ": ", ""), colors.red("error: " +err.name));
    if(config.debug) {
      let error = err.stack;
      return res.set("content-type", "text/plain").status(500).send(error);
    }
  } catch(e) {
    console.error(err);
  }
});

export default app;