/**
 * ============================================================
 * LINEAR ALGEBRA PREP HUB — la_hub.js
 * Complete Interactive Platform JavaScript
 * ============================================================
 *
 * Modules:
 *   1.  ThemeManager         — dark/light toggle + persistence
 *   2.  ScrollSpy            — sidebar active-week detection
 *   3.  SmoothNav            — smooth scroll + nav highlighting
 *   4.  ProgressTracker      — mark-complete + localStorage
 *   5.  DashboardCounters    — dynamic stat computation
 *   6.  SearchSystem         — instant full-text search
 *   7.  CollapsibleSections  — expand/collapse content blocks
 *   8.  FAQAccordion         — single-open FAQ mode
 *   9.  PracticeSystem       — hint / answer reveal
 *  10.  FormulaInteractions  — copy formula + focus mode
 *  11.  BackToTop            — animated scroll-to-top button
 *  12.  KeyboardShortcuts    — /, T, M, Esc, Home shortcuts
 *  13.  StudyMode            — distraction-free reading mode
 *  14.  MobileMenu          — hamburger + overlay (no freeze)
 *  15.  Performance         — debounce / throttle utilities
 *  16.  Accessibility        — focus management helpers
 *  17.  Init                 — bootstrap & event delegation
 * ============================================================
 */

'use strict';

/* ============================================================
   UTILITIES
   ============================================================ */

/**
 * Debounce: delays fn execution until `wait` ms after last call.
 * @param {Function} fn
 * @param {number} wait
 * @returns {Function}
 */
function debounce(fn, wait) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Throttle: allows fn at most once per `limit` ms.
 * @param {Function} fn
 * @param {number} limit
 * @returns {Function}
 */
function throttle(fn, limit) {
  let inThrottle = false;
  return function (...args) {
    if (!inThrottle) {
      fn.apply(this, args);
      inThrottle = true;
      setTimeout(() => { inThrottle = false; }, limit);
    }
  };
}

/**
 * Safe querySelector — returns null on missing element without throwing.
 * @param {string} selector
 * @param {Element|Document} [root=document]
 * @returns {Element|null}
 */
function qs(selector, root = document) {
  try { return root.querySelector(selector); } catch { return null; }
}

/**
 * Safe querySelectorAll — returns empty NodeList on failure.
 * @param {string} selector
 * @param {Element|Document} [root=document]
 * @returns {NodeList}
 */
function qsa(selector, root = document) {
  try { return root.querySelectorAll(selector); } catch { return []; }
}

/**
 * localStorage helpers with try/catch (private/incognito safe).
 */
const Store = {
  get(key, fallback = null) {
    try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; }
    catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); }
    catch { /* storage full / blocked */ }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
};

/* ============================================================
   1. THEME MANAGER
   ============================================================ */
const ThemeManager = (() => {
  const KEY = 'la_hub_theme';
  const DARK  = 'dark';
  const LIGHT = 'light';
  const ICONS = { dark: '☀', light: '☾' };

  let current = DARK;

  function apply(theme) {
    current = theme;
    document.documentElement.setAttribute('data-theme', theme);
    const btn = qs('#theme-toggle');
    if (btn) {
      btn.textContent = ICONS[theme];
      btn.setAttribute('aria-label', `Switch to ${theme === DARK ? LIGHT : DARK} mode`);
    }
    Store.set(KEY, theme);
  }

  function toggle() {
    apply(current === DARK ? LIGHT : DARK);
  }

  function init() {
    const saved = Store.get(KEY, DARK);
    apply(saved);

    const btn = qs('#theme-toggle');
    if (btn) {
      btn.addEventListener('click', toggle);
    }
  }

  return { init, toggle, get current() { return current; } };
})();

/* ============================================================
   2. SCROLL SPY — highlights active nav week as user scrolls
   ============================================================ */
const ScrollSpy = (() => {
  const ACTIVE_CLASS = 'active';
  let navLinks = [];
  let weekSections = [];
  let observer = null;

  function activate(weekNum) {
    navLinks.forEach(link => {
      const isActive = link.dataset.week === String(weekNum);
      link.classList.toggle(ACTIVE_CLASS, isActive);
      link.setAttribute('aria-current', isActive ? 'true' : 'false');
    });
  }

  function init() {
    navLinks      = Array.from(qsa('.nav-link[data-week]'));
    weekSections  = Array.from(qsa('.week-article[data-week]'));

    if (!weekSections.length) return;

    // IntersectionObserver: trigger when section top enters viewport
    const headerH = (qs('#site-header')?.offsetHeight || 72)
                  + (qs('#main-nav')?.offsetHeight || 64)
                  + 16;

    observer = new IntersectionObserver(
      entries => {
        // Find the entry closest to the top of the viewport
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

        if (visible.length > 0) {
          const weekNum = visible[0].target.dataset.week;
          activate(weekNum);
        }
      },
      {
        rootMargin: `-${headerH}px 0px -50% 0px`,
        threshold: 0
      }
    );

    weekSections.forEach(section => observer.observe(section));
  }

  return { init };
})();

/* ============================================================
   3. SMOOTH NAVIGATION
   ============================================================ */
const SmoothNav = (() => {
  function getOffset() {
    const header = qs('#site-header');
    const nav    = qs('#main-nav');
    return (header?.offsetHeight || 72) + (nav?.offsetHeight || 64) + 16;
  }

  function scrollToId(id) {
    const target = qs(`#${CSS.escape(id)}`);
    if (!target) return;
    const top = target.getBoundingClientRect().top + window.scrollY - getOffset();
    window.scrollTo({ top, behavior: 'smooth' });
  }

  function handleClick(e) {
    const link = e.target.closest('a[href^="#"]');
    if (!link) return;
    const id = link.getAttribute('href').slice(1);
    if (!id) return;
    e.preventDefault();
    scrollToId(id);
    // Close mobile menu if open
    MobileMenu.close();
    // Update focus for accessibility
    const target = qs(`#${CSS.escape(id)}`);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus({ preventScroll: true });
    }
  }

  function init() {
    document.addEventListener('click', handleClick, { passive: false });
  }

  return { init, scrollToId };
})();

/* ============================================================
   4. PROGRESS TRACKER
   ============================================================ */
const ProgressTracker = (() => {
  const KEY = 'la_hub_progress'; // stores Set-like array of completed week numbers
  let completed = new Set();

  function load() {
    const saved = Store.get(KEY, []);
    completed = new Set(saved.map(String));
  }

  function save() {
    Store.set(KEY, Array.from(completed));
  }

  function markComplete(weekNum) {
    const key = String(weekNum);
    if (completed.has(key)) {
      completed.delete(key);
    } else {
      completed.add(key);
    }
    save();
    updateButtons();
    DashboardCounters.update();
  }

  function isComplete(weekNum) {
    return completed.has(String(weekNum));
  }

  function updateButtons() {
    qsa('.week-complete-btn').forEach(btn => {
      const week = btn.dataset.week;
      const done = isComplete(week);
      btn.setAttribute('aria-pressed', done ? 'true' : 'false');
      btn.textContent = done ? '✓ Completed' : 'Mark Complete';
      // style the week header on completion
      const article = btn.closest('.week-article');
      if (article) {
        article.classList.toggle('week-article--completed', done);
      }
    });
  }

  function getStats() {
    const total = qsa('.week-article[data-week]').length;
    const done  = completed.size;
    return { total, done, pct: total > 0 ? Math.round((done / total) * 100) : 0 };
  }

  function updateProgressBar() {
    const { pct } = getStats();
    const fill = qs('#progress-fill');
    const label = qs('#progress-pct');
    const wrap  = qs('.progress-bar-wrap');
    if (fill)  fill.style.width = `${pct}%`;
    if (label) label.textContent = `${pct}%`;
    if (wrap)  wrap.setAttribute('aria-valuenow', pct);
  }

  function init() {
    load();
    updateButtons();
    updateProgressBar();

    // Event delegation for all complete buttons
    document.addEventListener('click', e => {
      const btn = e.target.closest('.week-complete-btn');
      if (btn) markComplete(btn.dataset.week);
    });
  }

  return { init, isComplete, getStats, updateProgressBar };
})();

/* ============================================================
   5. DASHBOARD COUNTERS
   ============================================================ */
const DashboardCounters = (() => {
  function update() {
    ProgressTracker.updateProgressBar();

    const stats = ProgressTracker.getStats();

    // Update hero stat numbers if they include dynamic counters
    // The HTML has static numbers; update the week counter if present
    const weekStats = qs('.hero-stat .stat-number');
    // Only update if there's a dedicated counter element (future-proof)
    // For now, just keep progress bar in sync
    _ = stats; // suppress lint warning
  }

  function init() {
    update();
  }

  // Tiny no-op placeholder to suppress unused var lint
  const _ = (v) => v;

  return { init, update };
})();

/* ============================================================
   6. SEARCH SYSTEM
   ============================================================ */
const SearchSystem = (() => {
  const HIGHLIGHT_CLASS = 'search-highlight';
  const HIDDEN_CLASS    = 'search-hidden';
  let searchInput = null;
  let allSections = [];
  let overlay = null;
  let resultsPanel = null;
  let isOpen = false;

  /** Build a flat index of searchable text nodes */
  function buildIndex() {
     const selectors = [
       '.def-term', '.def-body',
       '.concept-title', '.concept-block p',
       '.theorem-label', '.theorem-block p',
       '.example-title', '.example-block p',
       '.formula-name', '.formula-math',
       '.faq-q', '.faq-a p',
       '.practice-q', '.challenge-q',
       '.rp-statement',
       '.objectives-list li',
       '.tips-list li',
       '.memorize-list li',
       '.mistakes-list li',
       '.app-list li',
       '.summary-card p',
       '.week-title', '.week-subtitle',
       '.step-text',
       '.section-title'
     ].join(', ');
  
     allSections = Array.from(qsa(selectors));
     console.log(`Search index built: ${allSections.length} elements`);
}

  /** Strip HTML tags and MathJax artifacts for plain-text search */
  function plainText(el) {
     if (!el) return '';
     return (el.textContent || '').toLowerCase().replace(/\s+/g, ' ').trim();
   }
  }

  /** Escape for RegExp */
  function escapeRE(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /** Remove all previous highlights */
  function clearHighlights() {
    qsa(`.${HIGHLIGHT_CLASS}`).forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent), el);
        parent.normalize();
      }
    });
  }

  /** Highlight matching text in a text node */
  function highlightInEl(el, re) {
    // Walk text nodes
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    const nodes = [];
    let node;
    while ((node = walker.nextNode())) nodes.push(node);

    nodes.forEach(textNode => {
      const text = textNode.textContent;
      if (!re.test(text)) return;
      re.lastIndex = 0;
      const frag = document.createDocumentFragment();
      let lastIndex = 0;
      let match;
      re.lastIndex = 0;
      while ((match = re.exec(text)) !== null) {
        frag.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
        const mark = document.createElement('mark');
        mark.className = HIGHLIGHT_CLASS;
        mark.textContent = match[0];
        frag.appendChild(mark);
        lastIndex = match.index + match[0].length;
        if (!re.global) break;
      }
      frag.appendChild(document.createTextNode(text.slice(lastIndex)));
      textNode.parentNode.replaceChild(frag, textNode);
    });
  }

  function showResults(query) {
    clearHighlights();

    if (!query) {
      if (resultsPanel) resultsPanel.innerHTML = '';
      return;
    }

    const re = new RegExp(escapeRE(query), 'gi');
    const matches = [];

    allSections.forEach(el => {
      const text = plainText(el);
      if (text.includes(query.toLowerCase())) {
        matches.push(el);
        // highlight inline
        highlightInEl(el, new RegExp(escapeRE(query), 'gi'));
        // Reveal hidden parent details/sections
        let parent = el.closest('details');
        while (parent) {
          parent.open = true;
          parent = parent.parentElement?.closest('details');
        }
      }
    });

    renderResultsPanel(query, matches);
  }

  function renderResultsPanel(query, matches) {
    if (!resultsPanel) return;

    if (!matches.length) {
      resultsPanel.innerHTML = `<div class="search-no-results">No results for "<strong>${escapeHTML(query)}</strong>"</div>`;
      resultsPanel.hidden = false;
      return;
    }

    // Group by week
    const groups = {};
    matches.forEach(el => {
      const article = el.closest('.week-article');
      const weekId  = article?.id || 'general';
      const weekTitle = article?.querySelector('.week-title')?.textContent?.trim() || 'General';
      if (!groups[weekId]) groups[weekId] = { title: weekTitle, items: [] };
      const snippet = (el.textContent || '').trim().slice(0, 90);
      groups[weekId].items.push({ snippet, id: weekId });
    });

    let html = `<div class="search-results-header"><span>${matches.length} result${matches.length !== 1 ? 's' : ''} for "<strong>${escapeHTML(query)}</strong>"</span><button class="search-close-btn" aria-label="Close search">✕</button></div><ul class="search-results-list">`;

    Object.entries(groups).forEach(([id, group]) => {
      html += `<li class="search-result-group"><a href="#${id}" class="search-result-week">${escapeHTML(group.title)}</a><ul>`;
      group.items.slice(0, 3).forEach(item => {
        html += `<li class="search-result-item"><a href="#${id}" class="search-result-link">${escapeHTML(item.snippet)}…</a></li>`;
      });
      if (group.items.length > 3) {
        html += `<li class="search-result-more">+${group.items.length - 3} more in this week</li>`;
      }
      html += `</ul></li>`;
    });
    html += '</ul>';

    resultsPanel.innerHTML = html;
    resultsPanel.hidden = false;
  }

  function escapeHTML(str) {
    return str.replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  function createUI() {
    // Inject search results panel below the nav-search input
    const wrap = qs('#nav-search')?.parentElement;
    if (wrap) {
      wrap.style.position = 'relative';
      resultsPanel = document.createElement('div');
      resultsPanel.id = 'search-results-panel';
      resultsPanel.className = 'search-results-panel';
      resultsPanel.setAttribute('role', 'listbox');
      resultsPanel.hidden = true;
      wrap.appendChild(resultsPanel);
    }

    // Full-page search overlay (opened with /)
    overlay = document.createElement('div');
    overlay.id = 'search-overlay';
    overlay.className = 'search-overlay';
    overlay.setAttribute('role', 'dialog');
    overlay.setAttribute('aria-modal', 'true');
    overlay.setAttribute('aria-label', 'Search topics');
    overlay.hidden = true;
    overlay.innerHTML = `
      <div class="search-overlay-inner">
        <div class="search-overlay-header">
          <span class="search-overlay-label">Search all topics</span>
          <button class="search-overlay-close" aria-label="Close search">✕</button>
        </div>
        <input type="search" id="search-overlay-input" class="search-overlay-input" placeholder="Type to search definitions, theorems, formulas…" autocomplete="off" />
        <div id="search-overlay-results" class="search-overlay-results" role="listbox"></div>
        <div class="search-overlay-hints">
          <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
          <span><kbd>Enter</kbd> jump</span>
          <span><kbd>Esc</kbd> close</span>
        </div>
      </div>`;
    document.body.appendChild(overlay);

    injectSearchStyles();
  }

  function injectSearchStyles() {
    const style = document.createElement('style');
    style.textContent = `
      mark.search-highlight {
        background: rgba(61,127,255,0.30);
        color: inherit;
        border-radius: 2px;
        padding: 0 1px;
      }
      .search-results-panel {
        position: absolute;
        top: calc(100% + 4px);
        left: 0;
        width: 380px;
        max-height: 440px;
        overflow-y: auto;
        background: var(--bg-raised);
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-lg);
        box-shadow: var(--shadow-xl);
        z-index: 500;
        font-family: var(--font-body);
      }
      .search-results-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 10px 14px;
        font-size: 0.76rem;
        color: var(--text-muted);
        border-bottom: 1px solid var(--border-soft);
      }
      .search-close-btn {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        font-size: 0.9rem;
        padding: 2px 6px;
        border-radius: var(--radius-sm);
      }
      .search-close-btn:hover { color: var(--text-primary); background: var(--bg-overlay); }
      .search-results-list { padding: 6px 0; }
      .search-result-group { padding: 0; }
      .search-result-week {
        display: block;
        padding: 6px 14px 2px;
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--primary);
      }
      .search-result-week:hover { text-decoration: underline; }
      .search-result-item {}
      .search-result-link {
        display: block;
        padding: 5px 14px 5px 22px;
        font-size: 0.80rem;
        color: var(--text-secondary);
        line-height: 1.5;
        border-radius: 4px;
        margin: 0 6px;
        transition: background 0.12s;
      }
      .search-result-link:hover { background: var(--bg-overlay); color: var(--text-primary); }
      .search-result-more {
        padding: 2px 22px 6px;
        font-size: 0.72rem;
        color: var(--text-faint);
      }
      .search-no-results {
        padding: 14px;
        font-size: 0.82rem;
        color: var(--text-muted);
        text-align: center;
      }
      /* Full-screen overlay */
      .search-overlay {
        position: fixed;
        inset: 0;
        background: rgba(8,14,26,0.75);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
        z-index: 2000;
        display: flex;
        align-items: flex-start;
        justify-content: center;
        padding-top: 80px;
      }
      .search-overlay-inner {
        width: min(640px, 92vw);
        background: var(--bg-raised);
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-xl);
        box-shadow: var(--shadow-xl);
        overflow: hidden;
      }
      .search-overlay-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 14px 18px 10px;
        border-bottom: 1px solid var(--border-soft);
      }
      .search-overlay-label {
        font-size: 0.76rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-muted);
      }
      .search-overlay-close {
        background: none; border: none;
        color: var(--text-muted); cursor: pointer;
        font-size: 1rem; padding: 2px 8px;
        border-radius: var(--radius-sm);
        transition: background 0.12s;
      }
      .search-overlay-close:hover { background: var(--bg-overlay); color: var(--text-primary); }
      .search-overlay-input {
        width: 100%;
        padding: 14px 18px;
        font-family: var(--font-body);
        font-size: 1.05rem;
        background: transparent;
        border: none;
        border-bottom: 1px solid var(--border-soft);
        color: var(--text-primary);
        outline: none;
      }
      .search-overlay-input::placeholder { color: var(--text-faint); }
      .search-overlay-results {
        max-height: 360px;
        overflow-y: auto;
        padding: 8px 0;
      }
      .search-overlay-result-item {
        display: block;
        padding: 10px 18px;
        font-size: 0.88rem;
        color: var(--text-secondary);
        cursor: pointer;
        border-radius: 6px;
        margin: 2px 8px;
        transition: background 0.12s;
        line-height: 1.5;
      }
      .search-overlay-result-item:hover,
      .search-overlay-result-item.selected {
        background: var(--bg-overlay);
        color: var(--text-primary);
      }
      .search-overlay-result-week {
        font-size: 0.68rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        color: var(--primary);
        display: block;
        margin-bottom: 2px;
      }
      .search-overlay-hints {
        display: flex;
        gap: 16px;
        padding: 8px 18px;
        border-top: 1px solid var(--border-soft);
        font-size: 0.70rem;
        color: var(--text-faint);
      }
      .search-overlay-hints kbd {
        background: var(--bg-overlay);
        border: 1px solid var(--border-medium);
        border-radius: 3px;
        padding: 1px 5px;
        font-family: var(--font-mono);
        font-size: 0.65rem;
      }
    `;
    document.head.appendChild(style);
  }

  function openOverlay() {
    if (!overlay) return;
    overlay.hidden = false;
    isOpen = true;
    const input = qs('#search-overlay-input');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 50);
    }
    document.body.style.overflow = 'hidden';
  }

  function closeOverlay() {
    if (!overlay) return;
    overlay.hidden = true;
    isOpen = false;
    document.body.style.overflow = '';
    clearHighlights();
    const resultsDiv = qs('#search-overlay-results');
    if (resultsDiv) resultsDiv.innerHTML = '';
  }

  function handleOverlaySearch(query) {
     if (!allSections.length) buildIndex();
    const resultsDiv = qs('#search-overlay-results');
    if (!resultsDiv) return;
    if (!query.trim()) { resultsDiv.innerHTML = ''; return; }

    const re = new RegExp(escapeRE(query.trim()), 'i');
    const hits = [];

    allSections.forEach(el => {
      if (re.test(plainText(el))) {
        const article = el.closest('.week-article');
        hits.push({
          el,
          weekId: article?.id || '',
          weekTitle: article?.querySelector('.week-title')?.textContent?.trim() || '',
          snippet: (el.textContent || '').trim().slice(0, 100)
        });
      }
    });

    if (!hits.length) {
      resultsDiv.innerHTML = `<div class="search-overlay-result-item">No results found</div>`;
      return;
    }

    resultsDiv.innerHTML = hits.slice(0, 20).map((h, i) =>
      `<a class="search-overlay-result-item" href="#${h.weekId}" data-result-index="${i}">
        <span class="search-overlay-result-week">${escapeHTML(h.weekTitle)}</span>
        ${escapeHTML(h.snippet)}…
      </a>`
    ).join('');
  }

  function init() {
    buildIndex();
    createUI();

    // Nav search input (smaller, inline)
    searchInput = qs('#nav-search');
    if (searchInput) {
      searchInput.addEventListener('input', debounce(e => {
        showResults(e.target.value.trim());
      }, 200));

      searchInput.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
          searchInput.value = '';
          clearHighlights();
          if (resultsPanel) resultsPanel.hidden = true;
          searchInput.blur();
        }
      });

      // Close panel on outside click
      document.addEventListener('click', e => {
        if (!e.target.closest('.nav-search-wrap') && resultsPanel) {
          resultsPanel.hidden = true;
        }
      });

      // Delegated close button
      document.addEventListener('click', e => {
        if (e.target.closest('.search-close-btn')) {
          searchInput.value = '';
          clearHighlights();
          if (resultsPanel) resultsPanel.hidden = true;
        }
      });
    }

    // Overlay search
    if (overlay) {
      const overlayInput = qs('#search-overlay-input');
      if (overlayInput) {
        overlayInput.addEventListener('input', debounce(e => {
          handleOverlaySearch(e.target.value);
        }, 150));
      }

      overlay.addEventListener('click', e => {
        if (e.target === overlay) closeOverlay();
        const link = e.target.closest('.search-overlay-result-item');
        if (link) {
          closeOverlay();
          const href = link.getAttribute('href');
          if (href) setTimeout(() => { location.hash = href; SmoothNav.scrollToId(href.slice(1)); }, 50);
        }
        if (e.target.closest('.search-overlay-close')) closeOverlay();
      });
    }
  }

  return { init, openOverlay, closeOverlay, get isOpen() { return isOpen; } };
})();

/* ============================================================
   7. COLLAPSIBLE SECTIONS
   ============================================================ */
const CollapsibleSections = (() => {
  const KEY = 'la_hub_collapsed';
  let collapsed = new Set();

  function load() {
    const saved = Store.get(KEY, []);
    collapsed = new Set(saved);
  }

  function save() {
    Store.set(KEY, Array.from(collapsed));
  }

  /**
   * Makes a content-section collapsible by wrapping its content and adding a toggle.
   * @param {Element} section
   */
  function makeCollapsible(section) {
    const heading = section.querySelector('.section-title');
    if (!heading || section.dataset.collapsible) return;
    section.dataset.collapsible = 'true';

    const sectionId = section.id || `cs-${Math.random().toString(36).slice(2, 7)}`;
    section.id = sectionId;

    // Wrap all children except the heading
    const children = Array.from(section.children).filter(c => c !== heading);
    const body = document.createElement('div');
    body.className = 'collapsible-body';
    body.id = `${sectionId}-body`;
    body.setAttribute('role', 'region');
    body.setAttribute('aria-labelledby', `${sectionId}-toggle`);
    children.forEach(c => body.appendChild(c));
    section.appendChild(body);

    // Toggle button on the heading
    const btn = document.createElement('button');
    btn.className = 'collapsible-toggle';
    btn.id = `${sectionId}-toggle`;
    btn.setAttribute('aria-expanded', 'true');
    btn.setAttribute('aria-controls', `${sectionId}-body`);
    btn.setAttribute('type', 'button');
    btn.setAttribute('aria-label', 'Toggle section');
    btn.innerHTML = '<span class="collapsible-icon" aria-hidden="true">▾</span>';
    heading.appendChild(btn);

    // Restore collapsed state
    if (collapsed.has(sectionId)) {
      collapse(section, body, btn, false);
    }

    btn.addEventListener('click', e => {
      e.stopPropagation();
      toggleSection(section, body, btn);
    });
  }

  function collapse(section, body, btn, animate = true) {
    if (animate) {
      body.style.height = body.scrollHeight + 'px';
      requestAnimationFrame(() => {
        body.style.height = '0';
        body.style.overflow = 'hidden';
        body.style.opacity = '0';
      });
    } else {
      body.style.height = '0';
      body.style.overflow = 'hidden';
      body.style.opacity = '0';
    }
    body.style.transition = animate ? 'height 0.28s ease, opacity 0.22s ease' : '';
    btn.setAttribute('aria-expanded', 'false');
    const icon = btn.querySelector('.collapsible-icon');
    if (icon) icon.style.transform = 'rotate(-90deg)';
    section.classList.add('is-collapsed');
  }

  function expand(section, body, btn) {
    body.style.height = body.scrollHeight + 'px';
    body.style.overflow = 'hidden';
    body.style.opacity = '1';
    body.style.transition = 'height 0.28s ease, opacity 0.22s ease';
    btn.setAttribute('aria-expanded', 'true');
    const icon = btn.querySelector('.collapsible-icon');
    if (icon) icon.style.transform = 'rotate(0deg)';
    section.classList.remove('is-collapsed');
    // Clear height after animation so content can reflow
    setTimeout(() => {
      body.style.height = '';
      body.style.overflow = '';
    }, 300);
  }

  function toggleSection(section, body, btn) {
    const isExpanded = btn.getAttribute('aria-expanded') === 'true';
    if (isExpanded) {
      collapse(section, body, btn);
      collapsed.add(section.id);
    } else {
      expand(section, body, btn);
      collapsed.delete(section.id);
    }
    save();
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .collapsible-toggle {
        background: none; border: none;
        padding: 0 0 0 8px; cursor: pointer;
        color: var(--text-muted);
        display: inline-flex; align-items: center;
        transition: color 0.15s;
        flex-shrink: 0;
        margin-left: auto;
      }
      .collapsible-toggle:hover { color: var(--primary); }
      .collapsible-icon {
        font-size: 0.85rem;
        transition: transform 0.22s ease;
        display: inline-block;
      }
      .collapsible-body {
        overflow: hidden;
        transition: height 0.28s ease, opacity 0.22s ease;
      }
      .section-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        cursor: default;
      }
    `;
    document.head.appendChild(style);
  }

  function init() {
    load();
    injectStyles();
    qsa('.content-section').forEach(makeCollapsible);
  }

  return { init };
})();

/* ============================================================
   8. FAQ ACCORDIONS — single-open mode
   ============================================================ */
const FAQAccordion = (() => {
  function init() {
    // Use event delegation on the document for all FAQ items
    document.addEventListener('toggle', e => {
      const details = e.target;
      if (!details.classList.contains('faq-item')) return;
      if (!details.open) return;

      // Close sibling FAQ items in the same section
      const parent = details.closest('.faq-section') || details.parentElement;
      if (!parent) return;
      parent.querySelectorAll('.faq-item[open]').forEach(sibling => {
        if (sibling !== details) sibling.open = false;
      });
    }, true); // use capture to get before browser toggles
  }

  return { init };
})();

/* ============================================================
   9. PRACTICE SYSTEM — hints are native <details>; this
      adds enhanced "Reveal Answer Outline" buttons
   ============================================================ */
const PracticeSystem = (() => {
  function addAnswerButtons() {
    qsa('.practice-item, .challenge-item, .review-problem').forEach(item => {
      if (item.dataset.answerAdded) return;
      item.dataset.answerAdded = 'true';

      const hint = item.querySelector('.hint-block');
      if (!hint) return;

      // The hint block already has expand/collapse via native <details>.
      // Style enhancement: add an aria-live region for screen readers when opened.
      const summary = hint.querySelector('summary');
      if (summary) {
        hint.addEventListener('toggle', () => {
          summary.textContent = hint.open ? 'Hide Hint' : 'Hint';
        });
      }
    });
  }

  function init() {
    addAnswerButtons();
  }

  return { init };
})();

/* ============================================================
   10. FORMULA INTERACTIONS — copy + focus mode
   ============================================================ */
const FormulaInteractions = (() => {
  let focusModal = null;

  function copyFormula(card) {
    // Get raw LaTeX from the formula-math element
    const mathEl = card.querySelector('.formula-math');
    if (!mathEl) return;

    // Try to get the LaTeX source; MathJax stores it in data attributes
    let text = '';
    const mjx = mathEl.querySelector('mjx-container');
    if (mjx) {
      const script = mjx.nextElementSibling;
      if (script && script.tagName === 'SCRIPT') {
        text = script.textContent.trim();
      } else {
        text = mjx.getAttribute('aria-label') || mathEl.textContent.trim();
      }
    } else {
      text = mathEl.textContent.trim();
    }

    if (!text) return;

    navigator.clipboard.writeText(text).then(() => {
      showCopyFeedback(card);
    }).catch(() => {
      // Fallback: select text
      const range = document.createRange();
      range.selectNodeContents(mathEl);
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      showCopyFeedback(card);
    });
  }

  function showCopyFeedback(card) {
    const btn = card.querySelector('.formula-copy-btn');
    if (!btn) return;
    const original = btn.textContent;
    btn.textContent = '✓ Copied!';
    btn.classList.add('copied');
    setTimeout(() => {
      btn.textContent = original;
      btn.classList.remove('copied');
    }, 1800);
  }

  function openFocusMode(card) {
    if (!focusModal) return;
    const name = card.querySelector('.formula-name')?.textContent?.trim() || 'Formula';
    const mathEl = card.querySelector('.formula-math');
    const mathHTML = mathEl ? mathEl.innerHTML : '';

    focusModal.querySelector('.formula-modal-name').textContent = name;
    focusModal.querySelector('.formula-modal-math').innerHTML = mathHTML;
    focusModal.hidden = false;
    document.body.style.overflow = 'hidden';

    // Re-typeset if MathJax is loaded
    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise([focusModal]).catch(() => {});
    }

    focusModal.querySelector('.formula-modal-close')?.focus();
  }

  function closeFocusMode() {
    if (!focusModal) return;
    focusModal.hidden = true;
    document.body.style.overflow = '';
  }

  function createModal() {
    focusModal = document.createElement('div');
    focusModal.id = 'formula-focus-modal';
    focusModal.setAttribute('role', 'dialog');
    focusModal.setAttribute('aria-modal', 'true');
    focusModal.setAttribute('aria-label', 'Formula focus mode');
    focusModal.hidden = true;
    focusModal.innerHTML = `
      <div class="formula-modal-backdrop"></div>
      <div class="formula-modal-content">
        <button class="formula-modal-close" aria-label="Close focus mode">✕</button>
        <div class="formula-modal-name"></div>
        <div class="formula-modal-math"></div>
      </div>`;
    document.body.appendChild(focusModal);

    focusModal.querySelector('.formula-modal-backdrop')?.addEventListener('click', closeFocusMode);
    focusModal.querySelector('.formula-modal-close')?.addEventListener('click', closeFocusMode);
  }

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .formula-card { position: relative; }
      .formula-card-actions {
        position: absolute;
        top: 6px; right: 6px;
        display: flex; gap: 4px;
        opacity: 0;
        transition: opacity 0.15s;
      }
      .formula-card:hover .formula-card-actions,
      .formula-card:focus-within .formula-card-actions { opacity: 1; }
      .formula-copy-btn, .formula-focus-btn {
        background: var(--bg-overlay);
        border: 1px solid var(--border);
        border-radius: var(--radius-sm);
        color: var(--text-muted);
        font-size: 0.64rem;
        font-weight: 600;
        padding: 2px 7px;
        cursor: pointer;
        transition: all 0.12s;
        font-family: var(--font-body);
      }
      .formula-copy-btn:hover, .formula-focus-btn:hover {
        background: var(--primary-glow);
        border-color: var(--primary-border);
        color: var(--primary);
      }
      .formula-copy-btn.copied {
        background: var(--success-bg);
        border-color: rgba(16,185,129,0.30);
        color: var(--success);
      }
      #formula-focus-modal {
        position: fixed; inset: 0; z-index: 3000;
        display: flex; align-items: center; justify-content: center;
      }
      .formula-modal-backdrop {
        position: absolute; inset: 0;
        background: rgba(8,14,26,0.80);
        backdrop-filter: blur(8px);
        -webkit-backdrop-filter: blur(8px);
      }
      .formula-modal-content {
        position: relative; z-index: 1;
        background: var(--bg-raised);
        border: 1px solid var(--formula-border);
        border-radius: var(--radius-xl);
        padding: 40px 50px;
        text-align: center;
        box-shadow: var(--shadow-xl);
        min-width: 300px;
        max-width: 90vw;
      }
      .formula-modal-close {
        position: absolute; top: 12px; right: 16px;
        background: none; border: none;
        color: var(--text-muted); font-size: 1rem;
        cursor: pointer; padding: 4px 8px;
        border-radius: var(--radius-sm);
        transition: background 0.12s;
      }
      .formula-modal-close:hover { background: var(--bg-overlay); color: var(--text-primary); }
      .formula-modal-name {
        font-size: 0.72rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.10em;
        color: var(--secondary);
        margin-bottom: 24px;
      }
      .formula-modal-math { font-size: 1.6rem; color: var(--text-primary); }
    `;
    document.head.appendChild(style);
  }

  function addButtonsToCards() {
    qsa('.formula-card').forEach(card => {
      if (card.dataset.formulaEnhanced) return;
      card.dataset.formulaEnhanced = 'true';

      const actions = document.createElement('div');
      actions.className = 'formula-card-actions';
      actions.innerHTML = `
        <button class="formula-copy-btn" title="Copy formula" aria-label="Copy formula">Copy</button>
        <button class="formula-focus-btn" title="Focus mode" aria-label="Open formula in focus mode">⤢</button>`;
      card.appendChild(actions);

      actions.querySelector('.formula-copy-btn')?.addEventListener('click', e => {
        e.stopPropagation();
        copyFormula(card);
      });
      actions.querySelector('.formula-focus-btn')?.addEventListener('click', e => {
        e.stopPropagation();
        openFocusMode(card);
      });
    });
  }

  function init() {
    injectStyles();
    createModal();
    addButtonsToCards();
  }

  return { init, closeFocusMode };
})();

/* ============================================================
   11. BACK TO TOP BUTTON
   ============================================================ */
const BackToTop = (() => {
  let btn = null;
  const THRESHOLD = 400;

  function create() {
    btn = document.createElement('button');
    btn.id = 'back-to-top';
    btn.className = 'back-to-top-btn';
    btn.setAttribute('aria-label', 'Back to top');
    btn.setAttribute('title', 'Back to top');
    btn.textContent = '↑';
    document.body.appendChild(btn);

    const style = document.createElement('style');
    style.textContent = `
      .back-to-top-btn {
        position: fixed;
        bottom: 28px;
        right: 28px;
        z-index: 999;
        width: 44px; height: 44px;
        background: linear-gradient(135deg, var(--primary-dim), var(--primary));
        color: #fff;
        border: none;
        border-radius: var(--radius-full);
        font-size: 1.1rem;
        font-weight: 700;
        box-shadow: 0 4px 20px rgba(61,127,255,0.40);
        cursor: pointer;
        opacity: 0;
        transform: translateY(12px) scale(0.85);
        transition: opacity 0.22s ease, transform 0.22s ease;
        pointer-events: none;
        display: flex;
        align-items: center;
        justify-content: center;
      }
      .back-to-top-btn.visible {
        opacity: 1;
        transform: translateY(0) scale(1);
        pointer-events: auto;
      }
      .back-to-top-btn:hover {
        transform: translateY(-3px) scale(1.08);
        box-shadow: 0 8px 28px rgba(61,127,255,0.50);
      }
      .back-to-top-btn:active {
        transform: scale(0.95);
      }
    `;
    document.head.appendChild(style);

    btn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  function onScroll() {
    if (!btn) return;
    btn.classList.toggle('visible', window.scrollY > THRESHOLD);
  }

  function init() {
    create();
    window.addEventListener('scroll', throttle(onScroll, 100), { passive: true });
  }

  return { init };
})();

/* ============================================================
   12. KEYBOARD SHORTCUTS
   ============================================================ */
const KeyboardShortcuts = (() => {
  const shortcuts = {
    '/': () => {
      // Open search overlay
      SearchSystem.openOverlay();
    },
    't': () => {
      // Toggle theme
      ThemeManager.toggle();
    },
    'm': () => {
      // Toggle mobile menu (if visible)
      MobileMenu.toggle();
    },
    'Home': () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    'Escape': () => {
      // Close any open overlay
      if (SearchSystem.isOpen) {
        SearchSystem.closeOverlay();
        return;
      }
      if (StudyMode.isActive) {
        StudyMode.disable();
        return;
      }
      FormulaInteractions.closeFocusMode();
      MobileMenu.close();
    }
  };

  function handle(e) {
    // Don't intercept when user is typing
    const tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select') {
      if (e.key === 'Escape') shortcuts['Escape']();
      return;
    }
    if (e.target.isContentEditable) return;

    const handler = shortcuts[e.key];
    if (handler) {
      e.preventDefault();
      handler(e);
    }
  }

  function init() {
    document.addEventListener('keydown', handle);
  }

  return { init };
})();

/* ============================================================
   13. STUDY MODE — focused reading, minimized distractions
   ============================================================ */
const StudyMode = (() => {
  let active = false;
  let toggle = null;

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      body.study-mode .site-header { opacity: 0.4; transition: opacity 0.3s; }
      body.study-mode .site-header:hover { opacity: 1; }
      body.study-mode .main-nav { opacity: 0.4; transition: opacity 0.3s; }
      body.study-mode .main-nav:hover { opacity: 1; }
      body.study-mode .hero-section { display: none; }
      body.study-mode .quick-tools { display: none; }
      body.study-mode .site-footer { display: none; }
      body.study-mode #main-content { max-width: 740px; margin: 0 auto; }
      body.study-mode .week-article { margin-bottom: 3rem; }
      .study-mode-toggle {
        position: fixed;
        bottom: 28px;
        left: 28px;
        z-index: 999;
        padding: 8px 16px;
        background: var(--bg-raised);
        border: 1px solid var(--border-medium);
        border-radius: var(--radius-full);
        font-family: var(--font-body);
        font-size: 0.72rem;
        font-weight: 700;
        letter-spacing: 0.05em;
        color: var(--text-muted);
        cursor: pointer;
        box-shadow: var(--shadow-md);
        transition: all 0.18s;
        text-transform: uppercase;
      }
      .study-mode-toggle:hover {
        background: var(--primary-glow);
        border-color: var(--primary-border);
        color: var(--primary);
      }
      body.study-mode .study-mode-toggle {
        background: var(--primary-glow);
        border-color: var(--primary-border);
        color: var(--primary);
      }
    `;
    document.head.appendChild(style);
  }

  function createToggle() {
    toggle = document.createElement('button');
    toggle.className = 'study-mode-toggle';
    toggle.textContent = '📖 Study Mode';
    toggle.setAttribute('aria-pressed', 'false');
    toggle.setAttribute('aria-label', 'Toggle study mode');
    document.body.appendChild(toggle);
    toggle.addEventListener('click', () => {
      if (active) disable(); else enable();
    });
  }

  function enable() {
    active = true;
    document.body.classList.add('study-mode');
    if (toggle) {
      toggle.textContent = '✕ Exit Study Mode';
      toggle.setAttribute('aria-pressed', 'true');
    }
    Store.set('la_hub_studymode', true);
  }

  function disable() {
    active = false;
    document.body.classList.remove('study-mode');
    if (toggle) {
      toggle.textContent = '📖 Study Mode';
      toggle.setAttribute('aria-pressed', 'false');
    }
    Store.set('la_hub_studymode', false);
  }

  function init() {
    injectStyles();
    createToggle();
    if (Store.get('la_hub_studymode', false)) enable();
  }

  return { init, enable, disable, get isActive() { return active; } };
})();

/* ============================================================
   14. MOBILE MENU
   ============================================================ */
const MobileMenu = (() => {
  let hamburger  = null;
  let drawer     = null;
  let overlay    = null;
  let isOpen     = false;

  function injectStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .hamburger-btn {
        display: none;
        width: 38px; height: 38px;
        background: var(--bg-raised);
        border: 1px solid var(--border);
        border-radius: var(--radius-md);
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 5px;
        cursor: pointer;
        flex-shrink: 0;
        z-index: 200;
        transition: background 0.15s;
      }
      .hamburger-btn:hover { background: var(--bg-overlay); }
      .hamburger-bar {
        width: 18px; height: 2px;
        background: var(--text-secondary);
        border-radius: 2px;
        transition: transform 0.22s ease, opacity 0.15s ease;
        display: block;
      }
      .hamburger-btn[aria-expanded="true"] .hamburger-bar:nth-child(1) {
        transform: translateY(7px) rotate(45deg);
      }
      .hamburger-btn[aria-expanded="true"] .hamburger-bar:nth-child(2) {
        opacity: 0;
      }
      .hamburger-btn[aria-expanded="true"] .hamburger-bar:nth-child(3) {
        transform: translateY(-7px) rotate(-45deg);
      }
      @media (max-width: 768px) {
        .hamburger-btn { display: flex; }
        .nav-inner .week-nav-list { display: none !important; }
      }
      .mobile-drawer {
        position: fixed;
        top: 0; right: 0;
        width: min(300px, 85vw);
        height: 100dvh;
        background: var(--bg-surface);
        border-left: 1px solid var(--border-medium);
        z-index: 1500;
        overflow-y: auto;
        transform: translateX(100%);
        transition: transform 0.30s cubic-bezier(0.16,1,0.3,1);
        padding: 80px var(--space-5) var(--space-8);
        box-shadow: var(--shadow-xl);
      }
      .mobile-drawer.open { transform: translateX(0); }
      .mobile-drawer-nav { display: flex; flex-direction: column; gap: 4px; }
      .mobile-nav-link {
        display: flex; align-items: center; gap: 10px;
        padding: 10px 14px;
        border-radius: var(--radius-md);
        font-size: 0.88rem;
        font-weight: 500;
        color: var(--text-secondary);
        text-decoration: none;
        transition: all 0.12s;
        border: 1px solid transparent;
      }
      .mobile-nav-link:hover, .mobile-nav-link.active {
        background: var(--primary-glow);
        border-color: var(--primary-border);
        color: var(--primary);
      }
      .mobile-nav-week {
        font-size: 0.68rem;
        font-weight: 700;
        color: var(--primary);
        opacity: 0.7;
        min-width: 20px;
        font-family: var(--font-mono);
      }
      .mobile-drawer-header {
        font-family: var(--font-display);
        font-size: 1rem;
        color: var(--text-primary);
        margin-bottom: var(--space-5);
        padding-bottom: var(--space-4);
        border-bottom: 1px solid var(--border-soft);
      }
      .mobile-overlay {
        position: fixed; inset: 0;
        background: rgba(8,14,26,0.60);
        backdrop-filter: blur(3px);
        -webkit-backdrop-filter: blur(3px);
        z-index: 1400;
        opacity: 0;
        pointer-events: none;
        transition: opacity 0.25s ease;
      }
      .mobile-overlay.visible {
        opacity: 1;
        pointer-events: auto;
      }
    `;
    document.head.appendChild(style);
  }

  function create() {
    // Hamburger button — inject into header
    hamburger = document.createElement('button');
    hamburger.className = 'hamburger-btn';
    hamburger.setAttribute('aria-label', 'Open navigation menu');
    hamburger.setAttribute('aria-expanded', 'false');
    hamburger.setAttribute('aria-controls', 'mobile-drawer');
    hamburger.innerHTML = `
      <span class="hamburger-bar"></span>
      <span class="hamburger-bar"></span>
      <span class="hamburger-bar"></span>`;
    const headerInner = qs('.header-inner');
    if (headerInner) {
      const themeBtn = qs('#theme-toggle');
      if (themeBtn) headerInner.insertBefore(hamburger, themeBtn);
      else headerInner.appendChild(hamburger);
    }

    // Overlay
    overlay = document.createElement('div');
    overlay.className = 'mobile-overlay';
    overlay.id = 'mobile-overlay';
    overlay.setAttribute('aria-hidden', 'true');
    document.body.appendChild(overlay);

    // Drawer
    drawer = document.createElement('nav');
    drawer.id = 'mobile-drawer';
    drawer.className = 'mobile-drawer';
    drawer.setAttribute('aria-label', 'Mobile navigation');

    // Build nav items from the desktop nav
    const links = Array.from(qsa('.nav-link[data-week]'));
    const navHTML = links.map(link => {
      const week = link.dataset.week;
      const label = link.querySelector('.nav-label')?.textContent?.trim() || '';
      const href  = link.getAttribute('href') || `#week${week}`;
      return `<a href="${href}" class="mobile-nav-link" data-week="${week}">
                <span class="mobile-nav-week">${week.padStart(2, '0')}</span>
                ${label}
              </a>`;
    }).join('');

    drawer.innerHTML = `
      <div class="mobile-drawer-header">Course Navigation</div>
      <div class="mobile-drawer-nav">${navHTML}</div>`;
    document.body.appendChild(drawer);

    // Events
    hamburger.addEventListener('click', toggle);
    overlay.addEventListener('click', close);
    drawer.addEventListener('click', e => {
      if (e.target.closest('.mobile-nav-link')) close();
    });
  }

  function open() {
    if (isOpen) return;
    isOpen = true;
    hamburger?.setAttribute('aria-expanded', 'true');
    drawer?.classList.add('open');
    overlay?.classList.add('visible');
    overlay?.removeAttribute('aria-hidden');
    // Don't freeze body scroll — just let drawer scroll internally
    // This avoids the "frozen gray overlay" bug
  }

  function close() {
    if (!isOpen) return;
    isOpen = false;
    hamburger?.setAttribute('aria-expanded', 'false');
    drawer?.classList.remove('open');
    overlay?.classList.remove('visible');
    overlay?.setAttribute('aria-hidden', 'true');
  }

  function toggle() {
    if (isOpen) close(); else open();
  }

  function init() {
    injectStyles();
    create();

    // Close on Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape' && isOpen) close();
    });
  }

  return { init, open, close, toggle, get isOpen() { return isOpen; } };
})();

/* ============================================================
   15. QUICK NAVIGATION — jump links injected at top of main
   ============================================================ */
const QuickNav = (() => {
  function init() {
    const main = qs('#main-content');
    if (!main) return;

    const container = document.createElement('div');
    container.className = 'quick-nav';
    container.setAttribute('role', 'navigation');
    container.setAttribute('aria-label', 'Jump to week');

    const links = Array.from({ length: 10 }, (_, i) => {
      const w = i + 1;
      return `<a href="#week${w}" class="quick-nav-link" aria-label="Jump to Week ${w}">Week ${w}</a>`;
    }).join('');

    container.innerHTML = `<span class="quick-nav-label">Jump to:</span>${links}`;
    main.insertBefore(container, main.firstChild);

    const style = document.createElement('style');
    style.textContent = `
      .quick-nav {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
        padding: 14px 0 24px;
        max-width: var(--content-max);
        margin: 0 auto 0;
      }
      .quick-nav-label {
        font-size: 0.70rem;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-faint);
        white-space: nowrap;
      }
      .quick-nav-link {
        font-size: 0.72rem;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: var(--radius-full);
        border: 1px solid var(--border-soft);
        color: var(--text-muted);
        background: var(--bg-surface);
        transition: all 0.14s;
        white-space: nowrap;
      }
      .quick-nav-link:hover {
        background: var(--primary-glow);
        border-color: var(--primary-border);
        color: var(--primary);
      }
      @media (max-width: 480px) { .quick-nav { display: none; } }
    `;
    document.head.appendChild(style);
  }

  return { init };
})();

/* ============================================================
   16. ACCESSIBILITY ENHANCEMENTS
   ============================================================ */
const A11y = (() => {
  function init() {
    // Skip-to-content link
    if (!qs('#skip-to-main')) {
      const skip = document.createElement('a');
      skip.id = 'skip-to-main';
      skip.href = '#main-content';
      skip.className = 'skip-link';
      skip.textContent = 'Skip to main content';
      document.body.insertBefore(skip, document.body.firstChild);

      const style = document.createElement('style');
      style.textContent = `
        .skip-link {
          position: absolute;
          top: -60px;
          left: 12px;
          z-index: 9999;
          background: var(--primary);
          color: #fff;
          padding: 8px 16px;
          border-radius: 0 0 var(--radius-md) var(--radius-md);
          font-size: 0.85rem;
          font-weight: 600;
          text-decoration: none;
          transition: top 0.2s;
          outline: none;
        }
        .skip-link:focus { top: 0; }
      `;
      document.head.appendChild(style);
    }

    // Add tabindex=0 to week articles for keyboard navigation
    qsa('.week-article').forEach(article => {
      if (!article.hasAttribute('tabindex')) {
        article.setAttribute('tabindex', '-1');
      }
    });

    // Ensure all details/summary are keyboard accessible
    qsa('details summary').forEach(s => {
      if (!s.hasAttribute('tabindex')) s.setAttribute('tabindex', '0');
    });

    // Announce dynamic progress updates to screen readers
    let liveRegion = qs('#a11y-live');
    if (!liveRegion) {
      liveRegion = document.createElement('div');
      liveRegion.id = 'a11y-live';
      liveRegion.setAttribute('aria-live', 'polite');
      liveRegion.setAttribute('aria-atomic', 'true');
      liveRegion.className = 'sr-only';
      document.body.appendChild(liveRegion);
    }
  }

  function announce(msg) {
    const region = qs('#a11y-live');
    if (!region) return;
    region.textContent = '';
    requestAnimationFrame(() => { region.textContent = msg; });
  }

  return { init, announce };
})();

/* ============================================================
   17. PERFORMANCE — lazy image / MathJax helpers
   ============================================================ */
const Performance = (() => {
  /**
   * Re-run MathJax typesetting after dynamic content changes
   * (e.g., collapsible sections opened, search results rendered)
   */
  function retypeset(el) {
    if (window.MathJax && MathJax.typesetPromise) {
      MathJax.typesetPromise([el || document.body]).catch(() => {});
    }
  }

  /**
   * Intersection Observer for animating sections into view
   */
  function initScrollAnimations() {
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });

    qsa('.week-header, .formula-card, .theorem-block, .concept-block, .example-block').forEach(el => {
      observer.observe(el);
    });

    const style = document.createElement('style');
    style.textContent = `
      .week-header,
      .formula-card,
      .theorem-block,
      .concept-block,
      .example-block {
        opacity: 0;
        transform: translateY(14px);
        transition: opacity 0.45s ease, transform 0.45s ease;
      }
      .in-view {
        opacity: 1 !important;
        transform: none !important;
      }
      @media (prefers-reduced-motion: reduce) {
        .week-header,
        .formula-card,
        .theorem-block,
        .concept-block,
        .example-block {
          opacity: 1 !important;
          transform: none !important;
        }
      }
    `;
    document.head.appendChild(style);
  }

  function init() {
    initScrollAnimations();
  }

  return { init, retypeset };
})();

/* ============================================================
   18. COMPLETED WEEK STYLING
   ============================================================ */
const CompletedWeekStyles = (() => {
  function init() {
    const style = document.createElement('style');
    style.textContent = `
      .week-article--completed .week-header {
        border-color: rgba(16,185,129,0.30) !important;
        background: linear-gradient(135deg, var(--bg-surface), rgba(16,185,129,0.04)) !important;
      }
      .week-article--completed .week-number-badge {
        color: var(--success) !important;
      }
      .week-article--completed .week-header::before {
        background: linear-gradient(90deg, var(--success), transparent) !important;
      }
      .week-article--completed .week-complete-btn {
        background: var(--success-bg) !important;
        border-color: rgba(16,185,129,0.30) !important;
        color: var(--success) !important;
      }
    `;
    document.head.appendChild(style);
  }

  return { init };
})();

/* ============================================================
   INIT — Bootstrap everything when DOM is ready
   ============================================================ */
function bootstrap() {
  // Order matters: theme first to avoid flash, then navigation, then features
  ThemeManager.init();
  MobileMenu.init();
  SmoothNav.init();
  ScrollSpy.init();
  ProgressTracker.init();
  DashboardCounters.init();
  CollapsibleSections.init();
  FAQAccordion.init();
  PracticeSystem.init();
  FormulaInteractions.init();
  BackToTop.init();
  StudyMode.init();
  QuickNav.init();
  SearchSystem.init();
  KeyboardShortcuts.init();
  A11y.init();
  Performance.init();
  CompletedWeekStyles.init();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  // DOM already parsed (script deferred or at bottom)
  bootstrap();
}
