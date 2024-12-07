import express, { type Express, type Request, type Response, type NextFunction } from "express";
const routes = express.Router();
import async_handler from 'express-async-handler';

routes.get("/", async_handler((req: Request, res: Response) => {
  res.render("index.twig");
}));
routes.get("/projects", async_handler((req: Request, res: Response) => {
  res.render("error.twig");
}));

export default routes;