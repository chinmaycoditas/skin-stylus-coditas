// src/js/components/Video.js
var VideoCircuitBreaker = {
  failureCount: 0,
  maxFailures: 3,
  resetTime: 5 * 60 * 1e3,
  // 5 minutes
  lastFailureTime: 0,
  isOpen() {
    const now = Date.now();
    if (now - this.lastFailureTime > this.resetTime) {
      this.failureCount = 0;
      return false;
    }
    return this.failureCount >= this.maxFailures;
  },
  recordFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    console.warn(`VideoOptimized circuit breaker: ${this.failureCount}/${this.maxFailures} failures`);
  }
};
var Video = class {
  constructor(element) {
    this.element = element;
    this.video = element.querySelector("[data-video-element]");
    this.poster = element.querySelector("[data-video-poster]");
    this.mobilePosterOnly = element.querySelector("[data-mobile-poster-only]");
    this.progressBar = element.querySelector("[data-progress-bar]");
    const videoOpts = JSON.parse(element.getAttribute("data-video") || "{}");
    const videoOptimizedOpts = JSON.parse(element.getAttribute("data-video-optimized") || "{}");
    this.options = { ...videoOpts, ...videoOptimizedOpts };
    this.videoId = element.getAttribute("data-video-id");
    this.playBtns = this.element.querySelectorAll("[data-play]");
    this.pauseBtns = this.element.querySelectorAll("[data-pause]");
    this.isLoaded = false;
    this.isPlaying = false;
    this.observer = null;
    this.handlePlayClick = this.handlePlayClick.bind(this);
    this.handlePauseClick = this.handlePauseClick.bind(this);
    this.handleVideoClick = this.handleVideoClick.bind(this);
    this.updateButtons = this.updateButtons.bind(this);
    this.init();
  }
  init() {
    try {
      if (VideoCircuitBreaker.isOpen()) {
        console.warn("VideoOptimized: Circuit breaker open, falling back to simple video");
        this.fallbackToSimpleVideo();
        return;
      }
      this.isMobileDevice = this.isMobile();
      this.connectionInfo = this.getConnectionInfo();
      if (!this.shouldLoadVideo()) {
        this.handleMobilePosterOnly();
        return;
      }
      if (this.options.lazy && !this.options.priority) {
        this.setupLazyLoading();
      } else {
        if (this.options.priority) {
          this.loadVideo();
        } else {
          requestAnimationFrame(() => {
            this.loadVideo();
          });
        }
      }
      this.setupEventListeners();
      if (this.progressBar) this.initProgressBar();
      if (this.options && this.options.inView) this.initInViewObserver();
      if (this.video) this.dispatchVideoEnd();
      if (this.playBtns.length || this.pauseBtns.length) this.initPausePlay();
    } catch (error) {
      console.error("VideoOptimized init error:", error);
      VideoCircuitBreaker.recordFailure();
      this.fallbackToSimpleVideo();
    }
  }
  shouldLoadVideo() {
    if (this.options.mobilePosterOnly && this.isMobileDevice) {
      console.log("VideoOptimized: Mobile poster-only mode enabled, skipping video");
      return false;
    }
    const connection = this.connectionInfo;
    if (connection.isVerySlow) {
      console.log("VideoOptimized: Very slow connection (2G), showing poster only");
      return false;
    }
    if (connection.isSlow && !this.options.priority) {
      console.log("VideoOptimized: Slow connection detected, skipping non-priority video");
      return false;
    }
    if (connection.hasDataSaver && !this.options.priority) {
      console.log("VideoOptimized: Data saver mode detected, skipping non-priority video");
      return false;
    }
    return true;
  }
  setupLazyLoading() {
    const observerOptions = {
      root: null,
      rootMargin: "50px",
      // Start loading 50px before element comes into view
      threshold: 0.1
    };
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && !this.isLoaded) {
          this.loadVideo();
          this.observer.unobserve(this.element);
        }
      });
    }, observerOptions);
    this.observer.observe(this.element);
  }
  async loadVideo() {
    if (this.isLoaded) return;
    try {
      this.element.setAttribute("data-loading", "true");
      await this.loadVideoSources();
      if (this.video.preload === "none") {
        this.video.preload = "metadata";
      }
      if (this.options.priority) {
        this.isLoaded = true;
        this.element.setAttribute("data-loaded", "true");
        this.element.removeAttribute("data-loading");
        this.progressiveLoad();
      } else {
        await this.waitForVideoReady();
        this.isLoaded = true;
        this.element.setAttribute("data-loaded", "true");
        this.element.removeAttribute("data-loading");
      }
      if (this.options.autoplay && this.canAutoplay()) {
        this.playVideo();
      }
    } catch (error) {
      console.warn("VideoOptimized: Failed to load video", error);
      VideoCircuitBreaker.recordFailure();
      this.handleLoadError();
    }
  }
  loadVideoSources() {
    return new Promise((resolve) => {
      const sources = this.video.querySelectorAll("source[data-src]");
      if (sources.length === 0) {
        resolve();
        return;
      }
      let loaded = 0;
      sources.forEach((source) => {
        const src = source.getAttribute("data-src");
        if (src) {
          source.setAttribute("src", src);
          source.removeAttribute("data-src");
        }
        loaded++;
        if (loaded === sources.length) {
          this.video.load();
          resolve();
        }
      });
    });
  }
  waitForVideoReady() {
    return new Promise((resolve, reject) => {
      if (this.video.readyState >= 1) {
        resolve();
        return;
      }
      const timeoutDuration = this.options.priority ? 5e3 : 3e3;
      const timeout = setTimeout(() => {
        reject(new Error("Video load timeout"));
      }, timeoutDuration);
      const onLoadedMetadata = () => {
        clearTimeout(timeout);
        this.video.removeEventListener("loadedmetadata", onLoadedMetadata);
        this.video.removeEventListener("error", onError);
        resolve();
      };
      const onError = () => {
        clearTimeout(timeout);
        this.video.removeEventListener("loadedmetadata", onLoadedMetadata);
        this.video.removeEventListener("error", onError);
        reject(new Error("Video load error"));
      };
      this.video.addEventListener("loadedmetadata", onLoadedMetadata, { once: true });
      this.video.addEventListener("error", onError, { once: true });
    });
  }
  setupEventListeners() {
    if (this.video) {
      this.video.addEventListener("play", () => {
        this.isPlaying = true;
        this.element.setAttribute("data-playing", "true");
      });
      this.video.addEventListener("pause", () => {
        this.isPlaying = false;
        this.element.setAttribute("data-playing", "false");
      });
      this.video.addEventListener("ended", () => {
        this.isPlaying = false;
        this.element.setAttribute("data-playing", "false");
        if (this.options.loop) {
          this.video.currentTime = 0;
          this.playVideo();
        }
      });
    }
    document.addEventListener("visibilitychange", () => {
      if (document.hidden && this.isPlaying) {
        this.video?.pause();
      }
    });
  }
  playVideo() {
    if (!this.video || !this.isLoaded) return;
    const playPromise = this.video.play();
    if (playPromise !== void 0) {
      playPromise.catch((error) => {
        console.warn("VideoOptimized: Autoplay failed", error);
        if (this.playButton) {
          this.playButton.style.opacity = "1";
          this.playButton.style.pointerEvents = "auto";
        }
      });
    }
  }
  handleMobilePosterOnly() {
    if (this.video) {
      this.video.style.display = "none";
    }
    if (this.mobilePosterOnly) {
      this.mobilePosterOnly.style.display = "block";
    }
    console.log("VideoOptimized: Using poster-only mode for mobile");
  }
  handleLoadError() {
    this.element.setAttribute("data-error", "true");
    if (this.video) {
      this.video.style.display = "none";
    }
    if (this.poster) {
      this.poster.style.opacity = "1";
      this.poster.style.pointerEvents = "auto";
    }
  }
  // Utility methods
  isMobile() {
    return window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  }
  getConnectionInfo() {
    const info = {
      isSlow: false,
      isVerySlow: false,
      hasDataSaver: false
    };
    if ("connection" in navigator) {
      const connection = navigator.connection;
      if (connection.effectiveType === "slow-2g" || connection.effectiveType === "2g") {
        info.isVerySlow = true;
        info.isSlow = true;
      } else if (connection.effectiveType === "3g" && connection.downlink < 1.5) {
        info.isSlow = true;
      }
      if ("saveData" in connection) {
        info.hasDataSaver = connection.saveData;
      }
    }
    return info;
  }
  // Legacy methods for backwards compatibility
  isSlowConnection() {
    return this.connectionInfo?.isSlow || false;
  }
  isVerySlowConnection() {
    return this.connectionInfo?.isVerySlow || false;
  }
  hasDataSaverMode() {
    return this.connectionInfo?.hasDataSaver || false;
  }
  canAutoplay() {
    return this.video.muted;
  }
  // Progressive loading for priority videos - no blocking, no timeouts
  progressiveLoad() {
    if (!this.video) return;
    const handleCanPlay = () => {
      if (this.poster) {
        this.poster.style.transition = "opacity 0.3s ease-out";
        this.poster.style.opacity = "0";
      }
      if (this.options.autoplay && this.canAutoplay()) {
        this.playVideo();
      }
      this.video.removeEventListener("canplay", handleCanPlay);
    };
    const handleError = () => {
      console.log("VideoOptimized: Video failed to load, keeping poster");
      this.video.removeEventListener("error", handleError);
    };
    this.video.addEventListener("canplay", handleCanPlay, { once: true });
    this.video.addEventListener("error", handleError, { once: true });
  }
  fallbackToSimpleVideo() {
    if (this.video) {
      const sources = this.video.querySelectorAll("source[data-src]");
      sources.forEach((source) => {
        const src = source.getAttribute("data-src");
        if (src) {
          source.setAttribute("src", src);
          source.removeAttribute("data-src");
        }
      });
      this.video.preload = "metadata";
      this.video.load();
      this.isLoaded = true;
      this.element.setAttribute("data-loaded", "true");
    }
    if (this.playBtns.length || this.pauseBtns.length) {
      this.initPausePlay();
    }
  }
  // Methods from old Video.js
  initProgressBar() {
    this.video.addEventListener("play", () => {
      if (!this.progressDuration) this.progressDuration = this.video.duration;
      this.progressBar.style.transition = `width ${this.progressDuration}s linear`;
      this.progressBar.style.width = "100%";
    });
    this.video.addEventListener("pause", () => {
      this.progressBar.style.width = this.video.currentTime / this.video.duration * 100 + "%";
      this.progressDuration = this.video.duration - this.video.currentTime;
    });
    this.video.addEventListener("ended", () => {
      this.progressBar.style.transition = "none";
      this.progressBar.style.width = "0%";
    });
  }
  initInViewObserver() {
    const videoObserver = new IntersectionObserver(([entries]) => {
      if (entries.isIntersecting) {
        setTimeout(() => {
          this.video.play();
        }, 500);
      } else {
        this.video.pause();
      }
    });
    videoObserver.observe(this.video);
  }
  dispatchVideoEnd() {
    this.video.addEventListener("ended", () => {
      document.dispatchEvent(new CustomEvent("video end", {
        detail: {
          video: this.video,
          changeSlide: this.options.changeSlide
        }
      }));
    });
  }
  initPausePlay() {
    this.updateButtons();
    this.video.addEventListener("click", this.handleVideoClick);
    this.playBtns.forEach((btn) => btn.addEventListener("click", this.handlePlayClick));
    this.pauseBtns.forEach((btn) => btn.addEventListener("click", this.handlePauseClick));
    this.video.addEventListener("play", this.updateButtons);
    this.video.addEventListener("pause", this.updateButtons);
  }
  handlePlayClick() {
    if (!this.isLoaded) {
      this.loadVideo().then(() => {
        this.playVideo();
      });
    } else {
      this.playVideo();
    }
  }
  handlePauseClick() {
    this.video.pause();
  }
  handleVideoClick() {
    if (this.video.paused) {
      this.playVideo();
    } else {
      this.video.pause();
    }
  }
  updateButtons() {
    if (this.video.paused) {
      this.pauseBtns?.forEach((btn) => btn.classList.add("hidden"));
      this.playBtns?.forEach((btn) => btn.classList.remove("hidden"));
    } else {
      this.pauseBtns?.forEach((btn) => btn.classList.remove("hidden"));
      this.playBtns?.forEach((btn) => btn.classList.add("hidden"));
    }
  }
  // Cleanup
  destroy() {
    if (this.observer) {
      this.observer.disconnect();
    }
    this.video.removeEventListener("click", this.handleVideoClick);
    this.playBtns.forEach((btn) => btn.removeEventListener("click", this.handlePlayClick));
    this.pauseBtns.forEach((btn) => btn.removeEventListener("click", this.handlePauseClick));
    this.video.removeEventListener("play", this.updateButtons);
    this.video.removeEventListener("pause", this.updateButtons);
  }
};
var Video_default = Video;
export {
  Video_default as default
};
