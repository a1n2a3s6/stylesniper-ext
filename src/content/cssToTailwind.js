'use strict';

(() => {
  if (window.__StyleSniperCompiler) return;

  // Compact Tailwind v3/v4 standard palette for nearest-color matching
  const TW_PALETTE = [
    ['white', '#ffffff'], ['black', '#000000'],
    ['slate-50', '#f8fafc'], ['slate-100', '#f1f5f9'], ['slate-200', '#e2e8f0'], ['slate-300', '#cbd5e1'],
    ['slate-400', '#94a3b8'], ['slate-500', '#64748b'], ['slate-600', '#475569'], ['slate-700', '#334155'],
    ['slate-800', '#1e293b'], ['slate-900', '#0f172a'], ['slate-950', '#020617'],
    ['gray-50', '#f9fafb'], ['gray-100', '#f3f4f6'], ['gray-200', '#e5e7eb'], ['gray-300', '#d1d5db'],
    ['gray-400', '#9ca3af'], ['gray-500', '#6b7280'], ['gray-600', '#4b5563'], ['gray-700', '#374151'],
    ['gray-800', '#1f2937'], ['gray-900', '#111827'], ['gray-950', '#030712'],
    ['zinc-50', '#fafafa'], ['zinc-100', '#f4f4f5'], ['zinc-200', '#e4e4e7'], ['zinc-300', '#d4d4d8'],
    ['zinc-400', '#a1a1aa'], ['zinc-500', '#71717a'], ['zinc-600', '#52525b'], ['zinc-700', '#3f3f46'],
    ['zinc-800', '#27272a'], ['zinc-900', '#18181b'], ['zinc-950', '#09090b'],
    ['neutral-50', '#fafafa'], ['neutral-100', '#f5f5f5'], ['neutral-200', '#e5e5e5'], ['neutral-300', '#d4d4d4'],
    ['neutral-400', '#a3a3a3'], ['neutral-500', '#737373'], ['neutral-600', '#525252'], ['neutral-700', '#404040'],
    ['neutral-800', '#262626'], ['neutral-900', '#171717'], ['neutral-950', '#0a0a0a'],
    ['red-50', '#fef2f2'], ['red-100', '#fee2e2'], ['red-200', '#fecaca'], ['red-300', '#fca5a5'],
    ['red-400', '#f87171'], ['red-500', '#ef4444'], ['red-600', '#dc2626'], ['red-700', '#b91c1c'],
    ['red-800', '#991b1b'], ['red-900', '#7f1d1d'], ['red-950', '#450a0a'],
    ['orange-400', '#fb923c'], ['orange-500', '#f97316'], ['orange-600', '#ea580c'],
    ['amber-100', '#fef3c7'], ['amber-300', '#fcd34d'], ['amber-400', '#fbbf24'], ['amber-500', '#f59e0b'],
    ['amber-600', '#d97706'], ['amber-700', '#b45309'],
    ['yellow-300', '#fde047'], ['yellow-400', '#facc15'], ['yellow-500', '#eab308'],
    ['green-400', '#4ade80'], ['green-500', '#22c55e'], ['green-600', '#16a34a'], ['green-700', '#15803d'],
    ['emerald-400', '#34d399'], ['emerald-500', '#10b981'], ['emerald-600', '#059669'], ['emerald-700', '#047857'],
    ['teal-400', '#2dd4bf'], ['teal-500', '#14b8a6'], ['teal-600', '#0d9488'],
    ['cyan-400', '#22d3ee'], ['cyan-500', '#06b6d4'], ['cyan-600', '#0891b2'],
    ['sky-400', '#38bdf8'], ['sky-500', '#0ea5e9'], ['sky-600', '#0284c7'],
    ['blue-50', '#eff6ff'], ['blue-100', '#dbeafe'], ['blue-200', '#bfdbfe'], ['blue-400', '#60a5fa'],
    ['blue-500', '#3b82f6'], ['blue-600', '#2563eb'], ['blue-700', '#1d4ed8'], ['blue-800', '#1e40af'], ['blue-900', '#1e3a8a'],
    ['indigo-500', '#6366f1'], ['indigo-600', '#4f46e5'], ['indigo-700', '#4338ca'],
    ['violet-500', '#8b5cf6'], ['violet-600', '#7c3aed'],
    ['purple-500', '#a855f7'], ['purple-600', '#9333ea'],
    ['pink-500', '#ec4899'], ['pink-600', '#db2777'],
    ['rose-500', '#f43f5e'], ['rose-600', '#e11d48']
  ].map(([name, hex]) => ({
    name,
    hex,
    r: parseInt(hex.slice(1, 3), 16),
    g: parseInt(hex.slice(3, 5), 16),
    b: parseInt(hex.slice(5, 7), 16)
  }));

  const SPACING_SCALE = [
    [0, '0'], [1, 'px'], [2, '0.5'], [4, '1'], [6, '1.5'], [8, '2'], [10, '2.5'],
    [12, '3'], [14, '3.5'], [16, '4'], [20, '5'], [24, '6'], [28, '7'], [32, '8'],
    [36, '9'], [40, '10'], [44, '11'], [48, '12'], [56, '14'], [64, '16'], [80, '20'],
    [96, '24'], [112, '28'], [128, '32'], [144, '36'], [160, '40'], [176, '44'],
    [192, '48'], [208, '52'], [224, '56'], [240, '60'], [256, '64'], [288, '72'],
    [320, '80'], [384, '96']
  ];

  const FONT_SIZE_SCALE = [
    [12, 'text-xs'], [14, 'text-sm'], [16, 'text-base'], [18, 'text-lg'],
    [20, 'text-xl'], [24, 'text-2xl'], [30, 'text-3xl'], [36, 'text-4xl'],
    [48, 'text-5xl'], [60, 'text-6xl'], [72, 'text-7xl'], [96, 'text-8xl']
  ];

  const FONT_WEIGHT_MAP = {
    100: 'font-thin',
    200: 'font-extralight',
    300: 'font-light',
    400: 'font-normal',
    500: 'font-medium',
    600: 'font-semibold',
    700: 'font-bold',
    800: 'font-extrabold',
    900: 'font-black'
  };

  const RADIUS_SCALE = [
    [0, 'rounded-none'], [2, 'rounded-sm'], [4, 'rounded'], [6, 'rounded-md'],
    [8, 'rounded-lg'], [12, 'rounded-xl'], [16, 'rounded-2xl'], [24, 'rounded-3xl']
  ];

  const VOID_TAGS = new Set([
    'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr'
  ]);

  // Isolated baseline iframe for accurate browser-default CSS diffing
  let baselineIframe = null;
  const baselineCache = new Map();

  function getBaselineStyle(tagName) {
    const tag = (tagName || 'div').toLowerCase();
    if (baselineCache.has(tag)) return baselineCache.get(tag);

    try {
      if (!baselineIframe || !baselineIframe.isConnected) {
        baselineIframe = document.createElement('iframe');
        baselineIframe.setAttribute('aria-hidden', 'true');
        baselineIframe.setAttribute('tabindex', '-1');
        baselineIframe.style.cssText =
          'position:fixed!important;width:0!important;height:0!important;border:0!important;visibility:hidden!important;pointer-events:none!important;left:-9999px!important;top:-9999px!important;';
        (document.documentElement || document.body).appendChild(baselineIframe);
      }

      const doc = baselineIframe.contentDocument;
      if (doc && doc.body) {
        const el = doc.createElement(tag);
        doc.body.appendChild(el);
        const cs = baselineIframe.contentWindow.getComputedStyle(el);
        const snapshot = {
          display: cs.display,
          position: cs.position,
          fontSize: cs.fontSize,
          fontWeight: cs.fontWeight,
          fontStyle: cs.fontStyle,
          textDecorationLine: cs.textDecorationLine,
          textAlign: cs.textAlign,
          textTransform: cs.textTransform,
          color: cs.color,
          backgroundColor: cs.backgroundColor,
          cursor: cs.cursor,
          paddingTop: cs.paddingTop,
          paddingRight: cs.paddingRight,
          paddingBottom: cs.paddingBottom,
          paddingLeft: cs.paddingLeft,
          marginTop: cs.marginTop,
          marginRight: cs.marginRight,
          marginBottom: cs.marginBottom,
          marginLeft: cs.marginLeft,
          borderTopWidth: cs.borderTopWidth,
          borderRightWidth: cs.borderRightWidth,
          borderBottomWidth: cs.borderBottomWidth,
          borderLeftWidth: cs.borderLeftWidth,
          borderRadius: cs.borderRadius,
          opacity: cs.opacity
        };
        el.remove();
        baselineCache.set(tag, snapshot);
        return snapshot;
      }
    } catch (_) {
      // Sandboxed iframe fallback
    }

    return null;
  }

  function pxNum(val) {
    if (!val || val === 'auto' || val === 'normal' || val === 'none') return 0;
    const n = parseFloat(val);
    return Number.isNaN(n) ? 0 : n;
  }

  function mapSpacing(px) {
    const abs = Math.abs(px);
    if (abs < 0.5) return '0';
    for (const [val, token] of SPACING_SCALE) {
      if (Math.abs(abs - val) <= 0.6) return token;
    }
    const rounded = Number.isInteger(abs) ? abs : Number(abs.toFixed(1));
    return `[${rounded}px]`;
  }

  function mapColorToken(cssColor, prefix) {
    const contrast = window.__StyleSniperContrast;
    if (!contrast) return null;
    const parsed = contrast.parseColor(cssColor);
    if (!parsed || parsed.a <= 0.005) return null;

    let best = null;
    let bestDist = Infinity;
    for (const swatch of TW_PALETTE) {
      const dr = parsed.r - swatch.r;
      const dg = parsed.g - swatch.g;
      const db = parsed.b - swatch.b;
      const dist = Math.sqrt(dr * dr + dg * dg + db * db);
      if (dist < bestDist) {
        bestDist = dist;
        best = swatch;
      }
    }

    const alphaSuffix =
      parsed.a < 0.99 ? `/${Math.round(parsed.a * 100)}` : '';

    if (best && bestDist <= 10) {
      return `${prefix}-${best.name}${alphaSuffix}`;
    }

    const hex = contrast.rgbaToHex(parsed).toLowerCase();
    return `${prefix}-[${hex}]${alphaSuffix}`;
  }

  function mapBoxSpacing(prefix, t, r, b, l) {
    const out = [];
    const fmt = (dir, val) => {
      const neg = val < 0 ? '-' : '';
      return `${neg}${prefix}${dir}-${mapSpacing(val)}`;
    };

    const nz = (v) => Math.abs(v) >= 0.5;
    if (!nz(t) && !nz(r) && !nz(b) && !nz(l)) return out;

    if (Math.abs(t - r) < 0.5 && Math.abs(t - b) < 0.5 && Math.abs(t - l) < 0.5) {
      out.push(fmt('', t));
      return out;
    }

    if (Math.abs(t - b) < 0.5 && Math.abs(r - l) < 0.5) {
      if (nz(r)) out.push(fmt('x', r));
      if (nz(t)) out.push(fmt('y', t));
      return out;
    }

    if (Math.abs(r - l) < 0.5 && nz(r)) {
      out.push(fmt('x', r));
    } else {
      if (nz(r)) out.push(fmt('r', r));
      if (nz(l)) out.push(fmt('l', l));
    }

    if (Math.abs(t - b) < 0.5 && nz(t)) {
      out.push(fmt('y', t));
    } else {
      if (nz(t)) out.push(fmt('t', t));
      if (nz(b)) out.push(fmt('b', b));
    }

    return out;
  }

  function mapRadius(style, rect) {
    const tl = pxNum(style.borderTopLeftRadius);
    const tr = pxNum(style.borderTopRightRadius);
    const br = pxNum(style.borderBottomRightRadius);
    const bl = pxNum(style.borderBottomLeftRadius);
    if (tl < 0.5 && tr < 0.5 && br < 0.5 && bl < 0.5) return null;

    const uniform =
      Math.abs(tl - tr) < 0.5 && Math.abs(tl - br) < 0.5 && Math.abs(tl - bl) < 0.5;

    if (uniform) {
      const minDim = Math.min(rect.width || 0, rect.height || 0);
      if (tl >= 999 || (minDim > 0 && tl >= minDim / 2 - 0.5)) {
        return 'rounded-full';
      }
      for (const [val, cls] of RADIUS_SCALE) {
        if (Math.abs(tl - val) <= 0.6) return cls;
      }
      return `rounded-[${Math.round(tl)}px]`;
    }

    return `rounded-[${Math.round(tl)}px_${Math.round(tr)}px_${Math.round(br)}px_${Math.round(bl)}px]`;
  }

  function mapShadow(boxShadow) {
    if (!boxShadow || boxShadow === 'none') return null;
    // Heuristic matching based on blur radius in computed shadow
    const match = boxShadow.match(/(-?\d+(?:\.\d+)?)px\s+(-?\d+(?:\.\d+)?)px\s+(\d+(?:\.\d+)?)px/);
    if (!match) return 'shadow';
    const blur = parseFloat(match[3]);
    if (blur <= 2) return 'shadow-sm';
    if (blur <= 6) return 'shadow';
    if (blur <= 12) return 'shadow-md';
    if (blur <= 20) return 'shadow-lg';
    if (blur <= 35) return 'shadow-xl';
    return 'shadow-2xl';
  }

  function compileElement(el) {
    const style = window.getComputedStyle(el);
    const rect = el.getBoundingClientRect();
    const tag = el.tagName.toLowerCase();
    const base = getBaselineStyle(tag);

    const tw = [];
    const cssProps = [];

    // 1. Display & Layout
    const display = style.display;
    const displayMap = {
      flex: 'flex',
      'inline-flex': 'inline-flex',
      grid: 'grid',
      'inline-grid': 'inline-grid',
      'inline-block': 'inline-block',
      none: 'hidden'
    };
    if (displayMap[display]) {
      tw.push(displayMap[display]);
      cssProps.push(['display', display]);
    } else if (base && display !== base.display) {
      if (display === 'block') tw.push('block');
      else if (display === 'inline') tw.push('inline');
      cssProps.push(['display', display]);
    }

    // Flex properties
    if (display === 'flex' || display === 'inline-flex') {
      if (style.flexDirection === 'column') {
        tw.push('flex-col');
        cssProps.push(['flex-direction', 'column']);
      } else if (style.flexDirection === 'row-reverse') {
        tw.push('flex-row-reverse');
        cssProps.push(['flex-direction', 'row-reverse']);
      } else if (style.flexDirection === 'column-reverse') {
        tw.push('flex-col-reverse');
        cssProps.push(['flex-direction', 'column-reverse']);
      }
      if (style.flexWrap === 'wrap') {
        tw.push('flex-wrap');
        cssProps.push(['flex-wrap', 'wrap']);
      }
    }

    // Grid columns
    if (display === 'grid' || display === 'inline-grid') {
      const cols = style.gridTemplateColumns;
      if (cols && cols !== 'none') {
        const count = cols.trim().split(/\s+/).length;
        if (count >= 1 && count <= 12) {
          tw.push(`grid-cols-${count}`);
        }
        cssProps.push(['grid-template-columns', cols]);
      }
    }

    // Alignment & Gap (Flex & Grid)
    if (display.includes('flex') || display.includes('grid')) {
      const alignMap = {
        center: 'items-center',
        'flex-start': 'items-start',
        start: 'items-start',
        'flex-end': 'items-end',
        end: 'items-end',
        baseline: 'items-baseline'
      };
      if (alignMap[style.alignItems]) {
        tw.push(alignMap[style.alignItems]);
        cssProps.push(['align-items', style.alignItems]);
      }

      const justifyMap = {
        center: 'justify-center',
        'flex-start': 'justify-start',
        start: 'justify-start',
        'flex-end': 'justify-end',
        end: 'justify-end',
        'space-between': 'justify-between',
        'space-around': 'justify-around',
        'space-evenly': 'justify-evenly'
      };
      if (justifyMap[style.justifyContent]) {
        tw.push(justifyMap[style.justifyContent]);
        cssProps.push(['justify-content', style.justifyContent]);
      }

      const rowGap = pxNum(style.rowGap);
      const colGap = pxNum(style.columnGap);
      if (rowGap > 0 || colGap > 0) {
        if (Math.abs(rowGap - colGap) < 0.5) {
          tw.push(`gap-${mapSpacing(rowGap)}`);
          cssProps.push(['gap', `${Math.round(rowGap)}px`]);
        } else {
          if (colGap > 0) {
            tw.push(`gap-x-${mapSpacing(colGap)}`);
            cssProps.push(['column-gap', `${Math.round(colGap)}px`]);
          }
          if (rowGap > 0) {
            tw.push(`gap-y-${mapSpacing(rowGap)}`);
            cssProps.push(['row-gap', `${Math.round(rowGap)}px`]);
          }
        }
      }
    }

    // 2. Position & Overflow & Z-Index
    if (style.position && style.position !== 'static') {
      tw.push(style.position);
      cssProps.push(['position', style.position]);
    }
    if (style.zIndex && style.zIndex !== 'auto') {
      const z = parseInt(style.zIndex, 10);
      if (!Number.isNaN(z)) {
        const stdZ = [0, 10, 20, 30, 40, 50];
        tw.push(stdZ.includes(z) ? `z-${z}` : `z-[${z}]`);
        cssProps.push(['z-index', String(z)]);
      }
    }
    if (style.overflow && style.overflow !== 'visible' && style.overflow !== 'visible visible') {
      const ov = style.overflow.split(' ')[0];
      if (['hidden', 'auto', 'scroll', 'clip'].includes(ov)) {
        tw.push(`overflow-${ov}`);
        cssProps.push(['overflow', ov]);
      }
    }

    // 3. Spacing (Padding & Margin)
    const pt = pxNum(style.paddingTop);
    const pr = pxNum(style.paddingRight);
    const pb = pxNum(style.paddingBottom);
    const pl = pxNum(style.paddingLeft);
    const padClasses = mapBoxSpacing('p', pt, pr, pb, pl);
    if (padClasses.length) {
      tw.push(...padClasses);
      if (pt === pr && pt === pb && pt === pl) {
        cssProps.push(['padding', `${Math.round(pt)}px`]);
      } else if (pt === pb && pr === pl) {
        cssProps.push(['padding', `${Math.round(pt)}px ${Math.round(pr)}px`]);
      } else {
        cssProps.push(['padding', `${Math.round(pt)}px ${Math.round(pr)}px ${Math.round(pb)}px ${Math.round(pl)}px`]);
      }
    }

    const mt = pxNum(style.marginTop);
    const mr = pxNum(style.marginRight);
    const mb = pxNum(style.marginBottom);
    const ml = pxNum(style.marginLeft);
    const marginChanged =
      !base ||
      style.marginTop !== base.marginTop ||
      style.marginRight !== base.marginRight ||
      style.marginBottom !== base.marginBottom ||
      style.marginLeft !== base.marginLeft;
    if (marginChanged) {
      const marClasses = mapBoxSpacing('m', mt, mr, mb, ml);
      if (marClasses.length) {
        tw.push(...marClasses);
        if (mt === mr && mt === mb && mt === ml) {
          cssProps.push(['margin', `${Math.round(mt)}px`]);
        } else if (mt === mb && mr === ml) {
          cssProps.push(['margin', `${Math.round(mt)}px ${Math.round(mr)}px`]);
        } else {
          cssProps.push(['margin', `${Math.round(mt)}px ${Math.round(mr)}px ${Math.round(mb)}px ${Math.round(ml)}px`]);
        }
      }
    }

    // 4. Typography
    const fontSize = pxNum(style.fontSize);
    if (fontSize > 0) {
      let matchedSize = null;
      for (const [sz, cls] of FONT_SIZE_SCALE) {
        if (Math.abs(fontSize - sz) <= 0.5) {
          matchedSize = cls;
          break;
        }
      }
      tw.push(matchedSize || `text-[${Number(fontSize.toFixed(1))}px]`);
      cssProps.push(['font-size', `${Number(fontSize.toFixed(1))}px`]);
    }

    const weight = parseInt(style.fontWeight, 10) || 400;
    const baseWeight = base ? parseInt(base.fontWeight, 10) || 400 : 400;
    if (weight !== 400 || weight !== baseWeight) {
      const nearest = Math.round(weight / 100) * 100;
      if (FONT_WEIGHT_MAP[nearest]) tw.push(FONT_WEIGHT_MAP[nearest]);
      cssProps.push(['font-weight', String(weight)]);
    }

    if (style.fontStyle === 'italic') {
      tw.push('italic');
      cssProps.push(['font-style', 'italic']);
    }

    if (style.lineHeight && style.lineHeight !== 'normal') {
      const lh = pxNum(style.lineHeight);
      if (lh > 0 && fontSize > 0) {
        const ratio = lh / fontSize;
        if (Math.abs(ratio - 1) <= 0.05) tw.push('leading-none');
        else if (Math.abs(ratio - 1.25) <= 0.05) tw.push('leading-tight');
        else if (Math.abs(ratio - 1.375) <= 0.05) tw.push('leading-snug');
        else if (Math.abs(ratio - 1.5) <= 0.05) tw.push('leading-normal');
        else if (Math.abs(ratio - 1.625) <= 0.05) tw.push('leading-relaxed');
        else if (Math.abs(ratio - 2) <= 0.05) tw.push('leading-loose');
        else tw.push(`leading-[${Math.round(lh)}px]`);
        cssProps.push(['line-height', `${Math.round(lh)}px`]);
      }
    }

    const ls = pxNum(style.letterSpacing);
    if (Math.abs(ls) >= 0.2) {
      if (ls <= -0.6) tw.push('tracking-tighter');
      else if (ls < -0.1) tw.push('tracking-tight');
      else if (ls >= 1.2) tw.push('tracking-widest');
      else if (ls >= 0.6) tw.push('tracking-wider');
      else tw.push('tracking-wide');
      cssProps.push(['letter-spacing', `${Number(ls.toFixed(2))}px`]);
    }

    if (['center', 'right', 'justify'].includes(style.textAlign)) {
      tw.push(`text-${style.textAlign}`);
      cssProps.push(['text-align', style.textAlign]);
    }

    if (['uppercase', 'lowercase', 'capitalize'].includes(style.textTransform)) {
      tw.push(style.textTransform);
      cssProps.push(['text-transform', style.textTransform]);
    }

    if (style.textDecorationLine && style.textDecorationLine.includes('underline')) {
      tw.push('underline');
      cssProps.push(['text-decoration', 'underline']);
    } else if (style.textDecorationLine && style.textDecorationLine.includes('line-through')) {
      tw.push('line-through');
      cssProps.push(['text-decoration', 'line-through']);
    }

    if (style.whiteSpace === 'nowrap') {
      tw.push('whitespace-nowrap');
      cssProps.push(['white-space', 'nowrap']);
    }

    // 5. Colors (Text & Background)
    const textColorToken = mapColorToken(style.color, 'text');
    if (textColorToken) {
      tw.push(textColorToken);
      const contrast = window.__StyleSniperContrast;
      const parsed = contrast ? contrast.parseColor(style.color) : null;
      cssProps.push(['color', parsed ? contrast.rgbaToHex(parsed, parsed.a < 0.99) : style.color]);
    }

    const bgToken = mapColorToken(style.backgroundColor, 'bg');
    if (bgToken) {
      tw.push(bgToken);
      const contrast = window.__StyleSniperContrast;
      const parsed = contrast ? contrast.parseColor(style.backgroundColor) : null;
      cssProps.push(['background-color', parsed ? contrast.rgbaToHex(parsed, parsed.a < 0.99) : style.backgroundColor]);
    }

    // 6. Borders & Border Radius
    const bt = pxNum(style.borderTopWidth);
    const br = pxNum(style.borderRightWidth);
    const bb = pxNum(style.borderBottomWidth);
    const bl = pxNum(style.borderLeftWidth);
    const hasBorder =
      (bt > 0 && style.borderTopStyle !== 'none') ||
      (br > 0 && style.borderRightStyle !== 'none') ||
      (bb > 0 && style.borderBottomStyle !== 'none') ||
      (bl > 0 && style.borderLeftStyle !== 'none');

    if (hasBorder) {
      const uniformW = bt === br && bt === bb && bt === bl;
      const mapBW = (w) => (w === 1 ? '' : [2, 4, 8].includes(Math.round(w)) ? `-${Math.round(w)}` : `-[${Math.round(w)}px]`);
      if (uniformW) {
        tw.push(`border${mapBW(bt)}`);
        const contrast = window.__StyleSniperContrast;
        const parsed = contrast ? contrast.parseColor(style.borderTopColor) : null;
        const bcHex = parsed ? contrast.rgbaToHex(parsed, parsed.a < 0.99) : style.borderTopColor;
        cssProps.push(['border', `${Math.round(bt)}px ${style.borderTopStyle} ${bcHex}`]);
      } else {
        if (bt > 0 && style.borderTopStyle !== 'none') tw.push(`border-t${mapBW(bt)}`);
        if (br > 0 && style.borderRightStyle !== 'none') tw.push(`border-r${mapBW(br)}`);
        if (bb > 0 && style.borderBottomStyle !== 'none') tw.push(`border-b${mapBW(bb)}`);
        if (bl > 0 && style.borderLeftStyle !== 'none') tw.push(`border-l${mapBW(bl)}`);
        cssProps.push(['border-width', `${Math.round(bt)}px ${Math.round(br)}px ${Math.round(bb)}px ${Math.round(bl)}px`]);
        cssProps.push(['border-style', style.borderTopStyle || 'solid']);
      }

      if (style.borderTopStyle === 'dashed') tw.push('border-dashed');
      else if (style.borderTopStyle === 'dotted') tw.push('border-dotted');

      const borderCol = mapColorToken(style.borderTopColor, 'border');
      if (borderCol) tw.push(borderCol);
    }

    const radiusCls = mapRadius(style, rect);
    if (radiusCls) {
      tw.push(radiusCls);
      cssProps.push(['border-radius', style.borderRadius]);
    }

    // 7. Effects (Shadow, Opacity, Cursor, Backdrop Blur)
    const shadowCls = mapShadow(style.boxShadow);
    if (shadowCls) {
      tw.push(shadowCls);
      cssProps.push(['box-shadow', style.boxShadow]);
    }

    const opacity = parseFloat(style.opacity);
    if (!Number.isNaN(opacity) && opacity < 0.995) {
      const pct = Math.round(opacity * 100);
      tw.push(`opacity-${pct}`);
      cssProps.push(['opacity', String(Number(opacity.toFixed(2)))]);
    }

    if (style.backdropFilter && style.backdropFilter.includes('blur(')) {
      tw.push('backdrop-blur-md');
      cssProps.push(['backdrop-filter', style.backdropFilter]);
    }

    if (style.cursor === 'pointer' && (!base || base.cursor !== 'pointer')) {
      tw.push('cursor-pointer');
      cssProps.push(['cursor', 'pointer']);
    }

    // Deduplicate Tailwind classes
    const uniqueTw = [...new Set(tw)];
    const tailwindStr = uniqueTw.join(' ');

    // Build clean Vanilla CSS block
    const classList = typeof el.className === 'string'
      ? el.className.trim().split(/\s+/).filter((c) => c && !c.includes(':') && !c.includes('[')).slice(0, 2)
      : [];
    const selector = el.id
      ? `#${el.id}`
      : classList.length > 0
      ? `.${classList.join('.')}`
      : tag;

    const dedupCss = [];
    const seenProp = new Set();
    for (const [k, v] of cssProps) {
      if (!seenProp.has(k) && v !== undefined && v !== '') {
        seenProp.add(k);
        dedupCss.push(`  ${k}: ${v};`);
      }
    }
    const cssStr = `${selector} {\n${dedupCss.join('\n')}\n}`;

    // Build React JSX snippet
    const rawText = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
    const shortText = rawText.length > 48 ? `${rawText.slice(0, 45)}...` : rawText;
    const escapedText = shortText.replace(/[<>]/g, '');
    const classAttr = tailwindStr ? ` className="${tailwindStr}"` : '';

    let jsxStr = '';
    if (VOID_TAGS.has(tag)) {
      jsxStr = `<${tag}${classAttr} />`;
    } else if (tag === 'svg') {
      jsxStr = `<svg${classAttr} viewBox="${el.getAttribute('viewBox') || '0 0 24 24'}">\n  {/* SVG paths */}\n</svg>`;
    } else if (escapedText) {
      jsxStr = `<${tag}${classAttr}>\n  ${escapedText}\n</${tag}>`;
    } else {
      jsxStr = `<${tag}${classAttr} />`;
    }

    return {
      tailwind: tailwindStr || '/* no non-default styles */',
      css: cssStr,
      jsx: jsxStr,
      classCount: uniqueTw.length
    };
  }

  window.__StyleSniperCompiler = {
    compileElement,
    mapColorToken,
    mapSpacing
  };
})();
