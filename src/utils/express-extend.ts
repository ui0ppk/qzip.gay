import express, { type Express, type Request, type Response, type NextFunction } from "express";
//import socket_io from "socket.io";
//import websockets from "../websockets";

declare module 'express-serve-static-core' {
  interface Request {
    anon_id: () => string
  }

  interface Response {
    //io: typeof websockets
  }
}

const silly = {
  nouns: ["paw", "tail", "snoot", "goober", "maw", "ear", "boy", "girl"],
  verbs: ["kisser", "licker", "nommer", "sniffer", "bapper", "booper"] 
} 
async function extension(req: Request, res: Response, next: NextFunction): Promise<void> {
  //res.io = websockets
  req.anon_id = () => {
    const cuser_id = res.locals.cuser.id ?? undefined;
    const ip = req.ip ?? ``;  
    const id = `${cuser_id ?? ip}`;
    
    const hashed = Bun.hash.crc32(id);
    const rand_noun = silly.nouns[hashed % silly.nouns.length];
    const rand_verb = silly.verbs[hashed % silly.verbs.length];
    const rand_id = String(hashed % 100).padStart(2, "0");
    
    const final = `${rand_noun}${rand_verb}${rand_id}`;
    
    return final;
  } 
  next();
}

export default extension;