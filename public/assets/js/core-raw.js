// @{sitename}
// special thanks (for nothing) to @{retards} 

const url_params = new URLSearchParams(window.location.search);

const logger = {
  logs: [],
  custom: (key = "LOG", text) => {
    const template = `[${key}]: ${text}`
    logger.logs.push({
      type: key,
      text: text
    });
    console.log(template);
    return;
  },
  print: (text) => logger.custom(`LOG`, text)
}

const app = {
  version: `@{version}`,
  titles: {
    on_load: `${document.title}`,
    last_fetched: ``,
  },
  set_title: (title) => {
    const title_template = `| @{sitename}`
    document.title = `${title} ${title_template}`;
  },
  body: document.querySelector("main"),
  set_url: async (url, replace = false, redirect = false) => {
    if(redirect) {
      window.location.href = url;
      return;
    }
    const request = await fetch(url, {});
    const response = await request.text();
    
    const html = (new DOMParser()).parseFromString(response, "text/html");
    const head = html.head;
    const body = html.body;
    const app_body = body.querySelector("main");

    if(replace) {
      window.history.replaceState({}, "", url);
    } else {
      window.history.pushState({}, "", url);
    }

    if(head && html.title && document.title != html?.title) {
      document.title = html.title;
      app.titles.last_fetched = html.title;
    }
    
    if(app.body) {
      Array.from(head.children).forEach((b) => {
        if(!Array.from(document.head.children).some((a) => a.isEqualNode(b))) {
          document.head.append(b);
        }
      })
      app.body.innerHTML = app_body.innerHTML;
    } else {
      console.warn("cannot find <main>");
    }
  }
};

const sound_path = `/assets/snd`;
const sounds = {
  files: {
    SQUEEK: `${sound_path}/squeek.mp3`
  },
  squeek: () => (new Audio(sounds.files.SQUEEK)).play()
}

const utils = {
  formatting: {
    size_byte: (bytes, decimals = 2) => { //https://stackoverflow.com/a/71209062
      let units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
      let i = 0;
      
      for (i; bytes > 1024; i++) {
        bytes /= 1024;
      }
      return parseFloat(bytes.toFixed(decimals)) + units[i];      
    }
  },

  json: {
    parse_s: (str) => {
      try {
        let parsed_json = JSON.parse(str);
        return parsed_json;
      } catch(e) {
        return {};
      }
    }
  },

  //https://stackoverflow.com/a/6234804
  html: {
    escape: (str) => {
      return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
    }
  },

  array: {
    cycle_next: (value, arr) => {
      const next_index = (arr.indexOf(value) + 1) % arr.length;
      return arr[next_index];
    },
    cycle_prev: (value, arr) => {
      const prev_index = (arr.reverse().indexOf(value) + 1) % arr.length;
      return arr.reverse()[prev_index];
    },
    shuffle: (array) => {
      if(typeof array === 'undefined' || array === null) return {};
      let new_array = JSON.parse(JSON.stringify(array)); //hack
    
      let current_index = new_array.length;
      while (current_index != 0) {
    
        let random_index = Math.floor(Math.random() * current_index);
        current_index--;
        [new_array[current_index], new_array[random_index]] = [
          new_array[random_index], new_array[current_index]];
      }
      return new_array;
    }
  }
}

//xss shorthand
const xss = utils.html.escape.bind(document);

//shit but so are cookies
const cookies = new Proxy((() => {
    const unparsed_cookies = document.cookie.split(";");
    let cookies = {}
    unparsed_cookies.forEach((cookie) => {
      let [key, val] = cookie.trim().split("=");
      cookies[key] = decodeURIComponent(val ?? ""); 
    });
    return cookies;
  })(), {
    get(target, prop) {
      return target[prop];
    },
    set(target, prop, value) {
      let same_site = "Lax";
      let expires_in = 86400;
      let path = location.href;
      if(typeof value === "object") {
        if(value.same_site) same_site = value.same_site;
        if(value.expires_in) expires_in = value.expires_in;
        if(value.path) path = value.path;


        value = value.value;
      }
      document.cookie = `${prop}=${encodeURIComponent(value)}; path=${path}; SameSite=${same_site}; max-age=${expires_in};`;
      return target[prop];
    },
  
});

const popup = {
  new: (detail) => {
    return window.dispatchEvent(
      new CustomEvent('new-popup', { 
        detail: detail
      }
    ));
  },
  close: (detail) => {
    return window.dispatchEvent(
      new CustomEvent('close-popup', { 
        detail: detail
      }
    ));
  }
};

const cuser = {
  loggedin: cookies.token ? true : false,
  make_proxy: (obj) => new Proxy(obj, {
    set(target, prop, val) {
      target[prop] = val;
      Alpine.store("cuser", { ...target });
    }
  }),
  fetch: async (token = cookies.token ?? ``, once_done = () => {}) => {
    fetch(`/api/v1/user/get`, {
      method: "POST",
      headers: {
        'Content-Type': `application/json`,
      },
      body: JSON.stringify({
        token: token,
      })
    }).then((response) => response.json()).then((json) => {
      cuser.data = cuser.make_proxy(json);

      localStorage.setItem("cuser.data", JSON.stringify(json));
      Alpine.store("cuser", json);
      if(once_done) { once_done() };
    });
  },

  logout: () => {
    localStorage.removeItem(`cuser.data`);
    cookies.token = {value: ``, expires_in: -86400, path: `/` };
  },

  data: utils.json.parse_s(localStorage.getItem("cuser.data") ?? {})
}

window.addEventListener("popstate", (event) => {
  console.warn("detected history change");
  app.set_url(window.location.href, true);
});

const tab_sleep = (() => { 
  let active = true;

  const favicon = document.querySelector("link[rel~='icon']")
  let favicons = {
    old: ``,
    current: favicon.getAttribute("href"), 
    set: (url) => { 
      favicon.setAttribute("href", url);
      current = favicon.getAttribute("href");
    },
    get: () => favicon.getAttribute("href")
  }

  let titles = {
    old: ``,
    current: ``,
    set: (title) => {
      document.title = title;
      titles.current = document.title;
    }
  }
  titles.current = document.title;
  document.addEventListener("visibilitychange", () => {
    if(document.visibilityState === "hidden") {
      titles.old = document.title; 
      active = false;
      favicons.old = favicons.get(); 
      favicons.set("/assets/img/bepisdrink-transparent.png")
    } else {
      active = true;
      if(titles.current === document.title) {
        titles.set(titles.old);
        favicons.set(favicons.old)
      }
    }
  }, false);

  let i = 0;
  setInterval(() => {
    if(!active) {
      if(i === 3) i = 0;
      i++;
      titles.set(`${`💤`.repeat(i)} ${titles.old}`);
    } else {
      i = 0;
    }
  }, 200);
});

const visitors = {
  visitors: {},
  last_updated: Date.now(),
  count: 0,
  refresh: () => {
    return fetch(`/api/v1/visitors/visitor-count`)
    .then((response) => response.json()).then((visitors_json) => {
      visitors.last_updated = Date.now();

      visitors.visitors = visitors_json;
      visitors.count = Number(Object.keys(visitors_json).length);

      Alpine.store("visitors_last_updated", visitors.last_updated);
      Alpine.store("visitors_count", visitors.count);
      Alpine.store("visitors_visitors", visitors.visitors);
      return visitors.count;
    });
  },
  visit: () => {
    return fetch(`/api/v1/visitors/visit`)
    .then((response) => response.json()).then((visitors_json) => {
      visitors.last_updated = Date.now();

      visitors.visitors = visitors_json;
      visitors.count = Number(Object.keys(visitors_json).length);

      Alpine.store("visitors_last_updated", visitors.last_updated);
      Alpine.store("visitors_count", visitors.count);
      Alpine.store("visitors_visitors", visitors.visitors);
      return visitors.count;
    });
  },
};


document.addEventListener("alpine:init", () => {
  Alpine.store("app", app);
  Alpine.store("loggedin", cuser.loggedin);
  Alpine.store("cuser", cuser.data);
  Alpine.store("visitors_last_updated", visitors.last_updated);
  Alpine.store("visitors_count", visitors.count);
  Alpine.store("visitors_visitors", visitors.visitors);

  //"WHY DID U INLINE EVERYTHING ELSE BUT CHAT ISNT??!"
  // its cuz i didnt plan those out lol
  Alpine.data("chat", () => ({
    init: () => {
      let url = `ws${(location.protocol === "https:") ? `s` : ``}://${window.location.host}/chat`;
      const websocket = new WebSocket(url)
      websocket.onmessage = function(e){
        let data = JSON.parse(e.data);
        console.log(data);
      }
    }
  }));
});

const custom_cursor = (toggle = true) => {
  if(!localStorage.getItem("cursor.custom")) {
    localStorage.setItem("cursor.custom", "true");
  }
  if(toggle) localStorage.setItem("cursor.custom", localStorage.getItem("cursor.custom") == "true" ? "false" : "true");
  if(localStorage.getItem("cursor.custom") == "true") {
    document.querySelector("html").setAttribute("custom-cursor", "");
  } else {
    document.querySelector("html").removeAttribute("custom-cursor");
  }

  return (localStorage.getItem("cursor.custom") == "true" ? true : false);
}

(async () => {
  custom_cursor(false);
  
  visitors.visit();
  setInterval(() => {
    if(!document.hidden) visitors.visit();
    if(document.hidden) visitors.refresh();
  }, 20000)

  if(cuser.loggedin) cuser.fetch();
  
  const quotes = [`now with ${100 - Math.round(Math.random() * 20)}% more bugs`, "mrrp! meowwww >~<", "FUCK MY CHUD LIFE"];
  console.log(`%cqzip%c.%cgay\n%cversion: ${app.version}\n%c"${utils.array.shuffle(quotes)[0]}"`, 
    "color: #996be3; font-size: 1.5em;",
    "color: #fff; font-size: 1.5em;",
    "color: #ace972; font-size: 1.5em;",

    "color: #fff; font-size: 1.1em;",
    "color: #cacaca; font-size: 0.95em; font-style: italic;"
  );
})();