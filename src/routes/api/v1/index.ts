import express, { type Express, type Request, type Response, type NextFunction } from "express";
const routes = express.Router();
import async_handler from 'express-async-handler';

import filebrowser from "./filebrowser";
import user from "./user";
import drawing from "./drawing";
import visitors from "./visitors";


routes.use("/file-browser", filebrowser);
routes.use("/user", user);
routes.use("/drawing", drawing);
routes.use("/visitors", visitors);

routes.all("*", async_handler(async (req, res) => {
  res.status(404);
  res.json({success: false, message: "not a valid api endpoint."});
}));

export default routes;