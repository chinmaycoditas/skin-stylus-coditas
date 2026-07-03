// src/js/components/ExitIntent.js
var ExitIntent = class {
  constructor(el) {
    this.el = el;
    this.lastPosition = window.scrollY;
    this.lastTime = Date.now();
    this.triggered = false;
    this.minScrollDepth = 400;
    this.speedThreshold = 2e3;
  }
  init() {
    setTimeout(() => {
      this.scrollListener = this.checkScrollSpeed.bind(this);
      document.addEventListener("scroll", this.scrollListener);
    }, 5e3);
  }
  checkScrollSpeed() {
    const currentPosition = window.scrollY;
    const currentTime = Date.now();
    const distance = currentPosition - this.lastPosition;
    const timeElapsed = currentTime - this.lastTime;
    const speed = distance / (timeElapsed / 1e3);
    const scrolledEnough = currentPosition > this.minScrollDepth;
    const scrolledFast = Math.abs(speed) > this.speedThreshold;
    if (scrolledEnough && scrolledFast && !this.triggered) {
      this.triggered = true;
      document.removeEventListener("scroll", this.scrollListener);
      this.el.querySelector("[data-modal-toggle]").checked = true;
    }
    this.lastPosition = currentPosition;
    this.lastTime = currentTime;
  }
};
var ExitIntent_default = ExitIntent;
export {
  ExitIntent_default as default
};
