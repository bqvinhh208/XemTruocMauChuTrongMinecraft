// ─────────────────────────────────────────────────────────
//  App logic — Compact UI Fix
// ─────────────────────────────────────────────────────────

const AppState = {
  text: "Minecraft Color",
  stops: ['#ff0000', '#ffaa00', '#00ff88'],
  fmt: { b: false, i: false, u: false, s: false },
  outFormat: 'hex', // hex | minimessage | legacy
  isManual: false,  // If user types raw code, we stop auto-generating from gradient
};

const DOM = {
  plainText: document.getElementById('plainText'),
  fmtB: document.getElementById('fmtB'),
  fmtI: document.getElementById('fmtI'),
  fmtU: document.getElementById('fmtU'),
  fmtS: document.getElementById('fmtS'),
  
  btnAdd: document.getElementById('btnAddColor'),
  btnRem: document.getElementById('btnRemoveColor'),
  btnRand: document.getElementById('btnRandomColors'),
  stopsContainer: document.getElementById('colorStops'),
  gradientBar: document.getElementById('gradientBar'),

  formatSelect: document.getElementById('formatSelect'),
  rawInput: document.getElementById('rawInput'),
  copyBtn: document.getElementById('copyBtn'),
  clearBtn: document.getElementById('clearBtn'),

  previewBox: document.getElementById('previewBox'),
  bgBtns: document.querySelectorAll('.bg-btn'),
  previewContainer: document.getElementById('previewContainer')
};

// ── Helpers ───────────────────────────────────────────
function hexToRgb(h) {
  const c = h.replace('#','');
  return { r: parseInt(c.slice(0,2),16), g: parseInt(c.slice(2,4),16), b: parseInt(c.slice(4,6),16) };
}
function rgbToHex({r,g,b}) {
  return '#' + [r,g,b].map(v => v.toString(16).padStart(2,'0')).join('');
}
function lerp(a, b, t) {
  return {
    r: Math.round(a.r + (b.r - a.r) * t),
    g: Math.round(a.g + (b.g - a.g) * t),
    b: Math.round(a.b + (b.b - a.b) * t),
  };
}
function getGradientColors(count) {
  if (count <= 0) return [];
  if (count === 1) return [AppState.stops[0]];
  const res = [];
  const segs = AppState.stops.length - 1;
  for (let i = 0; i < count; i++) {
    const t = i / (count - 1);
    const seg = Math.min(Math.floor(t * segs), segs - 1);
    const tSeg = t * segs - seg;
    res.push(rgbToHex(lerp(hexToRgb(AppState.stops[seg]), hexToRgb(AppState.stops[seg+1]), tSeg)));
  }
  return res;
}

// ── Render UI ─────────────────────────────────────────
function renderStops() {
  DOM.stopsContainer.innerHTML = '';
  AppState.stops.forEach((hex, i) => {
    const el = document.createElement('div');
    el.className = 'color-stop-item';
    el.innerHTML = `
      <div class="color-stop-swatch">
        <div class="swatch-bg" style="width:100%;height:100%;background:${hex};pointer-events:none"></div>
        <input type="color" value="${hex}" data-idx="${i}">
      </div>
      <input type="text" class="color-stop-hex" value="${hex.toUpperCase()}" data-idx="${i}" maxlength="7" spellcheck="false">
    `;
    DOM.stopsContainer.appendChild(el);
  });

  // CRITICAL FIX: Only update the visual styling, DO NOT call renderStops() on input
  DOM.stopsContainer.querySelectorAll('input[type="color"]').forEach(inp => {
    inp.addEventListener('input', e => {
      const idx = +e.target.dataset.idx;
      const val = e.target.value;
      AppState.stops[idx] = val;
      AppState.isManual = false;
      
      // Update DOM visually without re-rendering entire list (which closes color picker)
      e.target.previousElementSibling.style.background = val;
      e.target.closest('.color-stop-item').querySelector('.color-stop-hex').value = val.toUpperCase();
      DOM.gradientBar.style.background = `linear-gradient(90deg, ${AppState.stops.join(', ')})`;
      
      updateAll();
    });
  });
  
  DOM.stopsContainer.querySelectorAll('.color-stop-hex').forEach(inp => {
    inp.addEventListener('change', e => {
      let val = e.target.value.trim();
      if(!val.startsWith('#')) val = '#'+val;
      if(/^#[0-9a-fA-F]{6}$/.test(val)) {
        const idx = +e.target.dataset.idx;
        AppState.stops[idx] = val;
        AppState.isManual = false;
        
        // Update color picker value and swatch
        const parent = e.target.closest('.color-stop-item');
        parent.querySelector('input[type="color"]').value = val;
        parent.querySelector('.swatch-bg').style.background = val;
        DOM.gradientBar.style.background = `linear-gradient(90deg, ${AppState.stops.join(', ')})`;
        
        updateAll();
      }
    });
  });
  
  DOM.gradientBar.style.background = `linear-gradient(90deg, ${AppState.stops.join(', ')})`;
}

// ── Build Codes ───────────────────────────────────────
function getLegacyFmt() {
  let s = '';
  if (AppState.fmt.b) s += '&l';
  if (AppState.fmt.i) s += '&o';
  if (AppState.fmt.u) s += '&n';
  if (AppState.fmt.s) s += '&m';
  return s;
}
function buildMiniMsg() {
  const chars = [...AppState.text];
  if(!chars.length) return '';
  const cols = AppState.stops.map(c=>c.toLowerCase()).join(':');
  let open = '', close = '';
  if(AppState.fmt.b) { open += '<bold>'; close = '</bold>' + close; }
  if(AppState.fmt.i) { open += '<italic>'; close = '</italic>' + close; }
  if(AppState.fmt.u) { open += '<underline>'; close = '</underline>' + close; }
  if(AppState.fmt.s) { open += '<strikethrough>'; close = '</strikethrough>' + close; }
  return `<gradient:${cols}>${open}${AppState.text}${close}</gradient>`;
}
function buildCode() {
  if (!AppState.text.trim()) return '';
  if (AppState.outFormat === 'minimessage') return buildMiniMsg();

  const chars = [...AppState.text];
  const colors = getGradientColors(chars.length);
  const f = getLegacyFmt();

  if (AppState.outFormat === 'hex') {
    return chars.map((ch, i) => `&#${colors[i].slice(1).toUpperCase()}${f}${ch}`).join('');
  }
  if (AppState.outFormat === 'legacy') {
    return chars.map((ch, i) => {
      const hex = colors[i].slice(1).toUpperCase();
      const xCode = '&x' + hex.split('').map(c => `&${c}`).join('');
      return `${xCode}${f}${ch}`;
    }).join('');
  }
  return '';
}

// ── Core Updates ──────────────────────────────────────
let obfTimer = null;
function updatePreview() {
  const code = DOM.rawInput.value;
  if (!code.trim()) {
    DOM.previewBox.innerHTML = '<span class="placeholder-text">Đang đợi nội dung...</span>';
    return;
  }
  DOM.previewBox.innerHTML = code.split('\n').map(line => {
    return line ? `<div class="mc-line">${MinecraftParser.parse(line)}</div>` : '<br>';
  }).join('');

  // Anim obf
  clearInterval(obfTimer);
  obfTimer = setInterval(() => {
    document.querySelectorAll('.obfuscated').forEach(el => {
      const len = el.dataset.origLen || el.textContent.length;
      el.dataset.origLen = len;
      let s = '';
      const chars = 'AaBbCcDdEeFfGgHhIiJjKkLlMmNnOoPpQqRrSsTtUuVvWwXxYyZz0123456789!@#$%^&*()';
      for(let i=0; i<len; i++) s += chars[Math.floor(Math.random()*chars.length)];
      el.textContent = s;
    });
  }, 60);
}

function updateAll() {
  if (!AppState.isManual) {
    DOM.rawInput.value = buildCode();
  }
  updatePreview();
}

// ── Events ────────────────────────────────────────────
DOM.plainText.addEventListener('input', e => {
  AppState.text = e.target.value;
  AppState.isManual = false;
  updateAll();
});

[DOM.fmtB, DOM.fmtI, DOM.fmtU, DOM.fmtS].forEach(cb => {
  cb.addEventListener('change', () => {
    AppState.fmt = { b: DOM.fmtB.checked, i: DOM.fmtI.checked, u: DOM.fmtU.checked, s: DOM.fmtS.checked };
    AppState.isManual = false;
    updateAll();
  });
});

DOM.formatSelect.addEventListener('change', e => {
  AppState.outFormat = e.target.value;
  AppState.isManual = false; // re-gen code
  updateAll();
});

DOM.rawInput.addEventListener('input', () => {
  AppState.isManual = true; // user is typing raw code
  updatePreview();
});

DOM.btnAdd.addEventListener('click', () => {
  if(AppState.stops.length >= 8) return;
  const c1 = hexToRgb(AppState.stops[AppState.stops.length-1]);
  const c2 = hexToRgb(AppState.stops[Math.max(0, AppState.stops.length-2)]);
  AppState.stops.push(rgbToHex(lerp(c1,c2,0.5)));
  AppState.isManual = false;
  renderStops(); updateAll();
});

DOM.btnRem.addEventListener('click', () => {
  if(AppState.stops.length <= 2) return;
  AppState.stops.pop();
  AppState.isManual = false;
  renderStops(); updateAll();
});

DOM.btnRand.addEventListener('click', () => {
  const randHex = () => '#'+Math.floor(Math.random()*16777215).toString(16).padStart(6,'0');
  for(let i=0; i<AppState.stops.length; i++) AppState.stops[i] = randHex();
  AppState.isManual = false;
  renderStops(); updateAll();
});

DOM.copyBtn.addEventListener('click', () => {
  navigator.clipboard.writeText(DOM.rawInput.value).then(() => {
    const o = DOM.copyBtn.innerHTML;
    DOM.copyBtn.innerHTML = '✓ Đã Copy';
    DOM.copyBtn.classList.add('copied');
    setTimeout(() => { DOM.copyBtn.innerHTML = o; DOM.copyBtn.classList.remove('copied'); }, 1500);
  });
});

DOM.clearBtn.addEventListener('click', () => {
  DOM.plainText.value = '';
  DOM.rawInput.value = '';
  AppState.text = '';
  AppState.isManual = true;
  updateAll();
});

// Bg Switcher
DOM.bgBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    DOM.bgBtns.forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    DOM.previewContainer.className = 'card preview-section bg-' + btn.dataset.bg;
  });
});

// Example cards
document.querySelectorAll('.example-card').forEach(card => {
  const text = card.dataset.text;
  card.querySelector('.example-preview').innerHTML = MinecraftParser.parse(text);
  card.addEventListener('click', () => {
    DOM.rawInput.value = text;
    AppState.isManual = true; // Override gradient builder
    updatePreview();
    DOM.rawInput.scrollIntoView({ behavior: 'smooth', block: 'center' });
  });
});

// Reference tables
function initTables() {
  const leg = document.getElementById('legacyGrid');
  if(leg) {
    let html = '';
    const cols = MinecraftParser.LEGACY_COLORS;
    for(let c in cols) html += `<div class="color-chip" onclick="insertRaw('&${c}')"><div class="color-swatch" style="background:${cols[c]}"></div>&amp;${c}</div>`;
    leg.innerHTML = html;
  }

  const mini = document.getElementById('miniTable');
  if (mini) {
    let html = '<table><tr><th>Màu sắc</th><th>Mã MiniMessage</th></tr>';
    const cols = MinecraftParser.MINI_COLORS;
    for (let c in cols) {
      if (['dark_grey', 'grey', 'light_purple'].includes(c)) continue;
      html += `<tr>
        <td><div class="color-chip" style="width:fit-content;padding:0.2rem 0.5rem;border:none;background:transparent;cursor:default"><div class="color-swatch" style="background:${cols[c]}"></div><span style="color:${cols[c]}">${c}</span></div></td>
        <td><code class="insert-btn" onclick="insertRaw('<${c}>')">&lt;${c}&gt;</code></td>
      </tr>`;
    }
    html += '</table>';
    mini.innerHTML = html;
  }

  const fmt = document.getElementById('formatTable');
  if (fmt) {
    const formats = [
      { name: 'In đậm (Bold)', leg: '&l', mini: '<bold>', style: 'font-weight:bold' },
      { name: 'In nghiêng (Italic)', leg: '&o', mini: '<italic>', style: 'font-style:italic' },
      { name: 'Gạch chân (Underline)', leg: '&n', mini: '<underline>', style: 'text-decoration:underline' },
      { name: 'Gạch ngang (Strikethrough)', leg: '&m', mini: '<strikethrough>', style: 'text-decoration:line-through' },
      { name: 'Làm mờ (Obfuscated)', leg: '&k', mini: '<obf>', style: 'opacity:0.8' },
      { name: 'Mặc định (Reset)', leg: '&r', mini: '<reset>', style: '' }
    ];
    let html = '<table><tr><th>Định dạng</th><th>Legacy</th><th>MiniMessage</th></tr>';
    for (let f of formats) {
      html += `<tr>
        <td style="${f.style}">${f.name}</td>
        <td><code class="insert-btn" onclick="insertRaw('${f.leg}')">${f.leg}</code></td>
        <td><code class="insert-btn" onclick="insertRaw('${f.mini}')">${f.mini.replace('<','&lt;').replace('>','&gt;')}</code></td>
      </tr>`;
    }
    html += '</table>';
    fmt.innerHTML = html;
  }
}
function insertRaw(code) {
  const i = DOM.rawInput;
  const start = i.selectionStart;
  i.value = i.value.slice(0,start) + code + i.value.slice(i.selectionEnd);
  i.selectionStart = i.selectionEnd = start + code.length;
  AppState.isManual = true;
  updatePreview();
  i.focus();
}

// Tabs
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('tab-' + tab.dataset.tab).classList.add('active');
  });
});

// Boot
renderStops();
updateAll();
initTables();

