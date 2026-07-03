// node_modules/handy-collapse/dist/handy-collapse.mjs
var c = Object.defineProperty;
var g = (l, t, s) => t in l ? c(l, t, { enumerable: true, configurable: true, writable: true, value: s }) : l[t] = s;
var r = (l, t, s) => (g(l, typeof t != "symbol" ? t + "" : t, s), s);
var p = class {
  constructor(t = {}) {
    r(this, "toggleContentEls");
    r(this, "toggleButtonEls");
    r(this, "itemsState", {});
    r(this, "options");
    const s = typeof t == "object" && "nameSpace" in t ? t.nameSpace : "hc", i = {
      nameSpace: "hc",
      toggleButtonAttr: `data-${s}-control`,
      toggleContentAttr: `data-${s}-content`,
      activeClass: "is-active",
      isAnimation: true,
      closeOthers: true,
      animationSpeed: 400,
      cssEasing: "ease-in-out",
      onSlideStart: () => {
      },
      onSlideEnd: () => {
      }
    };
    this.options = {
      ...i,
      ...t
    }, this.toggleContentEls = [].slice.call(document.querySelectorAll(`[${this.options.toggleContentAttr}]`)), this.toggleButtonEls = [].slice.call(document.querySelectorAll(`[${this.options.toggleButtonAttr}]`)), this.toggleContentEls.length !== 0 && this.initContentsState(this.toggleContentEls), this.toggleButtonEls.length !== 0 && this.handleButtonsEvent(this.toggleButtonEls);
  }
  initContentsState(t) {
    this.itemsState = {}, t.forEach((s) => {
      s.style.overflow = "hidden", s.style.maxHeight = "none";
      const i = s.classList.contains(this.options.activeClass), e = s.getAttribute(this.options.toggleContentAttr);
      !e || (this.setItemState(e, i), i ? this.open(e, false, false) : this.close(e, false, false));
    });
  }
  handleButtonsEvent(t) {
    t.forEach((s) => {
      const i = s.getAttribute(this.options.toggleButtonAttr);
      i && s.addEventListener(
        "click",
        (e) => {
          e.preventDefault(), this.toggleSlide(i, true);
        },
        false
      );
    });
  }
  setItemState(t, s) {
    this.itemsState[t] = {
      isOpen: s,
      isAnimating: false
    };
  }
  toggleSlide(t, s = true) {
    var i, e;
    (i = this.itemsState[t]) != null && i.isAnimating || (((e = this.itemsState[t]) == null ? void 0 : e.isOpen) === false ? this.open(t, s, this.options.isAnimation) : this.close(t, s, this.options.isAnimation));
  }
  open(t, s = true, i = true) {
    if (!t)
      return;
    Object.prototype.hasOwnProperty.call(this.itemsState, t) || this.setItemState(t, false);
    const e = document.querySelector(`[${this.options.toggleContentAttr}='${t}']`);
    if (!e)
      return;
    this.itemsState[t].isAnimating = true, this.options.closeOthers && [].slice.call(this.toggleContentEls).forEach((n) => {
      const h = n.getAttribute(this.options.toggleContentAttr);
      h && h !== t && this.close(h, false, i);
    }), s !== false && this.options.onSlideStart(true, t);
    const a = this.getTargetHeight(e);
    e.style.visibility = "visible", e.classList.add(this.options.activeClass);
    const o = document.querySelectorAll(`[${this.options.toggleButtonAttr}='${t}']`);
    o.length > 0 && [].slice.call(o).forEach((n) => {
      n.classList.add(this.options.activeClass), n.hasAttribute("aria-expanded") && n.setAttribute("aria-expanded", "true");
    }), i ? (e.style.overflow = "hidden", e.style.transition = `${this.options.animationSpeed}ms ${this.options.cssEasing}`, e.style.maxHeight = (a || "1000") + "px", setTimeout(() => {
      s !== false && this.options.onSlideEnd(true, t), e.style.maxHeight = "none", e.style.transition = "", e.style.overflow = "", this.itemsState[t].isAnimating = false;
    }, this.options.animationSpeed)) : (e.style.maxHeight = "none", e.style.overflow = "", this.itemsState[t].isAnimating = false), this.itemsState[t].isOpen = true, e.hasAttribute("aria-hidden") && e.setAttribute("aria-hidden", "false");
  }
  close(t, s = true, i = true) {
    if (!t)
      return;
    Object.prototype.hasOwnProperty.call(this.itemsState, t) || this.setItemState(t, false), this.itemsState[t].isAnimating = true, s !== false && this.options.onSlideStart(false, t);
    const e = document.querySelector(`[${this.options.toggleContentAttr}='${t}']`);
    e.style.overflow = "hidden", e.classList.remove(this.options.activeClass), e.style.maxHeight = e.clientHeight + "px", setTimeout(() => {
      e.style.maxHeight = "0px";
    }, 5);
    const a = document.querySelectorAll(`[${this.options.toggleButtonAttr}='${t}']`);
    a.length > 0 && [].slice.call(a).forEach((o) => {
      o.classList.remove(this.options.activeClass), o.hasAttribute("aria-expanded") && o.setAttribute("aria-expanded", "false");
    }), i ? (e.style.transition = `${this.options.animationSpeed}ms ${this.options.cssEasing}`, setTimeout(() => {
      s !== false && this.options.onSlideEnd(false, t), e.style.transition = "", this.itemsState[t].isAnimating = false, e.style.visibility = "hidden";
    }, this.options.animationSpeed)) : (this.options.onSlideEnd(false, t), this.itemsState[t].isAnimating = false, e.style.visibility = "hidden"), Object.prototype.hasOwnProperty.call(this.itemsState, t) && (this.itemsState[t].isOpen = false), e.hasAttribute("aria-hidden") && e.setAttribute("aria-hidden", "true");
  }
  getTargetHeight(t) {
    if (!t)
      return;
    const s = t.cloneNode(true), i = t.parentNode;
    if (!i)
      return;
    const e = [].slice.call(s.querySelectorAll("input[name]"));
    if (e.length !== 0) {
      const o = "-" + (/* @__PURE__ */ new Date()).getTime();
      e.forEach((n) => {
        n.name += o;
      });
    }
    s.style.maxHeight = "none", s.style.opacity = "0", i.appendChild(s);
    const a = s.clientHeight;
    return i.removeChild(s), a;
  }
};

// src/js/components/Accordion.js
var Accordion = class {
  constructor(element) {
    this.element = element;
    if (!window.accordionInstance) {
      window.accordionInstance = new p({
        closeOthers: true,
        animationSpeed: 400,
        cssEasing: "ease-in-out"
      });
    }
    this.accordion = window.accordionInstance;
  }
  setupImmediateScroll() {
    if (window.accordionScrollSetup) return;
    window.accordionScrollSetup = true;
    document.addEventListener("click", (e) => {
      const control = e.target.closest("[data-hc-control]");
      if (!control) return;
      const contentID = control.getAttribute("data-hc-control");
      const content = document.querySelector(`[data-hc-content='${contentID}']`);
      if (content && !control.classList.contains("is-active")) {
        this.scrollToTop(control);
      }
    }, { capture: true });
  }
  scrollToTop(control) {
    const stickyHeader = document.querySelector('[data-sticky-header], .sticky-header, .site-header--sticky, header[data-sticky="true"]');
    const headerHeight = stickyHeader?.offsetHeight || 0;
    const offset = 20;
    const controlRect = control.getBoundingClientRect();
    const currentScrollY = window.scrollY;
    let heightAdjustment = 0;
    const allControls = document.querySelectorAll("[data-hc-control]");
    allControls.forEach((otherControl) => {
      if (otherControl.classList.contains("is-active") && otherControl !== control) {
        const otherRect = otherControl.getBoundingClientRect();
        if (otherRect.top < controlRect.top) {
          const contentID = otherControl.getAttribute("data-hc-control");
          const content = document.querySelector(`[data-hc-content='${contentID}']`);
          if (content) {
            heightAdjustment += content.offsetHeight;
          }
        }
      }
    });
    const futureElementTop = controlRect.top + currentScrollY - heightAdjustment;
    const scrollTarget = futureElementTop - headerHeight - offset;
    window.scrollTo({
      top: Math.max(0, scrollTarget),
      behavior: "smooth"
    });
  }
  init() {
    this.setupImmediateScroll();
    if (window.accordionBodyClickListener) return;
    window.accordionBodyClickListener = true;
    document.body.addEventListener("click", (e) => {
      if (e.target.closest("[data-hc-control]") || e.target.closest("[data-hc-content]")) {
        return;
      }
      document.querySelectorAll("[data-hc-body-click-toggle]").forEach((el) => {
        const contentID = el.getAttribute("data-hc-body-click-toggle");
        const contentElement = document.querySelector(`[data-hc-content='${contentID}']`);
        if (contentElement) {
          this.accordion.close(contentID);
        }
      });
    });
  }
};
var Accordion_default = Accordion;
export {
  Accordion_default as default
};
