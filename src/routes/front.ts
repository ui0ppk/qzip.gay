import express, { type Express, type Request, type Response, type NextFunction } from "express";
const routes = express.Router();
import async_handler from 'express-async-handler';
import * as types from "../utils/types"

routes.get("/", async_handler((req: Request, res: Response) => {
  res.render("index.twig");
}));
// routes.get("/projects/", async_handler((req: Request, res: Response) => {
//   res.render("projects.twig");
// }));
routes.get("/files/", async_handler((req: Request, res: Response) => {
  res.render("files.twig");
}));
routes.get("/drawing/", async_handler((req: Request, res: Response) => {
  res.render("drawing.twig");
}));
routes.get("/user/:id/", async_handler((req: Request, res: Response) => {
  const id = String(req.params.id);
  res.render("user.twig", { id: types.is_uuid(id) ? id : `` });
}));



routes.get("/login/", async_handler((req: Request, res: Response) => {
  res.render("login.twig");
}));
routes.get("/register/", async_handler((req: Request, res: Response) => {
  res.render("register.twig");
}));

routes.get("/settings/", async_handler((req: Request, res: Response) => {
  res.render("settings.twig");
}));

export default routes;