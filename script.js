// ═══════════════════════════════════════════
// STATE
// ═══════════════════════════════════════════
const state = {
  ts:  { tasks: [], sort: { col: '', asc: true }, focusOnly: false, view: 'table' },
  ths: { tasks: [], sort: { col: '', asc: true }, focusOnly: false, view: 'table' },
  report: { tasks: [], sort: { col: '', asc: true } },
};
let activeTab = 'ts';

const PIN_KEY = 'sdh_pins_v1';
let pinData = { ts: [], ths: [] };

let lastUpdateTs = 0;
let pulseTimer = null;

const PRESET_KEY = 'sdh_presets_v1';
let presetData = { ts: {}, ths: {} };

const focusState = {
  ts: { left: 1500, timer: null, running: false },
  ths:{ left: 1500, timer: null, running: false },
};

const ACCESS_PASSWORD = 'sdh@135';
const ACCESS_KEY = 'sdh_access_granted';

function showPasswordModal() {
  const overlay = document.getElementById('pwOverlay');
  const input = document.getElementById('pwInput');
  const error = document.getElementById('pwError');
  if (!overlay || !input || !error) return;

  if (localStorage.getItem(ACCESS_KEY) === '1') {
    hidePasswordModal();
    return;
  }

  document.body.classList.add('locked');
  overlay.classList.add('show');
  overlay.setAttribute('aria-hidden', 'false');
  error.textContent = '';
  input.value = '';
  setTimeout(() => input.focus(), 50);
}

function hidePasswordModal() {
  const overlay = document.getElementById('pwOverlay');
  if (!overlay) return;
  document.body.classList.remove('locked');
  overlay.classList.remove('show');
  overlay.setAttribute('aria-hidden', 'true');
}

function verifyPassword() {
  const input = document.getElementById('pwInput');
  const error = document.getElementById('pwError');
  if (!input || !error) return;
  if (input.value === ACCESS_PASSWORD) {
    localStorage.setItem(ACCESS_KEY, '1');
    hidePasswordModal();
    return;
  }
  error.textContent = 'Mật khẩu không đúng. Vui lòng thử lại.';
  input.select();
}

function loadPins() {
  try {
    const raw = localStorage.getItem(PIN_KEY);
    pinData = raw ? JSON.parse(raw) : { ts: [], ths: [] };
  } catch (e) {
    pinData = { ts: [], ths: [] };
  }
}

function savePins() {
  try { localStorage.setItem(PIN_KEY, JSON.stringify(pinData)); } catch (e) {}
}

function getTaskId(key, t) {
  return [key, t.stt || 'x', t.name || ''].join('|');
}

function isPinned(key, id) {
  return (pinData[key] || []).includes(id);
}

function togglePin(key, id) {
  id = decodeURIComponent(id);
  const list = pinData[key] || [];
  if (list.includes(id)) pinData[key] = list.filter(x => x !== id);
  else pinData[key] = [id, ...list].slice(0, 8);
  savePins();
  applyFilters(key);
}

function toggleFocus(key) {
  state[key].focusOnly = !state[key].focusOnly;
  const btn = document.getElementById(key + '-focus');
  if (btn) {
    btn.classList.toggle('active', state[key].focusOnly);
    btn.textContent = state[key].focusOnly ? 'Focus: Đang bật' : 'Focus: Overdue + In progress';
  }
  applyFilters(key);
}

function toggleZen() {
  document.body.classList.toggle('zen');
  const btn = document.getElementById('zenBtn');
  if (btn) btn.classList.toggle('active', document.body.classList.contains('zen'));
}

function loadPresets() {
  try {
    const raw = localStorage.getItem(PRESET_KEY);
    presetData = raw ? JSON.parse(raw) : { ts: {}, ths: {} };
  } catch (e) {
    presetData = { ts: {}, ths: {} };
  }
  presetRender('ts');
  presetRender('ths');
}

function presetRender(key) {
  const sel = document.getElementById(key + '-preset');
  if (!sel) return;
  const list = presetData[key] || {};
  sel.innerHTML = '<option value="">Preset...</option>' + Object.keys(list)
    .map(k => `<option value="${k}">${k}</option>`).join('');
}

function presetSave(key) {
  const nameEl = document.getElementById(key + '-preset-name');
  if (!nameEl || !nameEl.value.trim()) return;
  const name = nameEl.value.trim();
  const data = {
    search: document.getElementById(key+'-search').value || '',
    status: document.getElementById(key+'-fstatus').value || '',
    prio: document.getElementById(key+'-fprio').value || '',
    ns: document.getElementById(key+'-fns').value || '',
    grp: document.getElementById(key+'-fgrp').value || '',
    fu: document.getElementById(key+'-ffu').value || '',
  };
  presetData[key][name] = data;
  try { localStorage.setItem(PRESET_KEY, JSON.stringify(presetData)); } catch (e) {}
  nameEl.value = '';
  presetRender(key);
}

function presetApply(key) {
  const sel = document.getElementById(key + '-preset');
  if (!sel || !sel.value) return;
  const data = presetData[key][sel.value];
  if (!data) return;
  document.getElementById(key+'-search').value = data.search || '';
  document.getElementById(key+'-fstatus').value = data.status || '';
  document.getElementById(key+'-fprio').value = data.prio || '';
  document.getElementById(key+'-fns').value = data.ns || '';
  document.getElementById(key+'-fgrp').value = data.grp || '';
  document.getElementById(key+'-ffu').value = data.fu || '';
  applyFilters(key);
}

function setView(key, view) {
  state[key].view = view;
  const wrap = document.getElementById('panel-' + key);
  if (!wrap) return;
  wrap.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
  wrap.querySelectorAll('.view-btn').forEach(btn => {
    if (btn.textContent.toLowerCase() === view) btn.classList.add('active');
  });
  const table = wrap.querySelector('.table-card');
  const kanban = document.getElementById(key + '-kanban');
  const timeline = document.getElementById(key + '-timeline-view');
  if (table) table.style.display = view === 'table' ? 'block' : 'none';
  if (kanban) kanban.style.display = view === 'kanban' ? 'block' : 'none';
  if (timeline) timeline.style.display = view === 'timeline' ? 'block' : 'none';
}

function smartSort(key) {
  state[key].sort = { col: 'priority', asc: true };
  const list = state[key].tasks.slice().sort((a, b) => {
    const pa = a.priority === 'Cao' ? 0 : 1;
    const pb = b.priority === 'Cao' ? 0 : 1;
    if (pa !== pb) return pa - pb;
    const da = excelSerialToDate(a.end) || excelSerialToDate(a.start) || new Date(2100,0,1);
    const db = excelSerialToDate(b.end) || excelSerialToDate(b.start) || new Date(2100,0,1);
    return da - db;
  });
  state[key].tasks = list;
  applyFilters(key);
}

function snapshotSummary(key) {
  const el = document.getElementById(key + '-summary');
  if (!el) return;
  const text = el.textContent || '';
  if (navigator.clipboard) navigator.clipboard.writeText(text);
  showToast('Đã copy snapshot', 'ok');
}

function setLastUpdate(ts) {
  lastUpdateTs = ts || Date.now();
}

function startPulse() {
  if (pulseTimer) return;
  pulseTimer = setInterval(() => {
    updatePulse('ts');
    updatePulse('ths');
  }, 1000);
}

function updatePulse(key) {
  const el = document.getElementById(key + '-pulse');
  const cap = document.getElementById(key + '-capsule');
  if (!el || !cap) return;
  if (!lastUpdateTs) {
    el.innerHTML = '<span class="pulse-dot"></span>Live pulse';
    cap.textContent = 'Cập nhật: —';
    return;
  }
  const diff = Math.max(0, Math.floor((Date.now() - lastUpdateTs) / 1000));
  el.innerHTML = `<span class="pulse-dot"></span>Live pulse • ${diff}s`;
  const mins = Math.floor(diff / 60);
  const text = mins > 0 ? `${mins} phút trước` : `${diff}s trước`;
  cap.textContent = `Cập nhật: ${text}`;
}

function focusStart(key) {
  const st = focusState[key];
  if (!st || st.running) return;
  st.running = true;
  const btn = document.getElementById(key + '-fs-start');
  if (btn) btn.classList.add('active');
  st.timer = setInterval(() => {
    st.left = Math.max(0, st.left - 1);
    focusRender(key);
    if (st.left === 0) {
      focusPause(key);
      showToast('Focus session hoàn tất', 'ok');
    }
  }, 1000);
}

function focusPause(key) {
  const st = focusState[key];
  if (!st) return;
  st.running = false;
  if (st.timer) clearInterval(st.timer);
  st.timer = null;
  const btn = document.getElementById(key + '-fs-start');
  if (btn) btn.classList.remove('active');
}

function focusReset(key) {
  const st = focusState[key];
  if (!st) return;
  st.left = 1500;
  focusPause(key);
  focusRender(key);
}

function focusRender(key) {
  const el = document.getElementById(key + '-fs-time');
  if (!el) return;
  const m = String(Math.floor(focusState[key].left / 60)).padStart(2, '0');
  const s = String(focusState[key].left % 60).padStart(2, '0');
  el.textContent = `${m}:${s}`;
}

// Initialize date pickers
document.addEventListener('DOMContentLoaded', function() {
    flatpickr(".date-range", {
        mode: "range",
        dateFormat: "d/m/Y",
        locale: {
            firstDayOfWeek: 1,
            weekdays: {
                shorthand: ["CN", "T2", "T3", "T4", "T5", "T6", "T7"],
                longhand: ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"]
            },
            months: {
                shorthand: ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"],
                longhand: ["Tháng Một", "Tháng Hai", "Tháng Ba", "Tháng Tư", "Tháng Năm", "Tháng Sáu", "Tháng Bảy", "Tháng Tám", "Tháng Chín", "Tháng Mười", "Tháng Mười Một", "Tháng Mười Hai"]
            },
            rangeSeparator: ' đến '
        },
        onChange: function(selectedDates, dateStr, instance) {
            // This will trigger the onchange event of the input, thus calling applyFilters
            const event = new Event('change');
            instance.input.dispatchEvent(event);
        }
    });
      showPasswordModal();
      loadPins();
      loadPresets();
      startPulse();
      focusRender('ts');
      focusRender('ths');
      const pwBtn = document.getElementById('pwBtn');
      const pwInput = document.getElementById('pwInput');
      if (pwBtn) pwBtn.addEventListener('click', verifyPassword);
      if (pwInput) pwInput.addEventListener('keydown', e => {
        if (e.key === 'Enter') verifyPassword();
      });
    autoLoadFile();
    noteInit();
    eduInit();
});

// ═══════════════════════════════════════════
// TAB SWITCHING
// ═══════════════════════════════════════════
function switchTab(tab) {
  activeTab = tab;
  ['ts','ths','report','week','edu','note'].forEach(t => {
    const panel = document.getElementById('panel-'+t);
    panel.classList.toggle('active', t === tab);
    if (t === tab) {
      panel.classList.remove('animate-in');
      void panel.offsetWidth;
      panel.classList.add('animate-in');
    }
    const btn = document.getElementById('tab-'+t);
    btn.className = 'tab-btn' + (t === tab ? ' active-'+t : '');
  });
}

// ═══════════════════════════════════════════
// CONFIG — GOOGLE SHEETS (PUBLISHED)
// ═══════════════════════════════════════════
const EXCEL_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRyrCR6Gjo4NQYZLC87atI6_-zNlumCz7lyJ7aAViZn7gr1IXVq3HzUEQQWbYGBxijnnZEMKIx0R0CA/pub?output=xlsx';
const EXCEL_LABEL = 'Google Sheets (Published)';
const EXCEL_HTML_URL = 'https://docs.google.com/spreadsheets/d/e/2PACX-1vRyrCR6Gjo4NQYZLC87atI6_-zNlumCz7lyJ7aAViZn7gr1IXVq3HzUEQQWbYGBxijnnZEMKIx0R0CA/pubhtml';
let reportSheetPageUrlCache = '';

function normalizeSheetName(name) {
  return String(name || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s.]/g, '')
    .toUpperCase();
}

function findSheetName(wb, target) {
  const needle = normalizeSheetName(target);
  return wb.SheetNames.find(name => normalizeSheetName(name) === needle);
}

function findSheetMeta(wb, target) {
  const needle = normalizeSheetName(target);
  return wb.Workbook && Array.isArray(wb.Workbook.Sheets)
    ? wb.Workbook.Sheets.find(sheet => normalizeSheetName(sheet.name) === needle)
    : null;
}

async function resolveReportSheetUrl() {
  if (reportSheetPageUrlCache) return reportSheetPageUrlCache;

  const res = await fetch(EXCEL_HTML_URL, { cache: 'no-cache' });
  if (!res.ok) throw new Error('Không tải được trang pubhtml của Google Sheets');

  const text = await res.text();
  const regex = /items\.push\(\{name:\s*"([^"]+)",\s*pageUrl:\s*"([^"]+)",\s*gid:\s*"([^"]+)"/g;
  let match;

  while ((match = regex.exec(text))) {
    const sheetName = match[1];
    const pageUrl = match[2]
      .replace(/\\\//g, '/')
      .replace(/\\x3d/g, '=')
      .replace(/\\x26/g, '&');
    if (normalizeSheetName(sheetName) === normalizeSheetName('BÁO CÁO TUẦN')) {
      reportSheetPageUrlCache = pageUrl;
      return reportSheetPageUrlCache;
    }
  }

  throw new Error('Không tìm thấy sheet BÁO CÁO TUẦN trong pubhtml');
}

async function loadReportSheet() {
  const iframe = document.getElementById('report-iframe');
  const countEl = document.getElementById('report-tbl-count');
  if (!iframe || !countEl) return;

  try {
    const url = await resolveReportSheetUrl();
    iframe.src = url;
    countEl.textContent = 'Bảng tính trực tiếp';
  } catch (err) {
    countEl.textContent = 'Không tải được sheet';
    iframe.removeAttribute('src');
    console.error(err);
  }
}

// ═══════════════════════════════════════════
// AUTO-LOAD KHI TRANG MỞ
// ═══════════════════════════════════════════
function setBarState(state, msgHtml, showRetry = false) {
  const bar     = document.getElementById('autoloadBar');
  const spinner = document.getElementById('alSpinner');
  const dot     = document.getElementById('alDot');
  const msg     = document.getElementById('alMsg');
  const retry   = document.getElementById('alRetry');

  bar.className = 'autoload-bar ' + state;
  spinner.style.display = state === 'loading' ? 'block' : 'none';
  dot.style.display     = state !== 'loading' ? 'block' : 'none';

  const dotColor = { success:'#3fb950', error:'#f78166', warn:'#d29922' };
  dot.style.background = dotColor[state] || '#8b949e';

  msg.innerHTML = msgHtml;
  retry.style.display = showRetry ? 'inline-block' : 'none';
}

async function autoLoadFile() {
  const bar = document.getElementById('autoloadBar');
  bar.classList.remove('hidden');

  setBarState('loading',
    `Đang tải tự động: <span class="al-filename">${EXCEL_LABEL}</span> …`
  );

  try {
    // Thêm ?t=timestamp để tránh cache khi file được cập nhật
    const res = await fetch(EXCEL_URL + '&t=' + Date.now(), { cache: 'no-cache' });

    if (!res.ok) {
      if (res.status === 404) {
        setBarState('warn',
          `Không thể tải dữ liệu từ <span class="al-filename">${EXCEL_LABEL}</span>.
           Kiểm tra lại link publish hoặc quyền chia sẻ,
           hoặc dùng nút <strong>Tải file Excel</strong> để tải thủ công.`,
          true
        );
      } else {
        setBarState('error',
          `Lỗi tải file (HTTP ${res.status}). Kiểm tra lại server hoặc tải thủ công.`,
          true
        );
      }
      return;
    }

    const arrayBuffer = await res.arrayBuffer();
    await processWorkbook(new Uint8Array(arrayBuffer), EXCEL_LABEL, 'auto');

  } catch (err) {
    setBarState('error',
      `Không thể kết nối để tải file: <em>${err.message}</em>. Thử dùng nút tải thủ công.`,
      true
    );
  }
}

// ═══════════════════════════════════════════
// MANUAL UPLOAD (nút "Tải file Excel")
// ═══════════════════════════════════════════
function handleFile(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = ev => {
    void processWorkbook(new Uint8Array(ev.target.result), file.name, 'manual');
  };
  reader.readAsArrayBuffer(file);
  e.target.value = '';
}

// ═══════════════════════════════════════════
// XỬ LÝ WORKBOOK (dùng chung cho auto & manual)
// ═══════════════════════════════════════════
async function processWorkbook(data, fname, source) {
  try {
    const wb = XLSX.read(data, { type: 'array', cellStyles: true, cellFormula: true, cellHTML: true });
    let loaded = 0;

    const tsName  = findSheetName(wb, 'TS');
    if (tsName)  { parseSheet(wb.Sheets[tsName],  'ts');  loaded++; }

    const thsName = findSheetName(wb, 'Th.S');
    if (thsName) { parseSheet(wb.Sheets[thsName], 'ths'); loaded++; }

    const reportMeta = findSheetMeta(wb, 'BÁO CÁO TUẦN') || findSheetMeta(wb, 'BÁO CÁO TUẦN');
    if (reportMeta) { await loadReportSheet(); loaded++; }

    if (loaded === 0) {
      if (source === 'auto') {
        setBarState('error',
          `File <span class="al-filename">${fname}</span> không có sheet <strong>TS</strong>, <strong>Th.S</strong> hoặc <strong>BÁO CÁO TUẦN</strong>. Kiểm tra lại file.`,
          true
        );
      } else {
        showToast('Không tìm thấy sheet "TS", "Th.S" hoặc "BÁO CÁO TUẦN"!', 'err');
      }
      return;
    }

    const now = new Date().toLocaleString('vi-VN');
    setLastUpdate(Date.now());
    document.getElementById('headerSub').textContent  = fname + ' · ĐH Đại Nam';
    document.getElementById('uploadMeta').textContent = 'Cập nhật: ' + now;

    if (source === 'auto') {
      setBarState('success',
        `✅ Đã tải tự động: <span class="al-filename">${fname}</span> — ${loaded} sheet · ${now}`
      );
    } else {
      // Ẩn thanh auto-load khi tải thủ công thành công
      document.getElementById('autoloadBar').classList.add('hidden');
      showToast(`✅ Đã tải thủ công: ${fname} (${loaded} sheet)`, 'ok');
    }
  } catch (err) {
    if (source === 'auto') {
      setBarState('error', `Lỗi đọc file: ${err.message}`, true);
    } else {
      showToast('Lỗi đọc file: ' + err.message, 'err');
    }
  }
}

// ═══════════════════════════════════════════
// PARSE SHEET
// ═══════════════════════════════════════════
function parseSheet(ws, key) {
  const range = XLSX.utils.decode_range(ws['!ref']);
  const gc = (r, c) => { const cell = ws[XLSX.utils.encode_cell({r,c})]; return cell ? cell.v : ''; };
  const cleanCell = (value) => {
    const v = String(value ?? '').trim();
    if (!v) return '';
    const lowered = v.toLowerCase();
    const errorTokens = ['#ref!', '#n/a', '#value!', '#name?', '#div/0!'];
    return (lowered === 'undefined' || lowered === 'null' || v === '-' || v === '—' || errorTokens.includes(lowered)) ? '' : v;
  };

  // Find header row
  let hdr = -1;
  for (let r = range.s.r; r <= Math.min(range.e.r, 15); r++) {
    for (let c = range.s.c; c <= range.e.c; c++) {
      if (String(gc(r,c)).includes('TÊN CÔNG VIỆC')) { hdr = r; break; }
    }
    if (hdr >= 0) break;
  }
  if (hdr < 0) hdr = 4;

  // Column mapping
  let cm = { stt:0, name:1, desc:2, nhansu:3, priority:4, status:5, followup:6, start:7, end:8, pct:10, note:11 };
  for (let c = range.s.c; c <= range.e.c; c++) {
    const v = String(gc(hdr, c)).trim().toUpperCase();
    if (v.includes('STT')) cm.stt = c;
    else if (v.includes('TÊN CÔNG VIỆC')) cm.name = c;
    else if (v.includes('MÔ TẢ')) cm.desc = c;
    else if (v.includes('NHÂN SỰ')) cm.nhansu = c;
    else if (v.includes('ƯU TIÊN') && !v.includes('HOÀN')) cm.priority = c;
    else if (v.includes('TÌNH TRẠNG')) cm.status = c;
    else if (v.includes('FOLLOW')) cm.followup = c;
    else if (v.includes('BẮT ĐẦU')) cm.start = c;
    else if (v.includes('KẾT THÚC')) cm.end = c;
    else if (v.includes('HOÀN THÀNH') && v.includes('MỨC')) cm.pct = c;
    else if (v.includes('HIỆN TRẠNG')) cm.note = c;
  }

  const tasks = [];
  let group = '';

  for (let r = hdr + 1; r <= range.e.r; r++) {
    const stt  = String(gc(r, cm.stt)).trim();
    const name = cleanCell(gc(r, cm.name));
    if (!name || name === 'undefined' || name === '0') continue;

    const statusRaw   = cleanCell(gc(r, cm.status));
    const priorityRaw = cleanCell(gc(r, cm.priority));
    const nhansuRaw   = cleanCell(gc(r, cm.nhansu));
    const followupRaw = cleanCell(gc(r, cm.followup));
    const noteRaw     = cleanCell(gc(r, cm.note));
    const pctCell     = cleanCell(gc(r, cm.pct));
    const startS   = parseFloat(gc(r, cm.start));
    const endS     = parseFloat(gc(r, cm.end));
    const hasRowData = Boolean(
      statusRaw || priorityRaw || nhansuRaw || followupRaw || noteRaw ||
      (!isNaN(parseFloat(pctCell)) && parseFloat(pctCell) > 0) ||
      (startS > 1000) || (endS > 1000)
    );

    // Section/group header: name only, no other meaningful data
    if (!statusRaw) {
      if (!hasRowData && name.length > 2 && !/^0(\.0)?$/.test(name)) {
        group = name.replace(/^\d+[\.\d]*\s+/, '').trim();
      }
      continue;
    }

    let pctRaw   = parseFloat(pctCell);
    if (isNaN(pctRaw)) pctRaw = 0;

    if (pctRaw > 1) pctRaw = pctRaw / 100;
    const pct = Math.min(1, Math.max(0, pctRaw));

    const hasProgress = pct > 0 || (startS > 1000) || (endS > 1000);
    const hasAssignee = Boolean(nhansuRaw);
    const hasMeta = Boolean(priorityRaw || followupRaw || noteRaw);
    if (!hasAssignee && !hasProgress && !hasMeta) continue;

    tasks.push({
      stt:      stt || '—',
      name,
      group,
      nhansu:   nhansuRaw || '—',
      priority: priorityRaw,
      status:   statusRaw,
      followup: followupRaw,
      start:    startS > 1000 ? startS : null,
      end:      endS   > 1000 ? endS   : null,
      pct,
      note:     noteRaw,
    });
  }

  state[key].tasks = tasks;
  state[key].sort  = { col:'', asc:true };
  buildFilters(key);
  applyFilters(key);

  // Update pill counts
  document.getElementById('pill-'+key).textContent = tasks.length;
}

// ═══════════════════════════════════════════
// FILTERS
// ═══════════════════════════════════════════
function buildFilters(key) {
  const tasks = state[key].tasks;
  const nsSet  = [...new Set(tasks.map(t=>t.nhansu).filter(v=>v&&v!=='—'))];
  const grpSet = [...new Set(tasks.map(t=>t.group).filter(Boolean))];

  const ns  = document.getElementById(key+'-fns');
  ns.innerHTML  = '<option value="">Tất cả</option>' + nsSet.map(v=>`<option>${v}</option>`).join('');
  const grp = document.getElementById(key+'-fgrp');
  grp.innerHTML = '<option value="">Tất cả</option>' + grpSet.map(v=>`<option value="${v}">${v.substring(0,40)}${v.length>40?'…':''}</option>`).join('');
}

function excelSerialToDate(serial) {
  if (!serial || typeof serial !== 'number') return null;
  const utcDays = Math.floor(serial - 25569);
  return new Date(utcDays * 86400 * 1000);
}

function parseDateRange(value) {
  const raw = (value || '').trim();
  if (!raw) return null;
  const parts = raw.split(' đến ').map(s => s.trim()).filter(Boolean);
  if (!parts.length) return null;

  const parseDMY = (str) => {
    const m = /^([0-3]?\d)\/([0-1]?\d)\/(\d{4})$/.exec(str);
    if (!m) return null;
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10) - 1;
    const year = parseInt(m[3], 10);
    const d = new Date(year, month, day);
    return isNaN(d.getTime()) ? null : d;
  };

  const start = parseDMY(parts[0]);
  const end = parseDMY(parts[1] || parts[0]);
  if (!start || !end) return null;

  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);
  return start <= end ? { start, end } : { start: end, end: start };
}

function applyFilters(key) {
  const search   = (document.getElementById(key+'-search').value||'').toLowerCase();
  const fstatus  = document.getElementById(key+'-fstatus').value;
  const fprio    = document.getElementById(key+'-fprio').value;
  const fns      = document.getElementById(key+'-fns').value;
  const fgrp     = document.getElementById(key+'-fgrp').value;
  const ffu      = document.getElementById(key+'-ffu').value;
  const fdate    = document.getElementById(key+'-fdate').value;
  const dateRange = parseDateRange(fdate);
  const { col, asc } = state[key].sort;

  let list = state[key].tasks.filter(t => {
    if (search  && !t.name.toLowerCase().includes(search) && !t.note.toLowerCase().includes(search)) return false;
    if (fstatus && t.status   !== fstatus) return false;
    if (fprio   && t.priority !== fprio)   return false;
    if (fns     && t.nhansu   !== fns)     return false;
    if (fgrp    && t.group    !== fgrp)    return false;
    if (ffu     && t.followup !== ffu)     return false;
    if (dateRange) {
      const start = excelSerialToDate(t.start);
      const end = excelSerialToDate(t.end) || start;
      if (!start && !end) return false;
      const s = start || end;
      const e = end || start;
      if (s > dateRange.end || e < dateRange.start) return false;
    }
    if (state[key].focusOnly) {
      const focusStatuses = ['Overdue', 'In progress', 'Pending'];
      if (!focusStatuses.includes(t.status)) return false;
    }
    return true;
  });

  if (col) list.sort((a,b) => {
    const va = a[col], vb = b[col];
    if (typeof va === 'number' && typeof vb === 'number') return asc ? va-vb : vb-va;
    return asc ? String(va).localeCompare(String(vb),'vi') : String(vb).localeCompare(String(va),'vi');
  });

  renderSummary(key, list);
  renderNarrative(key, list);
  renderAlerts(key, list);
  renderTimeline(key, list);
  renderHighlights(key, list);
  renderInsights(key, list);
  renderRanking(key, list);

  const pinnedIds = pinData[key] || [];
  const pinned = list.filter(t => pinnedIds.includes(getTaskId(key, t)));
  const unpinned = list.filter(t => !pinnedIds.includes(getTaskId(key, t)));

  renderPinned(key, pinned);
  renderStats(key, list);
  renderCharts(key, list);
  renderTable(key, unpinned, list.length, list);
  renderKanban(key, list);
  renderTimelineView(key, list);
  setView(key, state[key].view || 'table');
}

function sortT(key, col) {
  const s = state[key].sort;
  if (s.col === col) s.asc = !s.asc; else { s.col = col; s.asc = true; }
  applyFilters(key);
}

function resetFilters(key) {
  ['search','fstatus','fprio','fns','fgrp','ffu','fdate'].forEach(id => {
    const el = document.getElementById(key+'-'+id);
    if (el.tagName === 'INPUT') el.value = ''; else el.value = '';
  });
  const dateInput = document.getElementById(key+'-fdate');
  if (dateInput && dateInput._flatpickr) dateInput._flatpickr.clear();
  state[key].sort = { col:'', asc:true };
  state[key].focusOnly = false;
  const btn = document.getElementById(key + '-focus');
  if (btn) {
    btn.classList.remove('active');
    btn.textContent = 'Focus: Overdue + In progress';
  }
  applyFilters(key);
}

// ═══════════════════════════════════════════
// RENDER STATS
// ═══════════════════════════════════════════
function renderSummary(key, tasks) {
  const el = document.getElementById(key + '-summary');
  if (!el) return;
  const total = tasks.length;
  if (!total) {
    el.textContent = 'Chưa có dữ liệu để tóm tắt.';
    return;
  }
  const done = tasks.filter(t => t.status === 'Done').length;
  const inprog = tasks.filter(t => t.status === 'In progress').length;
  const overdue = tasks.filter(t => t.status === 'Overdue').length;
  const avg = Math.round(tasks.reduce((s, t) => s + t.pct, 0) / total * 100);
  const focusTxt = state[key].focusOnly ? 'Đang bật chế độ Focus.' : 'Đang xem đầy đủ.';
  el.textContent = `Hoàn thành ${done}/${total}, đang thực hiện ${inprog}, quá hạn ${overdue}. Tỉ lệ TB ${avg}%. ${focusTxt}`;
}

function renderRanking(key, tasks) {
  const listEl = document.getElementById(key + '-rank-list');
  if (!listEl) return;

  const staffMap = {};
  tasks.forEach(t => {
    if (!t.nhansu || t.nhansu === '—') return;
    const s = staffMap[t.nhansu] || { name: t.nhansu, total: 0, done: 0, inprog: 0, pending: 0, overdue: 0 };
    s.total += 1;
    if (t.status === 'Done') s.done += 1;
    else if (t.status === 'In progress') s.inprog += 1;
    else if (t.status === 'Pending') s.pending += 1;
    else if (t.status === 'Overdue') s.overdue += 1;
    staffMap[t.nhansu] = s;
  });

  const staff = Object.values(staffMap).map(s => {
    const score = s.done * 5 + s.inprog * 2 + s.pending * 1 - s.overdue * 3;
    const rate = s.total ? Math.round((s.done / s.total) * 100) : 0;
    return { ...s, score, rate };
  });

  if (!staff.length) {
    listEl.innerHTML = '<div class="rank-empty">Chưa có nhân sự để xếp hạng.</div>';
    return;
  }

  staff.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    if (b.done !== a.done) return b.done - a.done;
    return b.total - a.total;
  });

  const avatars = {
    general: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><rect width='128' height='128' rx='24' fill='%231c2330'/><circle cx='64' cy='52' r='24' fill='%23f3d6b1'/><rect x='24' y='76' width='80' height='34' rx='17' fill='%2358a6ff'/><rect x='30' y='22' width='68' height='18' rx='9' fill='%233fb950'/><path d='M44 30h40' stroke='%23ffd166' stroke-width='3'/><circle cx='48' cy='30' r='3' fill='%23ffd166'/><circle cx='64' cy='30' r='3' fill='%23ffd166'/><circle cx='80' cy='30' r='3' fill='%23ffd166'/></svg>",
    ltg: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><rect width='128' height='128' rx='24' fill='%231c2330'/><circle cx='64' cy='52' r='24' fill='%23f3d6b1'/><rect x='24' y='76' width='80' height='34' rx='17' fill='%2358a6ff'/><rect x='30' y='22' width='68' height='18' rx='9' fill='%230969da'/><path d='M52 30h24' stroke='%23ffd166' stroke-width='3'/><circle cx='56' cy='30' r='3' fill='%23ffd166'/><circle cx='72' cy='30' r='3' fill='%23ffd166'/></svg>",
    mjg: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><rect width='128' height='128' rx='24' fill='%231c2330'/><circle cx='64' cy='52' r='24' fill='%23f3d6b1'/><rect x='24' y='76' width='80' height='34' rx='17' fill='%2358a6ff'/><rect x='30' y='22' width='68' height='18' rx='9' fill='%23d29922'/><circle cx='64' cy='30' r='4' fill='%23ffd166'/></svg>",
    captain: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><rect width='128' height='128' rx='24' fill='%231c2330'/><circle cx='64' cy='52' r='24' fill='%23f3d6b1'/><rect x='24' y='76' width='80' height='34' rx='17' fill='%2358a6ff'/><rect x='30' y='22' width='68' height='18' rx='9' fill='%236e7681'/><path d='M58 30h12' stroke='%23cbd5e1' stroke-width='3'/></svg>",
    private: "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='128' height='128' viewBox='0 0 128 128'><rect width='128' height='128' rx='24' fill='%231c2330'/><circle cx='64' cy='52' r='24' fill='%23f3d6b1'/><rect x='24' y='76' width='80' height='34' rx='17' fill='%2358a6ff'/><rect x='30' y='22' width='68' height='18' rx='9' fill='%23f78166'/><path d='M60 30h8' stroke='%23ffb4a2' stroke-width='3'/></svg>",
  };

  const levels = [
    { min: 120, label: 'Đại tướng', icon: '🪖', nick: 'Tổng chỉ huy', avatar: avatars.general, color: 'rgba(63,185,80,.18)', text: 'var(--done)' },
    { min: 90,  label: 'Trung tướng', icon: '⭐', nick: 'Tham mưu trưởng', avatar: avatars.ltg, color: 'rgba(88,166,255,.18)', text: 'var(--inprogress)' },
    { min: 60,  label: 'Thiếu tướng', icon: '🎖️', nick: 'Mũi nhọn chiến dịch', avatar: avatars.mjg, color: 'rgba(227,179,65,.18)', text: 'var(--pending)' },
    { min: 35,  label: 'Đại úy', icon: '🪙', nick: 'Trinh sát tiền tuyến', avatar: avatars.captain, color: 'rgba(139,148,158,.18)', text: 'var(--text-muted)' },
    { min: 0,   label: 'Binh nhì', icon: '🎒', nick: 'Tân binh chiến trường', avatar: avatars.private, color: 'rgba(247,129,102,.18)', text: 'var(--overdue)' },
  ];

  const gradients = [
    'linear-gradient(135deg,#f78166,#e3b341)',
    'linear-gradient(135deg,#58a6ff,#3fb950)',
    'linear-gradient(135deg,#20c997,#58a6ff)',
    'linear-gradient(135deg,#e3b341,#58a6ff)',
    'linear-gradient(135deg,#f78166,#58a6ff)',
  ];

  const top = staff.slice(0, 5).map((s, i) => {
    const lv = levels.find(l => s.score >= l.min) || levels[levels.length - 1];
    const bar = Math.min(100, Math.max(8, s.rate));
    const initials = s.name.split(/\s+/).filter(Boolean).map(w => w[0]).slice(-2).join('').toUpperCase();
    const tagline = s.overdue
      ? 'Kỷ luật thép, xử lý nợ nhiệm vụ'
      : s.done >= 12
        ? 'Đánh nhanh, thắng gọn'
        : 'Giữ đội hình ổn định';
    const rankClass = i === 0 ? 'rank-top1' : i === 1 ? 'rank-top2' : i === 2 ? 'rank-top3' : '';
    return `
      <div class="rank-profile ${rankClass}">
        <div class="rank-ribbon">#${i + 1}</div>
        <div class="rank-avatar" style="background:${gradients[i % gradients.length]}">
          <img src="${lv.avatar}" alt="${lv.label}">
          <div class="rank-initials">${initials || 'NV'}</div>
        </div>
        <div class="rank-name">${s.name}</div>
        <div class="rank-level" style="background:${lv.color};color:${lv.text}">${lv.icon} ${lv.label}</div>
        <div class="rank-nick">${lv.nick}</div>
        <div class="rank-tagline">${tagline}</div>
        <div class="rank-stats">${s.done}/${s.total} hoàn thành · ${s.overdue} quá hạn</div>
        <div class="rank-bar"><i style="width:${bar}%"></i></div>
        <div class="rank-xp">XP ${s.score}</div>
      </div>`;
  }).join('');

  listEl.innerHTML = top;
}

function renderTimeline(key, tasks) {
  const wrap = document.getElementById(key + '-timeline');
  if (!wrap) return;

  const days = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d);
  }

  const counts = days.map(d => {
    const startDay = new Date(d); startDay.setHours(0,0,0,0);
    const endDay = new Date(d); endDay.setHours(23,59,59,999);
    return tasks.filter(t => {
      const s = excelSerialToDate(t.start);
      const e = excelSerialToDate(t.end) || s;
      if (!s && !e) return false;
      const ss = s || e;
      const ee = e || s;
      return ss <= endDay && ee >= startDay;
    }).length;
  });

  const max = Math.max(1, ...counts);
  wrap.innerHTML = days.map((d, i) => {
    const label = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
    const w = Math.round(counts[i] / max * 100);
    return `<div class="timeline-day">
      <div class="d">${label}</div>
      <div class="n">${counts[i]}</div>
      <div class="timeline-bar" style="width:${w}%"></div>
    </div>`;
  }).join('');
}

function renderHighlights(key, tasks) {
  const wrap = document.getElementById(key + '-highlights');
  if (!wrap) return;

  const overdue = tasks.filter(t => t.status === 'Overdue').slice(0, 3);
  const staffCnt = {};
  tasks.forEach(t => { if (t.nhansu && t.nhansu !== '—') staffCnt[t.nhansu] = (staffCnt[t.nhansu] || 0) + 1; });
  const staffTop = Object.entries(staffCnt).sort((a,b) => b[1]-a[1]).slice(0, 3);

  const groupStats = {};
  tasks.forEach(t => {
    if (!t.group) return;
    const g = t.group;
    groupStats[g] = groupStats[g] || { sum: 0, n: 0 };
    groupStats[g].sum += t.pct;
    groupStats[g].n += 1;
  });
  const groupTop = Object.entries(groupStats)
    .map(([g, v]) => [g, Math.round((v.sum / Math.max(1, v.n)) * 100)])
    .sort((a,b) => b[1]-a[1])
    .slice(0, 3);

  const overdueHtml = overdue.length
    ? overdue.map(t => `<div class="hl-item">${t.name} <span>(${t.nhansu})</span></div>`).join('')
    : '<div class="hl-item"><span>Không có công việc quá hạn.</span></div>';

  const staffHtml = staffTop.length
    ? staffTop.map(([n, c]) => `<div class="hl-item">${n} <span>· ${c} việc</span></div>`).join('')
    : '<div class="hl-item"><span>Chưa có nhân sự.</span></div>';

  const groupHtml = groupTop.length
    ? groupTop.map(([g, p]) => `<div class="hl-item">${g.substring(0, 40)} <span>· ${p}%</span></div>`).join('')
    : '<div class="hl-item"><span>Chưa có nhóm.</span></div>';

  wrap.innerHTML = `
    <div class="hl-card">
      <div class="hl-title">Nổi bật quá hạn</div>
      ${overdueHtml}
    </div>
    <div class="hl-card">
      <div class="hl-title">Nhân sự bận nhất</div>
      ${staffHtml}
    </div>
    <div class="hl-card">
      <div class="hl-title">Nhóm tiến độ nhanh</div>
      ${groupHtml}
    </div>
  `;
}

function renderNarrative(key, tasks) {
  const el = document.getElementById(key + '-narrative');
  if (!el) return;
  if (!tasks.length) { el.textContent = 'Chưa có dữ liệu để gợi ý ưu tiên.'; return; }
  const top = tasks
    .filter(t => t.priority === 'Cao')
    .sort((a, b) => {
      const da = excelSerialToDate(a.end) || excelSerialToDate(a.start) || new Date(2100,0,1);
      const db = excelSerialToDate(b.end) || excelSerialToDate(b.start) || new Date(2100,0,1);
      return da - db;
    })
    .slice(0, 3)
    .map(t => t.name);
  const risk = tasks.find(t => t.status === 'Overdue');
  const riskText = risk ? `Rủi ro lớn: ${risk.name}` : 'Không có rủi ro lớn.';
  el.innerHTML = `Ưu tiên: <span>${top.join(' • ') || '—'}</span> · ${riskText}`;
}

function renderAlerts(key, tasks) {
  const bar = document.getElementById(key + '-alert');
  const msg = document.getElementById(key + '-alert-msg');
  if (!bar || !msg) return;
  const overdue = tasks.filter(t => t.status === 'Overdue').length;
  const pending = tasks.filter(t => t.status === 'Pending').length;
  if (overdue > 0) {
    bar.style.display = 'flex';
    bar.className = 'alert-bar';
    msg.textContent = `Có ${overdue} việc quá hạn cần xử lý ngay.`;
  } else if (pending > 5) {
    bar.style.display = 'flex';
    bar.className = 'alert-bar warn';
    msg.textContent = `Pending tăng cao (${pending} việc).`;
  } else {
    bar.style.display = 'flex';
    bar.className = 'alert-bar ok';
    msg.textContent = 'Tiến độ ổn định, không có cảnh báo lớn.';
  }
}

function renderInsights(key, tasks) {
  renderStory(key, tasks);
  renderCompareWeek(key, tasks);
  renderAchievements(key, tasks);
  renderDigest(key, tasks);
  renderConfidence(key, tasks);
  renderHeatmap(key, tasks);
  renderPlaylist(key, tasks);
  renderNetwork(key, tasks);
}

function renderDigest(key, tasks) {
  const el = document.getElementById(key + '-digest');
  if (!el) return;
  if (!tasks.length) { el.querySelector('.insight-body').textContent = 'Chưa có dữ liệu tuần.'; return; }
  const overdue = tasks.filter(t => t.status === 'Overdue').slice(0, 1)[0];
  const high = tasks.filter(t => t.priority === 'Cao').length;
  const done = tasks.filter(t => t.status === 'Done').length;
  el.querySelector('.insight-body').innerHTML = `
    • Hoàn thành ${done} việc tuần này<br>
    • Ưu tiên cao: ${high} việc<br>
    • Cần xử lý: ${overdue ? overdue.name : 'Không có quá hạn'}
  `;
}

function renderConfidence(key, tasks) {
  const text = document.getElementById(key + '-confidence-text');
  const fill = document.getElementById(key + '-confidence-fill');
  if (!text || !fill) return;
  if (!tasks.length) { text.textContent = 'Chưa có dữ liệu.'; fill.style.width = '0%'; return; }
  const complete = tasks.filter(t => (t.pct > 0) && (t.start || t.end)).length;
  const pct = Math.round(complete / tasks.length * 100);
  text.textContent = `Độ tin cậy dữ liệu: ${pct}%`;
  fill.style.width = pct + '%';
}

function getTaskRange(t) {
  const s = excelSerialToDate(t.start);
  const e = excelSerialToDate(t.end) || s;
  return { start: s || null, end: e || null };
}

function renderStory(key, tasks) {
  const el = document.getElementById(key + '-story');
  if (!el) return;
  if (!tasks.length) {
    el.querySelector('.insight-body').textContent = 'Chưa có dữ liệu để kể chuyện.';
    return;
  }
  const done = tasks.filter(t => t.status === 'Done').length;
  const overdue = tasks.filter(t => t.status === 'Overdue').length;
  const high = tasks.filter(t => t.priority === 'Cao').length;
  const avg = Math.round(tasks.reduce((s, t) => s + t.pct, 0) / tasks.length * 100);
  el.querySelector('.insight-body').textContent = `Hôm nay hoàn thành ${done} việc, có ${overdue} việc quá hạn. Trung bình tiến độ ${avg}% với ${high} việc ưu tiên cao.`;
}

function renderCompareWeek(key, tasks) {
  const el = document.getElementById(key + '-compare');
  if (!el) return;
  const now = new Date();
  const endThis = new Date(now); endThis.setHours(23,59,59,999);
  const startThis = new Date(now); startThis.setDate(now.getDate() - 6); startThis.setHours(0,0,0,0);
  const endPrev = new Date(startThis); endPrev.setDate(startThis.getDate() - 1); endPrev.setHours(23,59,59,999);
  const startPrev = new Date(endPrev); startPrev.setDate(endPrev.getDate() - 6); startPrev.setHours(0,0,0,0);

  const countRange = (start, end) => tasks.filter(t => {
    const r = getTaskRange(t);
    const d = r.start;
    if (!d) return false;
    return d >= start && d <= end;
  }).length;

  const thisWeek = countRange(startThis, endThis);
  const prevWeek = countRange(startPrev, endPrev);
  const diff = thisWeek - prevWeek;
  const trend = diff >= 0 ? 'trend-up' : 'trend-down';
  const sign = diff >= 0 ? '+' : '';

  el.innerHTML = `
    <div class="insight-title">So sánh tuần</div>
    <div class="insight-body">Tuần này: <span class="insight-metric">${thisWeek}</span> · Tuần trước: ${prevWeek}</div>
    <div class="insight-body ${trend}">Biến động: ${sign}${diff}</div>
  `;
}

function renderAchievements(key, tasks) {
  const el = document.getElementById(key + '-achievements');
  if (!el) return;
  const overdue = tasks.filter(t => t.status === 'Overdue').length;
  const done = tasks.filter(t => t.status === 'Done').length;
  const high = tasks.filter(t => t.priority === 'Cao').length;

  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const qStartMonth = Math.floor(now.getMonth() / 3) * 3;
  const quarterStart = new Date(now.getFullYear(), qStartMonth, 1);
  const quarterEnd = new Date(now.getFullYear(), qStartMonth + 3, 0, 23, 59, 59, 999);

  const doneInMonth = tasks.filter(t => {
    if (t.status !== 'Done') return false;
    const d = excelSerialToDate(t.start) || excelSerialToDate(t.end);
    return d && d >= monthStart && d <= monthEnd;
  }).length;

  const doneInQuarter = tasks.filter(t => {
    if (t.status !== 'Done') return false;
    const d = excelSerialToDate(t.start) || excelSerialToDate(t.end);
    return d && d >= quarterStart && d <= quarterEnd;
  }).length;

  const badges = [];
  if (overdue === 0 && tasks.length) badges.push('7 ngày không quá hạn');
  if (done >= 10) badges.push('10+ việc hoàn thành');
  if (high >= 5) badges.push('Ưu tiên cao được kiểm soát');
  if (doneInMonth >= 20) badges.push('20+ hoàn thành trong tháng');
  if (doneInQuarter >= 50) badges.push('50+ hoàn thành trong quý');
  if (!badges.length) badges.push('Chưa có mốc mới, cố lên!');

  el.innerHTML = `
    <div class="insight-title">Thành tựu</div>
    <div class="insight-body">${badges.map(b => `<span class="badge-anim">${b}</span>`).join('')}</div>
  `;
}

function renderHeatmap(key, tasks) {
  const wrap = document.getElementById(key + '-heatmap');
  if (!wrap) return;
  const days = 30;
  const today = new Date();
  today.setHours(0,0,0,0);
  const cells = [];

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayStart = new Date(d); dayStart.setHours(0,0,0,0);
    const dayEnd = new Date(d); dayEnd.setHours(23,59,59,999);
    const count = tasks.filter(t => {
      const r = getTaskRange(t);
      if (!r.start && !r.end) return false;
      const s = r.start || r.end;
      const e = r.end || r.start;
      return s <= dayEnd && e >= dayStart;
    }).length;
    const level = count === 0 ? 0 : count <= 2 ? 1 : count <= 4 ? 2 : count <= 6 ? 3 : 4;
    const title = d.toLocaleDateString('vi-VN') + ' · ' + count + ' việc';
    cells.push(`<div class="heat-cell ${level ? 'heat-' + level : ''}" title="${title}"></div>`);
  }
  wrap.innerHTML = cells.join('');
}

function renderPlaylist(key, tasks) {
  const wrap = document.getElementById(key + '-playlist');
  if (!wrap) return;
  const list = tasks
    .filter(t => t.priority === 'Cao')
    .sort((a, b) => {
      const da = excelSerialToDate(a.end) || excelSerialToDate(a.start) || new Date(2100,0,1);
      const db = excelSerialToDate(b.end) || excelSerialToDate(b.start) || new Date(2100,0,1);
      return da - db;
    })
    .slice(0, 5);

  wrap.innerHTML = list.length ? list.map(t => {
    const d = excelSerialToDate(t.end) || excelSerialToDate(t.start);
    const dt = d ? d.toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit' }) : '—';
    return `<div class="pl-item"><div class="pl-name">${t.name}</div><div class="pl-date">${dt}</div></div>`;
  }).join('') : '<div class="insight-body">Chưa có việc ưu tiên cao.</div>';
}

function renderNetwork(key, tasks) {
  const wrap = document.getElementById(key + '-network');
  if (!wrap) return;
  if (!tasks.length) { wrap.innerHTML = 'Không có dữ liệu'; return; }

  const groupCnt = {};
  const staffCnt = {};
  const edges = [];
  tasks.forEach(t => {
    if (t.group) groupCnt[t.group] = (groupCnt[t.group] || 0) + 1;
    if (t.nhansu && t.nhansu !== '—') staffCnt[t.nhansu] = (staffCnt[t.nhansu] || 0) + 1;
    if (t.group && t.nhansu) edges.push([t.group, t.nhansu]);
  });

  const groups = Object.entries(groupCnt).sort((a,b) => b[1]-a[1]).slice(0, 4);
  const staffs = Object.entries(staffCnt).sort((a,b) => b[1]-a[1]).slice(0, 4);

  const w = 420, h = 170;
  const gx = 100, sx = 320;
  const gStep = h / (groups.length + 1);
  const sStep = h / (staffs.length + 1);

  const gNodes = groups.map((g, i) => ({ name: g[0], count: g[1], x: gx, y: (i+1)*gStep }));
  const sNodes = staffs.map((s, i) => ({ name: s[0], count: s[1], x: sx, y: (i+1)*sStep }));

  const edgeLines = [];
  gNodes.forEach(g => {
    sNodes.forEach(s => {
      const has = edges.some(e => e[0] === g.name && e[1] === s.name);
      if (has) edgeLines.push(`<line x1="${g.x}" y1="${g.y}" x2="${s.x}" y2="${s.y}" stroke="rgba(139,148,158,.4)" stroke-width="1" />`);
    });
  });

  const gCircles = gNodes.map(n => `<circle cx="${n.x}" cy="${n.y}" r="${6 + n.count}" fill="#f78166" />
    <text x="${n.x+12}" y="${n.y+4}" font-size="10" fill="#8b949e">${n.name.substring(0,14)}</text>`).join('');
  const sCircles = sNodes.map(n => `<circle cx="${n.x}" cy="${n.y}" r="${6 + n.count}" fill="#58a6ff" />
    <text x="${n.x+12}" y="${n.y+4}" font-size="10" fill="#8b949e">${n.name.substring(0,14)}</text>`).join('');

  wrap.innerHTML = `<svg viewBox="0 0 ${w} ${h}" preserveAspectRatio="xMidYMid meet">
    ${edgeLines.join('')}
    ${gCircles}
    ${sCircles}
  </svg>`;
}

function renderKanban(key, tasks) {
  const wrap = document.getElementById(key + '-kanban-body');
  if (!wrap) return;
  const cols = ['Not started','In progress','Pending','Overdue','Done'];
  wrap.innerHTML = cols.map(c => {
    const list = tasks.filter(t => t.status === c).slice(0, 30)
      .map(t => `<div class="kb-card">${t.name}<div style="font-size:.7rem;color:var(--text-muted)">${t.nhansu}</div></div>`).join('');
    return `<div class="kb-col"><div class="kb-h">${c}</div><div class="kb-list">${list || '<div class="kb-card">—</div>'}</div></div>`;
  }).join('');
}

function renderTimelineView(key, tasks) {
  const wrap = document.getElementById(key + '-timeline-body');
  if (!wrap) return;
  const list = tasks.slice().sort((a, b) => {
    const da = excelSerialToDate(a.start) || excelSerialToDate(a.end) || new Date(2100,0,1);
    const db = excelSerialToDate(b.start) || excelSerialToDate(b.end) || new Date(2100,0,1);
    return da - db;
  }).slice(0, 60);
  wrap.innerHTML = list.map(t => {
    const s = excelSerialToDate(t.start); const e = excelSerialToDate(t.end) || s;
    const r = (s ? s.toLocaleDateString('vi-VN') : '—') + ' → ' + (e ? e.toLocaleDateString('vi-VN') : '—');
    return `<div class="tl-item"><div class="tl-range">${r}</div><div>${t.name}</div></div>`;
  }).join('') || '<div class="tl-item">Không có dữ liệu</div>';
}

function renderPinned(key, tasks) {
  const wrap = document.getElementById(key + '-pinned-wrap');
  const list = document.getElementById(key + '-pinned-list');
  const count = document.getElementById(key + '-pinned-count');
  if (!wrap || !list || !count) return;

  if (!tasks.length) {
    wrap.style.display = 'none';
    list.innerHTML = '';
    count.textContent = '0';
    return;
  }

  wrap.style.display = 'block';
  count.textContent = String(tasks.length);
  list.innerHTML = tasks.map(t => {
    const id = getTaskId(key, t);
    const safeId = encodeURIComponent(id);
    return `<div class="pinned-item">
      <div>
        <div class="name">${t.name}</div>
        <div style="font-size:.72rem;color:var(--text-muted)">${t.nhansu} · ${t.status}</div>
      </div>
      <button class="pin-btn active" onclick="togglePin('${key}','${safeId}')">Bỏ ghim</button>
    </div>`;
  }).join('');
}

function renderStats(key, tasks) {
  const n      = tasks.length;
  const done   = tasks.filter(t=>t.status==='Done').length;
  const inp    = tasks.filter(t=>t.status==='In progress').length;
  const pend   = tasks.filter(t=>t.status==='Pending').length;
  const other  = tasks.filter(t=>t.status==='Overdue'||t.status==='Not started').length;
  const avg    = n ? Math.round(tasks.reduce((s,t)=>s+t.pct,0)/n*100) : 0;
  const high   = tasks.filter(t=>t.priority==='Cao').length;
  const fu     = tasks.filter(t=>t.followup==='Yes').length;
  const donePct = n ? Math.round(done/n*100) : 0;
  const ringPct = donePct;

  const accent = key==='ts' ? '#f78166' : key==='ths' ? '#58a6ff' : '#e3b341';
  const cards = [
    { lbl:'Tổng công việc', val:n,       sub:'Tất cả đầu việc',       c:'#8b949e' },
    { lbl:'Hoàn thành',     val:done,    sub:donePct+'% tổng số',      c:'#3fb950' },
    { lbl:'Đang thực hiện', val:inp,     sub:'In progress',            c:'#58a6ff' },
    { lbl:'Pending',        val:pend,    sub:'Đang chờ xử lý',         c:'#d29922' },
    { lbl:'Overdue/Chưa bắt đầu', val:other, sub:'Cần chú ý',         c:'#f78166' },
    { lbl:'Hoàn thành TB',  val:avg+'%', sub:'Trung bình % hoàn thành',c:'#d29922' },
    { lbl:'Ưu tiên Cao',    val:high,    sub:'Mức độ ưu tiên cao',     c:accent    },
    { lbl:'Follow-up',      val:fu,      sub:'Cần theo dõi tiếp',      c:'#f0883e' },
  ];
  document.getElementById(key+'-stats').innerHTML = cards.map(cd =>
    `<div class="stat-card" style="--c:${cd.c}">
      <div class="lbl">${cd.lbl}</div>
      <div class="val">${cd.val}</div>
      <div class="sub">${cd.sub}</div>
    </div>`
  ).join('');

  // Ring
  const circ = 389.56;
  const ringEl = document.getElementById(key+'-ring');
  ringEl.style.strokeDashoffset = circ - (ringPct/100)*circ;
  const rc = ringPct>=70?'#3fb950':ringPct>=40?'#d29922':'#f78166';
  ringEl.setAttribute('stroke', rc);
  const rp = document.getElementById(key+'-ring-pct');
  rp.textContent = ringPct+'%'; rp.style.color = rc;
}

// ═══════════════════════════════════════════
// RENDER CHARTS
// ═══════════════════════════════════════════
const STATUS_META = {
  'Done':        { c:'#3fb950' },
  'In progress': { c:'#58a6ff' },
  'Pending':     { c:'#d29922' },
  'Not started': { c:'#6e7681' },
  'Overdue':     { c:'#f78166' },
};
const PRIO_META = {
  'Cao':   { c:'#f78166' },
  'Thường':{ c:'#58a6ff' },
  'Thấp':  { c:'#3fb950' },
};

function renderCharts(key, tasks) {
  // Status bar
  const sCnt = {};
  tasks.forEach(t => sCnt[t.status] = (sCnt[t.status]||0)+1);
  const maxS = Math.max(1,...Object.values(sCnt));
  document.getElementById(key+'-status-chart').innerHTML =
    Object.entries(sCnt).sort((a,b)=>b[1]-a[1]).map(([s,n]) => {
      const m = STATUS_META[s]||{c:'#8b949e'};
      return `<div class="bar-row">
        <div class="bar-label">${s}</div>
        <div class="bar-wrap"><div class="bar-fill" style="width:${Math.round(n/maxS*100)}%;background:${m.c}">${n}</div></div>
        <div class="bar-cnt">${n}</div></div>`;
    }).join('');

  // Priority bar
  const pCnt = {};
  tasks.forEach(t => { if(t.priority) pCnt[t.priority]=(pCnt[t.priority]||0)+1; });
  const maxP = Math.max(1,...Object.values(pCnt));
  document.getElementById(key+'-prio-chart').innerHTML =
    Object.entries(pCnt).sort((a,b)=>b[1]-a[1]).map(([p,n]) => {
      const m = PRIO_META[p]||{c:'#8b949e'};
      return `<div class="bar-row">
        <div class="bar-label">${p}</div>
        <div class="bar-wrap"><div class="bar-fill" style="width:${Math.round(n/maxP*100)}%;background:${m.c}">${n}</div></div>
        <div class="bar-cnt">${n}</div></div>`;
    }).join('');

  // Ring legend
  const total = tasks.length || 1;
  document.getElementById(key+'-ring-legend').innerHTML =
    Object.entries(sCnt).map(([s,n]) => {
      const m = STATUS_META[s]||{c:'#8b949e'};
      return `<div class="ring-item"><div class="ring-dot" style="background:${m.c}"></div>${s}: ${n}</div>`;
    }).join('');
}

// ═══════════════════════════════════════════
// RENDER TABLE
// ═══════════════════════════════════════════
function excelToStr(serial) {
  if (!serial||isNaN(serial)) return '';
  const d = new Date((serial-25569)*86400*1000);
  return isNaN(d.getTime()) ? '' : d.toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric'});
}

function sBadge(s) {
  const m = {'Done':'done','In progress':'inprogress','Pending':'pending','Not started':'notstarted','Overdue':'overdue'};
  return `<span class="badge b-${m[s]||'notstarted'}">${s||'—'}</span>`;
}
function sBadgeWithTip(t) {
  const status = t.status || '—';
  const m = {'Done':'done','In progress':'inprogress','Pending':'pending','Not started':'notstarted','Overdue':'overdue'};
  let tip = '';
  const end = excelSerialToDate(t.end) || excelSerialToDate(t.start);
  if (end) {
    const diffDays = Math.floor((end.setHours(0,0,0,0) - new Date().setHours(0,0,0,0)) / 86400000);
    if (status === 'Overdue') tip = `Quá hạn ${Math.abs(diffDays)} ngày`;
    else if (diffDays < 0) tip = `Đã trễ ${Math.abs(diffDays)} ngày`;
    else if (diffDays === 0) tip = 'Đến hạn hôm nay';
    else tip = `Còn ${diffDays} ngày đến hạn`;
  }
  return `<span class="badge b-${m[status]||'notstarted'}" title="${tip}">${status}</span>`;
}
function pBadge(p) {
  const m = {'Cao':'cao','Thường':'thuong','Thấp':'thuong'};
  return p ? `<span class="badge b-${m[p]||'thuong'}">${p}</span>` : '<span style="color:var(--text-muted);font-size:.7rem">—</span>';
}
function pctBar(pct) {
  const p = Math.round(pct*100);
  const c = p>=80?'#3fb950':p>=40?'#d29922':'#f78166';
  return `<div class="pct-bar"><div class="pct-track"><div class="pct-fill" style="width:${p}%;background:${c}"></div></div><div class="pct-txt">${p}%</div></div>`;
}

function renderTable(key, tasks, totalCount = tasks.length, groupSource = tasks) {
  document.getElementById(key+'-tbl-count').textContent = totalCount+' công việc';
  const tbody = document.getElementById(key+'-tbody');
  const emptyEl = document.getElementById(key+'-empty');

  if (!totalCount && state[key].tasks.length === 0) {
    tbody.innerHTML=''; emptyEl.style.display='block'; return;
  }
  if (!totalCount) {
    tbody.innerHTML='';
    emptyEl.innerHTML='<div class="empty-icon">🔍</div><h3>Không tìm thấy kết quả</h3><p>Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm.</p>';
    emptyEl.style.display='block'; return;
  }
  emptyEl.style.display='none';

  const groupMap = {};
  groupSource.forEach(t => {
    if (!t.group) return;
    groupMap[t.group] = groupMap[t.group] || { sum: 0, n: 0 };
    groupMap[t.group].sum += t.pct;
    groupMap[t.group].n += 1;
  });

  tbody.innerHTML = tasks.map(t => `<tr>
    <td class="task-stt">${t.stt}</td>
    <td><div class="task-name">${t.name}</div></td>
    <td style="font-size:.7rem;color:var(--text-muted);max-width:140px">${t.group}</td>
    <td>
      <div class="spark"><i style="width:${Math.round(((groupMap[t.group]?.sum||0)/Math.max(1,groupMap[t.group]?.n||0))*100)}%"></i></div>
    </td>
    <td title="Nhóm: ${t.group || '—'}" style="white-space:nowrap;font-size:.72rem;color:${key==='ts'?'var(--ts-accent)':key==='ths'?'var(--ths-accent)':'var(--report-accent)'}">${t.nhansu}</td>
    <td>${pBadge(t.priority)}</td>
    <td>${sBadgeWithTip(t)}</td>
    <td class="task-date">${t.start?excelToStr(t.start):'—'}</td>
    <td class="task-date">${t.end?excelToStr(t.end):'—'}</td>
    <td style="min-width:100px">${pctBar(t.pct)}</td>
    <td style="text-align:center">
      <button class="pin-btn ${isPinned(key, getTaskId(key, t)) ? 'active' : ''}" onclick="togglePin('${key}','${encodeURIComponent(getTaskId(key, t))}')">
        ${isPinned(key, getTaskId(key, t)) ? 'Bỏ' : 'Ghim'}
      </button>
    </td>
    <td style="text-align:center">${t.followup==='Yes'?'<span style="color:#f78166;font-size:.75rem">● Yes</span>':t.followup==='No'?'<span style="color:#6e7681;font-size:.75rem">○ No</span>':'—'}</td>
    <td class="note-cell">${t.note||'—'}</td>
  </tr>`).join('');
}

// ═══════════════════════════════════════════
// NOTE CÔNG VIỆC — localStorage journal
// ═══════════════════════════════════════════
const NOTE_KEY   = 'sdh_notes_v2';
const NOTE_COLORS = [
  { hex:'#1c2330', label:'Mặc định' },
  { hex:'#1e2d1e', label:'Xanh lá' },
  { hex:'#2d1e1e', label:'Đỏ' },
  { hex:'#1e1e2d', label:'Xanh lam' },
  { hex:'#2d2a1e', label:'Vàng' },
  { hex:'#2a1e2d', label:'Tím' },
  { hex:'#1e2a2d', label:'Cyan' },
  { hex:'#2d2424', label:'Hồng' },
  // Light mode equivalents (same positions, auto-switched)
];
const NOTE_COLORS_LIGHT = [
  { hex:'#ffffff', label:'Mặc định' },
  { hex:'#e8f5e9', label:'Xanh lá' },
  { hex:'#fce4ec', label:'Đỏ' },
  { hex:'#e3f2fd', label:'Xanh lam' },
  { hex:'#fffde7', label:'Vàng' },
  { hex:'#f3e5f5', label:'Tím' },
  { hex:'#e0f7fa', label:'Cyan' },
  { hex:'#fce4f0', label:'Hồng' },
];

let noteData   = {};   // { id: { id, title, body, color, created, updated } }
let noteActive = null; // currently open note id
let noteSaveTimer = null;

// ── INIT ──────────────────────────────────
function noteInit() {
  try {
    const raw = localStorage.getItem(NOTE_KEY);
    noteData = raw ? JSON.parse(raw) : {};
  } catch(e) { noteData = {}; }
  noteRenderSwatches();
  noteRenderList();
  noteUpdatePill();
}

// ── PERSIST ───────────────────────────────
function noteSave() {
  try { localStorage.setItem(NOTE_KEY, JSON.stringify(noteData)); } catch(e) {}
}

// ── PILL COUNT ────────────────────────────
function noteUpdatePill() {
  document.getElementById('pill-note').textContent = Object.keys(noteData).length;
}

// ── COLOR SWATCHES ────────────────────────
function noteRenderSwatches() {
  const isLight = document.body.classList.contains('light');
  const palette = isLight ? NOTE_COLORS_LIGHT : NOTE_COLORS;
  const wrap = document.getElementById('noteColorSwatches');
  if (!wrap) return;
  wrap.innerHTML = palette.map((c, i) =>
    `<div class="color-swatch" data-idx="${i}" style="background:${c.hex};border-color:${noteActive && noteData[noteActive]?.colorIdx===i ? 'var(--text)' : 'transparent'}"
      title="${c.label}" onclick="noteSetColor(${i})"></div>`
  ).join('') +
  `<div class="color-swatch-sep"></div>
   <input type="color" title="Màu tuỳ chỉnh"
     style="width:22px;height:22px;border:1px solid var(--border);border-radius:50%;cursor:pointer;padding:0;background:none"
     oninput="noteSetCustomColor(this.value)">`;
}

function noteSetColor(idx) {
  if (!noteActive) return;
  const isLight = document.body.classList.contains('light');
  const palette = isLight ? NOTE_COLORS_LIGHT : NOTE_COLORS;
  noteData[noteActive].colorIdx = idx;
  noteData[noteActive].color    = palette[idx].hex;
  noteSave();
  noteRenderSwatches();
  noteApplyBg();
  noteRenderList();
}
function noteSetCustomColor(hex) {
  if (!noteActive) return;
  noteData[noteActive].colorIdx = -1;
  noteData[noteActive].color = hex;
  noteSave();
  noteApplyBg();
  noteRenderList();
}
function noteApplyBg() {
  const body = document.getElementById('noteBody');
  const wrap = document.getElementById('noteEditorWrap');
  if (!noteActive || !body) return;
  const col = noteData[noteActive]?.color || '';
  body.style.background = col;
  wrap.style.background = col;
}

// ── LIST ──────────────────────────────────
function noteRenderList() {
  const q    = (document.getElementById('noteSearchInput')?.value || '').toLowerCase();
  const list = document.getElementById('noteList');
  if (!list) return;

  let notes = Object.values(noteData)
    .sort((a,b) => (b.updated||0) - (a.updated||0));

  if (q) notes = notes.filter(n =>
    n.title.toLowerCase().includes(q) || noteStripHtml(n.body).toLowerCase().includes(q)
  );

  if (notes.length === 0) {
    list.innerHTML = q
      ? `<div class="note-empty-list">🔍 Không tìm thấy note nào.</div>`
      : `<div class="note-empty-list">📝 Chưa có note nào.<br>Nhấn "Tạo note mới" để bắt đầu.</div>`;
    return;
  }

  const isLight = document.body.classList.contains('light');
  const palette = isLight ? NOTE_COLORS_LIGHT : NOTE_COLORS;

  list.innerHTML = notes.map(n => {
    const bgColor = n.color || (isLight ? '#ffffff' : '#1c2330');
    const preview = noteStripHtml(n.body).substring(0, 80) || '(chưa có nội dung)';
    const dt = n.updated ? new Date(n.updated).toLocaleDateString('vi-VN',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}) : '';
    return `<div class="note-card${n.id===noteActive?' active':''}" data-id="${n.id}"
      style="background:${bgColor}" onclick="noteOpen('${n.id}')">
      <div class="note-card-title">${n.title || '(Chưa đặt tên)'}</div>
      <div class="note-card-preview">${preview}</div>
      <div class="note-card-meta">
        <span class="note-card-date">${dt}</span>
        <button class="note-card-del" onclick="noteDelete('${n.id}',event)" title="Xóa note">🗑</button>
      </div>
    </div>`;
  }).join('');
}

// ── CREATE ────────────────────────────────
function noteCreate() {
  const id  = 'note_' + Date.now();
  const now = Date.now();
  const isLight = document.body.classList.contains('light');
  noteData[id] = {
    id, title:'', body:'',
    color: isLight ? NOTE_COLORS_LIGHT[0].hex : NOTE_COLORS[0].hex,
    colorIdx: 0,
    created: now, updated: now,
  };
  noteSave();
  noteUpdatePill();
  noteRenderList();
  noteOpen(id);
}

// ── OPEN ──────────────────────────────────
function noteOpen(id) {
  if (!noteData[id]) return;
  noteActive = id;
  const n = noteData[id];

  // Show editor UI
  document.getElementById('noteEditorEmpty').style.display = 'none';
  const ui = document.getElementById('noteEditorUI');
  ui.style.display = 'flex';

  // Populate
  document.getElementById('noteTitleInput').value = n.title || '';
  document.getElementById('noteBody').innerHTML   = n.body  || '';

  noteApplyBg();
  noteRenderSwatches();
  noteRenderList();
  noteSetSaveStatus('saved');
  noteUpdateWordCount();
}

// ── EDIT & AUTO-SAVE ──────────────────────
function noteOnEdit() {
  if (!noteActive) return;
  noteSetSaveStatus('saving');
  clearTimeout(noteSaveTimer);
  noteSaveTimer = setTimeout(() => {
    const n = noteData[noteActive];
    if (!n) return;
    n.title   = document.getElementById('noteTitleInput').value.trim();
    n.body    = document.getElementById('noteBody').innerHTML;
    n.updated = Date.now();
    noteSave();
    noteRenderList();
    noteSetSaveStatus('saved');
    noteUpdateWordCount();
  }, 600);
}

function noteSetSaveStatus(st) {
  const dot   = document.getElementById('noteSaveDot');
  const label = document.getElementById('noteSaveLabel');
  if (!dot || !label) return;
  if (st === 'saving') {
    dot.className = 'note-save-dot saving';
    label.textContent = 'Đang lưu...';
  } else {
    dot.className = 'note-save-dot';
    const t = new Date().toLocaleTimeString('vi-VN',{hour:'2-digit',minute:'2-digit'});
    label.textContent = 'Đã lưu lúc ' + t;
  }
}

function noteUpdateWordCount() {
  const el = document.getElementById('noteWordCount');
  if (!el) return;
  const text  = document.getElementById('noteBody').innerText || '';
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const chars = text.replace(/\s/g,'').length;
  el.textContent = `${words} từ · ${chars} ký tự`;
}

// ── DELETE ────────────────────────────────
function noteDelete(id, e) {
  e.stopPropagation();
  if (!confirm('Xóa note này?')) return;
  delete noteData[id];
  if (noteActive === id) {
    noteActive = null;
    document.getElementById('noteEditorEmpty').style.display = 'flex';
    document.getElementById('noteEditorUI').style.display = 'none';
    document.getElementById('noteEditorWrap').style.background = '';
  }
  noteSave();
  noteUpdatePill();
  noteRenderList();
}

// ── EXEC COMMANDS ─────────────────────────
function noteExec(cmd, val) {
  document.getElementById('noteBody').focus();
  document.execCommand(cmd, false, val || null);
  noteOnEdit();
}
function noteExecBlock(tag) {
  if (!tag) return;
  document.getElementById('noteBody').focus();
  if (tag === 'blockquote') document.execCommand('formatBlock', false, 'blockquote');
  else document.execCommand('formatBlock', false, tag);
  noteOnEdit();
}

// ── UTIL ──────────────────────────────────
function noteStripHtml(html) {
  const tmp = document.createElement('div');
  tmp.innerHTML = html || '';
  return tmp.textContent || tmp.innerText || '';
}

// ═══════════════════════════════════════════
// TIN GIÁO DỤC — RSS
// ═══════════════════════════════════════════
const EDU_SOURCES = [
  { name: 'Văn bản Bộ GDĐT', url: 'https://vqa.moet.gov.vn/vi/laws/rss/' },
  { name: 'Khảo thí', url: 'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-khao-thi/rss/' },
  { name: 'Văn bằng chứng chỉ', url: 'https://vqa.moet.gov.vn/vi/thong-bao-quan-ly-vb-cc/rss/' },
  { name: 'Tin tức', url: 'https://vqa.moet.gov.vn/vi/news/rss/' },
];
const eduState = { items: [], activeId: null, loading: false };

function eduInit() {
  eduLoadAll();
}

function eduSetStatus(text) {
  const el = document.getElementById('eduStatus');
  if (el) el.textContent = text;
}

async function eduLoadAll() {
  if (!EDU_SOURCES.length) {
    eduState.items = [];
    eduRenderList();
    eduSetStatus('Chưa cấu hình nguồn RSS');
    return;
  }

  eduSetStatus('Đang tải RSS...');
  eduState.loading = true;
  try {
    const tasks = EDU_SOURCES.map(async (src) => {
      const res = await fetch(eduBuildApiUrl(src.url));
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      if (!data || !Array.isArray(data.items)) return [];
      return data.items.map((it, i) => ({
        id: src.name + '_' + i + '_' + (it.guid || it.link || it.title || ''),
        title: it.title || '(Không có tiêu đề)',
        link: it.link || '',
        pubDate: it.pubDate || '',
        source: src.name,
        description: it.description || '',
        content: it.content || it.description || '',
      }));
    });

    const results = await Promise.all(tasks);
    eduState.items = results.flat().sort((a, b) => {
      const da = Date.parse(a.pubDate) || 0;
      const db = Date.parse(b.pubDate) || 0;
      return db - da;
    });
    eduState.loading = false;
    eduSetStatus('Đã tải ' + eduState.items.length + ' tin');
    eduRenderList();
  } catch (err) {
    eduState.loading = false;
    eduSetStatus('Lỗi tải RSS');
    console.error(err);
  }
}
function eduBuildApiUrl(rssUrl) {
  return 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent(rssUrl);
}

function eduRenderList() {
  const list = document.getElementById('eduList');
  if (!list) return;
  const q = (document.getElementById('eduSearch')?.value || '').toLowerCase();
  const sourceFilter = document.getElementById('eduSourceFilter')?.value || '';
  let items = eduState.items;
  if (q) items = items.filter(it => it.title.toLowerCase().includes(q));
  if (sourceFilter) items = items.filter(it => it.source === sourceFilter);

  eduRenderSourceFilter();

  if (!items.length) {
    list.innerHTML = q
      ? '<div class="empty" style="padding:28px 16px"><div class="empty-icon">🔍</div><h3>Không tìm thấy</h3><p>Thử từ khóa khác.</p></div>'
      : '<div class="empty" style="padding:28px 16px"><div class="empty-icon">🗞️</div><h3>Chưa có tin</h3><p>Thêm nguồn RSS để hiển thị danh sách tin.</p></div>';
    return;
  }

  const grouped = {};
  items.forEach(it => {
    if (!grouped[it.source]) grouped[it.source] = [];
    grouped[it.source].push(it);
  });

  const groupKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'vi'));
  list.innerHTML = groupKeys.map(src => {
    const groupItems = grouped[src].sort((a, b) => eduGetDateTs(b) - eduGetDateTs(a));
    const groupHeader = `<div class="edu-group">${src} · ${groupItems.length} tin</div>`;
    const groupList = groupItems.map(it => {
      const dt = it.pubDate ? new Date(it.pubDate).toLocaleDateString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric' }) : '—';
      return `<div class="edu-item${it.id === eduState.activeId ? ' active' : ''}" onclick="eduSelectItem('${encodeURIComponent(it.id)}')">
        <div class="edu-title">${it.title}</div>
        <div class="edu-meta"><span class="edu-dot"></span>${it.source} · ${dt}</div>
      </div>`;
    }).join('');
    return groupHeader + groupList;
  }).join('');
}

function eduRenderSourceFilter() {
  const sel = document.getElementById('eduSourceFilter');
  if (!sel) return;
  const cur = sel.value || '';
  const sources = Array.from(new Set(eduState.items.map(it => it.source))).sort((a, b) => a.localeCompare(b, 'vi'));
  sel.innerHTML = '<option value="">Tất cả nguồn</option>' + sources.map(s => `<option value="${s}">${s}</option>`).join('');
  sel.value = sources.includes(cur) ? cur : '';
}

function eduGetDateTs(item) {
  return item.pubDate ? (Date.parse(item.pubDate) || 0) : 0;
}

function eduSelectItem(encodedId) {
  const id = decodeURIComponent(encodedId);
  const item = eduState.items.find(it => it.id === id);
  if (!item) return;
  eduState.activeId = id;
  eduRenderList();

  const detail = document.getElementById('eduDetail');
  const srcEl = document.getElementById('eduSource');
  const dateEl = document.getElementById('eduDate');
  if (!detail || !srcEl || !dateEl) return;

  const dateText = item.pubDate
    ? new Date(item.pubDate).toLocaleString('vi-VN', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' })
    : '—';

  srcEl.textContent = 'Nguồn: ' + (item.source || '—');
  dateEl.textContent = 'Ngày: ' + dateText;

  detail.innerHTML = `
    <div class="edu-detail-body">
      <h2>${item.title}</h2>
      ${item.link ? `<div class="edu-embed"><iframe title="Tin giao duc" src="${item.link}" loading="lazy" referrerpolicy="no-referrer"></iframe></div>` : '<div class="edu-detail-empty">Không có link để hiển thị nội dung.</div>'}
    </div>
    <div class="edu-footer" style="border-top:none">
      <span>Liên kết gốc</span>
      <button class="edu-open" onclick="window.open('${item.link}','_blank')">Mở bài</button>
    </div>
  `;
}


// ═══════════════════════════════════════════
// TOAST
// ═══════════════════════════════════════════
function showToast(msg, type) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show '+(type||'');
  setTimeout(()=>el.className='toast', 3500);
}

// ═══════════════════════════════════════════
// THEME TOGGLE
// ═══════════════════════════════════════════
function toggleTheme() {
  const isLight = document.body.classList.toggle('light');
  localStorage.setItem('sdh-theme', isLight ? 'light' : 'dark');
  noteRenderSwatches();
  noteRenderList();
}
// COMMAND BAR
const CMDK_ACTIONS = [
  { name: 'Chuyển tab Tiến sĩ', kbd: 'TS', run: () => switchTab('ts') },
  { name: 'Chuyển tab Thạc sĩ', kbd: 'ThS', run: () => switchTab('ths') },
  { name: 'Bật/Tắt Zen', kbd: 'Z', run: () => toggleZen() },
  { name: 'Bật/Tắt Theme', kbd: 'T', run: () => toggleTheme() },
  { name: 'Focus TS', kbd: 'F', run: () => toggleFocus('ts') },
  { name: 'Focus ThS', kbd: 'F', run: () => toggleFocus('ths') },
  { name: 'View TS Table', kbd: 'V', run: () => setView('ts','table') },
  { name: 'View TS Kanban', kbd: 'V', run: () => setView('ts','kanban') },
  { name: 'View TS Timeline', kbd: 'V', run: () => setView('ts','timeline') },
];

function cmdkOpen() {
  const el = document.getElementById('cmdk');
  const input = document.getElementById('cmdkInput');
  if (!el || !input) return;
  el.classList.add('show');
  input.value = '';
  cmdkRender('');
  setTimeout(() => input.focus(), 30);
}

function cmdkClose() {
  const el = document.getElementById('cmdk');
  if (el) el.classList.remove('show');
}

function cmdkRender(q) {
  const list = document.getElementById('cmdkList');
  if (!list) return;
  const needle = (q || '').toLowerCase();
  const items = CMDK_ACTIONS.filter(a => a.name.toLowerCase().includes(needle));
  list.innerHTML = items.map((a, i) =>
    `<div class="cmdk-item" data-idx="${i}">${a.name}<span class="cmdk-kbd">${a.kbd}</span></div>`
  ).join('') || '<div class="cmdk-item">Không có kết quả</div>';
}

document.addEventListener('keydown', e => {
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
    e.preventDefault();
    cmdkOpen();
  }
  if (e.key === 'Escape') cmdkClose();
});

document.addEventListener('click', e => {
  const list = document.getElementById('cmdkList');
  if (!list || !e.target.closest('.cmdk-item')) return;
  const idx = e.target.closest('.cmdk-item').dataset.idx;
  const q = document.getElementById('cmdkInput').value || '';
  const items = CMDK_ACTIONS.filter(a => a.name.toLowerCase().includes(q.toLowerCase()));
  const act = items[idx];
  if (act) act.run();
  cmdkClose();
});

document.getElementById('cmdkInput')?.addEventListener('input', e => cmdkRender(e.target.value));
// Restore saved theme on load
(function() {
  if (localStorage.getItem('sdh-theme') === 'light') document.body.classList.add('light');
})();

// ═══ AUTO-LOAD KHI TRANG MỞ ═══
window.addEventListener('DOMContentLoaded', () => {
  autoLoadFile();
  noteInit();
});
document.body.addEventListener('dragover', e => e.preventDefault());
document.body.addEventListener('drop', e => {
  e.preventDefault();
  const f = e.dataTransfer.files[0];
  if (f && (f.name.endsWith('.xlsx')||f.name.endsWith('.xls')))
    handleFile({ target:{ files:[f] } });
});
