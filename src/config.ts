export default {
  //**should be** immutable
  start: performance.now(),
  
  version: `2.1.0-beta.0`,

  debug: true,
  timezone: "Europe/Vilnius",
  behind_proxy: false,
  log_file: false,

  http: {
    port: 2020
  },

  db: {
    username: "qzipdotgay",
    password: "qzipdotgay",
    database: "qzipdotgay",
    host:     "localhost",
    port:     "5432",
  },

  // the
  owner_id: `fea34d30-1348-4bc5-8d37-a2dc6a8a7297`,

  site: {
    name: "qzip.gay",
    desc: "personal site with some gimmicks and info :3c",
  },

  views: {
    folder: "views"
  }
};