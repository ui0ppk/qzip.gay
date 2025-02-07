class cooldown {
  data: {[key: number|string]: {
    time: number,
    current: number,
    max: number,
    consequence: number
    consequence_given: boolean
  }} = {};

  // i forgot to document this and this is messy coming back to it now..
  apply(
    key: number|string,     // name for the cooldown entry
    time: number = 0,       // sets time**frame**
    max: number = 1,        // sets the max amount of hits allowed
    consequence: number = 0 // the resulting timeout for exceeding the amount of hits allowed 
  ): [
    boolean, // blocked or not
    number,  // time diff / seconds left before the hits are reset
    
    // redundant
    number,  // hits
    number   // max
  ] {
    let now = Date.now()
    let diff = (this.data[key] ? this.data[key].time : 0) - now;

    if(this.data[key] && (this.data[key] && diff > 0)) {
      if(this.data[key].current >= this.data[key].max) {
        if(!this.data[key].consequence_given) {
          this.data[key].time += consequence;
          diff += consequence; // so you actually get it at the first blocked ~~request~~ cooldown
          this.data[key].consequence_given = true;
        }
        return [true, diff, this.data[key].current, this.data[key].max];
      } else {
        if(this.data[key]) {
          this.data[key].current += 1;
        }
        return [false, diff, this.data[key].current, this.data[key].max]
      }
    } else {
      this.data[key] = {
        time: now + time,
        current: 0,
        max: max,
        consequence: consequence,
        consequence_given: false
      };
      return [false, diff, this.data[key].current, this.data[key].max];
    }
  }
}

export default (new cooldown());