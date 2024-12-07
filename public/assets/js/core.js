


const app = {
  body: document.querySelector("main"),
  set_url: async (url, replace = false) => {
    const request = await fetch(url, {
      headers: {
        "x-spa": `true`
      }
    });
    const response = await request.text();
    const data = response.split(`\\\\`);
    
    let head_raw = data.at(0);
    try {
      JSON.parse(head_raw);
    } catch (e) {
      console.warn("request is headless")
      head_raw = "{}";
    }
    const head = JSON.parse(head_raw) ?? {};
    const html = data.at(-1);

    if(replace) {
      window.history.replaceState({}, "", url);
    } else {
      window.history.pushState({}, "", url);
    }
    if(head && head.title && document.title != head?.title) {
      document.title = head.title;
    }
    if(app.body) { 
      app.body.innerHTML = html;
    } else {
      console.warn("cannot find <main>");
    }
  }
};

window.addEventListener("popstate", (event) => {
  console.warn("detected history change");
  app.set_url(window.location.href, true);
});