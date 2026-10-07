const MinecraftParser = (() => {

  const LEGACY_COLORS = {
    '0': '#000000', 
    '1': '#0000AA', 
    '2': '#00AA00', 
    '3': '#00AAAA', 
    '4': '#AA0000', 
    '5': '#AA00AA', 
    '6': '#FFAA00', 
    '7': '#AAAAAA', 
    '8': '#555555', 
    '9': '#5555FF', 
    'a': '#55FF55', 
    'b': '#55FFFF', 
    'c': '#FF5555', 
    'd': '#FF55FF', 
    'e': '#FFFF55', 
    'f': '#FFFFFF', 
  };

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

  function rainbowColors(count) {
    const stops = ['#FF0000','#FF8800','#FFFF00','#00FF00','#0088FF','#8800FF'];
    return interpolateGradient(stops, count);
  }

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

  function parse(input) {

    return parseHybrid(input);
  }

  function parseHybrid(input) {
    let html = '';
    let i = 0;

    let color = '#FFFFFF';
    let formats = { bold: false, italic: false, underline: false, strikethrough: false, obfuscated: false };

    let tagStack = [];

    function cloneFormats() {
      return { ...formats };
    }

    while (i < input.length) {

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

      if (input[i] === '<') {
        const tagEnd = input.indexOf('>', i);
        if (tagEnd !== -1) {
          const tagContent = input.slice(i + 1, tagEnd).trim();

          if (tagContent.startsWith('/')) {
            const tagName = tagContent.slice(1).toLowerCase();

            let popped = null;
            for (let si = tagStack.length - 1; si >= 0; si--) {
              if (tagStack[si].name === tagName) {
                popped = tagStack.splice(si, 1)[0];
                break;
              }
            }

            if (tagStack.length > 0) {
              const top = tagStack[tagStack.length - 1];
              if (top.color) color = top.color;
              formats = cloneFormats();

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

              i = tagEnd + 1;
              continue;
            }
            tagStack.push(frame);
            i = tagEnd + 1;
            continue;
          }
        }
      }

      if ((input[i] === '&' || input[i] === '\u00A7') && i + 1 < input.length) {
        const next = input[i + 1];

        if (next === '#' && i + 7 < input.length) {
          const hex = input.slice(i + 2, i + 8);
          if (/^[0-9A-Fa-f]{6}$/.test(hex)) {
            color = '#' + hex;
            i += 8;
            continue;
          }
        }

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

        if (LEGACY_COLORS[code]) {
          color = LEGACY_COLORS[code];
          i += 2;
          continue;
        }

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

      let ch = input[i];
      html += buildSpan(ch, color, formats);
      i++;
    }

    return html;
  }

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

  function renderGradientSegment(innerText, gradientColors, baseFormats) {

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

        if (LEGACY_COLORS[code]) { i += 2; continue; }
        if (code === '#' && i + 7 < text.length && /^[0-9A-Fa-f]{6}$/.test(text.slice(i + 2, i + 8))) {
          i += 8; continue;
        }
        if (code === 'x' && i + 13 < text.length) {

          i += 14; continue;
        }
      }

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

  function parseTag(tagContent) {
    const lower = tagContent.toLowerCase();
    const namePart = lower.split(':')[0].split(' ')[0];

    if (namePart === 'reset' || namePart === 'r') {
      return { name: namePart, type: 'reset' };
    }

    if (namePart === 'rainbow') {
      return { name: 'rainbow', type: 'rainbow' };
    }

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

    if (/^#[0-9a-f]{6}$/.test(namePart)) {
      return { name: namePart, type: 'color', color: namePart };
    }

    if (MINI_COLORS[namePart]) {
      return { name: namePart, type: 'color', color: MINI_COLORS[namePart] };
    }

    if (PLUGIN_COLORS[namePart]) {
      return { name: namePart, type: 'color', color: PLUGIN_COLORS[namePart] };
    }

    return null;
  }

  const HEX_TO_LEGACY = Object.fromEntries(Object.entries(LEGACY_COLORS).map(([k,v]) => [v.toLowerCase(), '&' + k]));
  const HEX_TO_MINI = {};
  for (let k in MINI_COLORS) {
    HEX_TO_MINI[MINI_COLORS[k].toLowerCase()] = '<' + k + '>';
  }

  function rgbToHexStr(rgb) {
    if (!rgb) return null;
    if (rgb.startsWith('#')) return rgb;
    const m = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (m) {
        return '#' + [m[1], m[2], m[3]].map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
    }
    return null;
  }

  function convertToFormat(input, target) {
    const lines = input.split('\n');
    const outLines = lines.map(line => {
        if (!line) return '';
        const html = parseHybrid(line);
        const div = document.createElement('div');
        div.innerHTML = html;
        
        let out = '';
        let lastColor = null;
        let lastFormats = { bold: false, italic: false, underline: false, strikethrough: false, obfuscated: false };

        function processNode(node) {
            if (node.nodeType === 3) {
                if (node.textContent) out += node.textContent;
            } else if (node.nodeType === 1) {
                if (node.classList.contains('placeholder')) {
                    out += node.textContent;
                    return;
                }
                
                let color = node.style.color ? rgbToHexStr(node.style.color) : lastColor;
                let formats = { ...lastFormats };
                if (node.style.fontWeight === 'bold') formats.bold = true;
                if (node.style.fontStyle === 'italic') formats.italic = true;
                if (node.style.textDecoration.includes('underline')) formats.underline = true;
                if (node.style.textDecoration.includes('line-through')) formats.strikethrough = true;
                if (node.classList.contains('obfuscated')) formats.obfuscated = true;

                let prefix = '';
                let needsReset = false;
                for (let k in formats) {
                    if (lastFormats[k] && !formats[k]) needsReset = true;
                }

                if (needsReset) {
                    prefix += (target === 'minimessage') ? '<reset>' : '&r';
                    lastColor = null;
                    lastFormats = { bold: false, italic: false, underline: false, strikethrough: false, obfuscated: false };
                }

                if (color !== lastColor && color) {
                    const colorLower = color.toLowerCase();
                    if (target === 'minimessage') {
                        if (HEX_TO_MINI[colorLower]) prefix += HEX_TO_MINI[colorLower];
                        else prefix += `<${color}>`;
                    } else if (target === 'legacy') {
                        if (HEX_TO_LEGACY[colorLower]) prefix += HEX_TO_LEGACY[colorLower];
                        else prefix += '&x' + color.slice(1).split('').map(c => '&' + c.toUpperCase()).join('');
                    } else if (target === 'hex') {
                        if (HEX_TO_LEGACY[colorLower]) prefix += HEX_TO_LEGACY[colorLower];
                        else prefix += `&#${color.slice(1).toUpperCase()}`;
                    }
                    lastColor = color;
                }

                for (let k in formats) {
                    if (formats[k] && !lastFormats[k]) {
                        if (target === 'minimessage') {
                            const m = { bold: '<bold>', italic: '<italic>', underline: '<underline>', strikethrough: '<strikethrough>', obfuscated: '<obf>' };
                            prefix += m[k];
                        } else {
                            const m = { bold: '&l', italic: '&o', underline: '&n', strikethrough: '&m', obfuscated: '&k' };
                            prefix += m[k];
                        }
                        lastFormats[k] = true;
                    }
                }

                if (prefix) out += prefix;
                for (let child of node.childNodes) processNode(child);
            }
        }
        for (let child of div.childNodes) processNode(child);
        return out;
    });
    return outLines.join('\n');
  }

  return {
    parse,
    LEGACY_COLORS,
    MINI_COLORS,
    PLUGIN_COLORS,
    rainbowColors,
    interpolateGradient,
    convertToFormat
  };
})();
