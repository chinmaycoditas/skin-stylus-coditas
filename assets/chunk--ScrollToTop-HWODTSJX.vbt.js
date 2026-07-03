// src/js/components/ScrollToTop.js
var scrollToTop = class {
  constructor(el) {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        document.documentElement.scrollTop = 0;
        document.body.scrollTop = 0;
        const scrollStep = -window.scrollY / (500 / 15);
        const scrollInterval = setInterval(() => {
          if (window.scrollY !== 0) {
            window.scrollBy(0, scrollStep);
          } else {
            clearInterval(scrollInterval);
          }
        }, 15);
      } else {
        try {
          window.scrollTo({
            top: 0,
            left: 0,
            behavior: "smooth"
          });
        } catch (_err) {
          window.scrollTo(0, 0);
        }
      }
      return false;
    });
  }
};
var ScrollToTop_default = scrollToTop;
export {
  ScrollToTop_default as default
};
