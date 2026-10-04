/**
 * Minecraft Color Parser
 * Hỗ trợ: Legacy codes (&a, &l...), Hex (&#RRGGBB), MiniMessage (<red>, <gradient:...>),
 *         Plugin tags (<lyellow>, <lred>...), Placeholders (%var%)
 */

const MinecraftParser = (() => {

  // ─────────────────────────────────────────────
  //  Legacy color map (&0-9, &a-f)
  // ─────────────────────────────────────────────
  const LEGACY_COLORS = {
    '0': '#000000', // Black
    '1': '#0000AA', // Dark Blue
    '2': '#00AA00', // Dark Green
    '3': '#00AAAA', // Dark Aqua
    '4': '#AA0000', // Dark Red
    '5': '#AA00AA', // Dark Purple
    '6': '#FFAA00', // Gold
    '7': '#AAAAAA', // Gray
    '8': '#555555', // Dark Gray
    '9': '#5555FF', // Blue
    'a': '#55FF55', // Green
    'b': '#55FFFF', // Aqua
    'c': '#FF5555', // Red
    'd': '#FF55FF', // Light Purple
    'e': '#FFFF55', // Yellow
    'f': '#FFFFFF', // White
  };

  // MiniMessage named colors
  const MINI_COLORS = {
    'black':        '#000000',
    'dark_blue':    '#0000AA',
    'dark_green':   '#00AA00',
    'dark_aqua':    '#00AAAA',
    'dark_red':     '#AA0000',
    'dark_purple':  '#AA00AA',
    'gold':         '#FFAA00',
    'gray':         '#AAAAAA',
    'grey':         '#AAAAAA',
    'dark_gray':    '#555555',
    'dark_grey':    '#555555',
    'blue':         '#5555FF',
    'green':        '#55FF55',
    'aqua':         '#55FFFF',
    'red':          '#FF5555',
    'light_purple': '#FF55FF',
    'yellow':       '#FFFF55',
    'white':        '#FFFFFF',
  };

  // Plugin-style named color tags (e.g. <lyellow>, <lred>)
  const PLUGIN_COLORS = {
    'lyellow':       '#FFFF55',
    'lgreen':        '#55FF55',
    'lred':          '#FF5555',
    'laqua':         '#55FFFF',
    'lpurple':       '#FF55FF',
    'lblue':         '#5555FF',
    'lgray':         '#AAAAAA',
    'lgrey':         '#AAAAAA',
    'yellow':        '#FFFF55',
    'green':         '#55FF55',
    'red':           '#FF5555',
    'aqua':          '#55FFFF',
    'purple':        '#AA00AA',
    'blue':          '#5555FF',
    'gray':          '#AAAAAA',
    'grey':          '#AAAAAA',
    'gold':          '#FFAA00',
    'white':         '#FFFFFF',
    'black':         '#000000',
    'darkred':       '#AA0000',
    'darkgreen':     '#00AA00',
    'darkblue':      '#0000AA',
    'darkaqua':      '#00AAAA',
    'darkpurple':    '#AA00AA',
    'darkgray':      '#555555',
    'darkgrey':      '#555555',
    'orange':        '#FF8800',
  };

  // ─────────────────────────────────────────────
  //  Utility
  // ─────────────────────────────────────────────
  function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return { r, g, b };
  }

  function lerpColor(c1, c2, t) {
    return {
      r: Math.round(c1.r + (c2.r - c1.r) * t),
      g: Math.round(c1.g + (c2.g - c1.g) * t),
      b: Math.round(c1.b + (c2.b - c1.b) * t),
    };
  }

  function rgbToHex({ r, g, b }) {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  function interpolateGradient(colors, count) {
    if (colors.length < 2) return Array(count).fill(colors[0]);
    const result = [];
    const segments = colors.length - 1;
    for (let i = 0; i < count; i++) {
      const t = count === 1 ? 0 : i / (count - 1);
      const segIdx = Math.min(Math.floor(t * segments), segments - 1);
      const segT = t * segments - segIdx;
      result.push(lerpColor(hexToRgb(colors[segIdx]), hexToRgb(colors[segIdx + 1]), segT));
    }
    return result.map(rgbToHex);
  }

  // Generate rainbow colors for N characters
  function rainbowColors(count) {
    const stops = ['#FF0000','#FF8800','#FFFF00','#00FF00','#0088FF','#8800FF'];
    return interpolateGradient(stops, count);
  }

  // ─────────────────────────────────────────────
  //  Token types
  // ─────────────────────────────────────────────
  const T = {
    TEXT: 'TEXT',
    COLOR: 'COLOR',
    FORMAT: 'FORMAT',
    RESET: 'RESET',
    GRADIENT_START: 'GRADIENT_START',
    GRADIENT_END: 'GRADIENT_END',
    RAINBOW_START: 'RAINBOW_START',
    RAINBOW_END: 'RAINBOW_END',
    TAG_OPEN: 'TAG_OPEN',
    TAG_CLOSE: 'TAG_CLOSE',
    PLACEHOLDER: 'PLACEHOLDER',
  };

  // ─────────────────────────────────────────────
  //  Span builder — builds HTML
  // ─────────────────────────────────────────────
  function buildSpan(text, color, formats) {
    if (!text) return '';
    let style = '';
    if (color) style += `color:${color};`;
    if (formats.bold) style += 'font-weight:bold;';
    if (formats.italic) style += 'font-style:italic;';
    let decoration = [];
    if (formats.underline) decoration.push('underline');
    if (formats.strikethrough) decoration.push('line-through');
    if (decoration.length) style += `text-decoration:${decoration.join(' ')};`;
    if (formats.obfuscated) {
      return `<span class="obfuscated" style="${style}">${escapeHtml(text)}</span>`;
    }
    return `<span style="${style}">${escapeHtml(text)}</span>`;
  }

  function escapeHtml(t) {
    return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // ─────────────────────────────────────────────
  //  Main parse function
  // ─────────────────────────────────────────────
  function parse(input) {
    // We'll do a two-pass approach:
    // 1. Handle MiniMessage / plugin XML-style tags (gradient, rainbow, color tags)
    // 2. Handle legacy &codes and &#hex codes inline

    // Split into segments by XML-style tags and legacy codes
    return parseHybrid(input);
  }

  // ─────────────────────────────────────────────
  //  Hybrid parser — handles both legacy and XML
  // ─────────────────────────────────────────────
  function parseHybrid(input) {
    let html = '';
    let i = 0;
    // State
    let color = '#FFFFFF';
    let formats = { bold: false, italic: false, underline: false, strikethrough: false, obfuscated: false };
    // Stack for tag-based formatting
    let tagStack = [];

    function cloneFormats() {
      return { ...formats };
    }

    while (i < input.length) {
      // ── Placeholder %var% ──
      if (input[i] === '%') {
        const end = input.indexOf('%', i + 1);
        if (end !== -1 && end > i + 1) {
          const varName = input.slice(i + 1, end);
          if (/^[a-zA-Z0-9_]+$/.test(varName)) {
            html += `<span class="placeholder" style="color:${color};">${escapeHtml('%' + varName + '%')}</span>`;
            i = end + 1;
            continue;
          }
        }
      }

      // ── XML-style tags: <tag> or </tag> ──
      if (input[i] === '<') {
        const tagEnd = input.indexOf('>', i);
        if (tagEnd !== -1) {
          const tagContent = input.slice(i + 1, tagEnd).trim();
          // Closing tag
          if (tagContent.startsWith('/')) {
            const tagName = tagContent.slice(1).toLowerCase();
            // Pop stack until we find matching open tag
            let popped = null;
            for (let si = tagStack.length - 1; si >= 0; si--) {
              if (tagStack[si].name === tagName) {
                popped = tagStack.splice(si, 1)[0];
                break;
              }
            }
            // Restore state from stack
            if (tagStack.length > 0) {
              const top = tagStack[tagStack.length - 1];
              if (top.color) color = top.color;
              formats = cloneFormats();
              // reapply formats from remaining stack
              formats = { bold: false, italic: false, underline: false, strikethrough: false, obfuscated: false };
              for (const s of tagStack) {
                if (s.formats) Object.assign(formats, s.formats);
                if (s.color && s.color !== 'gradient' && s.color !== 'rainbow') color = s.color;
              }
            } else {
              color = '#FFFFFF';
              formats = { bold: false, italic: false, underline: false, strikethrough: false, obfuscated: false };
            }
            i = tagEnd + 1;
            continue;
          }

          // Opening tag — parse content
          const parsed = parseTag(tagContent);
          if (parsed) {
            const frame = { name: parsed.name, color: null, formats: null, gradient: null, rainbow: false };

            if (parsed.type === 'color') {
              frame.color = parsed.color;
              color = parsed.color;
            } else if (parsed.type === 'format') {
              frame.formats = parsed.formats;
              Object.assign(formats, parsed.formats);
            } else if (parsed.type === 'gradient') {
              frame.color = 'gradient';
              frame.gradient = parsed.colors;
              // Render gradient content
              const closeTag = `</${parsed.name}>`;
              const closeIdx = findClosingTag(input, tagEnd + 1, parsed.name);
              if (closeIdx !== -1) {
                const innerText = input.slice(tagEnd + 1, closeIdx);
                html += renderGradientSegment(innerText, parsed.colors, formats);
                i = closeIdx + closeTag.length;
                continue;
              }
            } else if (parsed.type === 'rainbow') {
              frame.color = 'rainbow';
              frame.rainbow = true;
              const closeIdx = findClosingTag(input, tagEnd + 1, parsed.name);
              if (closeIdx !== -1) {
                const innerText = input.slice(tagEnd + 1, closeIdx);
                html += renderRainbowSegment(innerText, formats);
                const closeTag = `</${parsed.name}>`;
                i = closeIdx + closeTag.length;
                continue;
              }
            } else if (parsed.type === 'reset') {
              color = '#FFFFFF';
              formats = { bold: false, italic: false, underline: false, strikethrough: false, obfuscated: false };
              tagStack = [];
              i = tagEnd + 1;
              continue;
            } else {
              // Unknown tag — skip
              i = tagEnd + 1;
              continue;
            }
            tagStack.push(frame);
            i = tagEnd + 1;
            continue;
          }
        }
      }

      // ── Legacy codes: & or § ──
      if ((input[i] === '&' || input[i] === '\u00A7') && i + 1 < input.length) {
        const next = input[i + 1];

        // &#RRGGBB hex color
        if (next === '#' && i + 7 < input.length) {
          const hex = input.slice(i + 2, i + 8);
          if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
            color = '#' + hex;
            i += 8;
            continue;
          }
        }

        // &x&R&R&G&G&B&B hex color
        const code = next.toLowerCase();
        if (code === 'x' && i + 13 < input.length) {
          let isHex = true;
          let hexVal = '#';
          for (let j = 0; j < 6; j++) {
            const pos = i + 2 + j * 2;
            if ((input[pos] === '&' || input[pos] === '\u00A7') && /^[0-9A-Fa-f]$/.test(input[pos+1])) {
              hexVal += input[pos+1];
            } else {
              isHex = false;
              break;
            }
          }
          if (isHex) {
            color = hexVal;
            i += 14;
            continue;
          }
        }

        // Legacy single char code
        if (LEGACY_COLORS[code]) {
          color = LEGACY_COLORS[code];
          i += 2;
          continue;
        }
        // Format codes
        if (code === 'l') { formats.bold = true; i += 2; continue; }
        if (code === 'o') { formats.italic = true; i += 2; continue; }
        if (code === 'n') { formats.underline = true; i += 2; continue; }
        if (code === 'm') { formats.strikethrough = true; i += 2; continue; }
        if (code === 'k') { formats.obfuscated = true; i += 2; continue; }
        if (code === 'r') {
          color = '#FFFFFF';
          formats = { bold: false, italic: false, underline: false, strikethrough: false, obfuscated: false };
          i += 2;
          continue;
        }
      }

      // ── Normal character ──
      let ch = input[i];
      html += buildSpan(ch, color, formats);
      i++;
    }

    return html;
  }

  // Find closing </tagName> considering nesting
  function findClosingTag(input, from, tagName) {
    let depth = 1;
    let i = from;
    const open = `<${tagName}`;
    const close = `</${tagName}>`;
    while (i < input.length) {
      if (input.slice(i, i + open.length).toLowerCase() === open.toLowerCase()) {
        depth++;
        i += open.length;
      } else if (input.slice(i, i + close.length).toLowerCase() === close.toLowerCase()) {
        depth--;
        if (depth === 0) return i;
        i += close.length;
      } else {
        i++;
      }
    }
    return -1;
  }

  // Render text with gradient colors, respecting legacy codes inside
  function renderGradientSegment(innerText, gradientColors, baseFormats) {
    // Extract plain characters (ignoring legacy codes inside)
    const chars = extractCharsWithFormats(innerText, baseFormats);
    if (chars.length === 0) return '';
    const colors = interpolateGradient(gradientColors, chars.length);
    let html = '';
    for (let i = 0; i < chars.length; i++) {
      html += buildSpan(chars[i].ch, colors[i], chars[i].formats);
    }
    return html;
  }

  function renderRainbowSegment(innerText, baseFormats) {
    const chars = extractCharsWithFormats(innerText, baseFormats);
    if (chars.length === 0) return '';
    const colors = rainbowColors(chars.length);
    let html = '';
    for (let i = 0; i < chars.length; i++) {
      html += buildSpan(chars[i].ch, colors[i], chars[i].formats);
    }
    return html;
  }

  // Extract plain characters with their format state from a string with legacy codes
  function extractCharsWithFormats(text, baseFormats) {
    const result = [];
    let formats = { ...baseFormats };
    let i = 0;
    while (i < text.length) {
      if ((text[i] === '&' || text[i] === '\u00A7') && i + 1 < text.length) {
        const code = text[i + 1].toLowerCase();
        if (code === 'l') { formats = { ...formats, bold: true }; i += 2; continue; }
        if (code === 'o') { formats = { ...formats, italic: true }; i += 2; continue; }
        if (code === 'n') { formats = { ...formats, underline: true }; i += 2; continue; }
        if (code === 'm') { formats = { ...formats, strikethrough: true }; i += 2; continue; }
        if (code === 'k') { formats = { ...formats, obfuscated: true }; i += 2; continue; }
        if (code === 'r') { formats = { ...baseFormats }; i += 2; continue; }
        // color codes inside gradient are ignored for color (gradient overrides)
        if (LEGACY_COLORS[code]) { i += 2; continue; }
        if (code === '#' && i + 7 < text.length && /^[0-9A-Fa-f]{6}$/.test(text.slice(i + 2, i + 8))) {
          i += 8; continue;
        }
        if (code === 'x' && i + 13 < text.length) {
          // Bỏ qua &x&R&R&G&G&B&B
          i += 14; continue;
        }
      }
      // Skip XML tags inside gradient
      if (text[i] === '<') {
        const end = text.indexOf('>', i);
        if (end !== -1) { i = end + 1; continue; }
      }
      if (text[i] !== '\n') {
        result.push({ ch: text[i], formats: { ...formats } });
      } else {
        result.push({ ch: '\n', formats: { ...formats } });
      }
      i++;
    }
    return result;
  }

  // Parse a tag string like "red", "gradient:#ff0000:#00ff00", "bold", "b", etc.
  function parseTag(tagContent) {
    const lower = tagContent.toLowerCase();
    const namePart = lower.split(':')[0].split(' ')[0];

    // Reset
    if (namePart === 'reset' || namePart === 'r') {
      return { name: namePart, type: 'reset' };
    }

    // Rainbow
    if (namePart === 'rainbow') {
      return { name: 'rainbow', type: 'rainbow' };
    }

    // Gradient: <gradient:#color1:#color2:...>
    if (namePart === 'gradient') {
      const parts = lower.split(':').slice(1);
      const colors = parts
        .map(p => p.trim())
        .filter(p => /^#?[0-9a-f]{6}$/.test(p))
        .map(p => p.startsWith('#') ? p : '#' + p);
      if (colors.length >= 2) {
        return { name: 'gradient', type: 'gradient', colors };
      }
      return null;
    }

    // Format tags
    const formatMap = {
      'bold': { bold: true }, 'b': { bold: true },
      'italic': { italic: true }, 'i': { italic: true }, 'em': { italic: true },
      'underline': { underline: true }, 'u': { underline: true },
      'strikethrough': { strikethrough: true }, 'st': { strikethrough: true }, 's': { strikethrough: true },
      'obfuscated': { obfuscated: true }, 'obf': { obfuscated: true },
    };
    if (formatMap[namePart]) {
      return { name: namePart, type: 'format', formats: formatMap[namePart] };
    }

    // Hex color tag: <#RRGGBB>
    if (/^#[0-9a-f]{6}$/.test(namePart)) {
      return { name: namePart, type: 'color', color: namePart };
    }

    // MiniMessage named colors
    if (MINI_COLORS[namePart]) {
      return { name: namePart, type: 'color', color: MINI_COLORS[namePart] };
    }

    // Plugin-style named colors
    if (PLUGIN_COLORS[namePart]) {
      return { name: namePart, type: 'color', color: PLUGIN_COLORS[namePart] };
    }

    return null;
  }

  // ─────────────────────────────────────────────
  //  Public API
  // ─────────────────────────────────────────────
  return {
    parse,
    LEGACY_COLORS,
    MINI_COLORS,
    PLUGIN_COLORS,
    rainbowColors,
    interpolateGradient,
  };
})();
