import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cooldown from "./cooldown";

// cooldown wrapper but http

const ratelimit = (options: {
  timeframe?: number
  max_reqs?: number
  consequence?: number
} = {}) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    options = {
      timeframe: options.timeframe ?? 8000, 
      max_reqs: options.max_reqs ?? 15, 
      consequence: options.consequence ?? 20000
    }
    const cuser_id = res.locals.cuser.id ?? undefined;
  
    const path = req.originalUrl.split("?")[0]; 
    const identifier = `[${cuser_id ?? req.ip}]:${path}`;

    const [timed_out, diff, hits, max] = cooldown.apply(
      identifier, 
      
      options.timeframe, 
      options.max_reqs, 
      options.consequence
    );
    console.log(`${identifier} applied`, diff, hits, max)

    res.setHeader("Retry-After", diff > 0 ? String(diff) : `0`);

    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(max-hits));
    res.setHeader("X-RateLimit-Reset", diff > 0 ? String(diff) : `0`);

    // non standard 
    // "BUT THOSE ARENT STANDARD EITHER!!"
    // > shurrup.
    res.setHeader("X-RateLimit-Timeframe", String(options.timeframe));
    if(timed_out) {
      res.status(429).end();
      return;
    } else {
      next();
    }
  };
};

export default ratelimit;

function async_handler(arg0: (req: Request, res: Response, next: NextFunction) => Promise<void>) {
  throw new Error("Function not implemented.");
}
