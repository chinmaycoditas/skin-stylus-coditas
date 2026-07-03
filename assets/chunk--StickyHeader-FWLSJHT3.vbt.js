// src/js/components/StickyHeader.js
var StickyHeader = class {
  constructor(el) {
    this.header = el;
    this.headerOverride = document.querySelector(".header-override");
    this.headerOverrideInner = document.querySelector(".header-override__inner");
    this.isHidden = false;
    this.scrollTimeout = null;
    this.lastScrollY = window.scrollY;
    this.ticking = false;
    this.headerOverrideHidden = false;
    this.headerOverrideScrollThreshold = 100;
    this.headerOverrideRecentlyShown = false;
  }
  init() {
    document.addEventListener("scroll", () => {
      if (!this.ticking) {
        window.requestAnimationFrame(() => {
          this.onScroll();
          this.ticking = false;
        });
        this.ticking = true;
      }
    });
  }
  onScroll() {
    const currentScroll = window.scrollY;
    const scrollDiff = currentScroll - this.lastScrollY;
    this.lastScrollY = currentScroll;
    this.handleHeaderOverrideScroll(currentScroll, scrollDiff);
    if (currentScroll <= 0) {
      this.header.style.transform = "translateY(0)";
      this.header.classList.remove("scrolled");
      return;
    }
    if (scrollDiff > 0) {
      this.header.style.transform = `translateY(-${currentScroll}px)`;
    } else {
      this.header.style.transform = "translateY(0)";
      this.header.classList.add("scrolled");
    }
  }
  hideHeader() {
    this.isHidden = true;
    this.header.style.transform = `translateY(-150%)`;
    this.header.style.transition = "transform 0.3s ease-out";
    this.header.parentNode.style.pointerEvents = "none";
  }
  showHeader() {
    this.isHidden = false;
    this.header.style.transform = "translateY(0)";
    this.header.style.transition = "transform 0.3s ease-out";
    this.header.parentNode.style.pointerEvents = "auto";
  }
  handleHeaderOverrideScroll(currentScroll, scrollDiff) {
    if (!this.headerOverride) return;
    const overrideRect = this.headerOverride.getBoundingClientRect();
    const sticky_threshold = 10;
    const isSticky = overrideRect.top <= sticky_threshold;
    if (!isSticky) {
      if (this.headerOverrideHidden) this.showHeaderOverride();
      this.headerOverrideInner.classList.remove("header-override__visible");
      return;
    }
    if (Math.abs(scrollDiff) < 5) return;
    if (scrollDiff > 0 && !this.headerOverrideHidden && !this.headerOverrideRecentlyShown) {
      this.hideHeaderOverride();
    } else if (scrollDiff < 0 && this.headerOverrideHidden) {
      this.showHeaderOverride();
    }
  }
  hideHeaderOverride() {
    if (!this.headerOverride) return;
    this.headerOverrideHidden = true;
    this.headerOverrideInner.classList.remove("header-override__visible");
    this.headerOverride.style.transform = "translateY(-100%)";
    this.headerOverride.style.transition = "transform 0.3s ease-out";
  }
  showHeaderOverride() {
    if (!this.headerOverride) return;
    this.headerOverrideHidden = false;
    this.headerOverride.style.transform = "translateY(0)";
    this.headerOverride.style.transition = "transform 0.3s ease-out";
    this.headerOverrideInner.classList.add("header-override__visible");
    this.headerOverrideRecentlyShown = true;
    setTimeout(() => {
      this.headerOverrideRecentlyShown = false;
    }, 150);
  }
  shouldMainHeaderStayHidden(currentScroll) {
    if (!this.headerOverride) return false;
    const overrideRect = this.headerOverride.getBoundingClientRect();
    const overrideOffsetTop = overrideRect.top + currentScroll;
    const buffer = 200;
    return currentScroll >= overrideOffsetTop - buffer;
  }
};
var StickyHeader_default = StickyHeader;
export {
  StickyHeader_default as default
};
