/* Site-wide client:
   - theme toggle (empty-space click)
   - pane navigation (index.html only, has .rail)
   - tweaks panel (font family, theme, grid density quick pick)
   - blog list + post page rendering helpers
   Settings persist in localStorage. */

(function () {
  const LS_THEME = 'ps.theme';     // 'dark' | 'light'
  const LS_FONT  = 'ps.font';      // 'geist' | 'jetbrains' | 'plex' | 'space'
  const LS_PANE  = 'ps.pane';      // '0' | '1' (index only)

  // ---------- THEME ----------
  function applyTheme(mode) {
    const html = document.documentElement;
    if (mode === 'light') html.classList.add('theme-light');
    else                  html.classList.remove('theme-light');
    localStorage.setItem(LS_THEME, mode);
    updateTweakActives();
  }
  function currentTheme() {
    return document.documentElement.classList.contains('theme-light') ? 'light' : 'dark';
  }
  function initTheme() {
    const saved = localStorage.getItem(LS_THEME) || 'dark';
    applyTheme(saved);
  }

  /* Empty-space click → toggle theme.
     Ignore clicks on anything interactive or textual content. */
  function isInteractive(el) {
    if (!el) return false;
    const sel = 'a, button, input, textarea, select, label, [role="button"], [data-no-toggle], .prose, .tweaks, .scroll-area, .post-page, .post-list';
    return !!el.closest(sel);
  }
  function installThemeClick() {
    document.addEventListener('dblclick', (e) => {
      if (isInteractive(e.target)) return;
      const sel = window.getSelection && window.getSelection();
      if (sel && sel.removeAllRanges) sel.removeAllRanges();
      applyTheme(currentTheme() === 'dark' ? 'light' : 'dark');
    });
  }

  // ---------- FONT ----------
  function applyFont(name) {
    document.documentElement.setAttribute('data-font', name);
    localStorage.setItem(LS_FONT, name);
    updateTweakActives();
  }
  function initFont() {
    const saved = localStorage.getItem(LS_FONT) || 'martian';
    applyFont(saved);
  }

  // ---------- PANE NAV + SCROLL HIJACK (index only) ----------
  const paneState = { panes: [], idx: 0, animating: false };

  function paneReducedMotion() {
    return window.matchMedia &&
           window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }

  function goToPane(n) {
    const { panes } = paneState;
    if (!panes.length) return;
    n = Math.max(0, Math.min(panes.length - 1, n));
    if (n === paneState.idx || paneState.animating) return;
    paneState.animating = true;
    const behavior = paneReducedMotion() ? 'auto' : 'smooth';
    panes[n].scrollIntoView({ behavior });
    paneState.idx = n;
    setTimeout(() => { paneState.animating = false; }, behavior === 'smooth' ? 720 : 40);
  }

  function installPaneNav() {
    document.querySelectorAll('[data-goto]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        goToPane(Number(btn.dataset.goto));
      });
    });

    if (!document.documentElement.hasAttribute('data-paginate')) return;

    paneState.panes = [...document.querySelectorAll('section[data-pane]')];
    if (paneState.panes.length < 2) return;

    const y = window.scrollY;
    paneState.idx = paneState.panes.reduce((best, el, i) => {
      const d = Math.abs(el.offsetTop - y);
      return d < best.d ? { i, d } : best;
    }, { i: 0, d: Infinity }).i;

    window.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (paneState.animating) return;
      if (Math.abs(e.deltaY) < 8) return;
      goToPane(paneState.idx + (e.deltaY > 0 ? 1 : -1));
    }, { passive: false });

    window.addEventListener('keydown', (e) => {
      if (e.target && e.target.closest && e.target.closest('input, textarea, [contenteditable]')) return;
      if (['ArrowDown', 'PageDown', ' '].includes(e.key)) {
        e.preventDefault();
        goToPane(paneState.idx + 1);
      } else if (['ArrowUp', 'PageUp'].includes(e.key)) {
        e.preventDefault();
        goToPane(paneState.idx - 1);
      } else if (e.key === 'Home') {
        e.preventDefault();
        goToPane(0);
      } else if (e.key === 'End') {
        e.preventDefault();
        goToPane(paneState.panes.length - 1);
      }
    });

    let touchStartY = null;
    window.addEventListener('touchstart', (e) => {
      touchStartY = e.touches[0].clientY;
    }, { passive: true });
    window.addEventListener('touchend', (e) => {
      if (touchStartY == null) return;
      const dy = e.changedTouches[0].clientY - touchStartY;
      touchStartY = null;
      if (Math.abs(dy) < 40) return;
      goToPane(paneState.idx + (dy < 0 ? 1 : -1));
    });
  }

  // ---------- TWEAKS PANEL ----------
  const TWEAK_HTML = `
    <div class="tw-title">
      <span>Tweaks</span>
      <button class="tw-close" data-no-toggle aria-label="Close">×</button>
    </div>
    <div class="tw-row">
      <span class="tw-label">Theme</span>
      <div class="tw-opts">
        <button class="tw-opt" data-no-toggle data-theme="dark">dark</button>
        <button class="tw-opt" data-no-toggle data-theme="light">light</button>
      </div>
    </div>
  `;

  function installTweaks() {
    const panel = document.createElement('div');
    panel.className = 'tweaks';
    panel.setAttribute('data-no-toggle', '');
    panel.innerHTML = TWEAK_HTML;
    document.body.appendChild(panel);

    panel.querySelector('.tw-close').addEventListener('click', () => {
      panel.classList.remove('open');
    });
    panel.querySelectorAll('[data-theme]').forEach(b => {
      b.addEventListener('click', () => applyTheme(b.dataset.theme));
    });
    panel.querySelectorAll('[data-font]').forEach(b => {
      b.addEventListener('click', () => applyFont(b.dataset.font));
    });

    // Edit-mode protocol
    window.addEventListener('message', (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === '__activate_edit_mode')   panel.classList.add('open');
      if (e.data.type === '__deactivate_edit_mode') panel.classList.remove('open');
    });
    try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch {}
  }

  function updateTweakActives() {
    const theme = currentTheme();
    const font  = document.documentElement.getAttribute('data-font') || 'martian';
    document.querySelectorAll('.tweaks [data-theme]').forEach(b =>
      b.classList.toggle('active', b.dataset.theme === theme));
    document.querySelectorAll('.tweaks [data-font]').forEach(b =>
      b.classList.toggle('active', b.dataset.font === font));
  }

  // ---------- POSTS RENDERING ----------
  function fmtDate(iso) { return iso.replace(/-/g, '.'); }
  function sorted() { return [...(window.POSTS || [])].sort((a,b) => a.date < b.date ? 1 : -1); }

  function coverHtml(post) {
    if (post && post.cover && post.cover.src) {
      return `<span class="cover"><img src="${post.cover.src}" alt="${post.cover.alt||''}" loading="lazy"/></span>`;
    }
    return '';
  }

  function renderList(target, { limit } = {}) {
    const el = (typeof target === 'string') ? document.querySelector(target) : target;
    if (!el) return;
    const list = sorted().slice(0, limit || Infinity);
    const wrap = el.closest('.blog-wrap');
    if (list.length === 0) {
      el.innerHTML = `<li class="post-empty"><span class="empty-bar"></span><span class="empty-text">Nothing here yet — check back shortly.</span></li>`;
      if (wrap) wrap.classList.add('is-empty');
      return;
    }
    if (wrap) wrap.classList.remove('is-empty');
    el.innerHTML = list.map(p => {
      const hasCover = !!(p.cover && p.cover.src);
      return `
      <li>
        <a class="post-item ${hasCover ? '' : 'no-cover'}" href="${postUrl(p)}">
          <span class="date">${fmtDate(p.date)}</span>
          <span class="title-wrap">
            <span class="title">${p.title}</span>
            <span class="desc">${p.desc}</span>
          </span>
          ${coverHtml(p)}
          <span class="read">${p.readMin} min</span>
        </a>
      </li>`;
    }).join('');
  }

  function postUrl(p) {
    // index & blog live at root; links point into posts/
    return `posts/${p.slug}.html`;
  }

  function adjacent(slug) {
    const s = sorted();
    const i = s.findIndex(p => p.slug === slug);
    return {
      newer: i > 0 ? s[i - 1] : null,
      older: i >= 0 && i < s.length - 1 ? s[i + 1] : null,
    };
  }

  function renderPostChrome() {
    const article = document.querySelector('article.post-page');
    if (!article) return;
    const slug = article.dataset.slug;
    const post = (window.POSTS || []).find(p => p.slug === slug);
    if (!post) return;

    // cover banner (post-inner is where content lives)
    const coverMount = article.querySelector('.post-cover-mount');
    if (coverMount) {
      if (post.cover && post.cover.src) {
        coverMount.outerHTML = `<figure class="post-cover"><img src="${post.cover.src}" alt="${post.cover.alt||''}"/></figure>`;
      } else {
        coverMount.outerHTML = `<div class="post-cover placeholder" aria-hidden="true"></div>`;
      }
    }

    const head = article.querySelector('.post-head');
    if (head) {
      head.innerHTML = `
        <div class="meta">
          <span>${fmtDate(post.date)}</span>
          <span class="dot">·</span>
          <span>${post.readMin} min read</span>
        </div>
        <h1>${post.title}</h1>
      `;
    }

    const bodySlot = article.querySelector('.prose');
    if (bodySlot && !bodySlot.innerHTML.trim()) bodySlot.innerHTML = post.body;

    const foot = article.querySelector('.post-foot');
    if (foot) {
      const { newer, older } = adjacent(slug);
      foot.innerHTML = `
        <div class="nav-cell ${newer ? '' : 'empty'}">
          <span class="label">← Newer</span>
          ${newer ? `<a href="${newer.slug}.html">${newer.title}</a>` : '—'}
        </div>
        <div class="nav-cell right ${older ? '' : 'empty'}">
          <span class="label">Older →</span>
          ${older ? `<a href="${older.slug}.html">${older.title}</a>` : '—'}
        </div>
      `;
    }

    document.title = `${post.title} — Phillip Sievers`;
  }

  // ---------- THEME HINT (index only) ----------
  const LS_HINT = 'ps.themeHint';
  function installThemeHint() {
    const hint = document.getElementById('theme-hint');
    if (!hint) return;
    if (localStorage.getItem(LS_HINT) === 'dismissed') {
      hint.remove();
      return;
    }
    requestAnimationFrame(() => hint.classList.add('visible'));
    const dismiss = () => {
      hint.classList.remove('visible');
      localStorage.setItem(LS_HINT, 'dismissed');
      setTimeout(() => hint.remove(), 300);
    };
    hint.querySelector('.hint-close').addEventListener('click', dismiss);
    document.addEventListener('dblclick', dismiss, { once: true });
    setTimeout(() => {
      if (hint.classList.contains('visible')) {
        hint.classList.remove('visible');
        setTimeout(() => { if (hint.parentNode) hint.remove(); }, 300);
      }
    }, 12000);
  }

  // ---------- boot ----------
  function boot() {
    initTheme();
    initFont();
    installThemeClick();
    installPaneNav();
    installTweaks();
    installThemeHint();
    updateTweakActives();
  }

  window.Site = { renderList, renderPostChrome, sorted, fmtDate };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
