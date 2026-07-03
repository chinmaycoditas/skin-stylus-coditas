import "./chunk--chunk-MM7LL6Y4.vbt.js";

// src/js/components/AjaxForm.js
var AjaxForm = class _AjaxForm {
  constructor(el, sel) {
    this.form = el;
    this.selector = el.getAttribute(sel);
    this.container = document.querySelector(this.selector);
    this.inputs = el.querySelectorAll("input");
    this.mobileCloseInput = document.querySelector("#mobile-filters-close");
    this.isMobile = el.id === "collection-sort-form";
  }
  init() {
    this.form.addEventListener("submit", (e) => {
      e.preventDefault();
      const formData = new FormData(this.form);
      const params = new URLSearchParams();
      for (const [key, value] of formData.entries()) {
        if (value) {
          params.append(key, value);
        }
      }
      const queryString = params.toString();
      let newUrl = window.location.pathname;
      if (queryString) {
        newUrl += "?" + queryString;
      }
      this.ajax(newUrl);
      this.closeMenu();
    });
    const clearButtons = this.form.querySelectorAll("[data-clear]");
    if (clearButtons.length > 0) {
      clearButtons.forEach((clearBtn) => {
        clearBtn.addEventListener("click", (e) => {
          e.preventDefault();
          this.ajax(clearBtn.href);
          this.inputs.forEach((input) => {
            input.checked = false;
          });
          this.closeMenu();
        });
      });
    }
  }
  closeMenu() {
    if (this.isMobile) {
      if (this.mobileCloseInput) this.mobileCloseInput.checked = true;
    } else {
      const openFilter = this.form.querySelector("[data-hc-control].is-active");
      if (openFilter) {
        openFilter.click();
      }
    }
  }
  async ajax(url) {
    window.history.pushState({ path: url }, "", url);
    const res = await fetch(url);
    const text = await res.text();
    const div = document.createElement("div");
    div.innerHTML = text;
    const contents = div.querySelector(this.selector);
    this.container.innerHTML = contents.innerHTML;
    this.container.querySelectorAll("[data-ajax-form]").forEach((el) => {
      new _AjaxForm(el, `data-ajax-form`);
    });
  }
};
var AjaxForm_default = AjaxForm;
export {
  AjaxForm_default as default
};
