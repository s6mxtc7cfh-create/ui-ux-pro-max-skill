/* CapoVerso ETS — interazioni e animazioni
   GSAP 3.13 (ScrollTrigger, SplitText, Flip) self-hosted. Ogni effetto ha
   un fallback senza GSAP e rispetta prefers-reduced-motion. */
(function () {
  'use strict';

  var root = document.documentElement;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var mqReduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var reduce = mqReduce.matches;
  var finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var G = window.gsap;
  var hasST = !!(G && window.ScrollTrigger);
  if (hasST) G.registerPlugin(window.ScrollTrigger);
  if (G && window.SplitText) G.registerPlugin(window.SplitText);
  if (G && window.Flip) G.registerPlugin(window.Flip);

  function store(key, val) {
    try { if (val === undefined) return localStorage.getItem(key); localStorage.setItem(key, val); } catch (e) { return null; }
    return null;
  }

  /* ---------- Toast ---------- */
  var toastEl = $('.toast'), toastTimer;
  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.classList.add('is-on');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-on'); }, 3500);
  }

  /* ---------- Tema chiaro / scuro ---------- */
  var themeBtn = $('.theme-toggle');
  function syncThemeBtn() {
    var dark = root.getAttribute('data-theme') === 'dark';
    themeBtn.setAttribute('aria-pressed', String(dark));
    themeBtn.setAttribute('aria-label', dark ? 'Attiva tema chiaro' : 'Attiva tema scuro');
    var meta = $('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#070B24' : '#1A3399');
  }
  themeBtn.addEventListener('click', function () {
    var next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    store('cv-theme', next);
    syncThemeBtn();
  });
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', function (e) {
    if (!store('cv-theme')) { root.setAttribute('data-theme', e.matches ? 'dark' : 'light'); syncThemeBtn(); }
  });
  syncThemeBtn();

  /* ---------- Header: scroll, nascondi/mostra, link attivo ---------- */
  var nav = $('.nav'), bar = $('.progress span'), lastY = window.scrollY, ticking = false;
  function onScroll() {
    var y = window.scrollY;
    nav.classList.toggle('is-scrolled', y > 20);
    var menuOpen = document.body.classList.contains('menu-open');
    if (!menuOpen) nav.classList.toggle('is-hidden', y > 400 && y > lastY + 4);
    if (y < lastY - 4) nav.classList.remove('is-hidden');
    lastY = y;
    var max = document.documentElement.scrollHeight - window.innerHeight;
    bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(y / max, 1) : 0) + ')';
    ticking = false;
  }
  window.addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(onScroll); ticking = true; } }, { passive: true });
  onScroll();
  nav.addEventListener('focusin', function () { nav.classList.remove('is-hidden'); });

  var navLinks = $$('.nav__links a');
  if ('IntersectionObserver' in window) {
    var secObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        navLinks.forEach(function (a) {
          var on = a.getAttribute('href') === '#' + en.target.id;
          a.classList.toggle('is-active', on);
          if (on) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    navLinks.forEach(function (a) { var s = $(a.getAttribute('href')); if (s) secObs.observe(s); });
  }

  /* ---------- Menu mobile ---------- */
  var menuBtn = $('.menu-toggle'), menu = $('#mobile-menu');
  function setMenu(open) {
    menuBtn.setAttribute('aria-expanded', String(open));
    menuBtn.setAttribute('aria-label', open ? 'Chiudi il menu' : 'Apri il menu');
    $('use', menuBtn).setAttribute('href', open ? '#i-x' : '#i-menu');
    document.body.classList.toggle('menu-open', open);
    if (open) {
      menu.hidden = false;
      nav.classList.remove('is-hidden');
      if (G && !reduce) {
        G.fromTo(menu, { clipPath: 'circle(0% at 92% 4%)' }, { clipPath: 'circle(150% at 92% 4%)', duration: .6, ease: 'expo.out' });
        G.from($$('a', menu), { y: 40, opacity: 0, duration: .5, stagger: .05, ease: 'expo.out', delay: .1 });
      }
      $('a', menu).focus();
    } else {
      menu.hidden = true;
    }
  }
  menuBtn.addEventListener('click', function () { setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'); });
  menu.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && document.body.classList.contains('menu-open')) { setMenu(false); menuBtn.focus(); }
  });
  window.addEventListener('resize', function () { if (window.innerWidth >= 1024 && document.body.classList.contains('menu-open')) setMenu(false); });

  /* ---------- Reveal on scroll (con stagger tra fratelli) ---------- */
  var reveals = $$('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('is-in'); });
  } else {
    var revObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (!en.isIntersecting) return;
        var el = en.target;
        var sibs = $$(':scope > .reveal', el.parentElement);
        var i = Math.max(0, sibs.indexOf(el));
        el.style.transitionDelay = (Math.min(i, 6) * 80) + 'ms';
        el.classList.add('is-in');
        revObs.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .12 });
    reveals.forEach(function (el) { revObs.observe(el); });
  }

  /* ---------- Contatori ---------- */
  var fmt = new Intl.NumberFormat('it-IT');
  function countUp(el) {
    var to = +el.dataset.to, start = null, dur = 1600;
    if (reduce) { el.textContent = fmt.format(to); return; }
    function step(t) {
      if (!start) start = t;
      var p = Math.min((t - start) / dur, 1);
      var e = 1 - Math.pow(1 - p, 4);
      el.textContent = fmt.format(Math.round(to * e));
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var counters = $$('.count');
  counters.forEach(function (el) { el.textContent = reduce ? fmt.format(+el.dataset.to) : '0'; });
  if ('IntersectionObserver' in window) {
    var cObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { countUp(en.target); cObs.unobserve(en.target); } });
    }, { threshold: .6 });
    counters.forEach(function (el) { cObs.observe(el); });
  } else counters.forEach(countUp);

  /* ---------- Parola che ruota nell'hero ---------- */
  var rot = $('.rotator');
  if (rot && !reduce) {
    var words = rot.dataset.words.split('|'), wi = 0, wordEl = $('.rotator__word', rot);
    var colors = ['var(--coral)', 'var(--sun)', 'var(--sky)', 'var(--lime)'];
    setInterval(function () {
      if (document.hidden) return;
      wi = (wi + 1) % words.length;
      var swap = function () { wordEl.textContent = words[wi]; wordEl.style.background = colors[wi % colors.length]; };
      if (G) {
        G.to(wordEl, { yPercent: -110, opacity: 0, duration: .3, ease: 'power2.in', onComplete: function () {
          swap(); G.fromTo(wordEl, { yPercent: 110, opacity: 0, rotation: 6 }, { yPercent: 0, opacity: 1, rotation: -2, duration: .5, ease: 'back.out(2)' });
        } });
      } else swap();
    }, 2400);
  }

  /* ---------- Foto "sticker" trascinabili ---------- */
  var stickers = $$('.sticker');
  var stState = stickers.map(function (el) { return { x: 0, y: 0, r: +el.dataset.r || 0 }; });
  function applySticker(i, animate) {
    var el = stickers[i], s = stState[i];
    if (G) G.to(el, { x: s.x, y: s.y, rotation: s.r, duration: animate ? .7 : 0, ease: 'elastic.out(1, .6)' });
    else el.style.transform = 'translate(' + s.x + 'px,' + s.y + 'px) rotate(' + s.r + 'deg)';
  }
  stickers.forEach(function (el, i) {
    el.style.transform = 'none';
    if (G) G.set(el, { rotation: stState[i].r }); else applySticker(i);
    var sx, sy, ox, oy, dragging = false, z = 3;
    el.addEventListener('pointerdown', function (e) {
      if (e.pointerType === 'touch') return; // sui touch lasciamo lo scroll della pagina
      dragging = true; el.setPointerCapture(e.pointerId);
      sx = e.clientX; sy = e.clientY; ox = stState[i].x; oy = stState[i].y;
      stickers.forEach(function (o) { o.style.zIndex = 1; });
      el.style.zIndex = z; el.classList.add('is-dragging');
      if (G) G.to(el, { scale: 1.05, duration: .2 });
    });
    el.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      stState[i].x = ox + (e.clientX - sx); stState[i].y = oy + (e.clientY - sy);
      stState[i].r = (+el.dataset.r || 0) + (e.clientX - sx) * .03;
      if (G) G.set(el, { x: stState[i].x, y: stState[i].y, rotation: stState[i].r }); else applySticker(i);
    });
    function end() { if (!dragging) return; dragging = false; el.classList.remove('is-dragging'); if (G) G.to(el, { scale: 1, duration: .4, ease: 'back.out(3)' }); }
    el.addEventListener('pointerup', end); el.addEventListener('pointercancel', end);
  });
  var shuffleBtn = $('.shuffle');
  if (shuffleBtn) shuffleBtn.addEventListener('click', function () {
    var order = stickers.map(function (_, i) { return i; }).sort(function () { return Math.random() - .5; });
    stickers.forEach(function (el, i) {
      stState[i] = { x: Math.round((Math.random() - .5) * 60), y: Math.round((Math.random() - .5) * 50), r: Math.round((Math.random() - .5) * 18) };
      el.style.zIndex = order[i] + 1;
      applySticker(i, !reduce);
    });
  });

  /* ---------- Bottoni magnetici ---------- */
  if (finePointer && !reduce) {
    $$('.magnetic').forEach(function (b) {
      b.addEventListener('pointermove', function (e) {
        var r = b.getBoundingClientRect();
        var dx = (e.clientX - r.left - r.width / 2) * .22, dy = (e.clientY - r.top - r.height / 2) * .3;
        b.style.translate = dx.toFixed(1) + 'px ' + dy.toFixed(1) + 'px';
      });
      b.addEventListener('pointerleave', function () { b.style.translate = '0px 0px'; });
    });
  }

  /* ---------- Spotlight sulle card dei valori ---------- */
  if (finePointer) {
    $$('.value').forEach(function (v) {
      v.addEventListener('pointermove', function (e) {
        var r = v.getBoundingClientRect();
        v.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        v.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  }

  /* ---------- Manifesto: parole che si accendono scorrendo ---------- */
  var manifesto = $('.manifesto');
  function wrapWords(node) {
    Array.prototype.slice.call(node.childNodes).forEach(function (n) {
      if (n.nodeType === 3) {
        var frag = document.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach(function (part) {
          if (!part) return;
          if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
          else { var s = document.createElement('span'); s.className = 'word'; s.textContent = part; frag.appendChild(s); }
        });
        node.replaceChild(frag, n);
      } else if (n.nodeType === 1) wrapWords(n);
    });
  }
  if (manifesto && hasST && !reduce) {
    wrapWords(manifesto);
    G.to($$('.word', manifesto), {
      opacity: 1, stagger: .1, ease: 'none',
      scrollTrigger: { trigger: manifesto, start: 'top 80%', end: 'bottom 45%', scrub: .6 }
    });
  }

  /* ---------- Filtri progetti + Flip ---------- */
  var chips = $$('.chip'), cards = $$('.bento .card'), status = $('.filter-status');
  chips.forEach(function (chip) {
    chip.addEventListener('click', function () {
      var f = chip.dataset.filter;
      chips.forEach(function (c) { var on = c === chip; c.classList.toggle('is-active', on); c.setAttribute('aria-pressed', String(on)); });
      var state = (window.Flip && !reduce) ? window.Flip.getState(cards) : null;
      var shown = 0;
      cards.forEach(function (card) {
        var match = f === 'all' || card.dataset.cats.split(' ').indexOf(f) > -1;
        card.style.display = match ? '' : 'none';
        if (match && !card.classList.contains('card--idea')) shown++;
      });
      status.textContent = shown + (shown === 1 ? ' progetto mostrato' : ' progetti mostrati');
      if (state) {
        window.Flip.from(state, {
          duration: .6, ease: 'expo.inOut', absolute: true, scale: true,
          onEnter: function (els) { return G.fromTo(els, { opacity: 0, scale: .85 }, { opacity: 1, scale: 1, duration: .5, ease: 'back.out(1.6)' }); },
          onLeave: function (els) { return G.to(els, { opacity: 0, scale: .85, duration: .3 }); }
        });
      }
      if (hasST) setTimeout(function () { window.ScrollTrigger.refresh(); }, 650);
    });
  });

  /* ---------- Modale progetti ---------- */
  var modal = $('#project-modal'), modalContent = $('.modal__content', modal);
  function closeModal() { if (modal.open) modal.close(); }
  $$('[data-project]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var tpl = document.getElementById('p-' + btn.dataset.project);
      if (!tpl) return;
      modalContent.innerHTML = '';
      modalContent.appendChild(tpl.content.cloneNode(true));
      if (typeof modal.showModal === 'function') modal.showModal(); else modal.setAttribute('open', '');
      document.body.classList.add('modal-open');
      $('.modal__inner', modal).scrollTop = 0;
    });
  });
  $('.modal__close', modal).addEventListener('click', closeModal);
  modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
    if (e.target.closest('a[href^="#"]')) closeModal();
  });
  modal.addEventListener('close', function () { document.body.classList.remove('modal-open'); });

  /* ---------- Link che pre-compilano l'oggetto del form ---------- */
  var subjectSel = $('#f-oggetto');
  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-subject]');
    if (!a) return;
    subjectSel.value = a.dataset.subject;
    validateField(subjectSel.closest('.field'));
    var f = subjectSel.closest('.field');
    f.classList.remove('flash'); void f.offsetWidth; f.classList.add('flash');
  });

  /* ---------- Young Side: tabs delle fasi ---------- */
  var tabs = $$('.phases [role="tab"]'), phaseBar = $('.phases__bar span');
  function selectTab(i, focus) {
    tabs.forEach(function (t, j) {
      var on = i === j, panel = document.getElementById(t.getAttribute('aria-controls'));
      t.setAttribute('aria-selected', String(on)); t.tabIndex = on ? 0 : -1; panel.hidden = !on;
      if (on && G && !reduce) G.from(panel.children, { y: 16, opacity: 0, duration: .45, stagger: .06, ease: 'expo.out' });
    });
    phaseBar.style.transform = 'translateX(' + (i * 100) + '%)';
    if (focus) tabs[i].focus();
  }
  tabs.forEach(function (t, i) {
    t.addEventListener('click', function () { selectTab(i); });
    t.addEventListener('keydown', function (e) {
      var n = tabs.length, k = e.key, to = null;
      if (k === 'ArrowRight') to = (i + 1) % n; else if (k === 'ArrowLeft') to = (i - 1 + n) % n;
      else if (k === 'Home') to = 0; else if (k === 'End') to = n - 1;
      if (to !== null) { e.preventDefault(); selectTab(to, true); }
    });
  });

  /* ---------- Quiz ---------- */
  var quiz = $('.quiz__card');
  if (quiz) {
    var PROFILES = {
      socio: { name: "Cuore dell'associazione", desc: "Vuoi esserci con continuità e avere voce nelle decisioni. Diventare socio è la tua strada: assemblee, gruppi di lavoro e progetti dal primo giorno.", subject: 'Richiesta iscrizione socio', cta: 'Diventa socio' },
      idea: { name: 'Mente creativa', desc: "Hai idee che chiedono spazio. Raccontacele: le migliori iniziative di CapoVerso nascono proprio così, da chi vive il territorio.", subject: "Proposta di un'idea", cta: 'Proponi la tua idea' },
      volontario: { name: 'Forza in campo', desc: "Sei la persona che fa succedere le cose: allestimenti, foto, social, accoglienza. Dai la tua disponibilità come volontario per i prossimi eventi.", subject: 'Disponibilità volontariato', cta: 'Offri il tuo tempo' },
      partner: { name: 'Ponte col territorio', desc: "Conosci le persone giuste e sai unire mondi diversi. Costruiamo insieme una collaborazione con la tua scuola, azienda o ente.", subject: 'Proposta di partnership', cta: 'Costruiamo insieme' }
    };
    var steps = $$('.q', quiz), qStep = 0;
    var nextB = $('.quiz__next', quiz), backB = $('.quiz__back', quiz), navQ = $('.quiz__nav', quiz);
    var label = $('.quiz__step-label', quiz), prog = $('.quiz__progress span', quiz), result = $('.quiz__result', quiz);
    function answered(i) { return !!$('input:checked', steps[i]); }
    function show(i) {
      steps.forEach(function (s, j) { s.hidden = i !== j; });
      qStep = i;
      label.textContent = 'Domanda ' + (i + 1) + ' di ' + steps.length;
      prog.style.width = ((i + 1) / steps.length * 100) + '%';
      backB.disabled = i === 0;
      nextB.disabled = !answered(i);
      nextB.firstChild.textContent = i === steps.length - 1 ? 'Scopri il risultato ' : 'Avanti ';
      if (G && !reduce) G.from(steps[i].querySelectorAll('legend, .opt'), { x: 30, opacity: 0, duration: .4, stagger: .05, ease: 'expo.out' });
    }
    quiz.addEventListener('change', function () { nextB.disabled = !answered(qStep); });
    backB.addEventListener('click', function () { if (qStep > 0) show(qStep - 1); });
    nextB.addEventListener('click', function () {
      if (!answered(qStep)) return;
      if (qStep < steps.length - 1) { show(qStep + 1); $('legend', steps[qStep]).setAttribute('tabindex', '-1'); $('legend', steps[qStep]).focus(); return; }
      var score = {}, first = $('input:checked', steps[0]).value;
      steps.forEach(function (s) { var v = $('input:checked', s).value; score[v] = (score[v] || 0) + 1; });
      var best = first;
      Object.keys(score).forEach(function (k) { if (score[k] > score[best]) best = k; });
      var p = PROFILES[best];
      steps.forEach(function (s) { s.hidden = true; });
      navQ.hidden = true;
      label.textContent = 'Risultato';
      prog.style.width = '100%';
      $('.quiz__name', result).textContent = p.name;
      $('.quiz__desc', result).textContent = p.desc;
      var cta = $('.quiz__cta', result);
      cta.dataset.subject = p.subject;
      cta.firstChild.textContent = p.cta + ' ';
      result.hidden = false;
      result.focus();
      if (G && !reduce) {
        G.from(result.children, { y: 24, opacity: 0, duration: .6, stagger: .08, ease: 'expo.out' });
        G.fromTo($('.quiz__icon', result), { rotation: -180, scale: 0 }, { rotation: 0, scale: 1, duration: .8, ease: 'back.out(2)' });
      }
    });
    $('.quiz__restart', quiz).addEventListener('click', function () {
      quiz.reset(); result.hidden = true; navQ.hidden = false; show(0); $('input', steps[0]).focus();
    });
    show(0);
  }

  /* ---------- Marquee pausa ---------- */
  var mq = $('.marquee'), mqBtn = $('.marquee__toggle');
  if (mqBtn) mqBtn.addEventListener('click', function () {
    var paused = mq.classList.toggle('is-paused');
    mqBtn.setAttribute('aria-pressed', String(paused));
    mqBtn.setAttribute('aria-label', paused ? 'Riprendi lo scorrimento' : 'Metti in pausa lo scorrimento');
  });

  /* ---------- IBAN ---------- */
  var ibanEl = $('.iban'), copyBtn = $('.copy-iban');
  if (ibanEl && ibanEl.dataset.iban) {
    ibanEl.textContent = ibanEl.dataset.iban;
    copyBtn.disabled = false;
    copyBtn.addEventListener('click', function () {
      var txt = ibanEl.dataset.iban.replace(/\s+/g, '');
      var done = function () {
        toast('IBAN copiato negli appunti');
        $('use', copyBtn).setAttribute('href', '#i-check'); $('span', copyBtn).textContent = 'Copiato!';
        setTimeout(function () { $('use', copyBtn).setAttribute('href', '#i-copy'); $('span', copyBtn).textContent = 'Copia IBAN'; }, 2200);
      };
      if (navigator.clipboard) navigator.clipboard.writeText(txt).then(done, function () { toast('Copia non riuscita: seleziona il testo a mano'); });
      else toast('Copia non disponibile: seleziona il testo a mano');
    });
  }

  /* ---------- Form contatti ---------- */
  var form = $('#contact-form');
  var capA, capB;
  function newCaptcha() {
    capA = 1 + Math.floor(Math.random() * 9); capB = 1 + Math.floor(Math.random() * 9);
    $('.cap-a', form).textContent = capA; $('.cap-b', form).textContent = capB;
    $('#f-captcha').value = '';
  }
  function validateField(field) {
    if (!field) return true;
    var input = $('input, select, textarea', field), ok;
    if (input.type === 'checkbox') ok = input.checked;
    else if (input.name === 'captcha') ok = parseInt(input.value, 10) === capA + capB;
    else if (input.type === 'email') ok = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(input.value.trim());
    else ok = input.value.trim().length > 0;
    field.classList.toggle('is-invalid', !ok);
    field.classList.toggle('is-valid', ok && input.type !== 'checkbox');
    input.setAttribute('aria-invalid', String(!ok));
    return ok;
  }
  if (form) {
    newCaptcha();
    $('.cap-refresh', form).addEventListener('click', function () { newCaptcha(); $('#f-captcha').focus(); });
    $$('.field', form).forEach(function (f) {
      var input = $('input, select, textarea', f);
      input.addEventListener('blur', function () { if (input.value || f.classList.contains('is-invalid')) validateField(f); });
      input.addEventListener('input', function () { if (f.classList.contains('is-invalid')) validateField(f); });
      input.addEventListener('change', function () { if (input.type === 'checkbox' || input.tagName === 'SELECT') validateField(f); });
    });
    var msg = $('#f-msg'), cc = $('.count-chars', form);
    msg.addEventListener('input', function () { cc.textContent = msg.value.length; });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var fields = $$('.field', form), firstBad = null;
      fields.forEach(function (f) { if (!validateField(f) && !firstBad) firstBad = f; });
      var st = $('.form__status', form);
      if (firstBad) {
        st.textContent = 'Controlla i campi evidenziati.';
        $('input, select, textarea', firstBad).focus();
        if (G && !reduce) G.fromTo(form, { x: -8 }, { x: 0, duration: .5, ease: 'elastic.out(1, .3)' });
        return;
      }
      var d = new FormData(form);
      var body = 'Nome: ' + d.get('nome') + ' ' + d.get('cognome') + '\nEmail: ' + d.get('email') + '\n\n' + d.get('messaggio');
      var href = 'mailto:versocapo@gmail.com?subject=' + encodeURIComponent('[Sito] ' + d.get('oggetto')) + '&body=' + encodeURIComponent(body);
      st.textContent = 'Si sta aprendo il tuo programma di posta con il messaggio pronto: premi Invia per spedirlo.';
      window.location.href = href;
    });
  }

  /* ---------- Cookie notice ---------- */
  var cookie = $('.cookie');
  if (cookie && store('cv-cookie') !== '1') {
    cookie.hidden = false;
    $('button', cookie).addEventListener('click', function () { store('cv-cookie', '1'); cookie.hidden = true; });
  }

  var yr = $('.year'); if (yr) yr.textContent = new Date().getFullYear();

  /* =========================================================
     Coreografie GSAP (solo se disponibile e senza reduced-motion)
     ========================================================= */
  if (!G || reduce) return;

  // Hero: titolo carattere per carattere, poi il resto (dopo il caricamento dei font)
  G.set('.hero__copy, .hero__art', { autoAlpha: 0 });
  var introDone = false;
  function heroIntro() {
    if (introDone) return;
    introDone = true;
    G.set('.hero__copy, .hero__art', { autoAlpha: 1 });
    var tl = G.timeline({ defaults: { ease: 'expo.out' } });
    if (window.SplitText) {
      var split = new window.SplitText('.hero__title .line', { type: 'chars' });
      tl.from(split.chars, { yPercent: 70, opacity: 0, rotate: 10, duration: .9, stagger: .022 }, .1);
    } else {
      tl.from('.hero__title .line', { y: 40, opacity: 0, duration: .8, stagger: .1 }, .1);
    }
    tl.from('.eyebrow', { y: -20, opacity: 0, duration: .6 }, 0)
    .from('.hero__rotator, .hero__lead', { y: 24, opacity: 0, duration: .7, stagger: .08 }, .55)
    .from('.hero__ctas .btn', { y: 24, opacity: 0, duration: .6, stagger: .08 }, .7)
    .from('.sticker', { y: 120, opacity: 0, scale: .7, duration: 1, stagger: .12, ease: 'back.out(1.4)' }, .35)
    .from('.badge-ring', { scale: 0, rotation: -120, duration: 1, ease: 'back.out(1.6)' }, .8)
    .from('.shuffle, .scroll-cue', { opacity: 0, duration: .5 }, 1.2);
  }
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(heroIntro);
  else heroIntro();
  setTimeout(heroIntro, 1200); // rete lenta: non tenere l'hero invisibile

  if (!hasST) return;
  var ST = window.ScrollTrigger;

  // Parallax morbido sui blob e sulle foto
  G.to('.blob--1', { yPercent: 30, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  G.to('.blob--2', { yPercent: -40, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  G.to('.stickers', { yPercent: -12, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
  G.to('.badge-ring img', { rotation: 360, ease: 'none', scrollTrigger: { trigger: 'body', start: 'top top', end: 'bottom bottom', scrub: 1 } });

  // Titolo Young Side
  G.from('.ys__title', { yPercent: 40, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.ys', start: 'top 70%' } });
  G.from('.phases', { y: 60, rotation: 2, opacity: 0, duration: 1, ease: 'expo.out', scrollTrigger: { trigger: '.ys', start: 'top 60%' } });

  // Footer: wordmark che sale
  G.from('.footer__big', { yPercent: 60, opacity: 0, duration: 1.2, ease: 'expo.out', scrollTrigger: { trigger: '.footer', start: 'top 85%' } });

  // Timeline orizzontale su desktop
  var mm = G.matchMedia();
  mm.add('(min-width: 1024px)', function () {
    var story = $('.story'), track = $('.timeline');
    story.classList.add('is-horizontal');
    var dist = function () { return Math.max(0, track.scrollWidth - window.innerWidth + track.getBoundingClientRect().left); };
    var tween = G.to(track, {
      x: function () { return -dist(); }, ease: 'none',
      scrollTrigger: { trigger: story, start: 'top top', end: function () { return '+=' + dist(); }, pin: true, scrub: .8, invalidateOnRefresh: true, anticipatePin: 1 }
    });
    ST.refresh();
    return function () { story.classList.remove('is-horizontal'); tween.kill(); G.set(track, { clearProps: 'x' }); };
  });

  window.addEventListener('load', function () { ST.refresh(); });
})();
