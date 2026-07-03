// src/js/components/Carousel.js
var Carousel = class {
  constructor(el) {
    this.el = el;
    this.images = this.el.querySelectorAll("[data-carousel-image]");
    this.labels = this.el.querySelectorAll("[data-carousel-label]");
    this.infoBoxes = this.el.closest("[data-carousel-container]").querySelectorAll("[data-carousel-info-box]");
    this.total = this.images.length || 0;
    this.currentIndex = 0;
    this.isDragging = false;
    this.startX = 0;
    this.dragOffset = 0;
    this.radius = 200;
    this.perspective = 1800;
    this.tiltAngle = -75;
    this.xStretch = 1.2;
    this.yStretch = 0.9;
    this.maxNonFrontScale = 0.7;
  }
  init() {
    if (!this.images.length) return;
    const nextButton = this.el.querySelector("[data-carousel-next]");
    const previousButton = this.el.querySelector("[data-carousel-previous]");
    if (nextButton && previousButton) {
      this.attachNav(nextButton, 1);
      this.attachNav(previousButton, -1);
    }
    this.attachDragEvents();
    this.calculateRadius();
    this.render();
    window.addEventListener("resize", () => {
      this.calculateRadius();
      this.render();
    });
  }
  calculateRadius() {
    const container = this.el.querySelector("ul");
    if (!container) return;
    const containerWidth = container.offsetWidth;
    this.radius = containerWidth * 0.456;
    this.adjustControlsMargin(containerWidth);
  }
  adjustControlsMargin(containerWidth) {
    const controls = this.el.querySelector("[data-carousel-controls]");
    if (!controls) return;
    let marginTop;
    if (containerWidth <= 288) {
      marginTop = 50;
    } else if (containerWidth >= 364) {
      marginTop = 125;
    } else {
      marginTop = 50 + (containerWidth - 288) * (125 - 50) / (364 - 288);
    }
    controls.style.marginTop = `${marginTop}px`;
  }
  render() {
    const angleStep = Math.PI * 2 / this.total;
    this.images.forEach((image, index) => {
      const relativeIndex = index - this.currentIndex;
      const angle = relativeIndex * angleStep;
      const x = Math.sin(angle) * this.radius * this.xStretch;
      const z = Math.cos(angle) * this.radius + this.radius;
      const y = -Math.cos(angle) * this.radius * Math.sin(this.tiltAngle * Math.PI / 180) * this.yStretch;
      const absRel = Math.abs(relativeIndex);
      let scale = 0.5 + z / (this.radius * 2) * 0.6;
      if (absRel !== 0) {
        scale = Math.min(scale, this.maxNonFrontScale);
      }
      const opacity = Math.min(1, 0.4 + z / (this.radius * 2) * 0.6);
      const blur = Math.max(0, (1 - z / (this.radius * 2)) * 8);
      image.style.transform = `translateX(${x}px) translateY(${y}px) translateZ(${z}px) scale(${scale})`;
      image.style.zIndex = Math.floor(z);
      if (!this.el.style.perspective) {
        this.el.style.transformStyle = "preserve-3d";
      }
    });
    this.updateLabels();
    this.updateInfoBox();
  }
  rotate(direction) {
    this.currentIndex = (this.currentIndex + direction + this.total) % this.total;
    this.render();
  }
  updateLabels() {
    if (!this.labels.length) return;
    const currentImage = this.images[this.currentIndex];
    const currentId = currentImage?.dataset.carouselImage;
    this.labels.forEach((label) => {
      if (label.dataset.carouselLabel === currentId) {
        label.style.display = "flex";
        label.style.opacity = "1";
      } else {
        label.style.display = "none";
        label.style.opacity = "0";
      }
    });
  }
  updateInfoBox() {
    console.log(this.infoBoxes);
    if (!this.infoBoxes.length) return;
    this.infoBoxes.forEach((box) => {
      const infoBoxIndex = box.getAttribute("data-carousel-info-box");
      box.classList.toggle("active", this.currentIndex === parseInt(infoBoxIndex));
    });
  }
  attachNav(button, direction) {
    button.addEventListener("click", () => this.rotate(direction));
  }
  attachDragEvents() {
    this.el.addEventListener("mousedown", this.onDragStart.bind(this));
    this.el.addEventListener("mousemove", this.onDragMove.bind(this));
    this.el.addEventListener("mouseup", this.onDragEnd.bind(this));
    this.el.addEventListener("mouseleave", this.onDragEnd.bind(this));
    this.el.addEventListener("touchstart", this.onDragStart.bind(this), { passive: true });
    this.el.addEventListener("touchmove", this.onDragMove.bind(this));
    this.el.addEventListener("touchend", this.onDragEnd.bind(this));
    this.el.addEventListener("dragstart", (e) => e.preventDefault());
  }
  onDragStart(e) {
    this.isDragging = true;
    this.startX = e.clientX ?? e.touches[0].clientX;
    this.el.style.cursor = "grabbing";
    this.images.forEach((img) => img.style.transition = "none");
  }
  onDragMove(e) {
    if (!this.isDragging) return;
    if (e.touches) {
      e.preventDefault();
    }
    const currentX = e.clientX ?? e.touches[0].clientX;
    this.dragOffset = currentX - this.startX;
    const progress = this.dragOffset / this.el.offsetWidth;
    this.applyLiveStyles(progress);
  }
  onDragEnd() {
    if (!this.isDragging) return;
    this.isDragging = false;
    this.el.style.cursor = "grab";
    this.images.forEach((img) => img.style.transition = "");
    const dragThreshold = this.el.offsetWidth * 0.15;
    if (Math.abs(this.dragOffset) > dragThreshold) {
      this.rotate(this.dragOffset > 0 ? -1 : 1);
    } else {
      this.render();
    }
    this.dragOffset = 0;
  }
  applyLiveStyles(progress) {
    const angleStep = Math.PI * 2 / this.total;
    const rotationOffset = progress * angleStep;
    this.images.forEach((image, index) => {
      const relativeIndex = index - this.currentIndex;
      const angle = relativeIndex * angleStep + rotationOffset;
      const x = Math.sin(angle) * this.radius * this.xStretch;
      const z = Math.cos(angle) * this.radius + this.radius;
      const y = -Math.cos(angle) * this.radius * Math.sin(this.tiltAngle * Math.PI / 180) * this.yStretch;
      const absRel = Math.abs(relativeIndex);
      let scale = 0.5 + z / (this.radius * 2) * 0.6;
      if (absRel !== 0) {
        scale = Math.min(scale, this.maxNonFrontScale);
      }
      const opacity = Math.min(1, 0.4 + z / (this.radius * 2) * 0.6);
      const blur = Math.max(0, (1 - z / (this.radius * 2)) * 8);
      image.style.transform = `translateX(${x}px) translateY(${y}px) translateZ(${z}px) scale(${scale})`;
      image.style.zIndex = Math.floor(z);
    });
  }
};
var Carousel_default = Carousel;
export {
  Carousel_default as default
};
