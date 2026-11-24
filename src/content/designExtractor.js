'use strict';

(() => {
  if (window.__StyleSniperExtractor) return;

  const SKIP_TAGS = new Set([
    'SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE', 'META', 'LINK', 'HEAD', 'TITLE', 'IFRAME'
  ]);

  function extractDesignSystem() {
    const startTime = performance.now();
    const contrast = window.__StyleSniperContrast;
    const colorMap = new Map();
    const fontMap = new Map();
    const svgMap = new Map();

    const allNodes = document.querySelectorAll('body *');
    const maxScan = Math.min(allNodes.length, 2500);
    const step = allNodes.length > 2500 ? Math.ceil(allNodes.length / 2500) : 1;

    function addColor(cssVal, role, weight = 1) {
      if (!cssVal || !contrast) return;
      const parsed = contrast.parseColor(cssVal);
      if (!parsed || parsed.a < 0.08) return;
      const hex = contrast.rgbaToHex(parsed);
      let entry = colorMap.get(hex);
      if (!entry) {
        entry = {
          hex,
          rgb: `rgb(${parsed.r}, ${parsed.g}, ${parsed.b})`,
          count: 0,
          roles: new Set(),
          luminance: contrast.relativeLuminance(parsed)
        };
        colorMap.set(hex, entry);
      }
      entry.count += weight;
      entry.roles.add(role);
    }

    for (let i = 0; i < allNodes.length && i / step < maxScan; i += step) {
      const el = allNodes[i];
      if (!el || el.id === 'stylesniper-shadow-host') continue;
      if (SKIP_TAGS.has(el.tagName)) continue;

      const style = window.getComputedStyle(el);
      if (style.display === 'none' || style.visibility === 'hidden') continue;

      // Colors
      addColor(style.backgroundColor, 'bg', 2);
      addColor(style.color, 'text', 1);
      if (parseFloat(style.borderTopWidth) > 0 && style.borderTopStyle !== 'none') {
        addColor(style.borderTopColor, 'border', 1);
      }

      // Typography (only elements with direct non-empty text nodes)
      let hasDirectText = false;
      let sampleText = '';
      for (let c = 0; c < el.childNodes.length; c++) {
        const node = el.childNodes[c];
        if (node.nodeType === 3 && node.nodeValue && node.nodeValue.trim().length > 0) {
          hasDirectText = true;
          sampleText = node.nodeValue.trim().replace(/\s+/g, ' ').slice(0, 42);
          break;
        }
      }

      if (hasDirectText) {
        const rawFamily = (style.fontFamily || 'sans-serif').split(',')[0].replace(/['"]/g, '').trim();
        const sizePx = Math.round(parseFloat(style.fontSize) || 16);
        const weight = style.fontWeight || '400';
        const lineHeight = style.lineHeight === 'normal'
          ? 'normal'
          : `${Math.round(parseFloat(style.lineHeight) || sizePx * 1.4)}px`;

        const key = `${rawFamily}|${weight}|${sizePx}`;
        let fEntry = fontMap.get(key);
        if (!fEntry) {
          fEntry = {
            family: rawFamily,
            fullStack: style.fontFamily,
            weight,
            sizePx,
            lineHeight,
            sample: sampleText,
            count: 0
          };
          fontMap.set(key, fEntry);
        }
        fEntry.count++;
      }
    }

    // Dedicated full-page Inline SVG Gobbler (scan all SVGs, not sampled)
    const svgs = document.querySelectorAll('svg');
    let svgIndex = 0;
    for (let i = 0; i < svgs.length && svgIndex < 120; i++) {
      const svg = svgs[i];
      if (svg.closest && svg.closest('#stylesniper-shadow-host')) continue;
      const rect = svg.getBoundingClientRect();
      if (rect.width < 4 || rect.height < 4) continue;

      try {
        const clone = svg.cloneNode(true);
        // Strip scripts for safety
        clone.querySelectorAll('script').forEach((s) => s.remove());

        // Resolve <use href="#..."> symbols inline so exported SVG is standalone
        clone.querySelectorAll('use').forEach((useEl) => {
          const href = useEl.getAttribute('href') || useEl.getAttribute('xlink:href');
          if (href && href.startsWith('#')) {
            const ref = document.getElementById(href.slice(1));
            if (ref) {
              const g = document.createElementNS('http://www.w3.org/2000/svg', 'g');
              g.innerHTML = ref.innerHTML;
              if (!clone.getAttribute('viewBox') && ref.getAttribute('viewBox')) {
                clone.setAttribute('viewBox', ref.getAttribute('viewBox'));
              }
              useEl.replaceWith(g);
            }
          }
        });

        if (!clone.getAttribute('xmlns')) {
          clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        }
        if (!clone.getAttribute('viewBox')) {
          clone.setAttribute('viewBox', `0 0 ${Math.round(rect.width)} ${Math.round(rect.height)}`);
        }

        // Preserve computed currentColor fill/stroke if present
        const cs = window.getComputedStyle(svg);
        if (!clone.getAttribute('color') && cs.color) {
          clone.setAttribute('color', cs.color);
        }
        clone.removeAttribute('class');
        clone.removeAttribute('style');

        const markup = clone.outerHTML;
        const hashKey = markup.replace(/\s+/g, ' ').trim();
        if (svgMap.has(hashKey)) {
          svgMap.get(hashKey).count++;
          continue;
        }

        svgIndex++;
        const ariaLabel =
          svg.getAttribute('aria-label') ||
          svg.getAttribute('data-icon') ||
          (svg.querySelector('title') && svg.querySelector('title').textContent) ||
          `icon-${svgIndex}`;
        const cleanName = ariaLabel
          .toLowerCase()
          .replace(/[^a-z0-9-_]+/g, '-')
          .replace(/^-+|-+$/g, '') || `icon-${svgIndex}`;

        svgMap.set(hashKey, {
          id: `svg-${svgIndex}`,
          name: cleanName,
          width: Math.round(rect.width),
          height: Math.round(rect.height),
          markup,
          sizeBytes: new Blob([markup]).size,
          count: 1
        });
      } catch (_) {
        // Ignore malformed SVG nodes
      }
    }

    const colors = Array.from(colorMap.values())
      .map((c) => ({ ...c, roles: Array.from(c.roles) }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 28);

    const typography = Array.from(fontMap.values())
      .sort((a, b) => b.sizePx - a.sizePx || b.count - a.count)
      .slice(0, 24);

    const svgList = Array.from(svgMap.values());
    const durationMs = Math.max(1, Math.round(performance.now() - startTime));

    return {
      url: window.location.href,
      title: document.title || window.location.hostname,
      durationMs,
      colors,
      typography,
      svgs: svgList
    };
  }

  function toCssVariables(colors) {
    const lines = [':root {'];
    colors.forEach((c, idx) => {
      const role = c.roles[0] || 'brand';
      lines.push(`  --color-${role}-${idx + 1}: ${c.hex}; /* ${c.count} uses */`);
    });
    lines.push('}');
    return lines.join('\n');
  }

  function toTailwindConfig(colors) {
    const entries = colors.map((c, idx) => {
      const role = c.roles[0] || 'brand';
      return `        '${role}-${idx + 1}': '${c.hex}',`;
    });
    return [
      '// tailwind.config.js',
      'module.exports = {',
      '  theme: {',
      '    extend: {',
      '      colors: {',
      ...entries,
      '      },',
      '    },',
      '  },',
      '};'
    ].join('\n');
  }

  window.__StyleSniperExtractor = {
    extractDesignSystem,
    toCssVariables,
    toTailwindConfig
  };
})();
