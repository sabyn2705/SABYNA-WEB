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

  // Preload lì xì image
  const lixiImage = new Image();
  let lixiLoaded = false;
  lixiImage.onload = function() {
    lixiLoaded = true;
  };
  lixiImage.onerror = function() {
    lixiLoaded = false;
    console.log('Lì xì image failed to load, using fallback');
  };
  lixiImage.src = '/assets/lixi.png';

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

  // Lì xì (red envelope) constructor
  function Flake(x, y, r, speed, wind, opacity) {
    this.x = x;
    this.y = y;
    this.r = r;
    this.speed = speed;
    this.wind = wind;
    this.opacity = opacity;
    this.rotation = Math.random() * Math.PI * 2; // Random initial rotation
    this.rotationSpeed = (Math.random() - 0.5) * 0.05; // Slow rotation for natural motion
    this.update = function () {
      this.x += this.wind;
      this.y += this.speed;
      this.rotation += this.rotationSpeed; // Update rotation
      // wrap-around
      if (this.y > H + this.r * 2) {
        this.y = -this.r * 2;
        this.x = Math.random() * W;
      }
      if (this.x > W + this.r * 2) this.x = -this.r * 2;
      if (this.x < -this.r * 2) this.x = W + this.r * 2;
    };
    this.draw = function (ctx) {
      ctx.save();
      ctx.globalAlpha = this.opacity;
      ctx.translate(this.x, this.y);
      ctx.rotate(this.rotation);
      
      if (lixiLoaded) {
        // Draw lì xì image
        const w = this.r * 2;
        const h = this.r * 2.8; // Lì xì are taller than wide (envelope shape)
        ctx.drawImage(lixiImage, -w / 2, -h / 2, w, h);
      } else {
        // Fallback: red/yellow block
        ctx.fillStyle = 'rgba(220, 20, 60, ' + this.opacity + ')'; // Red
        ctx.fillRect(-this.r, -this.r * 1.4, this.r * 2, this.r * 2.8);
        // Yellow/gold accent
        ctx.fillStyle = 'rgba(255, 215, 0, ' + this.opacity + ')';
        ctx.fillRect(-this.r * 0.8, -this.r * 1.2, this.r * 1.6, this.r * 0.4);
      }
      
      ctx.restore();
    };
  }

  // Create flakes based on viewport
  let flakes = [];
  function initFlakes() {
    flakes = [];
    const area = W * H;
    // density: flakes per 10000 px^2 (adjusted to ~0.6 for lì xì)
    const density = 0.6;
    const count = Math.min(200, Math.round((area / 10000) * density));
    for (let i = 0; i < count; i++) {
      const r = 0.8 + Math.random() * 3.5; // size (base size for lì xì)
      const x = Math.random() * W;
      const y = Math.random() * H;
      const speed = 0.6 + Math.random() * 1.8; // speed ~0.6–2.4
      const wind = (Math.random() - 0.5) * 2.0; // wind ~±1.0
      const opacity = 0.5 + Math.random() * 0.5; // opacity 0.5–1.0
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
