/* =========================================================
   CONFIGURAÇÃO: troque aqui telefone, WhatsApp e mensagens.
   (O HTML já traz os links prontos para quem está sem JavaScript;
   com JavaScript ligado, vale sempre o que está aqui.)
   ========================================================= */
var CONFIG = {
  whatsapp: '5541996354400',        // só números: 55 + DDD + número
  telefone: '+5541996354400',       // formato internacional para o link de ligação
  telefoneTexto: '(41)\u00A099635\u20114400',
  formEndpoint: 'enviar.php',       // na raiz do site (HostGator). Sem PHP, o formulário cai no WhatsApp.
  mensagens: {
    padrao: 'Olá! Vim pelo site da Conserv I9 e preciso de um orçamento.',
    vaso: 'Olá! Vim pelo site. Estou com o vaso sanitário entupido no bairro ______. Pode vir avaliar?',
    pia: 'Olá! Vim pelo site. Estou com a pia/ralo entupido no bairro ______. Pode vir avaliar?',
    esgoto: 'Olá! Vim pelo site. Estou com problema de esgoto (retorno/mau cheiro) no bairro ______. Pode vir avaliar?',
    gordura: 'Olá! Vim pelo site. Preciso limpar a caixa de gordura no bairro ______. Pode vir avaliar?',
    vazamento: 'Olá! Vim pelo site. Acho que tenho um vazamento (conta alta/mancha/infiltração) no bairro ______. Pode vir avaliar?',
    dedetizacao: 'Olá! Vim pelo site. Quero agendar uma dedetização no bairro ______. É casa/apartamento/empresa. Qual o valor?',
    b2b: 'Olá! Vim pelo site. Sou de um(a) condomínio/empresa em ______ e preciso de orçamento para ______.',
    litoral: 'Olá! Vim pelo site. Preciso de atendimento no litoral (cidade: ______). É desentupimento / limpa-fossa.',
    // Regiões: a cidade entra pré-preenchida
    'regiao-curitiba': 'Olá! Vim pelo site. Estou em Curitiba, no bairro ______, e preciso de atendimento. Pode vir avaliar?',
    'regiao-rmc': 'Olá! Vim pelo site. Estou na Região Metropolitana (cidade: ______) e preciso de atendimento. Pode vir avaliar?',
    'regiao-litoral': 'Olá! Vim pelo site. Preciso de atendimento no litoral (cidade: ______). É desentupimento / limpa-fossa.',
    'regiao-itapoa': 'Olá! Vim pelo site. Preciso de atendimento em Itapoá (SC), no bairro ______. É desentupimento / limpa-fossa.'
  }
};

/* ---------- Rastreamento (Google Tag Manager) ----------
   Eventos no dataLayer: whatsapp_click · phone_click · form_submit · generate_lead · scroll_75
   No GTM: crie gatilhos de "Evento personalizado" com estes nomes.            */
window.dataLayer = window.dataLayer || [];
function track(evento, dados) {
  var d = dados || {};
  d.event = evento;
  d.pagina = d.pagina || location.pathname;
  window.dataLayer.push(d);
}

/* ---------- UTM: guarda na sessão e repassa para o WhatsApp ---------- */
var UTM = (function () {
  var chaves = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid'];
  var salvo = {};
  try { salvo = JSON.parse(sessionStorage.getItem('ci9_utm') || '{}'); } catch (e) {}
  var q = new URLSearchParams(location.search), novo = false;
  chaves.forEach(function (k) { if (q.get(k)) { salvo[k] = q.get(k).slice(0, 80); novo = true; } });
  if (novo) { try { sessionStorage.setItem('ci9_utm', JSON.stringify(salvo)); } catch (e) {} }
  return salvo;
})();

function comRef(msg) {
  return UTM.utm_campaign ? msg + ' [ref: ' + UTM.utm_campaign + ']' : msg;
}
function linkWhats(msg) {
  return 'https://wa.me/' + CONFIG.whatsapp + '?text=' + encodeURIComponent(comRef(msg || CONFIG.mensagens.padrao));
}
var RAIZ = document.documentElement.getAttribute('data-raiz') || '/';

document.addEventListener('DOMContentLoaded', function () {
  var html = document.documentElement;

  /* Links de WhatsApp: data-wa = origem (para o relatório), data-msg = chave da mensagem */
  document.querySelectorAll('[data-wa]').forEach(function (a) {
    var chave = a.getAttribute('data-msg') || 'padrao';
    a.href = linkWhats(CONFIG.mensagens[chave] || CONFIG.mensagens.padrao);
    a.target = '_blank';
    a.rel = 'noopener';
    a.addEventListener('click', function () {
      track('whatsapp_click', { origem: a.getAttribute('data-wa') });
    });
  });

  /* Links de telefone */
  document.querySelectorAll('[data-tel]').forEach(function (a) {
    a.href = 'tel:' + CONFIG.telefone;
    var t = a.querySelector('[data-tel-texto]');
    if (t) t.textContent = CONFIG.telefoneTexto;
    a.addEventListener('click', function () {
      track('phone_click', { origem: a.getAttribute('data-tel') || 'link' });
    });
  });

  /* Menu: pílula que encolhe (A3) */
  var topo = document.querySelector('.topo');
  var compacto = false, pedido = false;
  function aoRolar() {
    pedido = false;
    var c = window.scrollY > 80;
    if (c !== compacto && topo) { compacto = c; topo.classList.toggle('topo--compacto', c); }
  }
  window.addEventListener('scroll', function () { if (!pedido) { pedido = true; requestAnimationFrame(aoRolar); } }, { passive: true });
  aoRolar();

  /* Menu do celular */
  var botao = document.querySelector('.topo__menu');
  var painel = document.getElementById('painel');
  function fechar() { html.classList.remove('menu-aberto'); if (botao) { botao.setAttribute('aria-expanded', 'false'); } if (painel) painel.inert = true; }
  if (botao && painel) {
    botao.addEventListener('click', function () {
      var abrir = !html.classList.contains('menu-aberto');
      html.classList.toggle('menu-aberto', abrir);
      botao.setAttribute('aria-expanded', String(abrir));
      painel.inert = !abrir;
      if (abrir) { var p = painel.querySelector('a'); if (p) p.focus(); }
    });
    painel.addEventListener('click', function (e) { if (e.target.closest('a')) fechar(); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && html.classList.contains('menu-aberto')) { fechar(); botao.focus(); } });
    window.addEventListener('resize', function () { if (window.innerWidth >= 1100) fechar(); });
  }

  /* Barra fixa no celular (A11): aparece depois que o visitante passa do topo */
  var barra = document.querySelector('.barra');
  var heroEl = document.querySelector('.hero');
  if (barra) {
    if (heroEl && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (es) {
        barra.classList.toggle('barra--on', !es[0].isIntersecting);
      }, { rootMargin: '-120px 0px 0px 0px' }).observe(heroEl);
    } else { barra.classList.add('barra--on'); }
  }

  /* Rolagem de 75% (diagnóstico no GA4) */
  var foi75 = false;
  window.addEventListener('scroll', function () {
    if (foi75) return;
    var h = document.documentElement.scrollHeight - window.innerHeight;
    if (h > 0 && window.scrollY / h >= 0.75) { foi75 = true; track('scroll_75'); }
  }, { passive: true });

  /* Formulários */
  document.querySelectorAll('form[data-form]').forEach(montarForm);

  /* Página de obrigado */
  if (html.hasAttribute('data-obrigado')) paginaObrigado();

  var ano = document.getElementById('ano');
  if (ano) ano.textContent = new Date().getFullYear();
});

/* ---------- Formulários: validação, máscara, honeypot e envio ---------- */
function mascaraTel(v) {
  var d = v.replace(/\D/g, '').slice(0, 11);
  if (d.length <= 2) return d.length ? '(' + d : '';
  if (d.length <= 6) return '(' + d.slice(0, 2) + ') ' + d.slice(2);
  if (d.length <= 10) return '(' + d.slice(0, 2) + ') ' + d.slice(2, 6) + '-' + d.slice(6);
  return '(' + d.slice(0, 2) + ') ' + d.slice(2, 7) + '-' + d.slice(7);
}

function montarForm(form) {
  var tipo = form.getAttribute('data-form'); // residencial | b2b
  form.noValidate = true; // com JS, a validação é a nossa (mensagens claras); sem JS, vale a do navegador
  var status = form.querySelector('.form__status');
  var mensagens = {
    nome: 'Faltou o seu nome.',
    whats: 'Faltou o WhatsApp com DDD. Ex.: (41) 99999-9999',
    tipo: 'Escolha o tipo de imóvel.',
    cargo: 'Escolha o seu cargo.',
    empresa: 'Faltou o nome do condomínio ou da empresa.',
    cidade: 'Faltou a cidade ou o bairro.',
    servico: 'Escolha o serviço.'
  };

  function erroDe(campo) {
    if (!campo.required) return '';
    var v = campo.value.trim();
    if (campo.name === 'whats') return v.replace(/\D/g, '').length >= 10 ? '' : mensagens.whats;
    return v ? '' : (mensagens[campo.name] || 'Campo obrigatório.');
  }
  function mostrar(campo, msg) {
    var box = document.getElementById(campo.getAttribute('aria-describedby'));
    campo.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (box) box.textContent = msg;
  }

  form.querySelectorAll('input[name="whats"]').forEach(function (i) {
    i.addEventListener('input', function () { i.value = mascaraTel(i.value); });
  });
  form.querySelectorAll('[required]').forEach(function (c) {
    c.addEventListener('blur', function () { if (c.value.trim()) mostrar(c, erroDe(c)); });
    c.addEventListener('input', function () { if (c.getAttribute('aria-invalid') === 'true') mostrar(c, erroDe(c)); });
    c.addEventListener('change', function () { if (c.getAttribute('aria-invalid') === 'true') mostrar(c, erroDe(c)); });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var primeiro = null;
    form.querySelectorAll('[required]').forEach(function (c) {
      var m = erroDe(c); mostrar(c, m);
      if (m && !primeiro) primeiro = c;
    });
    if (primeiro) { primeiro.focus(); return; }

    var f = form.elements;
    var fd = new FormData(form);
    fd.append('pagina', location.pathname);
    Object.keys(UTM).forEach(function (k) { fd.append(k, UTM[k]); });

    // Honeypot: robô preencheu o campo escondido. Finge que deu certo e não envia.
    if (f.site && f.site.value) { location.href = RAIZ + 'obrigado/index.html?tipo=' + tipo; return; }

    var linhas = tipo === 'b2b'
      ? ['Olá! Pedido de orçamento (empresa/condomínio) pelo site.', 'Nome: ' + f.nome.value.trim(), 'Cargo: ' + f.cargo.value, 'Empresa/condomínio: ' + f.empresa.value.trim(), 'WhatsApp: ' + f.whats.value.trim(), 'Cidade/bairro: ' + f.cidade.value.trim(), 'Serviço: ' + f.servico.value]
      : ['Olá! Pedido de orçamento pelo site.', 'Nome: ' + f.nome.value.trim(), 'WhatsApp: ' + f.whats.value.trim(), 'Imóvel: ' + f.tipo.value];
    if (f.desc && f.desc.value.trim()) linhas.push((tipo === 'b2b' ? 'Mensagem: ' : 'O que aconteceu: ') + f.desc.value.trim());
    var textoWhats = linhas.join('\n');

    var btn = form.querySelector('button[type="submit"]');
    btn.disabled = true;
    if (status) status.textContent = 'Enviando...';
    track('form_submit', { tipo: tipo, tipo_imovel: f.tipo ? f.tipo.value : 'b2b' });

    function plantaoWhats() {
      // Sem servidor de e-mail (ex.: GitHub ou PHP ainda sem e-mail configurado):
      // leva o visitante ao /obrigado com o botão para mandar os dados pelo WhatsApp.
      try { sessionStorage.setItem('ci9_lead_whats', textoWhats); } catch (er) {}
      location.href = RAIZ + 'obrigado/index.html?tipo=' + tipo + '&via=whatsapp';
    }

    fetch(RAIZ + CONFIG.formEndpoint, { method: 'POST', body: fd, headers: { 'Accept': 'application/json' } })
      .then(function (r) { return r.ok ? r.json() : Promise.reject(r.status); })
      .then(function (j) {
        if (!j || !j.ok) return Promise.reject('falhou');
        try { sessionStorage.setItem('ci9_lead', tipo); } catch (er) {}
        location.href = RAIZ + 'obrigado/index.html?tipo=' + tipo;
      })
      .catch(plantaoWhats);
  });
}

/* ---------- /obrigado: conversão só aqui ---------- */
function paginaObrigado() {
  var q = new URLSearchParams(location.search);
  var tipo = q.get('tipo') === 'b2b' ? 'b2b' : 'residencial';
  var viaWhats = q.get('via') === 'whatsapp';
  var lead = null, texto = null;
  try { lead = sessionStorage.getItem('ci9_lead'); texto = sessionStorage.getItem('ci9_lead_whats'); } catch (e) {}

  if (viaWhats && texto) {
    // O pedido ainda não chegou: o botão principal manda os dados pelo WhatsApp.
    var bloco = document.getElementById('via-whats');
    var a = document.getElementById('enviar-dados');
    if (bloco && a) {
      bloco.hidden = false;
      a.href = linkWhats(texto);
      a.addEventListener('click', function () {
        track('whatsapp_click', { origem: 'obrigado-formulario' });
        track('generate_lead', { tipo: tipo, via: 'whatsapp' });
        try { sessionStorage.removeItem('ci9_lead_whats'); } catch (e) {}
      });
      var normal = document.getElementById('via-email');
      if (normal) normal.hidden = true;
      var tit = document.getElementById('ob-titulo');
      if (tit) tit.textContent = 'Falta um toque.';
    }
  } else if (lead) {
    // Envio por e-mail confirmado: dispara a conversão uma única vez.
    track('generate_lead', { tipo: tipo, via: 'formulario' });
    try { sessionStorage.removeItem('ci9_lead'); } catch (e) {}
  }
}
