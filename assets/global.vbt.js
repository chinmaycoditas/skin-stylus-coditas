// src/js/helpers/ComponentConstructor.js
function initComponentOnConnectedComponentLoad(componentToInit, handleToWatch, selectorDispatch, element, dataSelect) {
  document.addEventListener(handleToWatch + " loaded", function handler() {
    const component = new componentToInit(element, dataSelect);
    if (component.init) component.init();
    document.dispatchEvent(new CustomEvent(selectorDispatch + " loaded"));
    this.removeEventListener(handleToWatch + " loaded", handler);
  });
}
function initComponentOnConnectedComponentDomEvent(componentToInit, handleToWatch, trigger, selectorDispatch, element, dataSelect) {
  document.querySelectorAll("[data-" + handleToWatch + "]").forEach(
    (elementTrigger) => elementTrigger.addEventListener(trigger, function handler() {
      const component = new componentToInit(element, dataSelect);
      if (component.init) component.init();
      document.dispatchEvent(new CustomEvent(selectorDispatch + " loaded"));
      this.removeEventListener(trigger, handler);
    })
  );
}
function initComponentOnSelfDomEvent(componentToInit, trigger, selectorDispatch, element, dataSelect) {
  if (window.innerWidth < 768 && trigger === "mouseover") {
    initComponentOnSelfIntersection(
      componentToInit,
      selectorDispatch,
      element,
      dataSelect
    );
  } else {
    element.addEventListener(trigger, function handler() {
      const component = new componentToInit(element, dataSelect);
      if (component.init) component.init();
      document.dispatchEvent(new CustomEvent(selectorDispatch + " loaded"));
      this.removeEventListener(trigger, handler);
    });
  }
}
function initComponentOnSelfIntersection(componentToInit, selectorDispatch, element, dataSelect) {
  const component = new componentToInit(element, dataSelect);
  if (component.init) {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        component.init();
        document.dispatchEvent(new CustomEvent(selectorDispatch + " loaded"));
        observer.disconnect();
      }
    }, {
      rootMargin: "300px 0px 0px 0px"
    });
    observer.observe(element);
  }
}
function ComponentConstructor(components) {
  Object.entries(components).forEach(([selector, Component]) => {
    const dataSelect = "data-" + selector;
    const matchedElements = document.querySelectorAll("[" + dataSelect + "]");
    matchedElements.forEach((element) => {
      if (Array.isArray(Component)) {
        if (Component.filter((option) => typeof option === "string" && option.includes("url:")).length > 0) {
          const urls = Component.map((option) => typeof option === "string" && option.includes("url:") ? option.split("url:")[1] : false);
          let shouldInit = false;
          for (const url of urls) {
            if (url && window.location.href.includes(url)) {
              shouldInit = true;
            }
          }
          if (shouldInit) {
            initComponentOnSelfIntersection(
              Component[0],
              selector,
              element,
              dataSelect
            );
            return;
          }
        }
        Component.forEach((option, i) => {
          if (i === 0 || option.includes("url:")) return;
          if (option.includes(":")) {
            const triggerType = option.split(":")[0];
            const triggerSelector = option.split(":")[1];
            if (triggerType === "load") {
              initComponentOnConnectedComponentLoad(
                Component[0],
                triggerSelector,
                selector,
                element,
                dataSelect
              );
            } else {
              initComponentOnConnectedComponentDomEvent(
                Component[0],
                triggerSelector,
                triggerType,
                selector,
                element,
                dataSelect
              );
            }
          } else {
            initComponentOnSelfDomEvent(
              Component[0],
              option,
              selector,
              element,
              dataSelect
            );
          }
        });
        return;
      }
      initComponentOnSelfIntersection(Component, selector, element, dataSelect);
    });
  });
}

// src/global.vbt.js
document.addEventListener(
  "DOMContentLoaded",
  async function globalComponents() {
    window.addEventListener("scroll", () => {
      document.querySelectorAll("[data-close-on-scroll]").forEach((el) => {
        el.checked = false;
        const scrollableContainer = el.closest("label").querySelector("[data-scroll-container]");
        if (scrollableContainer) {
          scrollableContainer.scrollTop = 0;
        }
      });
    });
    const dropdownInputs = document.querySelectorAll("[data-dropdown-input]");
    dropdownInputs.forEach((dropdownInput) => {
      dropdownInput.addEventListener("change", () => {
        if (!dropdownInput.checked) {
          const scrollableContainer = dropdownInput.closest("label").querySelector("[data-scroll-container]");
          if (scrollableContainer) {
            scrollableContainer.scrollTop = 0;
          }
        }
      });
    });
    document.addEventListener("click", (event) => {
      const allDropdownInputs = document.querySelectorAll("[data-dropdown-input]");
      allDropdownInputs.forEach((input) => {
        const dropdownBoundary = input.closest("label");
        if (dropdownBoundary && !dropdownBoundary.contains(event.target)) {
          input.checked = false;
          const scrollableContainer = dropdownBoundary.querySelector("[data-scroll-container]");
          if (scrollableContainer) {
            scrollableContainer.scrollTop = 0;
          }
        }
      });
    });
    const components = {};
    if (document.querySelector("[data-slider]")) {
      const Slider = await import("./chunk--Slider-HGDC4EZN.vbt.js");
      components["slider"] = Slider.default;
    }
    if (document.querySelector("[data-tabs]")) {
      const Tabs = await import("./chunk--Tabs-Q372UERG.vbt.js");
      components["tabs"] = Tabs.default;
    }
    if (document.querySelector("[data-video]")) {
      const Video = await import("./chunk--Video-PMXHSE2N.vbt.js");
      components["video"] = Video.default;
    }
    if (document.querySelector("[data-sticky-header]")) {
      const StickyHeader = await import("./chunk--StickyHeader-FWLSJHT3.vbt.js");
      components["sticky-header"] = StickyHeader.default;
    }
    if (document.querySelector("[data-carousel]")) {
      const Carousel = await import("./chunk--Carousel-YNU2DNVF.vbt.js");
      components["carousel"] = Carousel.default;
    }
    ComponentConstructor(components);
    document.dispatchEvent(new CustomEvent("global components loaded"));
    this.removeEventListener("DOMContentLoaded", globalComponents);
  }
);
document.addEventListener(
  "global components loaded",
  async function asyncComponents() {
    const components = {};
    if (document.querySelector("[data-hc-control]")) {
      const Accordion = await import("./chunk--Accordion-KL3FOFJF.vbt.js");
      components["hc-control"] = Accordion.default;
    }
    if (document.querySelector("[data-exit-intent]")) {
      const ExitIntent = await import("./chunk--ExitIntent-FN5G2BXS.vbt.js");
      components["exit-intent"] = ExitIntent.default;
    }
    if (document.querySelector("[data-ajaxinate]")) {
      const Ajaxinate = await import("./chunk--Ajaxinate-FL6MQQMK.vbt.js");
      components["ajaxinate"] = Ajaxinate.default;
    }
    if (document.querySelector("[data-ajax-form]")) {
      const AjaxForm = await import("./chunk--AjaxForm-RWGS5U7Y.vbt.js");
      components["ajax-form"] = AjaxForm.default;
    }
    if (document.querySelector("[data-scroll-to-top]")) {
      const ScrollToTop = await import("./chunk--ScrollToTop-HWODTSJX.vbt.js");
      components["scroll-to-top"] = ScrollToTop.default;
    }
    ComponentConstructor(components);
    document.dispatchEvent(new CustomEvent("async components loaded"));
    this.removeEventListener("global components loaded", asyncComponents);
  }
);
