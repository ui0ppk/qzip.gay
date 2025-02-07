import express, { type Express, type Request, type Response, type NextFunction } from "express";
const routes = express.Router();
import async_handler from 'express-async-handler';
import { table_drawing } from "../../../db/schema/drawing";
import db from "../../../db";
import { pcall } from "../../../utils/pcall";
import ratelimit from "../../../utils/ratelimit";

routes.post("/create", ratelimit({ timeframe: 30000, max_reqs: 1, consequence: 40000}), async_handler(async (req: Request, res: Response) => {
  const anon_id = req.anon_id();
  const image = String(req.body.drawing);
  const [error, create_query] = await pcall(async () => {
    return await db.insert(table_drawing)
    .values({ 
      img: image,
      creator: anon_id,
    })
  });

  res.end();
}));

export default routes;