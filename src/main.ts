import config from "./config";
process.env.TZ = config.timezone;

import http from "./http";

http.init();
