document.addEventListener("alpine:init", () => {

  // time
  Alpine.directive("time", (el, { value, expression, modifiers }, { Alpine, effect }) => {
    const eval_time = Alpine.evaluateLater(el, value === null ? expression : `0`);
    const eval_mask = el.getAttribute("x-time:mask") ?? ``;
    const is_ago = el.getAttribute("x-time.ago") ?? false;

    effect(() => {
      eval_time((raw_time) => {
        let time = Number(raw_time);
        if(Number.isNaN(time)) { 
          console.warn(`Alpine Expression Error: expected valid time, got "${raw_time}"\n\nExpression: "${expression}"`); //:3
          time = 0; 
        }
        
        const date_time = luxon.DateTime.fromSeconds(time);
        if(is_ago) {
          const time_diff = date_time.toRelative() 
        
          el.textContent = time_diff;
        } else {
          const time_formatted = date_time.toFormat(eval_mask);
        
          el.textContent = time_formatted;
        }
      });
    });
  });
});