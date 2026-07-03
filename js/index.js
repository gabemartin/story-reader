/**
 * Story Reader — index page: saved theme + thumbnails from hero images.
 */
(function () {
  'use strict';

  var STORAGE_KEY = 'story-reader-prefs';
  var IMAGE_EXTENSIONS = ['jpg', 'png', 'webp'];

  function applySavedTheme() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      var prefs = JSON.parse(raw);
      if (prefs.theme) {
        document.documentElement.dataset.theme = prefs.theme;
      }
    } catch (e) { /* ignore */ }
  }

  applySavedTheme();
  var list = document.querySelector('.article-list');
  if (!list) return;

  function slugFromHref(href) {
    var match = href.match(/articles\/([^/]+)\.html$/);
    return match ? match[1] : null;
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
      img.onload = function () { onFound('images/' + slug + '.' + ext); };
      img.onerror = tryNext;
      img.src = 'images/' + slug + '.' + ext;
    }

    tryNext();
  }

  list.querySelectorAll('a.article-card').forEach(function (link, index) {
    var slug = slugFromHref(link.getAttribute('href'));
    if (!slug) return;

    var wrap = link.querySelector('.article-thumb-wrap');
    if (!wrap) return;

    var titleEl = link.querySelector('.article-title');
    var alt = titleEl ? titleEl.textContent.trim() : '';

    probeImage(slug, function (src) {
      var img = document.createElement('img');
      img.className = 'article-thumb';
      img.src = src;
      img.alt = alt;
      img.loading = index === 0 ? 'eager' : 'lazy';
      img.decoding = 'async';
      wrap.appendChild(img);
      link.classList.add('article-card--has-thumb');
    }, function () { /* no hero image yet */ });
  });
})();
