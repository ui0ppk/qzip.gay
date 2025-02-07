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

routes.get("/categories", ratelimit(), async_handler(async (req: Request, res: Response) => {
  const categories_arr = Object.values(categories);

  const items = (await Promise.all(
    categories_arr.map(async (cat) => {
      const cat_query = (await db.select({ 
        count: sql`count(*)`.mapWith(Number),
        size: sql`SUM(size)`.mapWith(Number)
      }).from(table_files)
        .where(sql`category = ${cat}`))[0];

      return { [cat]: {
        count: cat_query.count,
        size:  cat_query.size ?? 0
      }}
    })
  )).reduce((acc, item) => ({ ...acc, ...item }), {});

  res.json(items);
}));

routes.post("/", ratelimit(), async_handler(async (req: Request, res: Response) => {
  const search = String(req.body.search ?? "");
  const category = String(req.body.category ?? "ALL")

  const file_query = db.select().from(table_files).leftJoin(table_users, eq(table_users.id, table_files.user))
  file_query.where(sql`unlisted = false`);
  
  const tags = (() => { 
    if(search && search.length == 0) return { tags: [], colons: {} };

    const tags = search.split(" ");
    
    if(tags.length == 0) return { tags: [], colons: {} };

    let colons: {[key: string]: number|string|boolean} = {};
    tags.forEach((tag: string, index, array) => {
      const [key, val] = tag.split(":");
      if(val) {
        delete array[index];
      } else {
        return;
      }
      colons[key] = val;
    });

    return {
      tags: tags.filter(n => n),
      colons: colons
    };
  })();

  Object.entries(tags.colons).forEach(([key, val]) => {
    switch(key) {
      case "name":
        file_query.where(sql`name = ${val}`); 
        break;
      case "userid":
        file_query.where(sql`users.id = ${val}`); 
        break;
      case "username":
        file_query.where(sql`users.username = ${val}`); 
        break;
      default:
        break;
    }
  })
  if(tags.tags && tags.tags.length > 0) {
    file_query.where(sql`tags && ARRAY[${tags.tags.map((tag: string) => `${tag}`).join(",")}]::text[]`);
  }
  if(category !== "ALL") {
    if((Object.values(categories) as Array<String>).includes(category)) {
      file_query.where(sql`category = ${category}`);
    }
  }
  
  const file_result = await file_query;
  const files = file_result.map((row) => {
    const file = row.files;
    const user = row.users;
    return {
      id: file.id,
      name: file.name,
      category: file.category,

      mime: file.mime,
      size: file.size ?? 0,

      user: {
        id: file.user,
        username: user?.username, 
      },

      created: file.createdat
      // reviews: [
      //   {
      //     username: "faggot",
      //     text: "KURVA NAHUI"
      //   }
      // ]
    }
  });

  res.json({
    success: true,
    code: "OK",
    message: "",

    data: {
      files: files,
    }
  });
}));
routes.get("/get-file-data", ratelimit(), async_handler(async (req: Request, res: Response) => {
  const id = String(req.query.id);

  if(!types.is_uuid(id)) {
    res.status(400).end();
    return;
  }

  const file_query = db.select().from(table_files)
    .where(sql`id = ${id}`);

  const file = (await file_query)[0];
  if(!file) {
    res.status(404).end();
    return;
  }

  const file_path = path.join(root_path, file.asset);
  res.set(`Content-Disposition`, `inline; filename="${file.name}"`);
  res.sendFile(file_path);
}));
routes.get("/get-file-info", ratelimit(), async_handler(async (req: Request, res: Response) => {
  const id = String(req.query.id);

  if(!types.is_uuid(id)) {
    res.json({
      success: false,
      code: "INVALID_UUID",
      message: "",
  
      data: {}
    })
    return;
  }

  const file_query = db.select({
    files: table_files,
    users: table_users,
    user_file_count: sql`count(files)`,
  }).from(table_files).leftJoin(table_users, eq(table_users.id, table_files.user))
    .where(sql`files.id = ${id}`)
    .groupBy(table_files.id, table_users.id);

  const row = (await file_query)[0];
  if(!row) {
    res.json({
      success: false,
      code: "NOT_FOUND",
      message: "",
  
      data: {}
    })
    return;
  }
  const file = row.files;
  const user = row.users;
  const file_count = row.user_file_count;
  res.json({
    success: true,
    code: "OK",
    message: "",

    data: {
      id: file.id,
      name: file.name,
      category: file.category,
      asset: `/api/v1/file-browser/get-file-data?id=${file.id}`,
      user: {
        id: file.user,
        username: user?.username, 
        posts: file_count,
      },

      mime: file.mime,
      size: file.size ?? 0,
      tags: file.tags,

      created: file.createdat
    }
  });
}));

export default routes;