/* =========================================================
   Animações (manual, seção 5). Tudo aqui é decorativo:
   sem este arquivo, todo texto e todo botão continuam visíveis.
   A4 revelação · A6 contadores · A8 brilho nos chips · A12 passos
   A13 rota no mapa · A15 mosaico · A5 tubulação (GSAP + ScrollTrigger)
   ========================================================= */
(function () {
  var html = document.documentElement;
  var mqReduz = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduz = mqReduz.matches;
  var GSAP_URL = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js';
  var ST_URL = 'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/ScrollTrigger.min.js';
  var temIO = 'IntersectionObserver' in window;

  function abaixoDaDobra(el) { return el.getBoundingClientRect().top > window.innerHeight * 0.92; }

  /* ---------- Modo sem movimento: tudo no estado final ---------- */
  function semMovimento() {
    reduz = true;
    html.classList.add('no-anim');
    document.querySelectorAll('.rv--oculto').forEach(function (el) { el.classList.remove('rv--oculto'); });
    document.querySelectorAll('.mapa').forEach(function (m) { m.classList.add('desenhou'); });
    document.querySelectorAll('.passos').forEach(function (p) {
      p.style.setProperty('--prog', 1);
      p.querySelectorAll('.passo').forEach(function (s) { s.classList.add('ativo'); });
    });
    document.querySelectorAll('[data-n]').forEach(function (el) { el.textContent = el.getAttribute('data-n'); });
    document.querySelectorAll('.contando').forEach(function (el) { el.classList.remove('contando'); });
    if (window.ScrollTrigger) window.ScrollTrigger.getAll().forEach(function (t) { t.kill(); });
    desenharTubo();
  }
  if (mqReduz.addEventListener) mqReduz.addEventListener('change', function (e) { if (e.matches) semMovimento(); });

  document.addEventListener('DOMContentLoaded', function () {
    if (reduz || !temIO) { semMovimento(); return; }
    html.classList.add('js-rv');

    /* A4 + A15: revelação com stagger (só esconde o que ainda está fora da tela) */
    var porPai = new Map();
    document.querySelectorAll('.rv').forEach(function (el) {
      var pai = el.parentElement, n = porPai.get(pai) || 0;
      el.style.setProperty('--i', n); porPai.set(pai, n + 1);
      if (abaixoDaDobra(el)) el.classList.add('rv--oculto');
    });
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.remove('rv--oculto');
        e.target.querySelectorAll('.chip').forEach(function (c) { c.classList.add('brilha'); });
        io.unobserve(e.target);
      });
    }, { threshold: 0.15 });
    document.querySelectorAll('.rv--oculto').forEach(function (el) { io.observe(el); });

    /* A6: contador tipo odômetro */
    var ioN = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        ioN.unobserve(e.target); contar(e.target);
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('[data-n]').forEach(function (el) {
      if (!abaixoDaDobra(el)) return;
      el.textContent = '0';
      el.parentElement.classList.add('contando');
      ioN.observe(el);
    });

    /* A13: rota no mapa */
    document.querySelectorAll('.mapa').forEach(function (m) {
      m.querySelectorAll('.rota').forEach(function (r) { r.style.setProperty('--len', Math.ceil(r.getTotalLength())); });
      m.querySelectorAll('.pino').forEach(function (p, i) { p.style.transitionDelay = (0.35 + i * 0.32) + 's'; });
      var ioM = new IntersectionObserver(function (es) {
        if (es[0].isIntersecting) { m.classList.add('desenhou'); ioM.disconnect(); }
      }, { threshold: 0.3 });
      ioM.observe(m);
    });

    /* Tubulação: desenha já (estática) e carrega o GSAP depois do LCP, no primeiro gesto ou após 2,5 s */
    desenharTubo();
    var carregou = false;
    function carregar() {
      if (carregou) return; carregou = true;
      ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.removeEventListener(ev, carregar); });
      script(GSAP_URL, function () { script(ST_URL, iniciarScroll, falhou); }, falhou);
    }
    function falhou() { semMovimentoParcial(); }
    window.addEventListener('load', function () {
      ['scroll', 'pointerdown', 'keydown', 'touchstart'].forEach(function (ev) { window.addEventListener(ev, carregar, { passive: true, once: true }); });
      setTimeout(carregar, 2500);
    });
  });

  function script(src, ok, erro) {
    var s = document.createElement('script');
    s.src = src; s.async = true; s.onload = ok; s.onerror = erro;
    document.head.appendChild(s);
  }

  /* Se o GSAP não carregar: passos e tubo já preenchidos (nada some) */
  function semMovimentoParcial() {
    document.querySelectorAll('.passos').forEach(function (p) {
      p.style.setProperty('--prog', 1);
      p.querySelectorAll('.passo').forEach(function (s) { s.classList.add('ativo'); });
    });
    document.querySelectorAll('.tubo .t-fluxo, .tubo .t-brilho').forEach(function (f) { f.style.strokeDashoffset = 0; });
  }

  function contar(el) {
    var alvo = parseFloat(el.getAttribute('data-n')), ini = performance.now(), dur = 1200;
    (function passo(t) {
      var k = Math.min(1, (t - ini) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(alvo * e);
      if (k < 1) requestAnimationFrame(passo);
      else el.parentElement.classList.remove('contando');
    })(ini);
  }

  /* ---------- A5: a tubulação que desentope ---------- */
  var tubo = { svg: null, fluxo: null, amostras: [], luvas: [], fim: null, total: 0, y0: 0, y1: 0 };
  var NS = 'http://www.w3.org/2000/svg';

  function desenharTubo() {
    var main = document.querySelector('main');
    var fimEl = document.querySelector('[data-tubo-fim]');
    var iniEl = document.querySelector('[data-tubo-inicio]');
    if (tubo.svg) { tubo.svg.remove(); tubo.svg = null; }
    if (!main || !fimEl || !iniEl || window.innerWidth < 1280) return;

    // posições sem transform (as animações de entrada deslocam os elementos)
    function abs(el) { var t = 0, l = 0; while (el) { t += el.offsetTop; l += el.offsetLeft; el = el.offsetParent; } return { t: t, l: l }; }
    var mb = main.getBoundingClientRect(), top = abs(main).t, left = abs(main).l;
    function y(el) { return abs(el).t - top; }
    var vw = document.documentElement.clientWidth;
    var L = Math.max(20, (vw - 1160) / 2);          // borda esquerda do conteúdo
    var x = Math.round(L * 0.45);                    // o tubo corre na margem
    var a = Math.min(18, x - 14);                    // amplitude das curvas
    var y0 = y(iniEl) + 24;
    var paradas = Array.prototype.map.call(document.querySelectorAll('[data-tubo-parada]'), function (el) { return y(el) + 40; });
    var fa = abs(fimEl);
    var bx = fa.l - left, by = fa.t - top + fimEl.offsetHeight / 2;
    var r = Math.min(28, (bx - x) / 2);

    var d = 'M' + x + ' ' + y0, yAnt = y0;
    paradas.concat([by - r]).forEach(function (yB) {
      var ym = (yAnt + yB) / 2;
      if (yB - yAnt > 260) {
        d += ' L' + x + ' ' + (ym - 90) + ' C' + x + ' ' + (ym - 45) + ' ' + (x + a) + ' ' + (ym - 45) + ' ' + (x + a) + ' ' + ym +
             ' C' + (x + a) + ' ' + (ym + 45) + ' ' + x + ' ' + (ym + 45) + ' ' + x + ' ' + (ym + 90);
      }
      d += ' L' + x + ' ' + yB; yAnt = yB;
    });
    d += ' Q' + x + ' ' + by + ' ' + (x + r) + ' ' + by + ' L' + (bx - 2) + ' ' + by;

    var svg = document.createElementNS(NS, 'svg');
    svg.setAttribute('class', 'tubo'); svg.setAttribute('aria-hidden', 'true'); svg.setAttribute('focusable', 'false');
    svg.setAttribute('width', mb.width); svg.setAttribute('height', main.scrollHeight);
    svg.innerHTML = '<defs><linearGradient id="g-fluxo" gradientUnits="userSpaceOnUse" x1="0" y1="' + y0 + '" x2="0" y2="' + by + '">' +
      '<stop offset="0" stop-color="#2BB3C0"/><stop offset=".7" stop-color="#2BB3C0"/><stop offset="1" stop-color="#FF6A13"/></linearGradient></defs>' +
      '<path class="t-base" d="' + d + '" style="stroke:rgba(43,120,135,.22)"/>' +
      '<path class="t-brilho" d="' + d + '"/><path class="t-fluxo" d="' + d + '"/>';
    main.appendChild(svg);
    var fluxo = svg.querySelectorAll('.t-fluxo, .t-brilho');
    var total = fluxo[1].getTotalLength();
    fluxo.forEach(function (f) { f.style.strokeDasharray = total; f.style.strokeDashoffset = reduz ? 0 : total; });

    // amostras comprimento → altura, para saber até onde o fluxo chegou
    var amostras = [];
    for (var l = 0; l <= total; l += 8) amostras.push([l, fluxo[1].getPointAtLength(l).y]);
    amostras.push([total, by]);

    // luvas de conexão nas paradas (o mesmo detalhe do logo)
    var luvas = paradas.map(function (yp) {
      var g = document.createElementNS(NS, 'g');
      g.setAttribute('class', 'luva' + (reduz ? ' acesa' : ''));
      g.innerHTML = '<rect x="' + (x - 13) + '" y="' + (yp - 5) + '" width="26" height="10" rx="2"/>';
      svg.appendChild(g); return { g: g, y: yp };
    });

    tubo = { svg: svg, fluxo: fluxo, amostras: amostras, luvas: luvas, fim: fimEl, total: total, y0: y0, y1: by, top: top };
    if (reduz) return;
    atualizarTubo();
  }

  function atualizarTubo() {
    if (!tubo.svg || reduz) return;
    var ponta = window.scrollY + window.innerHeight * 0.6 - tubo.top; // a ponta do fluxo acompanha 60% da tela
    var am = tubo.amostras, comp = 0;
    if (ponta >= tubo.y1) comp = tubo.total;
    else if (ponta > tubo.y0) {
      for (var i = 0; i < am.length; i++) { if (am[i][1] > ponta) break; comp = am[i][0]; }
    }
    var off = tubo.total - comp;
    tubo.fluxo.forEach(function (f) { f.style.strokeDashoffset = off; });
    tubo.luvas.forEach(function (lv) { lv.g.classList.toggle('acesa', ponta >= lv.y); });
    var chegou = comp >= tubo.total - 1;
    if (chegou && !tubo.fim.classList.contains('chegou')) tubo.fim.classList.add('chegou');
    else if (!chegou && tubo.fim.classList.contains('chegou') && ponta < tubo.y1 - 200) tubo.fim.classList.remove('chegou');
  }

  /* ---------- GSAP + ScrollTrigger: tubulação e passos ---------- */
  function iniciarScroll() {
    if (reduz || !window.gsap || !window.ScrollTrigger) { semMovimentoParcial(); return; }
    var gsap = window.gsap, ST = window.ScrollTrigger;
    gsap.registerPlugin(ST);

    // A12 + A5 celular: passos de "Como funciona" com o tubo enchendo
    document.querySelectorAll('.passos').forEach(function (p) {
      var passos = p.querySelectorAll('.passo'), n = passos.length;
      ST.create({
        trigger: p, start: 'top 72%', end: 'bottom 62%', scrub: true,
        onUpdate: function (self) {
          var v = self.progress;
          p.style.setProperty('--prog', v.toFixed(3));
          passos.forEach(function (s, i) { s.classList.toggle('ativo', v >= (n > 1 ? i / (n - 1) : 0) - 0.02); });
        }
      });
    });

    // Tubulação da página (desktop)
    if (document.querySelector('[data-tubo-fim]')) {
      ST.create({ trigger: 'main', start: 'top top', end: 'bottom bottom', scrub: true, onUpdate: atualizarTubo });
      var redesenhar = debounce(function () { desenharTubo(); ST.refresh(); }, 200);
      window.addEventListener('resize', redesenhar);
      if ('ResizeObserver' in window) {
        var alt = 0;
        new ResizeObserver(function () {
          var h = document.querySelector('main').offsetHeight;
          if (Math.abs(h - alt) > 4) { alt = h; redesenhar(); }
        }).observe(document.querySelector('main'));
      }
    }
    ST.refresh();
  }

  function debounce(fn, ms) { var t; return function () { clearTimeout(t); t = setTimeout(fn, ms); }; }
})();
