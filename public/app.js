// ─────────────────────────────────────────────────────────
//  App logic — UI interactions
// ─────────────────────────────────────────────────────────

const input  = document.getElementById('colorInput');
const preview = document.getElementById('previewBox');
const previewBtn = document.getElementById('previewBtn');
const clearBtn   = document.getElementById('clearBtn');
const copyBtn    = document.getElementById('copyBtn');

// ── Preview on button or Ctrl+Enter ──────────────────────
previewBtn.addEventListener('click', doPreview);
input.addEventListener('keydown', e => {
  if (e.key === 'Enter' && e.ctrlKey) doPreview();
});

// Live preview with debounce
let debounceTimer = null;
input.addEventListener('input', () => {
  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(doPreview, 300);
});

function doPreview() {
  const text = input.value;
  if (!text.trim()) {
    preview.innerHTML = '<span class="placeholder-text">Nhập text phía trên để xem preview...</span>';
    return;
  }
  const lines = text.split('\n');
  const html = lines.map(line => {
    if (line === '') return '<br>';
    return '<div class="mc-line">' + MinecraftParser.parse(line) + '</div>';
  }).join('');
  preview.innerHTML = html;

  // Animate obfuscated text
  startObfuscation();
}

// ── Clear ─────────────────────────────────────────────────
clearBtn.addEventListener('click', () => {
  input.value = '';
  preview.innerHTML = '<span class="placeholder-text">Nhập text phía trên để xem preview...</span>';
  stopObfuscation();
});

// ── Copy ──────────────────────────────────────────────────
copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(input.value).then(() => {
    copyBtn.textContent = '✓ Đã copy!';
    copyBtn.classList.add('copied');
    setTimeout(() => {
      copyBtn.textContent = '📋 Copy';
      copyBtn.classList.remove('copied');
    }, 2000);
  });
});

// ── Background switcher ───────────────────────────────────
document.querySelectorAll('.bg-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.bg-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    preview.className = 'minecraft-preview ' + btn.dataset.bg;
  });
});

// ── Obfuscated animation ──────────────────────────────────
const OBFUSCATED_CHARS = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789!@#$%^&*()';
let obfuscationInterval = null;

function startObfuscation() {
  stopObfuscation();
  obfuscationInterval = setInterval(() => {
    document.querySelectorAll('.obfuscated').forEach(el => {
      const len = el.dataset.origLen || el.textContent.length;
      el.dataset.origLen = len;
      let s = '';
      for (let i = 0; i < len; i++) {
        s += OBFUSCATED_CHARS[Math.floor(Math.random() * OBFUSCATED_CHARS.length)];
      }
      el.textContent = s;
    });
  }, 60);
}

function stopObfuscation() {
  if (obfuscationInterval) {
    clearInterval(obfuscationInterval);
    obfuscationInterval = null;
  }
}

// ── Example cards ─────────────────────────────────────────
document.querySelectorAll('.example-card').forEach(card => {
  const text = card.dataset.text;
  const previewDiv = card.querySelector('.example-preview');
  // Render small preview
  const html = MinecraftParser.parse(text);
  previewDiv.innerHTML = html;

  card.addEventListener('click', () => {
    input.value = text;
    doPreview();
    input.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});

// ── Reference tables ──────────────────────────────────────
function buildLegacyGrid() {
  const grid = document.getElementById('legacyGrid');
  const colors = MinecraftParser.LEGACY_COLORS;
  const names = {
    '0':'Black','1':'Dark Blue','2':'Dark Green','3':'Dark Aqua','4':'Dark Red',
    '5':'Dark Purple','6':'Gold','7':'Gray','8':'Dark Gray','9':'Blue',
    'a':'Green','b':'Aqua','c':'Red','d':'Light Purple','e':'Yellow','f':'White'
  };
  let html = '';
  for (const [code, color] of Object.entries(colors)) {
    html += `
      <div class="color-chip" onclick="insertCode('&${code}')" title="Click để chèn &${code}">
        <div class="color-swatch" style="background:${color}"></div>
        <div class="color-info">
          <span class="color-code">&amp;${code}</span>
          <span class="color-name" style="color:${color}">${names[code]}</span>
        </div>
      </div>`;
  }
  grid.innerHTML = html;
}

function buildMiniTable() {
  const table = document.getElementById('miniTable');
  const entries = [
    ['<red>', '#FF5555'], ['<green>', '#55FF55'], ['<yellow>', '#FFFF55'],
    ['<blue>', '#5555FF'], ['<aqua>', '#55FFFF'], ['<gold>', '#FFAA00'],
    ['<white>', '#FFFFFF'], ['<gray>', '#AAAAAA'], ['<dark_red>', '#AA0000'],
    ['<dark_green>', '#00AA00'], ['<dark_aqua>', '#00AAAA'], ['<dark_blue>', '#0000AA'],
    ['<dark_purple>', '#AA00AA'], ['<light_purple>', '#FF55FF'], ['<dark_gray>', '#555555'],
    ['<black>', '#000000'],
  ];
  let html = '<table><thead><tr><th>Tag</th><th>Kết quả</th><th></th></tr></thead><tbody>';
  for (const [tag, color] of entries) {
    html += `<tr>
      <td><code>${tag.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></td>
      <td style="color:${color};font-weight:bold">■ ${tag.replace(/<|>/g,'')}</td>
      <td><button class="insert-btn" onclick="insertCode('${tag}')">Chèn</button></td>
    </tr>`;
  }
  html += '</tbody></table>';
  table.innerHTML = html;
}

function buildFormatTable() {
  const table = document.getElementById('formatTable');
  const entries = [
    ['&l', '<b>', 'Bold (đậm)', 'bold'],
    ['&o', '<i>', 'Italic (nghiêng)', 'italic'],
    ['&n', '<u>', 'Underline (gạch chân)', 'underline'],
    ['&m', '<s>', 'Strikethrough (gạch ngang)', 'strikethrough'],
    ['&k', '<obf>', 'Obfuscated (ẩn)', 'obfuscated'],
    ['&r', '<reset>', 'Reset về mặc định', 'reset'],
  ];
  let html = '<table><thead><tr><th>Legacy</th><th>MiniMessage</th><th>Mô tả</th><th>Ví dụ</th><th></th></tr></thead><tbody>';
  for (const [leg, mini, desc] of entries) {
    const sample = leg === '&r' ? '&r' :
                   leg === '&k' ? '' : // skip obfuscated sample
                   `${leg}Chữ mẫu`;
    const sampleHtml = sample ? MinecraftParser.parse(`&f${leg}Chữ mẫu`) : '<span class="obfuscated">????</span>';
    html += `<tr>
      <td><code>${leg}</code></td>
      <td><code>${mini.replace(/</g,'&lt;').replace(/>/g,'&gt;')}</code></td>
      <td>${desc}</td>
      <td class="sample-cell">${sampleHtml}</td>
      <td><button class="insert-btn" onclick="insertCode('${leg}')">Chèn</button></td>
    </tr>`;
  }
  html += '</tbody></table>';
  table.innerHTML = html;
}

function insertCode(code) {
  const start = input.selectionStart;
  const end = input.selectionEnd;
  const val = input.value;
  input.value = val.slice(0, start) + code + val.slice(end);
  input.selectionStart = input.selectionEnd = start + code.length;
  input.focus();
  doPreview();
}

// ── Tabs ──────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// ── Init ──────────────────────────────────────────────────
buildLegacyGrid();
buildMiniTable();
buildFormatTable();

// Start obfuscation on example cards
startObfuscation();

// ══════════════════════════════════════════════════════════
//  GRADIENT BUILDER
// ══════════════════════════════════════════════════════════

const GB = (() => {

  // ── State ─────────────────────────────────────────────
  let stops = ['#ff0000', '#ffaa00', '#00ff88'];
  let currentFmt = 'hex'; // 'hex' | 'minimessage' | 'legacy'

  // ── DOM refs ──────────────────────────────────────────
  const gbText    = document.getElementById('gbText');
  const gbStops   = document.getElementById('gbStops');
  const gbBar     = document.getElementById('gbBar');
  const gbPreview = document.getElementById('gbPreview');
  const gbOutputs = document.getElementById('gbOutputs');
  const gbBold    = document.getElementById('gbBold');
  const gbItalic  = document.getElementById('gbItalic');
  const gbUnder   = document.getElementById('gbUnder');
  const gbStrike  = document.getElementById('gbStrike');

  // ── Helpers ───────────────────────────────────────────
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return {
      r: parseInt(h.slice(0,2), 16),
      g: parseInt(h.slice(2,4), 16),
      b: parseInt(h.slice(4,6), 16),
    };
  }

  function rgbToHex({ r, g, b }) {
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2,'0')).join('');
  }

  function lerpRgb(a, b, t) {
    return {
      r: Math.round(a.r + (b.r - a.r) * t),
      g: Math.round(a.g + (b.g - a.g) * t),
      b: Math.round(a.b + (b.b - a.b) * t),
    };
  }

  // Generate `count` colors interpolated across stops[]
  function getGradientColors(count) {
    if (count <= 0) return [];
    if (count === 1) return [stops[0]];
    const colors = [];
    const segs = stops.length - 1;
    for (let i = 0; i < count; i++) {
      const t = i / (count - 1);
      const seg = Math.min(Math.floor(t * segs), segs - 1);
      const tSeg = t * segs - seg;
      colors.push(rgbToHex(lerpRgb(hexToRgb(stops[seg]), hexToRgb(stops[seg + 1]), tSeg)));
    }
    return colors;
  }

  // ── Render stop row ───────────────────────────────────
  function renderStops() {
    gbStops.innerHTML = '';
    stops.forEach((hex, idx) => {
      const div = document.createElement('div');
      div.className = 'gb-stop';
      div.innerHTML = `
        <div class="gb-stop-swatch" title="Click để chọn màu">
          <div class="gb-stop-swatch-bg" style="background:${hex}"></div>
          <input type="color" value="${hex}" data-idx="${idx}" class="gb-color-input">
        </div>
        <input type="text" class="gb-stop-hex" value="${hex.toUpperCase()}" data-idx="${idx}" maxlength="7" spellcheck="false">
      `;
      gbStops.appendChild(div);
    });

    // color picker events
    gbStops.querySelectorAll('.gb-color-input').forEach(inp => {
      inp.addEventListener('input', e => {
        const idx = +e.target.dataset.idx;
        stops[idx] = e.target.value;
        // sync swatch bg + hex text
        const stop = e.target.closest('.gb-stop');
        stop.querySelector('.gb-stop-swatch-bg').style.background = e.target.value;
        stop.querySelector('.gb-stop-hex').value = e.target.value.toUpperCase();
        update();
      });
    });

    // hex text input events
    gbStops.querySelectorAll('.gb-stop-hex').forEach(inp => {
      inp.addEventListener('input', e => {
        let val = e.target.value.trim();
        if (!val.startsWith('#')) val = '#' + val;
        if (/^#[0-9a-fA-F]{6}$/.test(val)) {
          const idx = +e.target.dataset.idx;
          stops[idx] = val;
          const stop = e.target.closest('.gb-stop');
          stop.querySelector('.gb-stop-swatch-bg').style.background = val;
          stop.querySelector('.gb-color-input').value = val;
          update();
        }
      });
    });
  }

  // ── Gradient bar ──────────────────────────────────────
  function renderBar() {
    gbBar.style.background =
      `linear-gradient(90deg, ${stops.join(', ')})`;
  }

  // ── Format codes ──────────────────────────────────────
  function getFormats() {
    return {
      bold:   gbBold.checked,
      italic: gbItalic.checked,
      under:  gbUnder.checked,
      strike: gbStrike.checked,
    };
  }

  function legacyFormatCodes(f) {
    let s = '';
    if (f.bold)   s += '&l';
    if (f.italic) s += '&o';
    if (f.under)  s += '&n';
    if (f.strike) s += '&m';
    return s;
  }

  function miniFormatOpen(f) {
    let s = '';
    if (f.bold)   s += '<bold>';
    if (f.italic) s += '<italic>';
    if (f.under)  s += '<underline>';
    if (f.strike) s += '<strikethrough>';
    return s;
  }
  function miniFormatClose(f) {
    let s = '';
    if (f.strike) s += '</strikethrough>';
    if (f.under)  s += '</underline>';
    if (f.italic) s += '</italic>';
    if (f.bold)   s += '</bold>';
    return s;
  }

  // Build output code string
  function buildCode(text, fmt) {
    const f = getFormats();
    const chars = [...text]; // unicode-safe split
    if (chars.length === 0) return '';

    if (fmt === 'minimessage') {
      // <gradient:#c1:#c2:...><bold>text</bold></gradient>
      const colStr = stops.map(c => c.toLowerCase()).join(':');
      return `<gradient:${colStr}>${miniFormatOpen(f)}${text}${miniFormatClose(f)}</gradient>`;
    }

    const colors = getGradientColors(chars.length);
    const fmtCode = legacyFormatCodes(f);

    if (fmt === 'hex') {
      // &#RRGGBB per character
      return chars.map((ch, i) => `&#${colors[i].slice(1).toUpperCase()}${fmtCode}${ch}`).join('');
    }

    if (fmt === 'legacy') {
      // &x&R&R&G&G&B&B format (used by some plugins like CMI, EssentialsX)
      return chars.map((ch, i) => {
        const hex = colors[i].slice(1).toUpperCase();
        const xCode = '&x' + hex.split('').map(c => `&${c}`).join('');
        return `${xCode}${fmtCode}${ch}`;
      }).join('');
    }

    return '';
  }

  // ── Preview render ────────────────────────────────────
  function renderPreview() {
    const text = gbText.value;
    if (!text.trim()) {
      gbPreview.innerHTML = '<span style="color:#444;font-style:italic;font-size:0.85rem">Preview sẽ hiện ở đây...</span>';
      return;
    }

    const chars = [...text];
    const colors = getGradientColors(chars.length);
    const f = getFormats();

    const html = chars.map((ch, i) => {
      let style = `color:${colors[i]};`;
      if (f.bold)   style += 'font-weight:bold;';
      if (f.italic) style += 'font-style:italic;';
      let deco = [];
      if (f.under)  deco.push('underline');
      if (f.strike) deco.push('line-through');
      if (deco.length) style += `text-decoration:${deco.join(' ')};`;
      return `<span style="${style};text-shadow:1px 1px 3px rgba(0,0,0,0.9)">${escapeHtml(ch)}</span>`;
    }).join('');

    gbPreview.innerHTML = html;
  }

  function escapeHtml(t) {
    return t.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
  }

  // ── Output blocks render ──────────────────────────────
  const FMT_LABELS = {
    hex:         '&#RRGGBB — Bukkit / Spigot / Paper',
    minimessage: '<gradient> — MiniMessage / Adventure API',
    legacy:      '&x codes — CMI / EssentialsX / LuckPerms',
  };

  function renderOutputs() {
    const text = gbText.value;

    // Always show all 3 formats
    const fmts = ['hex', 'minimessage', 'legacy'];
    gbOutputs.innerHTML = fmts.map(fmt => {
      const code = text.trim() ? buildCode(text, fmt) : '';
      const id = `gbOut_${fmt}`;
      return `
        <div class="gb-output-block">
          <div class="gb-output-header">
            <span class="gb-output-label">${FMT_LABELS[fmt]}</span>
            <button class="gb-copy-btn" onclick="GB.copyOutput('${fmt}')">📋 Copy</button>
          </div>
          <div class="gb-output-code" id="${id}">${escapeHtml(code)}</div>
        </div>`;
    }).join('');
  }

  // ── Copy output ───────────────────────────────────────
  function copyOutput(fmt) {
    const text = gbText.value;
    if (!text.trim()) return;
    const code = buildCode(text, fmt);
    navigator.clipboard.writeText(code).then(() => {
      // find the button and flash it
      const btn = gbOutputs.querySelector(`[onclick="GB.copyOutput('${fmt}')"]`);
      if (btn) {
        btn.textContent = '✓ Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          btn.innerHTML = '📋 Copy';
          btn.classList.remove('copied');
        }, 2000);
      }
    });
  }

  // ── Main update ───────────────────────────────────────
  function update() {
    renderBar();
    renderPreview();
    renderOutputs();
  }

  // ── Init ─────────────────────────────────────────────
  function init() {
    renderStops();
    update();

    // Text input
    gbText.addEventListener('input', update);

    // Format toggles
    [gbBold, gbItalic, gbUnder, gbStrike].forEach(cb => cb.addEventListener('change', update));

    // Add/remove stop buttons
    document.getElementById('gbAddStop').addEventListener('click', () => {
      if (stops.length >= 8) return;
      // interpolate a new stop between last two
      const last  = hexToRgb(stops[stops.length - 1]);
      const prev  = hexToRgb(stops[Math.max(0, stops.length - 2)]);
      const newC  = rgbToHex(lerpRgb(last, prev, 0.5));
      stops.push(newC);
      renderStops();
      update();
    });

    document.getElementById('gbRemoveStop').addEventListener('click', () => {
      if (stops.length <= 2) return;
      stops.pop();
      renderStops();
      update();
    });

    // Format tab buttons
    document.querySelectorAll('.gb-fmt-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.gb-fmt-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentFmt = btn.dataset.fmt;
        // scroll to that format block
        const el = document.getElementById(`gbOut_${currentFmt}`);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      });
    });
  }

  return { init, copyOutput };
})();

// Init Gradient Builder
GB.init();
