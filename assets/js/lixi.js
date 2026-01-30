// assets/js/lixi.js
(function(){
  function createBao(options){
    const el = document.createElement('div');
    el.className = 'lixi-bao';
    const img = document.createElement('img');
    // path relative to repo root - adjust if your site serves from a subpath
    img.src = (options && options.src) ? options.src : '/assets/svg/bao.svg';
    img.alt = '';
    el.appendChild(img);

    // random horizontal start
    const left = Math.random() * 100; // percent
    el.style.left = left + 'vw';

    // random duration and delay
    const duration = (Math.random() * 6) + 5; // 5s - 11s
    const delay = Math.random() * 4; // 0s - 4s
    el.style.animation = `lixi-fall ${duration}s linear ${delay}s forwards`;

    // Remove after animation ends (duration + delay + small buffer)
    const ttl = (duration + delay + 0.5) * 1000;
    setTimeout(()=> el.remove(), ttl);

    return el;
  }

  function startLixi(opts){
    const cfg = Object.assign({ count: 18, interval: 350, src: '/assets/svg/bao.svg' }, opts || {});
    // respect reduced motion
    const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if(prefersReduced) return { stop: ()=>{} };

    let container = document.getElementById('lixi-container');
    if(!container){
      container = document.createElement('div');
      container.id = 'lixi-container';
      container.setAttribute('aria-hidden','true');
      document.body.appendChild(container);
    }

    let spawned = 0;
    let intervalId = setInterval(()=>{
      if(spawned >= cfg.count){ clearInterval(intervalId); return; }
      const b = createBao({ src: cfg.src });
      container.appendChild(b);
      spawned++;
    }, cfg.interval);

    return {
      stop: ()=> { clearInterval(intervalId); }
    };
  }

  // Auto-start once DOM ready if script has data-autostart attribute on script tag
  function autoStartIfRequested(){
    try{
      const scripts = document.getElementsByTagName('script');
      const me = scripts[scripts.length-1];
      if(me && me.dataset && me.dataset.autostart !== undefined){
        // parse optional config
        let cfg = {};
        if(me.dataset.count) cfg.count = parseInt(me.dataset.count,10);
        if(me.dataset.interval) cfg.interval = parseInt(me.dataset.interval,10);
        if(me.dataset.src) cfg.src = me.dataset.src;
        startLixi(cfg);
      }
    }catch(e){ /* ignore */ }
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', autoStartIfRequested);
  } else autoStartIfRequested();

  // Expose to window for manual control
  window.lixi = { start: startLixi };
})();
