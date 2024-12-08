import express, { type Express, type Request, type Response, type NextFunction } from "express";
const routes = express.Router();
import async_handler from 'express-async-handler';

routes.get("/ping", async_handler((req: Request, res: Response) => {
  const before = performance.now();
  const time = (performance.now() - before);
  const time_rounded = Math.floor(time * 10000) / 10000;
  res.json({ success: true, message: `pong! ${ time_rounded }ms`, info: { time: time }});
}));


routes.get("/projects/fetch", async_handler((req: Request, res: Response) => {
  res.json([
    {
      name: "testblox",
      description: "a big project aiming to recreate ROBLOX APIs and rehost it's older clients.",
      thumbnail: "https://u.rl/ima.ge",
    }
  ]);
}));

routes.get("*", async_handler(async (req, res) => {
  res.status(404);
  res.json({success: false, message: "not a valid api endpoint."});
}));

export default routes;