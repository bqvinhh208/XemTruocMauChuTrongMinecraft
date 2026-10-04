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
