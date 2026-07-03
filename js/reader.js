/**
 * Story Reader — native reading experience for article pages.
 * Text size, font family, themes, and optional book mode (large screens).
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'story-reader-prefs';
  var BOOK_MIN_WIDTH = 900;
  var INLINE_CONTROLS_MIN_WIDTH = 768;
  var FONT_SIZE_MIN = 0.875;
  var FONT_SIZE_MAX = 2;
  var FONT_SIZE_STEP = 0.125;
  var LINE_HEIGHT_MIN = 1.4;
  var LINE_HEIGHT_MAX = 2.2;
  var LINE_HEIGHT_STEP = 0.1;
  var SWIPE_THRESHOLD = 50;
  var MEASURE_SAFETY = 12;

  var FONTS = [
    { id: 'default', label: 'Palatino', google: null, category: 'serif' },
    { id: 'literata', label: 'Literata', google: 'Literata', category: 'serif' },
    { id: 'lora', label: 'Lora', google: 'Lora', category: 'serif' },
    { id: 'merriweather', label: 'Merriweather', google: 'Merriweather', category: 'serif' },
    { id: 'crimson-pro', label: 'Crimson Pro', google: 'Crimson Pro', category: 'serif' },
    { id: 'eb-garamond', label: 'EB Garamond', google: 'EB Garamond', category: 'serif' },
    { id: 'source-serif-4', label: 'Source Serif 4', google: 'Source Serif 4', category: 'serif' },
    { id: 'inter', label: 'Inter', google: 'Inter', category: 'sans' },
    { id: 'source-sans-3', label: 'Source Sans 3', google: 'Source Sans 3', category: 'sans' },
    { id: 'ibm-plex-sans', label: 'IBM Plex Sans', google: 'IBM Plex Sans', category: 'sans' },
    { id: 'atkinson-hyperlegible', label: 'Atkinson Hyperlegible', google: 'Atkinson Hyperlegible', category: 'sans', weights: '400;700' },
    { id: 'work-sans', label: 'Work Sans', google: 'Work Sans', category: 'sans' }
  ];

  var THEMES = ['light', 'dark', 'beige'];

  var article = document.querySelector('article');
  if (!article) return;

  document.body.classList.add('reader-page');

  /* ── Preferences ─────────────────────────────────────────────── */

  function loadPrefs() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (raw) return Object.assign(defaultPrefs(), JSON.parse(raw));
    } catch (e) { /* ignore */ }
    return defaultPrefs();
  }

  function defaultPrefs() {
    return {
      theme: 'light',
      fontSize: 1.25,
      lineHeight: 1.6,
      fontFamily: 'default',
      bookMode: false
    };
  }

  function savePrefs() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
    } catch (e) { /* ignore */ }
  }

  var prefs = loadPrefs();
  var loadedFonts = {};

  /* ── DOM setup ───────────────────────────────────────────────── */

  var backLinks = article.querySelectorAll('.back-link');
  var bottomNav = backLinks[backLinks.length - 1] || null;

  var contentWrap = document.createElement('div');
  contentWrap.className = 'reader-content';

  Array.from(article.children).forEach(function (child) {
    if (child.classList.contains('back-link')) return;
    contentWrap.appendChild(child);
  });

  if (bottomNav) {
    article.insertBefore(contentWrap, bottomNav);
  } else {
    article.appendChild(contentWrap);
  }

  /* ── Article art (image or prompt card) ──────────────────────── */

  var IMAGE_EXTENSIONS = ['jpg', 'png', 'webp'];

  function getPromptText(figure) {
    var el = figure.querySelector('.article-art-prompt');
    return el ? el.textContent.trim() : '';
  }

  function probeImage(slug, onFound, onMissing) {
    var extIndex = 0;

    function tryNext() {
      if (extIndex >= IMAGE_EXTENSIONS.length) {
        onMissing();
        return;
      }
      var ext = IMAGE_EXTENSIONS[extIndex];
      extIndex += 1;
      var img = new Image();
      img.onload = function () { onFound('../images/' + slug + '.' + ext); };
      img.onerror = tryNext;
      img.src = '../images/' + slug + '.' + ext;
    }

    tryNext();
  }

  function renderPromptCard(figure, prompt) {
    figure.classList.add('article-art--missing');
    figure.dataset.prompt = prompt;
    figure.innerHTML =
      '<div class="article-art-card">' +
        '<p class="article-art-label">Image prompt</p>' +
        '<p class="article-art-prompt">' + escapeHtml(prompt) + '</p>' +
        '<button type="button" class="article-art-copy" data-copy-prompt>Copy prompt</button>' +
      '</div>';
  }

  function renderHeroImage(figure, src, prompt) {
    figure.classList.add('article-art--loaded');
    figure.dataset.prompt = prompt;
    figure.innerHTML =
      '<img class="article-art-img" src="' + escapeHtml(src) + '" alt="">' +
      '<details class="article-art-details">' +
        '<summary>Image prompt</summary>' +
        '<p class="article-art-prompt">' + escapeHtml(prompt) + '</p>' +
        '<button type="button" class="article-art-copy" data-copy-prompt>Copy prompt</button>' +
      '</details>';
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  function initArticleArt() {
    var figures = contentWrap.querySelectorAll('figure.article-art[data-image-slug]');
    figures.forEach(function (figure) {
      var slug = figure.dataset.imageSlug;
      var prompt = getPromptText(figure);
      if (!slug) return;

      probeImage(slug, function (src) {
        renderHeroImage(figure, src, prompt);
      }, function () {
        renderPromptCard(figure, prompt);
      });
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('[data-copy-prompt]');
    if (!btn) return;

    var container = btn.closest('figure.article-art');
    var text = container ? container.dataset.prompt : '';
    if (!text) return;

    function showCopied() {
      var label = btn.textContent;
      btn.textContent = 'Copied';
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = label;
        btn.disabled = false;
      }, 1500);
    }

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(showCopied).catch(function () {
        fallbackCopy(text, showCopied);
      });
    } else {
      fallbackCopy(text, showCopied);
    }
  });

  function fallbackCopy(text, onSuccess) {
    var ta = document.createElement('textarea');
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.position = 'absolute';
    ta.style.left = '-9999px';
    document.body.appendChild(ta);
    ta.select();
    try {
      document.execCommand('copy');
      onSuccess();
    } catch (e) { /* ignore */ }
    document.body.removeChild(ta);
  }

  initArticleArt();

  /* ── Controls UI ─────────────────────────────────────────────── */

  var panel = document.createElement('aside');
  panel.className = 'reader-controls';
  panel.setAttribute('aria-label', 'Reading controls');
  panel.innerHTML =
    '<button type="button" class="reader-controls-toggle" aria-expanded="false" aria-controls="reader-controls-panel" title="Reading settings">' +
      '<span class="reader-controls-icon" aria-hidden="true">Aa</span>' +
    '</button>' +
    '<div id="reader-controls-panel" class="reader-controls-panel" hidden>' +
      '<fieldset class="reader-fieldset">' +
        '<legend>Theme</legend>' +
        '<div class="reader-theme-group" role="group" aria-label="Color theme"></div>' +
      '</fieldset>' +
      '<fieldset class="reader-fieldset">' +
        '<legend>Font</legend>' +
        '<select class="reader-font-select" aria-label="Font family"></select>' +
      '</fieldset>' +
      '<fieldset class="reader-fieldset">' +
        '<legend>Size</legend>' +
        '<div class="reader-size-group">' +
          '<button type="button" class="reader-size-btn" data-action="decrease" aria-label="Decrease text size">A−</button>' +
          '<span class="reader-size-label" aria-live="polite"></span>' +
          '<button type="button" class="reader-size-btn" data-action="increase" aria-label="Increase text size">A+</button>' +
        '</div>' +
      '</fieldset>' +
      '<fieldset class="reader-fieldset">' +
        '<legend>Line height</legend>' +
        '<div class="reader-size-group reader-line-height-group">' +
          '<button type="button" class="reader-size-btn" data-action="decrease-line-height" aria-label="Decrease line height">−</button>' +
          '<span class="reader-size-label reader-line-height-label" aria-live="polite"></span>' +
          '<button type="button" class="reader-size-btn" data-action="increase-line-height" aria-label="Increase line height">+</button>' +
        '</div>' +
      '</fieldset>' +
      '<fieldset class="reader-fieldset reader-book-fieldset">' +
        '<legend>Layout</legend>' +
        '<label class="reader-book-toggle">' +
          '<input type="checkbox" class="reader-book-checkbox">' +
          '<span>Book mode</span>' +
        '</label>' +
        '<p class="reader-book-hint">Two columns · swipe or arrow keys</p>' +
      '</fieldset>' +
    '</div>';

  document.body.appendChild(panel);

  var toggleBtn = panel.querySelector('.reader-controls-toggle');
  var controlsPanel = panel.querySelector('.reader-controls-panel');
  var themeGroup = panel.querySelector('.reader-theme-group');
  var fontSelect = panel.querySelector('.reader-font-select');
  var sizeLabel = panel.querySelector('.reader-size-group .reader-size-label');
  var lineHeightLabel = panel.querySelector('.reader-line-height-label');
  var bookFieldset = panel.querySelector('.reader-book-fieldset');
  var bookCheckbox = panel.querySelector('.reader-book-checkbox');

  THEMES.forEach(function (theme) {
    var btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'reader-theme-btn';
    btn.dataset.theme = theme;
    btn.textContent = theme.charAt(0).toUpperCase() + theme.slice(1);
    btn.setAttribute('aria-pressed', 'false');
    themeGroup.appendChild(btn);
  });

  var fontGroups = {};
  FONTS.forEach(function (font) {
    var groupKey = font.category === 'sans' ? 'sans' : 'serif';
    if (!fontGroups[groupKey]) {
      var og = document.createElement('optgroup');
      og.label = groupKey === 'sans' ? 'Sans serif' : 'Serif';
      fontSelect.appendChild(og);
      fontGroups[groupKey] = og;
    }
    var opt = document.createElement('option');
    opt.value = font.id;
    opt.textContent = font.label;
    fontGroups[groupKey].appendChild(opt);
  });

  /* ── Book mode ───────────────────────────────────────────────── */

  var bookView = null;
  var bookSpread = null;
  var colLeft = null;
  var colRight = null;
  var navPrev = null;
  var navNext = null;
  var pageIndicator = null;
  var pages = [];
  var spreadIndex = 0;
  var bookActive = false;
  var touchStartX = 0;
  var touchStartY = 0;

  function canUseBookMode() {
    return window.innerWidth >= BOOK_MIN_WIDTH;
  }

  function isInlineControls() {
    return window.innerWidth >= INLINE_CONTROLS_MIN_WIDTH;
  }

  function updateControlsLayout() {
    var inline = isInlineControls();

    if (inline) {
      controlsPanel.hidden = false;
      toggleBtn.setAttribute('aria-expanded', 'true');
    } else {
      controlsPanel.hidden = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  }

  function ensureBookView() {
    if (bookView) return;

    bookView = document.createElement('div');
    bookView.className = 'book-view';
    bookView.hidden = true;

    navPrev = document.createElement('button');
    navPrev.type = 'button';
    navPrev.className = 'book-nav book-nav-prev';
    navPrev.setAttribute('aria-label', 'Previous page');
    navPrev.innerHTML = '&#8592;';

    navNext = document.createElement('button');
    navNext.type = 'button';
    navNext.className = 'book-nav book-nav-next';
    navNext.setAttribute('aria-label', 'Next page');
    navNext.innerHTML = '&#8594;';

    bookSpread = document.createElement('div');
    bookSpread.className = 'book-spread';

    colLeft = document.createElement('div');
    colLeft.className = 'book-col book-col-left';

    colRight = document.createElement('div');
    colRight.className = 'book-col book-col-right';

    pageIndicator = document.createElement('p');
    pageIndicator.className = 'book-page-indicator';
    pageIndicator.setAttribute('aria-live', 'polite');

    bookSpread.appendChild(colLeft);
    bookSpread.appendChild(colRight);
    bookView.appendChild(navPrev);
    bookView.appendChild(bookSpread);
    bookView.appendChild(navNext);
    bookView.appendChild(pageIndicator);

    article.insertBefore(bookView, contentWrap);

    navPrev.addEventListener('click', goPrevSpread);
    navNext.addEventListener('click', goNextSpread);
    bookSpread.addEventListener('touchstart', onTouchStart, { passive: true });
    bookSpread.addEventListener('touchend', onTouchEnd, { passive: true });
  }

  function afterLayout(cb) {
    requestAnimationFrame(function () {
      requestAnimationFrame(cb);
    });
  }

  function measureColumnHeight() {
    if (!bookView || bookView.hidden) {
      return Math.max(150, Math.floor(window.innerHeight * 0.6));
    }

    bookView.offsetHeight;
    if (colLeft) colLeft.offsetHeight;

    var chrome = MEASURE_SAFETY;
    var topBack = article.querySelector('.back-link');
    if (topBack) {
      chrome += topBack.getBoundingClientRect().height;
    }

    var viewStyles = window.getComputedStyle(bookView);
    chrome += parseFloat(viewStyles.paddingTop) || 0;
    chrome += parseFloat(viewStyles.paddingBottom) || 0;

    var fromViewport = Math.floor(window.innerHeight - chrome);

    if (colLeft) {
      var colRect = colLeft.getBoundingClientRect();
      if (colRect.height >= 80) {
        var fromCol = Math.floor(colRect.height - MEASURE_SAFETY);
        return Math.max(150, Math.min(fromCol, fromViewport));
      }
    }

    return Math.max(150, fromViewport);
  }

  function measureColumnWidth() {
    var width = colLeft.clientWidth;
    if (width >= 100) return width;
    return Math.floor((Math.min(window.innerWidth - 120, 1152)) / 2);
  }

  function paginateContent() {
    pages = [];
    var sourceNodes = Array.from(contentWrap.children);
    if (!sourceNodes.length) return;

    fillColumn(colLeft, '');
    fillColumn(colRight, '');
    bookView.offsetHeight;
    colLeft.offsetHeight;

    var columnHeight = measureColumnHeight();
    var columnWidth = measureColumnWidth();

    var stash = document.createElement('div');
    stash.className = 'book-pagination-stash';
    stash.setAttribute('aria-hidden', 'true');
    bookView.appendChild(stash);
    stash.style.width = columnWidth + 'px';

    var currentCol = null;
    var colIndex = 0;

    function startColumn() {
      var col = document.createElement('div');
      col.className = 'book-col book-col-stash ' +
        (colIndex % 2 === 0 ? 'book-col-left' : 'book-col-right');
      colIndex += 1;
      stash.appendChild(col);
      currentCol = col;
      currentCol.style.height = columnHeight + 'px';
      currentCol.style.overflow = 'hidden';
    }

    startColumn();

    sourceNodes.forEach(function (node) {
      var clone = node.cloneNode(true);
      currentCol.appendChild(clone);

      if (currentCol.scrollHeight > columnHeight + 2) {
        currentCol.removeChild(clone);

        if (currentCol.childNodes.length === 0) {
          currentCol.appendChild(clone);
          startColumn();
          return;
        }

        startColumn();
        currentCol.appendChild(clone);
      }
    });

    pages = Array.from(stash.querySelectorAll('.book-col-stash')).map(function (col) {
      return col.innerHTML;
    });

    bookView.removeChild(stash);
  }

  function renderSpread() {
    if (!pages.length) return;

    var leftIdx = spreadIndex;
    var rightIdx = spreadIndex + 1;

    fillColumn(colLeft, pages[leftIdx]);
    fillColumn(colRight, pages[rightIdx]);

    navPrev.disabled = spreadIndex <= 0;
    navNext.disabled = spreadIndex + 2 >= pages.length;

    var humanLeft = leftIdx + 1;
    var humanRight = rightIdx < pages.length ? rightIdx + 1 : null;
    if (humanRight !== null && humanRight !== humanLeft) {
      pageIndicator.textContent = 'Pages ' + humanLeft + '–' + humanRight + ' of ' + pages.length;
    } else {
      pageIndicator.textContent = 'Page ' + humanLeft + ' of ' + pages.length;
    }
  }

  function fillColumn(colEl, html) {
    colEl.innerHTML = html || '';
  }

  function enterBookMode() {
    if (!canUseBookMode()) return;

    ensureBookView();
    document.body.classList.add('book-mode');
    bookView.hidden = false;
    contentWrap.hidden = true;
    bookActive = true;
    prefs.bookMode = true;
    savePrefs();

    afterLayout(function () {
      bookView.offsetHeight;
      colLeft.offsetHeight;
      paginateContent();
      spreadIndex = 0;
      renderSpread();
    });
  }

  function exitBookMode() {
    bookActive = false;
    if (bookView) {
      bookView.hidden = true;
      fillColumn(colLeft, '');
      fillColumn(colRight, '');
    }
    contentWrap.hidden = false;
    document.body.classList.remove('book-mode');
    pages = [];
    spreadIndex = 0;
    prefs.bookMode = false;
    savePrefs();
    bookCheckbox.checked = false;
  }

  function rebuildBookMode() {
    if (!bookActive) return;
    var idx = spreadIndex;
    afterLayout(function () {
      ensureBookView();
      bookView.offsetHeight;
      colLeft.offsetHeight;
      paginateContent();
      spreadIndex = Math.min(idx, Math.max(0, pages.length - 1));
      if (spreadIndex % 2 !== 0) spreadIndex -= 1;
      renderSpread();
    });
  }

  function goNextSpread() {
    if (spreadIndex + 2 < pages.length) {
      spreadIndex += 2;
      renderSpread();
    }
  }

  function goPrevSpread() {
    if (spreadIndex > 0) {
      spreadIndex = Math.max(0, spreadIndex - 2);
      renderSpread();
    }
  }

  function onTouchStart(e) {
    touchStartX = e.changedTouches[0].screenX;
    touchStartY = e.changedTouches[0].screenY;
  }

  function onTouchEnd(e) {
    var dx = e.changedTouches[0].screenX - touchStartX;
    var dy = e.changedTouches[0].screenY - touchStartY;

    if (Math.abs(dx) < SWIPE_THRESHOLD || Math.abs(dx) < Math.abs(dy)) return;

    if (dx < 0) goNextSpread();
    else goPrevSpread();
  }

  /* ── Apply preferences ───────────────────────────────────────── */

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    prefs.theme = theme;
    themeGroup.querySelectorAll('.reader-theme-btn').forEach(function (btn) {
      btn.setAttribute('aria-pressed', btn.dataset.theme === theme ? 'true' : 'false');
    });
    savePrefs();
  }

  function loadGoogleFont(fontId) {
    var font = FONTS.find(function (f) { return f.id === fontId; });
    if (!font || !font.google || loadedFonts[fontId]) return;

    var weights = font.weights || '400;600';
    var link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=' +
      encodeURIComponent(font.google).replace(/%20/g, '+') +
      ':wght@' + weights + '&display=swap';
    document.head.appendChild(link);
    loadedFonts[fontId] = true;
  }

  function applyFontFamily(fontId) {
    var font = FONTS.find(function (f) { return f.id === fontId; });
    if (!font) return;

    if (font.google) {
      loadGoogleFont(fontId);
      var fallback = font.category === 'sans'
        ? 'system-ui, -apple-system, sans-serif'
        : 'Georgia, serif';
      document.documentElement.style.setProperty(
        '--font-serif',
        '"' + font.google + '", ' + fallback
      );
    } else {
      document.documentElement.style.removeProperty('--font-serif');
    }

    prefs.fontFamily = fontId;
    fontSelect.value = fontId;
    savePrefs();
    rebuildBookMode();
  }

  function applyFontSize(size) {
    size = Math.max(FONT_SIZE_MIN, Math.min(FONT_SIZE_MAX, size));
    prefs.fontSize = size;
    document.documentElement.style.setProperty('--font-size-base', size + 'rem');
    sizeLabel.textContent = Math.round(size * 100) + '%';
    savePrefs();
    rebuildBookMode();
  }

  function applyLineHeight(height) {
    height = Math.max(LINE_HEIGHT_MIN, Math.min(LINE_HEIGHT_MAX, height));
    height = Math.round(height * 10) / 10;
    prefs.lineHeight = height;
    document.documentElement.style.setProperty('--line-height-base', String(height));
    lineHeightLabel.textContent = height.toFixed(1);
    savePrefs();
    rebuildBookMode();
  }

  function applyAllPrefs() {
    applyTheme(prefs.theme);
    applyFontSize(prefs.fontSize);
    applyLineHeight(prefs.lineHeight);
    applyFontFamily(prefs.fontFamily);
    updateBookModeAvailability();
  }

  function updateBookModeAvailability() {
    var available = canUseBookMode();
    bookFieldset.hidden = !available;
    if (!available && bookActive) {
      exitBookMode();
    }
  }

  /* ── Event handlers ──────────────────────────────────────────── */

  toggleBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (isInlineControls()) return;
    var open = controlsPanel.hidden;
    controlsPanel.hidden = !open;
    toggleBtn.setAttribute('aria-expanded', open ? 'true' : 'false');
  });

  document.addEventListener('click', function (e) {
    if (isInlineControls()) return;
    if (!panel.contains(e.target) && !controlsPanel.hidden) {
      controlsPanel.hidden = true;
      toggleBtn.setAttribute('aria-expanded', 'false');
    }
  });

  themeGroup.addEventListener('click', function (e) {
    var btn = e.target.closest('.reader-theme-btn');
    if (btn) applyTheme(btn.dataset.theme);
  });

  fontSelect.addEventListener('change', function () {
    applyFontFamily(fontSelect.value);
  });

  panel.querySelector('.reader-size-group:not(.reader-line-height-group)').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var delta = btn.dataset.action === 'increase' ? FONT_SIZE_STEP : -FONT_SIZE_STEP;
    applyFontSize(prefs.fontSize + delta);
  });

  panel.querySelector('.reader-line-height-group').addEventListener('click', function (e) {
    var btn = e.target.closest('[data-action]');
    if (!btn) return;
    var delta = btn.dataset.action === 'increase-line-height' ? LINE_HEIGHT_STEP : -LINE_HEIGHT_STEP;
    applyLineHeight(prefs.lineHeight + delta);
  });

  bookCheckbox.addEventListener('change', function () {
    if (bookCheckbox.checked) {
      enterBookMode();
    } else {
      exitBookMode();
    }
  });

  document.addEventListener('keydown', function (e) {
    if (!bookActive) return;
    if (e.target.matches('input, select, textarea')) return;

    if (e.key === 'ArrowRight' || e.key === 'PageDown') {
      e.preventDefault();
      goNextSpread();
    } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
      e.preventDefault();
      goPrevSpread();
    }
  });

  var resizeTimer;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      updateControlsLayout();
      updateBookModeAvailability();
      rebuildBookMode();
    }, 250);
  });

  /* ── Init ────────────────────────────────────────────────────── */

  applyAllPrefs();
  updateControlsLayout();

  if (prefs.bookMode && canUseBookMode()) {
    bookCheckbox.checked = true;
    enterBookMode();
  }

})();
