/* =========================================================
   app.js — Comportamiento global
   ========================================================= */

// Helpers
const $ = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => Array.from(r.querySelectorAll(s));

// ---------- Menú móvil (hamburguesa) ----------
(() => {
  const btn = document.querySelector('.nav-toggle');
  const nav = document.querySelector('#mainnav');
  if (!btn || !nav) return;

  btn.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    btn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  // cerrar menú al hacer clic en un enlace
  nav.addEventListener('click', (e) => {
    if (e.target.matches('a')) {
      nav.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }
  });
})();

// ---------- Volver arriba + Toast (se crean si no existen) ----------
(() => {
  if (!$('#backtop')) {
    const b = document.createElement('button');
    b.id = 'backtop'; b.setAttribute('aria-label','Volver arriba'); b.textContent = '↑';
    document.body.appendChild(b);
  }
  if (!$('#toast')) {
    const t = document.createElement('div');
    t.id = 'toast'; t.className = 'toast'; t.textContent = '¡Acción realizada con éxito!';
    document.body.appendChild(t);
  }

  const back = $('#backtop');
  const toggleBack = () => { back.style.display = window.scrollY > 500 ? 'block' : 'none'; };
  window.addEventListener('scroll', toggleBack); toggleBack();
  back.addEventListener('click', () => window.scrollTo({ top:0, behavior:'smooth' }));
})();

// ---------- Animaciones on-scroll ----------
(() => {
  const els = $$('.card, .section, .product');
  if (!els.length) return;
  els.forEach(el => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e => e.target.classList.toggle('is-visible', e.isIntersecting));
  }, { threshold: .12 });
  els.forEach(el => io.observe(el));
})();

// ---------- Filtro / Orden en GRID ----------
(() => {
  const grid = $('.grid');
  const q = $('#q');
  const brand = $('#brand');
  const sort = $('#sort');
  if (!grid || (!q && !brand && !sort)) return;

  const items = Array.from(grid.children);
  function apply() {
    const text = (q?.value || '').toLowerCase();
    const b = brand?.value || '';
    let res = items.filter(card => {
      const name = (card.dataset.name || '').toLowerCase();
      const br = card.dataset.brand || '';
      return (!text || name.includes(text)) && (!b || br === b);
    });
    const s = sort?.value;
    if (s === 'price-asc') res.sort((a,b)=> (+a.dataset.price) - (+b.dataset.price));
    if (s === 'price-desc') res.sort((a,b)=> (+b.dataset.price) - (+a.dataset.price));
    grid.innerHTML = ''; res.forEach(el => grid.appendChild(el));
  }
  [q,brand,sort].forEach(el => el?.addEventListener('input', apply));
  apply();
})();

// ---------- Filtro / Orden en TABLA ----------
(() => {
  const table = document.querySelector('table.products');
  const q = document.querySelector('#q-table');
  const brand = document.querySelector('#brand-table');
  const sort = document.querySelector('#sort-table');
  if (!table) return;

  const tbody = table.tBodies[0];
  const rows = Array.from(tbody.rows);

  function apply() {
    const text = (q?.value || '').toLowerCase();
    const b = (brand?.value || '').toLowerCase();

    let res = rows.filter(tr => {
      const name = (tr.dataset.name || '').toLowerCase();
      const br = (tr.dataset.brand || '').toLowerCase();
      return (
        (!text || name.includes(text) || br.includes(text)) &&
        (!b || br === b)
      );
    });

    const s = sort?.value;
    if (s === 'price-asc')  res.sort((a, b) => (+a.dataset.price) - (+b.dataset.price));
    if (s === 'price-desc') res.sort((a, b) => (+b.dataset.price) - (+a.dataset.price));

    tbody.innerHTML = '';
    res.forEach(r => tbody.appendChild(r));
  }

  q?.addEventListener('input', apply);
  brand?.addEventListener('change', apply);
  sort?.addEventListener('change', apply);

  apply();
})();



// ---------- Favoritos (localStorage) en GRID ----------
(() => {
  const grid = $('.grid'); if (!grid) return;
  const KEY = 'favorites';
  const load = () => JSON.parse(localStorage.getItem(KEY) || '[]');
  const save = (arr) => localStorage.setItem(KEY, JSON.stringify(arr));

  // Inyectar botón "⭐ Favorito" si no existe
  $$('.card', grid).forEach(card => {
    const name = card.dataset.name;
    if (!name) return;
    let container = card.querySelector('.actions');
    if (!container) return;

    let btn = card.querySelector('.fav-btn');
    if (!btn) {
      btn = document.createElement('button');
      btn.className = 'fav-btn';
      btn.type = 'button';
      btn.textContent = '⭐ Favorito';
      container.appendChild(btn);
    }

    // Estado inicial
    const favs = load();
    if (favs.includes(name)) btn.classList.add('is-active');

    btn.addEventListener('click', () => {
      let favs2 = load();
      if (favs2.includes(name)) {
        favs2 = favs2.filter(n => n !== name);
        btn.classList.remove('is-active');
      } else {
        favs2.push(name);
        btn.classList.add('is-active');
      }
      save(favs2);
      const toast = $('#toast');
      if (toast) {
        toast.textContent = btn.classList.contains('is-active') ?
          `Añadido a favoritos: ${name}` : `Quitado de favoritos: ${name}`;
        toast.classList.add('show'); setTimeout(()=>toast.classList.remove('show'), 1800);
      }
    });
  });
})();

// ---------- Pasar datos de FICHA -> COMPRAR ----------
(() => {
  // En ficha: capturamos datos al clickear "Comprar"
  const buyLinks = $$('a.buy-link, .actions .link[href$="comprar.html"], .meta a[href$="comprar.html"]');
  if (buyLinks.length) {
    const title = $('main h2')?.textContent?.trim() || '';
    const price = $('.price')?.textContent?.replace(/[^\d]/g,'') || '';
    const img = $('.gallery img')?.getAttribute('src') || '';
    buyLinks.forEach(a => a.addEventListener('click', () => {
      localStorage.setItem('selectedCar', JSON.stringify({ title, price, img }));
    }));
  }

  // En comprar: mostramos lo guardado
  if (location.pathname.endsWith('comprar.html')) {
    const data = JSON.parse(localStorage.getItem('selectedCar') || 'null');
    if (data) {
      const t = $('#car-title'); const p = $('#car-price'); const i = $('#car-preview');
      if (t) t.textContent = data.title;
      if (p && data.price) p.textContent = 'USD ' + Number(data.price).toLocaleString('es-AR');
      if (i && data.img) { i.src = data.img; i.style.display = 'block'; i.alt = data.title || ''; }
      // si existe select de autos, intentar seleccionar
      const sel = $('#auto-select');
      if (sel) {
        const opt = Array.from(sel.options).find(o => (o.textContent||'').trim() === data.title);
        if (opt) { sel.value = opt.value; sel.disabled = true; }
      }
    }
  }
})();

// ---------- Validación de COMPRA ----------
(() => {
  const form = $('#purchase-form'); if (!form) return;
  const toast = $('#toast');

  form.addEventListener('submit', (e) => {
    e.preventDefault();

    // campos requeridos
    const required = form.querySelectorAll('[required]');
    const invalid = Array.from(required).find(i => !i.value.trim());
    if (invalid) { invalid.focus(); return; }

    // correo básico
    const email = form.querySelector('input[type="email"]');
    if (email && !/^\S+@\S+\.\S+$/.test(email.value)) { email.focus(); return; }

    // mostrar éxito
    if (toast) {
      toast.textContent = '¡Compra realizada con éxito!';
      toast.classList.add('show');
      setTimeout(()=> toast.classList.remove('show'), 2200);
    }

    // bloquear edición tras compra
    form.querySelectorAll('input,select,button,textarea').forEach(el => el.disabled = true);
  });
})();
