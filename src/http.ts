import config from "./config";
import logs from "./utils/log";
import { Server } from 'http';

import routes from "./routes";
//import websockets from "./websockets";

class http {
  server: Server | undefined;
  
  init() {
    logs.http(`starting...`);
    this.server = routes.listen(config.http.port, () => {
      logs.http(`running at :${config.http.port}`);
    });
    //websockets.listen(this.server);
  }
}

export default new http;
