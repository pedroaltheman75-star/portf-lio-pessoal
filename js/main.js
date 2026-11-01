/* ============================================================================
   PORTFÓLIO — PEDRO ALTHEMAN · JavaScript puro (sem frameworks, sem build)
   ----------------------------------------------------------------------------
   O que este arquivo faz:
     1. Tela de carregamento (contador 000 → 100 + palavras rotativas)
     2. Palavra que rotaciona no topo ("estudante de TI", "programador"...)
     3. Menu: sombra ao rolar, destaque do link ativo e rolagem suave
     4. Animação de entrada dos elementos quando aparecem na tela
     5. Vídeo de fundo (HLS) com fundo em gradiente caso não carregue
   ========================================================================== */

document.body.classList.add("js");

/* --------------------------------------------------------------- CONTEÚDO */
// Palavras do topo — troque à vontade
const ROLES = ["estudante de TI", "programador", "criador de jogos", "aprendiz constante"];

// Palavras da tela de carregamento
const LOADER_WORDS = ["Estudar", "Criar", "Evoluir"];

/* =========================================================== 1. CARREGAMENTO */
(function initLoader() {
  const loader = document.getElementById("loader");
  const countEl = document.getElementById("loaderCount");
  const barEl = document.getElementById("loaderBar");
  const wordEl = document.getElementById("loaderWord");
  if (!loader || !countEl) return;

  document.body.classList.add("is-loading");

  const DURATION = 2700;
  let start = null;
  let wordIndex = 0;

  // palavras rotativas a cada 900ms
  const wordTimer = setInterval(() => {
    if (!wordEl) return;
    wordEl.style.animation = "none";
    wordIndex = (wordIndex + 1) % LOADER_WORDS.length;
    wordEl.textContent = LOADER_WORDS[wordIndex];
    void wordEl.offsetWidth; // reinicia a animação
    wordEl.style.animation = "wordIn 0.4s ease-out";
  }, 900);

  function tick(time) {
    if (start === null) start = time;
    const progress = Math.min((time - start) / DURATION, 1);
    const value = Math.floor(progress * 100);

    countEl.textContent = String(value).padStart(3, "0");
    if (barEl) barEl.style.transform = `scaleX(${value / 100})`;

    if (progress < 1) {
      requestAnimationFrame(tick);
      return;
    }

    // terminou: espera 400ms, esconde o loader e libera a entrada do hero
    clearInterval(wordTimer);
    setTimeout(() => {
      loader.classList.add("is-hidden");
      document.body.classList.remove("is-loading");
      document.body.classList.add("is-ready");
      setTimeout(() => loader.remove(), 700);
    }, 400);
  }

  requestAnimationFrame(tick);
})();

/* ========================================================= 2. PALAVRA DO HERO */
(function initRoles() {
  const el = document.getElementById("roleWord");
  if (!el) return;

  let index = 0;
  setInterval(() => {
    index = (index + 1) % ROLES.length;
    el.style.animation = "none";
    el.textContent = ROLES[index];
    void el.offsetWidth;
    el.style.animation = "wordIn 0.4s ease-out";
  }, 2000);
})();

/* ==================================================== 3. MENU (nav) E ROLAGEM */
(function initNav() {
  const nav = document.getElementById("nav");
  const links = Array.from(document.querySelectorAll(".nav__link"));
  if (!nav || !links.length) return;

  function update() {
    nav.classList.toggle("is-scrolled", window.scrollY > 100);

    // destaca o link da seção visível
    const visible = links
      .map((link) => {
        const section = document.getElementById(link.getAttribute("href").slice(1));
        return { link, top: section ? section.getBoundingClientRect().top : Infinity };
      })
      .filter((item) => item.top <= window.innerHeight * 0.4)
      .sort((a, b) => b.top - a.top)[0];

    if (visible) {
      links.forEach((link) => link.classList.toggle("is-active", link === visible.link));
    }
  }

  update();
  window.addEventListener("scroll", update, { passive: true });

  // rolagem suave com compensação do menu fixo
  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", (event) => {
      const id = link.getAttribute("href").slice(1);
      const target = document.getElementById(id);
      if (!target) return;

      event.preventDefault();
      const offset = id === "home" ? 0 : 76;
      window.scrollTo({
        top: target.getBoundingClientRect().top + window.scrollY - offset,
        behavior: "smooth",
      });
    });
  });
})();

/* ============================================ 4. ANIMAÇÃO AO APARECER (scroll) */
(function initReveal() {
  const items = document.querySelectorAll(".reveal");
  if (!items.length) return;

  if (!("IntersectionObserver" in window)) {
    items.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;

        const el = entry.target;
        // pequeno atraso em cascata entre irmãos
        const siblings = Array.from(el.parentElement ? el.parentElement.children : []).filter((child) =>
          child.classList.contains("reveal")
        );
        const index = Math.max(0, siblings.indexOf(el));
        el.style.animationDelay = `${Math.min(index * 70, 420)}ms`;

        el.classList.add("is-visible");
        observer.unobserve(el);
      });
    },
    { rootMargin: "0px 0px -80px 0px", threshold: 0.1 }
  );

  items.forEach((item) => observer.observe(item));
})();

/* ================================================= 5. VÍDEO DE FUNDO (HLS) */
(function initVideos() {
  const HLS_CDN = "https://cdn.jsdelivr.net/npm/hls.js@1.5.17/dist/hls.min.js";
  let hlsPromise = null;

  function loadHls() {
    if (window.Hls) return Promise.resolve(window.Hls);
    if (!hlsPromise) {
      hlsPromise = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = HLS_CDN;
        script.onload = () => resolve(window.Hls);
        script.onerror = () => reject(new Error("Não foi possível carregar o hls.js"));
        document.head.appendChild(script);
      });
    }
    return hlsPromise;
  }

  function play(video) {
    const promise = video.play();
    if (promise && typeof promise.catch === "function") promise.catch(() => {});
  }

  async function setup(video) {
    const src = video.dataset.hls;
    if (!src) return;

    try {
      // Primeiro tenta o hls.js (funciona em Chrome, Edge, Firefox)
      const Hls = await loadHls();
      if (Hls && Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true });
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => play(video));
        hls.on(Hls.Events.ERROR, () => {
          // mantém o fundo em gradiente
        });
        return;
      }
    } catch (error) {
      console.warn("[vídeo de fundo]", error.message);
    }

    // Plano B: Safari e iOS tocam HLS nativamente
    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = src;
      play(video);
    }
  }

  document.querySelectorAll("video[data-hls]").forEach(setup);
})();

/* ================================================================== RODAPÉ */
(function initYear() {
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
