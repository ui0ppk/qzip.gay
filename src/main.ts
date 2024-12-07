import config from "./config";
process.env.TZ = config.timezone;

//import './sql';
import http from "./http";

http.init();