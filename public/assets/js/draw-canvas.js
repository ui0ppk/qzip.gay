class entity_draw_canvas {
  width = 480;
  height = 360;

  debug = false;
  canvas = null;
  context = null;
  
  mouse_btn = 0;
  drawing = false;

  history = [];
  max_history = 100;

  brush = {
    tool: "draw",
    layer: "over",
    color: "#000",
    size: 4,
    join: "round",
    cap: "round"
  }

  zoom = {
    value: 5,
    min: 1,
    max: 10,
    percent: () => (this.zoom.value / this.zoom.max) * 200
  }

  save_history() {
    if (this.history.length >= this.max_history) {
      this.history.shift();
    }
    this.history.push(this.get_as_image());
  }


  get_context() {
    const device_pixel_ratio = window.devicePixelRatio ?? 1;

    this.canvas.height = this.height * device_pixel_ratio;
    this.canvas.width = this.width * device_pixel_ratio;

    const context = this.canvas.getContext("2d");
    context.scale(device_pixel_ratio, device_pixel_ratio);
    return context;
  }

  set_brush(
    tool = this.brush.tool,
    layer = this.brush.layer,
    color = this.brush.color, 
    size = this.brush.size, 
    join = this.brush.join,
    cap = this.brush.cap
  ) {
    if(tool === "eraser") {
      this.context.globalCompositeOperation = "destination-out";
    } else if(tool === "draw") {
      if(layer === "over") {
        this.context.globalCompositeOperation = "source-over";
      } else if(layer === "under") {
      this.context.globalCompositeOperation = "destination-over";
      }
    }
    this.context.strokeStyle = color;
    this.context.fillStyle = color;
    this.context.lineWidth = size;
    this.context.lineJoin = join;
    this.context.lineCap = cap;
  }

  clear() {
    this.context.clearRect(0, 0, this.context.canvas.width, this.context.canvas.height);
  }

  undo() {
    if(this.history.length > 0) {
      const previous_state = this.history.pop();
      const img = new Image();
      img.onload = () => {
        this.clear();
        this.context.drawImage(img, 0, 0);
      };
      img.src = previous_state;
    }
  }

  start(event, self, is_touch = false) {
    if(event.type === "mousedown" && event.button === self.mouse_btn || event.type === "touchstart") {
      self.drawing = true;
      self.set_brush();
      self.save_history();
      
      let x, y;

      const rect = self.canvas.getBoundingClientRect();
      if(is_touch) {
        const touch = event.touches[0];
        x = touch.clientX - rect.left;
        y = touch.clientY - rect.top;
      } else {
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
      }

      x = (x / rect.width) * self.canvas.width;
      y = (y / rect.height) * self.canvas.height;
      
      self.context.beginPath();
      self.context.arc(x, y, self.brush.size / 2, 0, Math.PI * 2); // so it draws a dot on first click
      self.context.fill();
      self.context.closePath();
      self.context.beginPath();
      
      self.context.beginPath();
      self.context.moveTo(x, y);
    }
  }
  
  end(event, self) {
    if(event.button === self.mouse_btn) {
      self.drawing = false;
    }
  }

  get_as_image() {
    return this.canvas.toDataURL();
  }
  
  move(event, self, is_touch = false) {
    if(self.drawing) {
      let x, y;

      const rect = self.canvas.getBoundingClientRect();
      if(is_touch) {
        const touch = event.touches[0];
        x = touch.clientX - rect.left;
        y = touch.clientY - rect.top;
      } else {
        x = event.clientX - rect.left;
        y = event.clientY - rect.top;
      }

      x = (x / rect.width) * self.canvas.width;
      y = (y / rect.height) * self.canvas.height;

      self.context.lineTo(x,y);
      self.context.stroke()

      self.context.closePath();
      self.context.beginPath();
      self.context.moveTo(x,y);
    }
  }
  
  is_touch() { //https://stackoverflow.com/a/4819886
    return (('ontouchstart' in window) ||
       (navigator.maxTouchPoints > 0) ||
       (navigator.msMaxTouchPoints > 0));
  }
  
  log(msg) {
    console.log(`[DRAW]: ${msg}`);
  }

  zoom_set(int = this.zoom.value) {
    int = Math.round(Number(int));

    if(this.zoom.min > int || this.zoom.max < int) return;
    this.zoom.value = int;
    console.log(this.zoom.value, this.zoom.percent());
    this.canvas.style.zoom = String(`${this.zoom.percent()}%`);
  }

  zoom_in() {
    this.zoom_set(this.zoom.value+1);
  }

  zoom_out() {
    this.zoom_set(this.zoom.value-1);
  }
  
  constructor(canvas, options = {}) {
    this.debug = options.debug ?? false;
    this.width = options.width ?? this.width;
    this.height = options.height ?? this.height;
    
    this.log("initializing");

    this.canvas = canvas;

    if(document.body.clientWidth < this.width) {
      const adjuster = (document.body.clientWidth / this.width);
      this.log(`TOO SMALL ${adjuster} ${this.zoom.value * adjuster}`)
      this.zoom_set(this.zoom.value * adjuster);

    } else {
      this.zoom_set();
    }
    this.context = this.get_context();
    
    const touch_device = this.is_touch();
    this.log(`TOUCH: ${touch_device}`);

    if(touch_device) {
      this.canvas.addEventListener("touchstart", (e) => {
        e.preventDefault();
        this.log(`STARTED TOUCH`);
        this.start(e, this, true);
      });
      this.canvas.addEventListener("touchend", (e) => {
        e.preventDefault();
        this.end(e, this);
      });
      this.canvas.addEventListener("touchmove", (e) => {
        e.preventDefault();
        this.log(`TOUCH MOVE`);
        this.move(e, this, true);
      }, false);
    } else {
      this.canvas.addEventListener("mousedown", (e) => this.start(e, this));
      window.addEventListener("mouseup", (e) => this.end(e, this));
      window.addEventListener("mousemove", (e) => this.move(e, this), false);
    }

    return this;
  }
}