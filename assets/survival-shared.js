(function(global) {
  function parseDate(iso) {
    if (!iso) return null;
    var date = new Date(iso);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function formatAbsolute(iso) {
    var date = parseDate(iso);
    if (!date) return iso || 'unknown';
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function formatRelativeFull(iso) {
    var date = parseDate(iso);
    if (!date) return iso || 'Recent timestamp unavailable';

    var diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
    if (diffMinutes < 1) return 'just now';
    if (diffMinutes < 60) return diffMinutes + ' min ago';

    var diffHours = Math.round(diffMinutes / 60);
    if (diffHours < 24) return diffHours + ' hr ago';

    var diffDays = Math.round(diffHours / 24);
    return diffDays + ' day' + (diffDays > 1 ? 's' : '') + ' ago';
  }

  function formatRelativeCompact(iso) {
    var date = parseDate(iso);
    if (!date) return iso || 'unknown';

    var diff = Date.now() - date.getTime();
    var minute = 60 * 1000;
    var hour = 60 * minute;
    var day = 24 * hour;

    if (diff < hour) return Math.max(1, Math.round(diff / minute)) + 'm ago';
    if (diff < day) return Math.round(diff / hour) + 'h ago';
    if (diff < day * 14) return Math.round(diff / day) + 'd ago';
    return formatAbsolute(iso);
  }

  function toViewUrl(url) {
    if (!url) return 'survival-log.html';
    return url.indexOf('https://citriac.github.io/') === 0
      ? url.replace('https://citriac.github.io/', '')
      : url;
  }

  function isExternalUrl(url) {
    return /^https?:\/\//i.test(url || '');
  }

  function getEvidence(entry) {
    return entry && entry.evidence ? entry.evidence : {};
  }

  function getEvidenceBullets(entry, limit) {
    var bullets = Array.isArray(getEvidence(entry).bullets) ? getEvidence(entry).bullets.slice() : [];
    return typeof limit === 'number' ? bullets.slice(0, limit) : bullets;
  }

  function getEvidenceLinks(entry, options) {
    var opts = options || {};
    var links = Array.isArray(getEvidence(entry).links)
      ? getEvidence(entry).links.filter(function(link) {
          return link && link.url;
        })
      : [];

    if (opts.excludeHome) {
      links = links.filter(function(link) {
        return link.label !== 'Home';
      });
    }

    if (!opts.viewUrl) return links;

    return links.map(function(link) {
      var copy = Object.assign({}, link);
      copy.url = toViewUrl(link.url);
      return copy;
    });
  }

  function getSourceBits(entry, options) {
    var opts = options || {};
    var evidence = getEvidence(entry);
    var bits = [];

    if (evidence.source_file) bits.push(evidence.source_file);
    if (evidence.source_heading) bits.push(evidence.source_heading);
    if (opts.includeTime) bits.push(formatAbsolute(evidence.source_time || (entry && entry.time)));

    return bits.filter(Boolean);
  }

  function getEvidenceCount(entry, options) {
    var evidence = getEvidence(entry);
    var sourceCount = evidence.source_heading ? 1 : 0;
    return getEvidenceLinks(entry, options).length + getEvidenceBullets(entry).length + sourceCount;
  }

  function pickBestProofLink(entry) {
    var links = getEvidenceLinks(entry, { excludeHome: true });
    var priority = { offer: 0, story: 1, status: 2, post: 3, page: 4 };

    if (!links.length) return null;

    links.sort(function(a, b) {
      var aPriority = Object.prototype.hasOwnProperty.call(priority, a.kind) ? priority[a.kind] : 9;
      var bPriority = Object.prototype.hasOwnProperty.call(priority, b.kind) ? priority[b.kind] : 9;
      return aPriority - bPriority;
    });

    return links[0];
  }

  function applyLink(anchor, link, options) {
    if (!anchor) return;

    var opts = options || {};
    var href = opts.viewUrl === false
      ? (link && link.url ? link.url : (opts.fallbackHref || '#'))
      : toViewUrl(link && link.url);
    var text = opts.fallbackText || 'Open link';

    if (link) {
      text = typeof opts.textBuilder === 'function'
        ? opts.textBuilder(link)
        : (link.label || text);
    }

    anchor.setAttribute('href', href || opts.fallbackHref || '#');
    anchor.textContent = text;

    if (isExternalUrl(href)) {
      anchor.setAttribute('target', '_blank');
      anchor.setAttribute('rel', 'noreferrer');
    } else {
      anchor.removeAttribute('target');
      anchor.removeAttribute('rel');
    }
  }

  global.ClavisSurvival = {
    escapeHtml: escapeHtml,
    formatAbsolute: formatAbsolute,
    formatRelativeFull: formatRelativeFull,
    formatRelativeCompact: formatRelativeCompact,
    toViewUrl: toViewUrl,
    isExternalUrl: isExternalUrl,
    getEvidenceBullets: getEvidenceBullets,
    getEvidenceLinks: getEvidenceLinks,
    getSourceBits: getSourceBits,
    getEvidenceCount: getEvidenceCount,
    pickBestProofLink: pickBestProofLink,
    applyLink: applyLink
  };
})(window);
