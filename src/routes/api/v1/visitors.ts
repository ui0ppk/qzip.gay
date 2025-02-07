import express, { type Express, type Request, type Response, type NextFunction } from "express";
const routes = express.Router();
import async_handler from 'express-async-handler';

import db, { table_files, table_users } from "../../../db/index";
import { eq, sql } from "drizzle-orm";
import { categories } from "../../../db/schema/files";

import path from "path";
import root_path from "../../../utils/root_path";
import * as types from "../../../utils/types";
import ratelimit from "../../../utils/ratelimit";

const visitors: {[key: string]: number} = {};
const get_filtered_visitors = () => Object.entries(visitors).filter(([visit, time]) => {
  return (Date.now() - time) < 1000 * 25
}).reduce((accum: typeof visitors, [visit, time]) => { // reverts the object entries conversion
  accum[visit] = time;
  return accum;
}, {});
routes.get("/visit", ratelimit(), async_handler(async (req: Request, res: Response) => {
  const id = req.anon_id();

  visitors[id] = Date.now();
  const filtered_visitors = get_filtered_visitors();
  res.json(filtered_visitors);
}));
routes.get("/visitor-count", ratelimit(), async_handler(async (req: Request, res: Response) => {
  const filtered_visitors = get_filtered_visitors();
  res.json(filtered_visitors);
}));

export default routes;
