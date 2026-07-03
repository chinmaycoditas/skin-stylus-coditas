import {
  ProductForm_default
} from "./chunk--chunk-MM7LL6Y4.vbt.js";

// src/js/components/Ajaxinate.js
var Ajaxinate = class {
  constructor(el) {
    this.el = el;
    const pagination = el.querySelector("[data-pagination]");
    this.initPaginationObserver(pagination, false);
  }
  initPaginationObserver(pagination, _observer) {
    if (_observer) _observer.disconnect();
    const anchor = pagination.querySelector("a");
    if (!anchor) return;
    const reqLink = anchor.href;
    const observer = new IntersectionObserver(async ([entry]) => {
      if (entry.isIntersecting) {
        const res = await fetch(reqLink);
        const text = await res.text();
        pagination.parentNode.removeChild(pagination);
        const div = document.createElement("div");
        div.innerHTML = text;
        this.el.innerHTML += div.querySelector("[data-ajaxinate]").innerHTML;
        document.querySelectorAll("[data-product-form]").forEach((form) => {
          new ProductForm_default(form, "data-product-form").init();
        });
        this.initPaginationObserver(this.el.querySelector("[data-pagination]"), observer);
      }
    });
    observer.observe(pagination);
  }
};
var Ajaxinate_default = Ajaxinate;
export {
  Ajaxinate_default as default
};
