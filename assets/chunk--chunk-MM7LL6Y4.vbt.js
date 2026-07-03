// src/js/components/ProductForm.js
var ProductForm = class {
  constructor(el, sel) {
    this.el = el;
    this.productID = el.getAttribute(sel);
    this.input = el.querySelector('input[name="id"]');
    const quantitySelector = this.el.querySelector("[data-quantity]");
    if (quantitySelector) {
      this.quantity = quantitySelector.querySelector("input");
      this.plus = quantitySelector.querySelector("[data-plus]");
      this.minus = quantitySelector.querySelector("[data-minus]");
    }
    const variantPicker = this.el.querySelector("[data-variant-picker]");
    if (variantPicker) {
      this.variantPicker = variantPicker;
      this.variantData = JSON.parse(
        variantPicker.querySelector('script[type="application/json"]').textContent
      );
      if (variantPicker.getAttribute("data-variant-picker") === "main product form") {
        this.isMainProductForm = true;
      }
    }
  }
  init() {
    this.initSubmitListener();
    if (this.quantity) this.initQuantitySelector();
    if (this.variantPicker) {
      this.getCurrentVariant();
      this.initVariantPicker();
    }
  }
  initSubmitListener() {
    this.el.addEventListener("submit", async (e) => {
      e.preventDefault();
      try {
        const formData = new FormData(this.el);
        const body = new URLSearchParams(formData);
        const res = await fetch("/cart/add.js", {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          method: "POST",
          body
        });
        if (res.status === 200) {
          const rec = this.el.closest("[data-cart-rec]");
          if (rec) {
            rec.querySelector('input[type="checkbox"]').checked = false;
          }
          const cartRes = await fetch("/?sections=ajaxcart");
          const cartJson = await cartRes.json();
          const div = document.createElement("div");
          div.innerHTML = cartJson.ajaxcart;
          const cartContent = div.querySelector("[data-ajax-cart-content]");
          const cartEl = document.querySelector("[data-ajax-cart] [data-ajax-cart-content]").parentNode;
          cartEl.innerHTML = "";
          cartEl.appendChild(cartContent);
          const subtotalValue = div.querySelector("[data-subtotal-value]").value;
          const subtotalEls = document.querySelectorAll("[data-subtotal]");
          subtotalEls.forEach((subtotalEl) => {
            subtotalEl.innerHTML = subtotalValue;
          });
          document.dispatchEvent(new CustomEvent("ajaxcart refresh"));
        }
      } catch (err) {
        console.error(err);
      }
    });
  }
  initQuantitySelector() {
    this.plus.addEventListener("click", () => {
      this.quantity.value++;
    });
    this.minus.addEventListener("click", () => {
      if (this.quantity.value <= 1) {
        return;
      }
      this.quantity.value--;
    });
  }
  initVariantPicker() {
    if (this.isMainProductForm) {
      this.updateURLParams();
    }
    this.variantPicker.querySelectorAll('input[type="radio"]').forEach((input) => {
      const label = input.parentElement.querySelector("label");
      label.addEventListener("click", () => {
        input.click();
      });
      input.addEventListener("change", () => {
        const currentVariant = this.getCurrentVariant();
        if (this.isMainProductForm) {
          this.updateURLParams();
        }
      });
    });
  }
  updateURLParams() {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const currentVariant = this.getCurrentVariant();
    params.set("variant", currentVariant.id);
    url.search = params.toString();
    window.history.replaceState({}, "", url.toString());
  }
  updatePriceEls(currentVariant) {
    const prices = document.querySelectorAll("[data-price]");
    if (prices.length > 0) {
      prices.forEach((price) => {
        const context = price.getAttribute("data-price");
        price.innerHTML = "";
        if (currentVariant.compare_at_price > currentVariant.price && context !== "sticky-cta") {
          const crossOutPrice = document.createElement("span");
          crossOutPrice.setAttribute(
            "style",
            "text-decoration:line-through;color:#878C8D;"
          );
          crossOutPrice.innerHTML = (currentVariant.compare_at_price / 100).toLocaleString("en-US", {
            style: "currency",
            currency: "USD"
          });
          price.appendChild(crossOutPrice);
        }
        const priceSpan = document.createElement("span");
        priceSpan.innerHTML = (currentVariant.price / 100).toLocaleString(
          "en-US",
          {
            style: "currency",
            currency: "USD"
          }
        );
        price.appendChild(priceSpan);
        if (currentVariant.compare_at_price > currentVariant.price && context !== "sticky-cta") {
          const discount = 100 - Math.round(currentVariant.price * 100 / currentVariant.compare_at_price);
          const saveSpan = document.createElement("span");
          saveSpan.innerHTML = `SAVE ${discount}%`;
          price.appendChild(saveSpan);
        }
      });
    }
  }
  getCurrentVariant() {
    const currentVariantValue = this.variantPicker.querySelector(
      'input[type="radio"]:checked'
    );
    const currentVariant = this.variantData.find(
      (variant) => variant.options.includes(currentVariantValue.value)
    );
    this.input.value = currentVariant.id;
    this.updatePriceEls(currentVariant);
    return currentVariant;
  }
};
var ProductForm_default = ProductForm;

export {
  ProductForm_default
};
