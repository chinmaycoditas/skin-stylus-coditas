// src/js/components/Slider.js
var Slider = class {
  constructor(element, selector) {
    this.el = element;
    this.options = JSON.parse(element.getAttribute(selector));
  }
  async init() {
    let Splide = await import("./chunk--splide.esm-KCIDD5RU.vbt.js");
    Splide = Splide.default;
    this.scrollTriggerEl = this.el.closest("[data-scroll-trigger]");
    this.videoNoChange = this.el.querySelector("[data-video-no-change]");
    if (this.el.getAttribute("data-upsell-slider")) {
      this.upsellInit = true;
      this.removedProducts = [];
    }
    this.mainSlider = new Splide(this.el, this.options);
    this.initOverflowTouchHandler();
    if (this.el.parentNode.querySelector("[data-connected-slider]")) {
      this.connectedEl = this.el.parentNode.querySelector("[data-connected-slider]");
      const connectedOptions = JSON.parse(this.connectedEl.getAttribute("data-connected-slider"));
      this.connectedSlider = new Splide(this.connectedEl, connectedOptions);
      if (connectedOptions) {
        this.connectedSlider.on("click", (slide) => {
          this.connectedSlider.go(slide.index);
        });
      }
      this.initConnectedSlider();
    }
    if (this.options.changeOnClick && !this.el.hasAttribute("data-offset-slide-focus")) {
      this.mainSlider.on("click", (slide) => {
        this.mainSlider.go(slide.index);
      });
    }
    this.mainSlider.mount();
    if (this.el.querySelector("video")) {
      this.initVideoHandler();
    }
    this.initOverflowScrollReset();
    const slides = this.mainSlider.Components.Slides;
    const ro = new ResizeObserver(() => {
      this.mainSlider.refresh();
    });
    slides.forEach((slide, targetIndex) => {
      const slideEl = slide.slide;
      ro.observe(slideEl);
      const expandToggle = slideEl.querySelector("[data-expand-media]");
      if (expandToggle) {
        expandToggle.addEventListener("click", () => {
          const isActiveSlide = slideEl.classList.contains("is-active");
          const isActive = slideEl.classList.contains("is-expanded");
          if (isActive) {
            document.querySelectorAll(".is-expanded").forEach((el) => {
              el.classList.remove("is-expanded");
            });
          } else {
            if (!isActiveSlide) {
              this.mainSlider.go(targetIndex);
              setTimeout(() => {
                slideEl.classList.add("is-expanded");
              }, 300);
            } else {
              slideEl.classList.add("is-expanded");
            }
          }
        });
      }
    });
    this.mainSlider.on("destroy", () => {
      ro.disconnect();
    });
    const mobileToggleExpanded = this.el.querySelectorAll("[data-expand-media-mobile]");
    let mobileExpansionScrollLockInput;
    if (mobileToggleExpanded.length) {
      mobileExpansionScrollLockInput = document.querySelector("#expanded-splide-lock");
    }
    mobileToggleExpanded.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        mobileExpansionScrollLockInput.checked = !mobileExpansionScrollLockInput.checked;
        this.el.scrollIntoView({ behavior: "smooth", block: "start" });
        setTimeout(() => {
          this.el.classList.toggle("mobile__expanded");
        }, 100);
      });
    });
    const isTabsWithSlider = this.el.parentNode.hasAttribute("data-tab-content");
    if (isTabsWithSlider) {
      const tabsWithSlidersContainer = this.el.closest("[data-homepage-tab-slider-group]");
      const tabNext = tabsWithSlidersContainer.querySelector("[data-tab-next-button]");
      const tabPrev = tabsWithSlidersContainer.querySelector("[data-tab-prev-button]");
      this.mainSlider.on("moved", (newIndex) => {
        const isFirst = newIndex === 0;
        const isLast = newIndex === this.mainSlider.length - 1;
        this.mainSlider.root.classList.toggle("is-first", isFirst);
        this.mainSlider.root.classList.toggle("is-last", isLast);
        if (isLast) {
          tabNext.classList.remove("pointer-events-none");
        } else if (isFirst) {
          tabPrev.classList.remove("pointer-events-none");
        } else {
          tabNext.classList.add("pointer-events-none");
          tabPrev.classList.add("pointer-events-none");
        }
      });
      if (window.innerWidth < 1024) {
        const tabsContainer = this.mainSlider.root.closest("[data-tabs]");
        if (!tabsContainer) return;
        const threshold = 30;
        let startX = null;
        this.mainSlider.root.addEventListener("pointerdown", (event) => {
          startX = event.clientX;
        });
        this.mainSlider.root.addEventListener("pointerup", (event) => {
          if (startX === null) return;
          const endX = event.clientX;
          const deltaX = endX - startX;
          startX = null;
          if (Math.abs(deltaX) < threshold) return;
          const isAtFirst = this.mainSlider.index === 0;
          const isAtLast = this.mainSlider.index === this.mainSlider.length - 1;
          if (deltaX > 0 && isAtFirst) {
            tabsContainer.dispatchEvent(
              new CustomEvent("edgeSwipe", { detail: { direction: "prev" } })
            );
          } else if (deltaX < 0 && isAtLast) {
            tabsContainer.dispatchEvent(
              new CustomEvent("edgeSwipe", { detail: { direction: "next" } })
            );
          }
        });
      }
    }
    if (this.scrollTriggerEl) {
      this.initScrollTrigger();
    }
  }
  initConnectedSlider() {
    const offsetFocus = this.el.hasAttribute("data-offset-slide-focus");
    if (offsetFocus) {
      if (this.options.changeOnClick) {
        this.mainSlider.on("click", (slide) => {
          const highestIndex = this.mainSlider.length - 1;
          if (slide.index > highestIndex) {
            this.connectedSlider.go(slide.index - this.mainSlider.length);
          } else {
            this.connectedSlider.go(slide.index);
          }
        });
      }
      this.mainSlider.on("move", (newIndex) => {
        const totalSlides = this.connectedSlider.length;
        const prevIndex = (newIndex - 1 + totalSlides) % totalSlides;
        this.connectedSlider.go(prevIndex);
        if (this.connectedEl.hasAttribute("data-is-navigation")) {
          this.instantStyleChange(newIndex);
        }
      });
      this.connectedSlider.on("move", (newIndex) => {
        const totalSlides = this.mainSlider.length;
        const nextIndex = (newIndex + 1) % totalSlides;
        this.mainSlider.go(nextIndex);
        if (this.connectedEl.hasAttribute("data-is-navigation")) {
          this.instantStyleChange(newIndex);
        }
      });
    } else {
      this.mainSlider.on("move", (newIndex) => {
        this.connectedSlider.go(newIndex);
        if (this.connectedEl.hasAttribute("data-is-navigation")) {
          this.instantStyleChange(newIndex);
        }
      });
      this.connectedSlider.on("move", (newIndex) => {
        this.mainSlider.go(newIndex);
        if (this.connectedEl.hasAttribute("data-is-navigation")) {
          this.instantStyleChange(newIndex);
        }
      });
    }
    this.connectedSlider.mount();
  }
  // ensures no delay in changing slide for navigation slider
  instantStyleChange(index) {
    this.connectedSlider.Components.Slides.forEach((slide) => {
      if (slide.index === index) {
        slide.slide.classList.add("is-active");
      } else {
        slide.slide.classList.remove("is-active");
      }
    });
  }
  initVideoHandler() {
    if (this.videoNoChange) return;
    const { Components: { Slides } } = this.mainSlider;
    this.currentSlide = Slides.getAt(0).slide;
    let slideTimeout = null;
    const clearSlideTimeout = () => {
      if (slideTimeout) {
        clearTimeout(slideTimeout);
        slideTimeout = null;
      }
    };
    document.addEventListener("video end", (e) => {
      const videoInSlide = this.currentSlide.querySelector("video");
      if (e.detail && e.detail.video === videoInSlide && e.detail.changeSlide) {
        this.mainSlider.go(">");
      }
    });
    this.mainSlider.on("move", (newIndex, prevIndex) => {
      this.currentSlide = Slides.getAt(newIndex).slide;
      clearSlideTimeout();
      const currentVideo = this.currentSlide.querySelector("video");
      const lastVideo = Slides.getAt(prevIndex)?.slide.querySelector("video");
      if (lastVideo) lastVideo.pause();
      if (currentVideo) {
        currentVideo.play();
      } else {
        slideTimeout = setTimeout(() => {
          this.mainSlider.go(newIndex + 1);
        }, 5e3);
      }
    });
  }
  initOverflowTouchHandler() {
    if (window.innerWidth >= 1024) return;
    const handleTouchStart = (e) => {
      const overflowContainer = e.target.closest(".overflow-x-auto");
      if (overflowContainer) {
        this.touchStartX = e.touches[0].clientX;
        this.touchStartY = e.touches[0].clientY;
        this.activeOverflowContainer = overflowContainer;
        this.touchTime = Date.now();
      }
    };
    const handleTouchMove = (e) => {
      if (!this.activeOverflowContainer || !this.touchStartX) return;
      const touchMoveX = e.touches[0].clientX;
      const touchMoveY = e.touches[0].clientY;
      const diffX = this.touchStartX - touchMoveX;
      const diffY = this.touchStartY - touchMoveY;
      if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 10) {
        const { scrollLeft, scrollWidth, clientWidth } = this.activeOverflowContainer;
        const maxScrollLeft = scrollWidth - clientWidth;
        const swipingLeft = diffX > 0;
        const swipingRight = diffX < 0;
        if (swipingLeft && scrollLeft < maxScrollLeft) {
          e.stopImmediatePropagation();
          return;
        }
      }
    };
    const handleTouchEnd = (e) => {
      if (!this.activeOverflowContainer || !this.touchStartX) return;
      const touchEndX = e.changedTouches[0].clientX;
      const diffX = this.touchStartX - touchEndX;
      const touchDuration = Date.now() - this.touchTime;
      const threshold = 30;
      if (Math.abs(diffX) > threshold && touchDuration < 500) {
        const { scrollLeft, scrollWidth, clientWidth } = this.activeOverflowContainer;
        const maxScrollLeft = scrollWidth - clientWidth;
        if (diffX > 0 && scrollLeft >= maxScrollLeft) {
          e.preventDefault();
          e.stopImmediatePropagation();
          this.mainSlider.go(">");
        } else if (diffX < 0) {
          e.preventDefault();
          e.stopImmediatePropagation();
          this.mainSlider.go("<");
        }
      }
      this.touchStartX = null;
      this.touchStartY = null;
      this.activeOverflowContainer = null;
      this.touchTime = null;
    };
    this.el.addEventListener("touchstart", handleTouchStart, { passive: true, capture: true });
    this.el.addEventListener("touchmove", handleTouchMove, { passive: false, capture: true });
    this.el.addEventListener("touchend", handleTouchEnd, { passive: false, capture: true });
  }
  initOverflowScrollReset() {
    if (window.innerWidth >= 1024) return;
    this.mainSlider.on("moved", (newIndex, prevIndex) => {
      const { Components: { Slides } } = this.mainSlider;
      if (prevIndex !== void 0) {
        const prevSlide = Slides.getAt(prevIndex).slide;
        const prevOverflowContainer = prevSlide.querySelector(".overflow-x-auto");
        if (prevOverflowContainer) {
          prevOverflowContainer.scrollLeft = 0;
        }
      }
    });
  }
  async initScrollTrigger() {
    let gsap = await import("./chunk--gsap-CRC6Y6FG.vbt.js");
    gsap = gsap.default;
    const { ScrollTrigger } = await import("./chunk--ScrollTrigger-MZKS3GJJ.vbt.js");
    if (!this.mainSlider) return;
    if (window.innerWidth < 1024) return;
    gsap.registerPlugin(ScrollTrigger);
    const totalSlides = this.mainSlider.length - 1;
    const transitions = Math.max(totalSlides - 1, 1);
    const perSlide = 100;
    const endStr = `+=${transitions * perSlide}%`;
    const proxy = { index: 0 };
    gsap.to(proxy, {
      index: totalSlides,
      ease: "none",
      scrollTrigger: {
        trigger: this.scrollTriggerEl,
        start: "top+=50 top",
        end: endStr,
        scrub: true,
        pin: true,
        anticipatePin: 1,
        onUpdate: (self) => {
          const newIndex = Math.round(proxy.index);
          if (newIndex !== this.mainSlider.index) {
            this.mainSlider.go(newIndex);
          }
        }
      }
    });
  }
};
var Slider_default = Slider;
export {
  Slider_default as default
};
