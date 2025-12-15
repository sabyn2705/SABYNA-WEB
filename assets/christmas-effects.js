/* Christmas effects: snowfall (canvas) + twinkling stars overlay
   - Sử dụng requestAnimationFrame
   - Tắt nếu URL có ?xmas=0 hoặc localStorage.xmasEffects === "off"
   - Tôn trọng prefers-reduced-motion
*/

(function () {
  'use strict';

  // Kiểm tra có tắt bằng URL param hoặc localStorage
  function isXmasDisabled() {
    try {
      const url = new URL(location.href);
      if (url.searchParams.get('xmas') === '0') return true;
    } catch (e) {}
    try {
      if (localStorage && localStorage.getItem('xmasEffects') === 'off') return true;
    } catch (e) {}
    return false;
  }

  // Tôn trọng prefers-reduced-motion
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (isXmasDisabled() || prefersReduced) {
    // Không khởi tạo effect nếu disabled
    return;
  }

  // --- Tạo container overlay ---
  const overlay = document.createElement('div');
  overlay.className = 'xmas-overlay';
  overlay.setAttribute('aria-hidden', 'true');

  const canvas = document.createElement('canvas');
  overlay.appendChild(canvas);
  document.body.appendChild(overlay);

  // Twinkles container (sao lấp lánh)
  const twinkles = document.createElement('div');
  twinkles.className = 'xmas-twinkles';
  twinkles.setAttribute('aria-hidden', 'true');
  document.body.appendChild(twinkles);

  // Canvas context
  const ctx = canvas.getContext('2d');

  // Kích thước và scale
  let W = 0, H = 0, DPR = Math.max(1, window.devicePixelRatio || 1);

  function resize() {
    W = Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
    H = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    canvas.width = Math.floor(W * DPR);
    canvas.height = Math.floor(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Snowflake constructor
  function Flake(x, y, r, speed, wind, opacity) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.speed = speed;
    this.wind = wind;
    this.opacity = opacity;
    this.update = function () {
      this.x += this.wind;
      this.y += this.speed;
      // wrap-around
      if (this.y > H + this.r) {
        this.y = -this.r;
        this.x = Math.random() * W;
      }
      if (this.x > W + this.r) this.x = -this.r;
      if (this.x < -this.r) this.x = W + this.r;
    };
    this.draw = function (ctx) {
      ctx.beginPath();
      // simple circle (white)
      ctx.fillStyle = 'rgba(255,255,255,' + this.opacity + ')';
      ctx.moveTo(this.x + this.r, this.y);
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fill();
    };
  }

  // Create flakes based on viewport
  let flakes = [];
  function initFlakes() {
    flakes = [];
    const area = W * H;
    // density: flakes per 10000 px^2 (adjust: ~0.8)
    const density = 0.8;
    const count = Math.min(200, Math.round((area / 10000) * density));
    for (let i = 0; i < count; i++) {
      const r = 0.8 + Math.random() * 3.5; // size
      const x = Math.random() * W;
      const y = Math.random() * H;
      const speed = 0.3 + Math.random() * 1.2;
      const wind = (Math.random() - 0.5) * 0.6;
      const opacity = 0.2 + Math.random() * 0.9;
      flakes.push(new Flake(x, y, r, speed, wind, opacity));
    }
  }
  initFlakes();
  // Re-init on resize with debounce
  let resizeTimeout;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(initFlakes, 250);
  }, { passive: true });

  // Animation loop
  let rafId;
  function animate() {
    ctx.clearRect(0, 0, W, H);
    for (let i = 0; i < flakes.length; i++) {
      const f = flakes[i];
      f.update();
      f.draw(ctx);
    }
    rafId = requestAnimationFrame(animate);
  }
  animate();

  // Pause when page hidden
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) {
      if (rafId) cancelAnimationFrame(rafId);
    } else {
      animate();
    }
  });

  // --- Twinkles (đốm sáng nhấp nháy) ---
  function createTwinkles(n) {
    // xóa twinkles cũ
    while (twinkles.firstChild) twinkles.removeChild(twinkles.firstChild);
    for (let i = 0; i < n; i++) {
      const el = document.createElement('div');
      const sizeClassRand = Math.random();
      if (sizeClassRand < 0.5) el.className = 'xmas-star small';
      else if (sizeClassRand < 0.85) el.className = 'xmas-star medium';
      else el.className = 'xmas-star large';

      const left = Math.floor(Math.random() * 100);
      const top = Math.floor(Math.random() * 100);
      el.style.left = left + '%';
      el.style.top = top + '%';
      // random delay/duration to make twinkles non-uniform
      const delay = Math.random() * 3;
      const dur = 2 + Math.random() * 3;
      el.style.animationDelay = delay + 's';
      el.style.animationDuration = dur + 's';
      twinkles.appendChild(el);
    }
  }

  // số lượng twinkles tùy kích thước màn hình
  const twinkleCount = Math.min(30, Math.round((W * H) / (1920 * 1080) * 30) || 12);
  createTwinkles(twinkleCount);
  // khởi tạo lại twinkles khi thay đổi kích thước (debounced)
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(function () {
      createTwinkles(Math.min(30, Math.round((W * H) / (1920 * 1080) * 30) || 12));
    }, 300);
  }, { passive: true });

  // Expose a global toggle (nếu muốn dev bật/tắt từ console)
  window.__xmasEffects = {
    disable: function () {
      try {
        localStorage.setItem('xmasEffects', 'off');
      } catch (e) {}
      // remove nodes and stop animation
      if (rafId) cancelAnimationFrame(rafId);
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
      if (twinkles.parentNode) twinkles.parentNode.removeChild(twinkles);
    },
    enable: function () {
      try {
        localStorage.removeItem('xmasEffects');
      } catch (e) {}
      location.reload();
    }
  };

  // Cleanup on unload (best-effort)
  window.addEventListener('unload', function () {
    if (rafId) cancelAnimationFrame(rafId);
  });
})();
