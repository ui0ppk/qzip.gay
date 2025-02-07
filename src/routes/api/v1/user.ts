import express, { type Express, type Request, type Response, type NextFunction } from "express";
const routes = express.Router();
import async_handler from 'express-async-handler';

import db, {table_users} from "../../../db";
import { sql } from 'drizzle-orm'
import { pcall } from "../../../utils/pcall";
import * as types from "../../../utils/types";
import cooldown from "../../../utils/cooldown";
import ratelimit from "../../../utils/ratelimit";
import { z } from "zod";
import { table_invkeys } from "../../../db/schema/invkeys";

routes.post("/get", ratelimit(), async_handler(async (req: Request, res: Response) => {
  const { token, id } = req.body;
  if(!token && !id) { res.status(403).end(); return; }
  
  // token gives you PRIVATE data
  // id    gives you PUBLIC  data 
  
  const user_query = db.select().from(table_users)
  
  if(token) {
    user_query.where(sql`token = ${token}`)
    const users = (await user_query);
    if(users.length == 0) {
      res.status(404).json({});
      return;
    } 
    const user = users[0];
    
    res.json({
      id: user.id,
      username: user.username,
      password: user.password,
      token: user.token,
      description: user.description,
      roles: user.roles,
      boops: user.boops,
      createdat: user.createdat,
    })
  } else if(id) {
    user_query.where(sql`id = ${id}`)
    const users = (await user_query);
    if(users.length == 0) {
      res.status(404).json({});
      return;
    } 
    const user = users[0];
    
    res.json({
      id: user.id,
      username: user.username,
      description: user.description,
      boops: user.boops,
      createdat: user.createdat,
    })
  }
}));


routes.get("/boop", ratelimit({timeframe: 600, max_reqs: 1, consequence: 1200}), async_handler(async (req: Request, res: Response) => {
  const id = String(req.query.id);
  const get_only = Boolean(req.query.get_only)
  if(!types.is_uuid(id) || !id) {
    res.status(400).end();
    return;
  }

  res.set(`content-type`, `text/plain`);
  if(get_only) {
    const user_query = await db.select({ boops: table_users.boops })
      .from(table_users)
      .where(sql`id = ${id}`);

    if(user_query[0]) {
      res.send(String(user_query[0].boops))
      return;
    } else {
      res.end();
      return;
    }
  } else {
    const user_query = await db.update(table_users)
      .set({ boops: sql`boops + 1` })
      .where(sql`id = ${id}`)
      .returning({ boops: table_users.boops });
  
    if(user_query[0]) {
      res.send(String(user_query[0].boops))
      return;
    } else {
      res.end();
      return;
    }
  }
}));
routes.post("/authenticate", ratelimit({timeframe: 2000, max_reqs: 2, consequence: 20000}), async_handler(async (req: Request, res: Response) => {
  const username = String(req.body.username);
  const password = String(req.body.password);

  const user_query = db.select({
    password: table_users.password,
    token: table_users.token
  }).from(table_users);
  user_query.where(sql`username = ${username}`);
  const users = (await user_query);
  if(users.length == 0) {
    res.status(404).json({ 
      success: false,
      message: `invalid username or password` 
    });
    return;
  } 
  const user = users[0];

  
  const [error, matches_hash] = await pcall(async () => await Bun.password.verify(password, user.password));
  console.log(error,matches_hash)
  if(!(error instanceof Error) && matches_hash) {
    res.json({
      success: true,
      message: `authenticated`,
      data: { 
        token: user.token
      }
    });
  } else {
    res.status(404).json({ 
      success: false,
      message: `invalid username or password` 
    });
  }
}));

routes.post("/create", ratelimit({timeframe: 2000, max_reqs: 2, consequence: 20000}), async_handler(async (req: Request, res: Response) => {
  const schema = z.object({
    username: z.string()
      .min(2, { message: "username needs to be 2 characters min." })
      .max(21, { message: "username needs to be 21 characters max." }),
    password: z.string()
      .min(8, { message: "password needs to be 8 characters min." })
      .max(32, { message: "password needs to be 32 characters max." }),
    confirm_password: z.string()
      .min(8, { message: "confirm password needs to be 8 characters min." })
      .max(32, { message: "confirm password needs to be 32 characters max." }),
    invite_key: z.string()
      .nonempty({ message: "invite key needs to be non empty." })
  }).refine(data => data.password === data.confirm_password, {
    message: "passwords do not match.",
    path: ["confirm_password"]
  });
  
  const result = schema.safeParse(req.body);
  
  if(!result.success) {
    res.status(400).json({ success: false, message: result.error.errors[0].message });
    return;
  } else { 
    const { username, password, invite_key } = result.data;
    const inv_query = await db.select().from(table_invkeys)
    .where(sql`key = ${invite_key}`);
    if(inv_query.length === 0) {
      res.status(400).json({
        success: false,
        message: `invite key is invalid.`
      });
      return;
    } else {
      const found_invite_key = inv_query[0];
      if(found_invite_key.taken !== null) {
        res.status(400).json({
          success: false,
          message: `invite key is used.`
        });
        return;
      }
    }
    const hashed_password = await Bun.password.hash(password);
    const [error, create_query] = await pcall(async () => {
      return await db.insert(table_users)
      .values({ 
        username: username,
        password: hashed_password,
      })
      .returning({ 
        id: table_users.id,
        token: table_users.token 
      })
    });
  
    if(error instanceof Error) {
      res.json({
        success: false,
        message: "detail" in error ? `${error?.detail}` : `an unknown error occured`
      });
  
      return;
    } else if (error === true) {
      const user = create_query[0];
      const set_inv_query = await db.update(table_invkeys)
        .set({ 
          updatedat: sql`extract(epoch from now())`,
          taken: user.id
        })
        .where(sql`key = ${invite_key}`);
      res.json({
        success: true,
        message: `account created`,
        data: { 
          token: user.token
        }
      });
  
      res.json(create_query);
    }
  }
}));

export default routes;