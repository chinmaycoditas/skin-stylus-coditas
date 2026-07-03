// src/js/components/Tabs.js
var Tabs = class {
  constructor(el) {
    this.el = el;
    this.toggles = el.querySelectorAll("[data-tab-toggle]");
    this.contents = el.querySelectorAll("[data-tab-content]");
    this.indicator = el.querySelector("[data-tab-indicator]");
    this.tabContainer = el.querySelector("[data-tab-container]");
    this.nextBtn = el.querySelector("[data-tab-next-button]");
    this.prevBtn = el.querySelector("[data-tab-prev-button]");
    this.activeIndex = 0;
    this.isDragging = false;
    this.startX = 0;
    this.startScrollLeft = 0;
    this.hasDragged = false;
  }
  init() {
    const defaultTab = this.toggles[0].getAttribute("data-tab-toggle", "z-[-1]");
    this.contents.forEach((content) => {
      const tabConnector = content.getAttribute("data-tab-content");
      if (tabConnector === defaultTab) {
        content.classList.remove("!hidden");
        content.classList.add("is-visible");
      } else {
        content.classList.add("!hidden");
      }
    });
    this.toggles[0].classList.add("is-active");
    if (this.prevBtn || this.nextBtn) this.initNavigationButtons();
    this.initDragFunctionality();
    this.moveIndicator(this.toggles[0]);
    this.toggles.forEach((toggle, index) => {
      toggle.addEventListener("click", (e) => {
        if (!this.hasDragged) {
          this.setActiveTab(index);
        }
      });
    });
    this.updateNavButtons();
    if (window.innerWidth < 1024) {
      this.initSwiperListener();
    }
  }
  // mobile tabs with sliders swipe to change tabs
  initSwiperListener() {
    this.el.addEventListener("edgeSwipe", (e) => {
      if (e.detail.direction === "next") {
        if (this.activeIndex < this.toggles.length - 1) this.goToTab(this.activeIndex + 1);
      } else if (e.detail.direction === "prev") {
        if (this.activeIndex > 0) this.goToTab(this.activeIndex - 1);
      }
    });
  }
  moveIndicator(tab) {
    if (!this.indicator) return;
    const offsetLeft = tab.getBoundingClientRect().x - this.tabContainer.getBoundingClientRect().x;
    const width = tab.offsetWidth;
    this.indicator.style.left = `${offsetLeft}px`;
    this.indicator.style.width = `${width}px`;
  }
  scrollTabIntoView(tab) {
    const container = this.el.querySelector("[data-tab-container]");
    const offsetLeft = tab.offsetLeft;
    const offsetCenter = (offsetLeft - container.offsetWidth / 2 + tab.offsetWidth / 2) * -1;
    const max = (container.scrollWidth - container.offsetWidth) * -1;
    [container, this.indicator].forEach(
      (el) => el.style.transform = `translateX(${offsetCenter < 0 ? offsetCenter < max ? max : offsetCenter : 0}px)`
    );
    requestAnimationFrame(() => {
      this.moveIndicator(tab);
    });
  }
  initNavigationButtons() {
    this.prevBtn?.addEventListener("click", () => {
      console.log("prev");
      if (this.activeIndex > 0) this.goToTab(this.activeIndex - 1);
    });
    this.nextBtn?.addEventListener("click", () => {
      console.log("next");
      if (this.activeIndex < this.toggles.length - 1) this.goToTab(this.activeIndex + 1);
    });
  }
  setActiveTab(index) {
    const toggle = this.toggles[index];
    const contentConnector = toggle.getAttribute("data-tab-toggle");
    this.toggles.forEach((t) => t.classList.remove("is-active"));
    toggle.classList.add("is-active");
    this.activeIndex = index;
    this.el.style.overflowAnchor = "none";
    this.scrollTabIntoView(toggle);
    this.contents.forEach((content) => {
      const tabConnector = content.getAttribute("data-tab-content");
      content.classList.toggle("!block", tabConnector === contentConnector);
      content.classList.toggle("is-visible", tabConnector === contentConnector);
      content.classList.toggle("!hidden", tabConnector !== contentConnector);
    });
    this.updateNavButtons();
    requestAnimationFrame(() => {
      this.el.style.overflowAnchor = "auto";
    });
  }
  goToTab(index) {
    if (!this.toggles[index]) return;
    this.setActiveTab(index);
  }
  updateNavButtons() {
    this.prevBtn?.classList.toggle("is-disabled", this.activeIndex === 0);
    this.nextBtn?.classList.toggle("is-disabled", this.activeIndex === this.toggles.length - 1);
  }
  initDragFunctionality() {
    if (!this.tabContainer) return;
    this.tabContainer.addEventListener("mousedown", (e) => this.handleDragStart(e));
    this.tabContainer.addEventListener("touchstart", (e) => this.handleDragStart(e), { passive: false });
    document.addEventListener("mousemove", (e) => this.handleDragMove(e));
    document.addEventListener("touchmove", (e) => this.handleDragMove(e), { passive: false });
    document.addEventListener("mouseup", () => this.handleDragEnd());
    document.addEventListener("touchend", () => this.handleDragEnd());
  }
  handleDragStart(e) {
    this.isDragging = true;
    this.hasDragged = false;
    this.startX = this.getEventX(e);
    this.tabContainer.style.transition = "none";
    if (this.indicator) {
      this.indicator.style.transition = "none";
    }
    const currentTransform = this.tabContainer.style.transform;
    const currentTranslateX = currentTransform ? parseFloat(currentTransform.match(/translateX\(([^)]+)px\)/)?.[1] || 0) : 0;
    this.startScrollLeft = currentTranslateX;
    this.tabContainer.style.cursor = "grabbing";
  }
  handleDragMove(e) {
    if (!this.isDragging) return;
    const currentX = this.getEventX(e);
    const dragDistance = Math.abs(currentX - this.startX);
    if (dragDistance > 5) {
      this.hasDragged = true;
      e.preventDefault();
      const actualDistance = currentX - this.startX;
      const container = this.tabContainer;
      const maxScroll = (container.scrollWidth - container.offsetWidth) * -1;
      let newTranslate = this.startScrollLeft + actualDistance;
      newTranslate = Math.max(maxScroll, Math.min(0, newTranslate));
      container.style.transform = `translateX(${newTranslate}px)`;
      if (this.indicator) {
        this.indicator.style.transform = `translateX(${newTranslate}px)`;
      }
    }
  }
  handleDragEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.tabContainer.style.cursor = "";
    this.tabContainer.style.transition = "transform 0.3s ease";
    if (this.indicator) {
      this.indicator.style.transition = "all 0.3s ease";
    }
    this.hasDragged = false;
  }
  getEventX(e) {
    return e.touches ? e.touches[0].clientX : e.clientX;
  }
};
var Tabs_default = Tabs;
export {
  Tabs_default as default
};
