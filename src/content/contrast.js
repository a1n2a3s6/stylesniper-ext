'use strict';

(() => {
  if (window.__StyleSniperContrast) return;

  let colorCanvasCtx = null;

  function getColorCanvasCtx() {
    if (colorCanvasCtx) return colorCanvasCtx;
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 1;
      canvas.height = 1;
      colorCanvasCtx = canvas.getContext('2d', { willReadFrequently: true });
    } catch (_) {
      colorCanvasCtx = null;
    }
    return colorCanvasCtx;
  }

  function clamp(val, min, max) {
    return Math.min(max, Math.max(min, val));
  }

  function parseHex(str) {
    const hex = str.slice(1).trim();
    if (hex.length === 3) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: 1
      };
    }
    if (hex.length === 4) {
      return {
        r: parseInt(hex[0] + hex[0], 16),
        g: parseInt(hex[1] + hex[1], 16),
        b: parseInt(hex[2] + hex[2], 16),
        a: parseInt(hex[3] + hex[3], 16) / 255
      };
    }
    if (hex.length === 6) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1
      };
    }
    if (hex.length === 8) {
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: parseInt(hex.slice(6, 8), 16) / 255
      };
    }
    return null;
  }

  function hslToRgb(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    let r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return {
      r: Math.round((r + m) * 255),
      g: Math.round((g + m) * 255),
      b: Math.round((b + m) * 255)
    };
  }

  function parseAlpha(raw) {
    if (raw === undefined || raw === null || raw === '') return 1;
    const trimmed = String(raw).trim();
    if (trimmed.endsWith('%')) {
      return clamp(parseFloat(trimmed) / 100, 0, 1);
    }
    const n = parseFloat(trimmed);
    return Number.isNaN(n) ? 1 : clamp(n, 0, 1);
  }

  function parseColor(input) {
    if (!input || typeof input !== 'string') return null;
    const str = input.trim().toLowerCase();
    if (!str || str === 'transparent' || str === 'none') {
      return { r: 0, g: 0, b: 0, a: 0 };
    }

    if (str.startsWith('#')) {
      return parseHex(str);
    }

    // Standard rgb/rgba (both comma-separated and CSS Color 4 space-separated)
    const rgbMatch = str.match(
      /^rgba?\(\s*([0-9.]+%?)\s*[,\s]\s*([0-9.]+%?)\s*[,\s]\s*([0-9.]+%?)(?:\s*[,/]\s*([0-9.]+%?))?\s*\)$/
    );
    if (rgbMatch) {
      const parseChannel = (v) =>
        v.endsWith('%') ? Math.round((parseFloat(v) / 100) * 255) : Math.round(parseFloat(v));
      return {
        r: clamp(parseChannel(rgbMatch[1]), 0, 255),
        g: clamp(parseChannel(rgbMatch[2]), 0, 255),
        b: clamp(parseChannel(rgbMatch[3]), 0, 255),
        a: parseAlpha(rgbMatch[4])
      };
    }

    // Standard hsl/hsla
    const hslMatch = str.match(
      /^hsla?\(\s*([0-9.]+)(?:deg)?\s*[,\s]\s*([0-9.]+)%\s*[,\s]\s*([0-9.]+)%(?:\s*[,/]\s*([0-9.]+%?))?\s*\)$/
    );
    if (hslMatch) {
      const h = ((parseFloat(hslMatch[1]) % 360) + 360) % 360;
      const s = clamp(parseFloat(hslMatch[2]) / 100, 0, 1);
      const l = clamp(parseFloat(hslMatch[3]) / 100, 0, 1);
      const rgb = hslToRgb(h, s, l);
      return { ...rgb, a: parseAlpha(hslMatch[4]) };
    }

    // Fallback for modern CSS Color 4 spaces (oklch, lab, color(display-p3 ...)) and named colors
    const ctx = getColorCanvasCtx();
    if (ctx) {
      try {
        ctx.clearRect(0, 0, 1, 1);
        ctx.fillStyle = 'rgba(0,0,0,0)';
        ctx.fillStyle = input;
        ctx.fillRect(0, 0, 1, 1);
        const data = ctx.getImageData(0, 0, 1, 1).data;
        return { r: data[0], g: data[1], b: data[2], a: +(data[3] / 255).toFixed(3) };
      } catch (_) {
        return null;
      }
    }

    return null;
  }

  function rgbaToHex(c, includeAlpha = false) {
    if (!c) return '#000000';
    const toHex = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, '0');
    const base = `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`.toUpperCase();
    if (includeAlpha && c.a < 0.999) {
      return `${base}${toHex(c.a * 255)}`.toUpperCase();
    }
    return base;
  }

  // Porter-Duff source-over compositing
  function compositeOver(fg, bg) {
    const a = fg.a + bg.a * (1 - fg.a);
    if (a <= 0) return { r: 0, g: 0, b: 0, a: 0 };
    return {
      r: Math.round((fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a),
      g: Math.round((fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a),
      b: Math.round((fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a),
      a
    };
  }

  // WCAG 2.1 relative luminance (sRGB)
  function relativeLuminance(rgb) {
    const linearize = (channel) => {
      const s = clamp(channel, 0, 255) / 255;
      return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    };
    const R = linearize(rgb.r);
    const G = linearize(rgb.g);
    const B = linearize(rgb.b);
    return 0.2126 * R + 0.7152 * G + 0.0722 * B;
  }

  function contrastRatio(fg, bg) {
    const l1 = relativeLuminance(fg);
    const l2 = relativeLuminance(bg);
    const lighter = Math.max(l1, l2);
    const darker = Math.min(l1, l2);
    return (lighter + 0.05) / (darker + 0.05);
  }

  function getParentElementCrossingShadow(el) {
    if (!el) return null;
    if (el.parentElement) return el.parentElement;
    const root = el.getRootNode ? el.getRootNode() : null;
    if (root && root.host && root.host instanceof Element) {
      return root.host;
    }
    return null;
  }

  function resolveEffectiveBackground(el) {
    const layers = [];
    let current = el;
    let safety = 0;

    while (current && current.nodeType === 1 && safety < 60) {
      safety++;
      const style = window.getComputedStyle(current);
      const parsed = parseColor(style.backgroundColor);
      const opacity = parseFloat(style.opacity);
      const effAlpha = parsed ? parsed.a * (Number.isNaN(opacity) ? 1 : clamp(opacity, 0, 1)) : 0;

      if (parsed && effAlpha > 0.001) {
        layers.push({ r: parsed.r, g: parsed.g, b: parsed.b, a: effAlpha });
        if (effAlpha >= 0.999) {
          break;
        }
      }
      current = getParentElementCrossingShadow(current);
    }

    // Default canvas backdrop if nothing opaque was found up to <html>
    let resolved = { r: 255, g: 255, b: 255, a: 1 };
    if (layers.length === 0) {
      try {
        const htmlBg = parseColor(window.getComputedStyle(document.documentElement).backgroundColor);
        const bodyBg = document.body
          ? parseColor(window.getComputedStyle(document.body).backgroundColor)
          : null;
        if (htmlBg && htmlBg.a > 0.01) resolved = compositeOver(htmlBg, resolved);
        if (bodyBg && bodyBg.a > 0.01) resolved = compositeOver(bodyBg, resolved);
      } catch (_) {
        // Fallback to white
      }
      return resolved;
    }

    // Composite from bottommost layer up to element
    for (let i = layers.length - 1; i >= 0; i--) {
      resolved = compositeOver(layers[i], resolved);
    }
    return resolved;
  }

  function evaluateElement(el) {
    const style = window.getComputedStyle(el);
    const rawFg = parseColor(style.color) || { r: 0, g: 0, b: 0, a: 1 };
    const bg = resolveEffectiveBackground(el);
    const elOpacity = parseFloat(style.opacity);
    const fgWithOpacity = {
      ...rawFg,
      a: rawFg.a * (Number.isNaN(elOpacity) ? 1 : clamp(elOpacity, 0, 1))
    };
    const fg = fgWithOpacity.a < 0.999 ? compositeOver(fgWithOpacity, bg) : fgWithOpacity;

    const ratio = contrastRatio(fg, bg);
    const fontSizePx = parseFloat(style.fontSize) || 16;
    const fontWeight = parseInt(style.fontWeight, 10) || 400;
    const isLargeText = fontSizePx >= 24 || (fontSizePx >= 18.66 && fontWeight >= 700);

    let grade = 'FAIL';
    let pass = false;
    if (isLargeText) {
      if (ratio >= 4.5) {
        grade = 'AAA';
        pass = true;
      } else if (ratio >= 3.0) {
        grade = 'AA';
        pass = true;
      }
    } else {
      if (ratio >= 7.0) {
        grade = 'AAA';
        pass = true;
      } else if (ratio >= 4.5) {
        grade = 'AA';
        pass = true;
      } else if (ratio >= 3.0) {
        grade = 'AA Large';
        pass = false;
      }
    }

    return {
      ratio: Number(ratio.toFixed(2)),
      formatted: `${ratio.toFixed(1)}:1`,
      grade,
      pass,
      isLargeText,
      fgHex: rgbaToHex(fg),
      bgHex: rgbaToHex(bg),
      fgRgba: fg,
      bgRgba: bg
    };
  }

  window.__StyleSniperContrast = {
    parseColor,
    rgbaToHex,
    compositeOver,
    relativeLuminance,
    contrastRatio,
    resolveEffectiveBackground,
    evaluateElement
  };
})();
